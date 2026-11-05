import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { upstashRedis, upstashVector, StagedQuestion } from "@/lib/upstash";

// ── GET: Fetch Staged Questions from Upstash Redis ────────────────────────────
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const contentType = url.searchParams.get("contentType");
    const status = url.searchParams.get("status") || "PENDING_REVIEW";
    const limit = parseInt(url.searchParams.get("limit") || "100", 10);
    const docId = url.searchParams.get("docId");

    // 1. Get queue member IDs
    let queueIds: string[] = [];
    if (docId) {
      queueIds = await upstashRedis.smembers(`kaizen:staging:doc:${docId}`);
    } else {
      queueIds = await upstashRedis.smembers("kaizen:staging:queue");
    }

    if (!queueIds || queueIds.length === 0) {
      // Also return staging stats
      const allKeys = await upstashRedis.keys("kaizen:staging:item:*");
      const neonTotal = await prisma.ocrQuestion.count();
      return NextResponse.json({
        stats: {
          stagedPending: 0,
          totalStagedKeys: allKeys.length,
          neonApprovedTotal: neonTotal,
        },
        questions: [],
      });
    }

    // 2. Fetch staging items
    const fetchPromises = queueIds.slice(0, limit).map((id) =>
      upstashRedis.get<StagedQuestion>(`kaizen:staging:item:${id}`)
    );
    const rawItems = await Promise.all(fetchPromises);
    const questions = rawItems.filter((item): item is StagedQuestion => {
      if (!item) return false;
      if (contentType && item.contentType !== contentType) return false;
      if (status !== "ALL" && item.status !== status) return false;
      return true;
    });

    // 3. Stats breakdown
    const allKeys = await upstashRedis.keys("kaizen:staging:item:*");
    const neonApprovedTotal = await prisma.ocrQuestion.count();

    return NextResponse.json({
      stats: {
        stagedPending: queueIds.length,
        totalStagedKeys: allKeys.length,
        neonApprovedTotal,
      },
      questions,
    });
  } catch (err: any) {
    console.error("Staging GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── PUT: Update Staged Question in Redis (Reviewer Edits) ─────────────────────
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, cleanText, subject, subjectCode, year, examType, contentType, marks, bbox, rotation } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing staging item id" }, { status: 400 });
    }

    const existing = await upstashRedis.get<StagedQuestion>(`kaizen:staging:item:${id}`);
    if (!existing) {
      return NextResponse.json({ error: "Staged question not found in Redis" }, { status: 404 });
    }

    const updated: StagedQuestion = {
      ...existing,
      cleanText: cleanText !== undefined ? cleanText : existing.cleanText,
      subject: subject || existing.subject,
      subjectCode: subjectCode || existing.subjectCode,
      year: year || existing.year,
      examType: examType || existing.examType,
      contentType: contentType || existing.contentType,
      marks: marks !== undefined ? marks : existing.marks,
      bbox: bbox || existing.bbox,
      rotation: rotation !== undefined ? rotation : existing.rotation,
      status: "EDITED",
      reviewedAt: new Date().toISOString(),
    };

    await upstashRedis.set(`kaizen:staging:item:${id}`, updated);

    return NextResponse.json({ success: true, question: updated });
  } catch (err: any) {
    console.error("Staging PUT error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── POST: Approve (Commit to Neon DB + Vector) OR Reject (Discard in Redis) ──
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, action, cleanText, subject, subjectCode, year, examType, marks } = body;

    if (!id || !action) {
      return NextResponse.json({ error: "Missing id or action ('APPROVE' | 'REJECT')" }, { status: 400 });
    }

    const item = await upstashRedis.get<StagedQuestion>(`kaizen:staging:item:${id}`);
    if (!item) {
      return NextResponse.json({ error: "Staged question not found in Redis" }, { status: 404 });
    }

    // ── REJECT ACTION ────────────────────────────────────────────────────────
    if (action === "REJECT") {
      // Mark as REJECTED in Redis and remove from pending queue
      // ZERO calls to Neon DB!
      item.status = "REJECTED";
      item.reviewedAt = new Date().toISOString();
      await upstashRedis.set(`kaizen:staging:item:${id}`, item);
      await upstashRedis.srem("kaizen:staging:queue", id);

      return NextResponse.json({
        success: true,
        message: "Question rejected in Redis. Neon DB unchanged.",
      });
    }

    // ── APPROVE ACTION ───────────────────────────────────────────────────────
    if (action === "APPROVE") {
      const finalCleanText = cleanText || item.cleanText || item.rawOcrText;
      const finalSubject = subject || item.subject;
      const finalCode = subjectCode || item.subjectCode;
      const finalYear = year || item.year;
      const finalExamType = examType || item.examType;

      // 1. Commit golden clean record into Neon PostgreSQL DB
      const createdRecord = await prisma.ocrQuestion.create({
        data: {
          subject: finalSubject,
          subjectCode: finalCode,
          year: finalYear,
          examType: finalExamType,
          sourcePdf: item.sourceDoc,
          pageNumber: item.pageNumber,
          bboxX0: item.bbox.x0,
          bboxY0: item.bbox.y0,
          bboxX1: item.bbox.x1,
          bboxY1: item.bbox.y1,
          pageWidth: item.pageWidth || 595,
          pageHeight: item.pageHeight || 842,
          imagePath: item.imageUrl || `dataset/raw/${item.sourceDoc}_p${item.pageNumber}.png`,
          rawOcrText: item.rawOcrText,
          correctedText: finalCleanText,
          status: "APPROVED",
        },
      });

      // 2. Index embedding & metadata into Upstash Vector index
      try {
        await upstashVector.upsert({
          id: createdRecord.id,
          data: `${finalSubject} (${finalCode}) ${finalExamType} ${finalYear} Question: ${finalCleanText}`,
          metadata: {
            questionId: createdRecord.id,
            subject: finalSubject,
            subjectCode: finalCode,
            year: finalYear,
            examType: finalExamType,
            contentType: item.contentType,
            marks: marks || item.marks || "5",
            sourcePdf: item.sourceDoc,
            pageNumber: item.pageNumber,
            fineTuningReady: true,
          },
        });
      } catch (vecErr) {
        console.warn("Upstash Vector indexing warning:", vecErr);
      }

      // 3. Mark approved in Redis & remove from pending queue
      item.status = "APPROVED";
      item.reviewedAt = new Date().toISOString();
      await upstashRedis.set(`kaizen:staging:item:${id}`, item);
      await upstashRedis.srem("kaizen:staging:queue", id);

      return NextResponse.json({
        success: true,
        message: "Question approved, committed to Neon DB & indexed in Upstash Vector!",
        question: createdRecord,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error("Staging POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

