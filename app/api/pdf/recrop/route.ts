import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBackendRunning } from "@/lib/backend-manager";
import { upstashRedis, StagedQuestion } from "@/lib/upstash";
import path from "path";

export async function POST(request: Request) {
  try {
    await ensureBackendRunning(25000);
    const data = await request.json();
    const {
      questionId,
      bboxX0,
      bboxY0,
      bboxX1,
      bboxY1,
      updateText = true,
      forceGemini = false,
      rotation = 0,
    } = data;

    if (!questionId) {
      return NextResponse.json({ error: "Missing questionId" }, { status: 400 });
    }

    let sourcePdf: string | null = data.sourcePdf || null;
    let pageNumber: number = data.pageNumber || 1;
    let saveFilename: string | null = null;
    let isStaged = false;
    let stagedItem: StagedQuestion | null = null;
    let dbQuestion: any = null;

    // 1. Check if it's a Redis staged question (e.g. stg_*)
    if (typeof questionId === "string" && questionId.startsWith("stg_")) {
      stagedItem = await upstashRedis.get<StagedQuestion>(`kaizen:staging:item:${questionId}`);
      if (stagedItem) {
        isStaged = true;
        sourcePdf = stagedItem.sourceDoc || sourcePdf;
        pageNumber = stagedItem.pageNumber || pageNumber;
        saveFilename = stagedItem.imageUrl
          ? path.basename(stagedItem.imageUrl.split("?")[0])
          : `${questionId}.png`;
      }
    }

    // 2. If not found in Redis, check Neon DB
    if (!isStaged) {
      try {
        dbQuestion = await prisma.ocrQuestion.findUnique({
          where: { id: questionId },
        });
      } catch (dbErr) {
        console.warn("Prisma lookup failed, falling back to Redis staging:", dbErr);
      }

      if (dbQuestion) {
        sourcePdf = dbQuestion.sourcePdf || sourcePdf;
        pageNumber = dbQuestion.pageNumber || pageNumber;
        saveFilename = dbQuestion.imagePath;
      } else {
        // Fallback: check Redis anyway in case the ID was not prefixed with stg_
        stagedItem = await upstashRedis.get<StagedQuestion>(`kaizen:staging:item:${questionId}`);
        if (stagedItem) {
          isStaged = true;
          sourcePdf = stagedItem.sourceDoc || sourcePdf;
          pageNumber = stagedItem.pageNumber || pageNumber;
          saveFilename = stagedItem.imageUrl
            ? path.basename(stagedItem.imageUrl.split("?")[0])
            : `${questionId}.png`;
        }
      }
    }

    // 3. Fallback: if record not in DB or Redis, use sourcePdf passed from client
    if (!sourcePdf && data.sourcePdf) {
      sourcePdf = data.sourcePdf;
      pageNumber = data.pageNumber || 1;
      saveFilename = `${questionId}.png`;
    }

    if (!sourcePdf) {
      return NextResponse.json(
        { error: `Question ${questionId} not found in Neon DB or Redis staging, and no sourcePdf provided.` },
        { status: 404 }
      );
    }

    // 4. Call FastAPI on 127.0.0.1:8000 to recrop from PDF and extract clean OCR text
    const fastApiResp = await fetch("http://127.0.0.1:8000/api/pdf/recrop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourcePdf,
        pageNumber,
        x0: bboxX0,
        y0: bboxY0,
        x1: bboxX1,
        y1: bboxY1,
        saveFilename: saveFilename || `${questionId}.png`,
        dpi: 200,
        forceGemini: Boolean(forceGemini),
        rotation: Number(rotation || 0),
      }),
    });

    if (!fastApiResp.ok) {
      const err = await fastApiResp.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || `FastAPI recrop failed with HTTP ${fastApiResp.status}` },
        { status: 500 }
      );
    }

    const result = await fastApiResp.json();
    const extractedText: string = result.text || "";

    // 5. Update Record in Redis or Neon DB
    if (isStaged && stagedItem) {
      const updatedStaged: StagedQuestion = {
        ...stagedItem,
        bbox: {
          x0: bboxX0,
          y0: bboxY0,
          x1: bboxX1,
          y1: bboxY1,
        },
        pageWidth: result.pageWidth || stagedItem.pageWidth || 595.32,
        pageHeight: result.pageHeight || stagedItem.pageHeight || 841.92,
        rotation: Number(rotation || 0),
        rawOcrText: updateText && extractedText ? extractedText : stagedItem.rawOcrText,
        cleanText: updateText && extractedText ? extractedText : stagedItem.cleanText,
        status: "EDITED",
        reviewedAt: new Date().toISOString(),
      };

      await upstashRedis.set(`kaizen:staging:item:${questionId}`, updatedStaged);

      return NextResponse.json({
        success: true,
        isStaged: true,
        question: {
          id: updatedStaged.id,
          subject: updatedStaged.subject,
          subjectCode: updatedStaged.subjectCode,
          year: updatedStaged.year,
          examType: updatedStaged.examType,
          sourcePdf: updatedStaged.sourceDoc,
          pageNumber: updatedStaged.pageNumber,
          bboxX0: updatedStaged.bbox.x0,
          bboxY0: updatedStaged.bbox.y0,
          bboxX1: updatedStaged.bbox.x1,
          bboxY1: updatedStaged.bbox.y1,
          pageWidth: updatedStaged.pageWidth,
          pageHeight: updatedStaged.pageHeight,
          imagePath: updatedStaged.imageUrl,
          rawOcrText: updatedStaged.rawOcrText,
          correctedText: updatedStaged.cleanText,
          status: updatedStaged.status,
          contentType: updatedStaged.contentType,
        },
        extractedText,
        method: result.method || "gemini_vision_ocr",
        imagePath: updatedStaged.imageUrl ? `${updatedStaged.imageUrl}?t=${Date.now()}` : undefined,
      });
    }

    if (dbQuestion) {
      const updateData: any = {
        bboxX0,
        bboxY0,
        bboxX1,
        bboxY1,
        pageWidth: result.pageWidth,
        pageHeight: result.pageHeight,
      };

      if (updateText && extractedText) {
        updateData.rawOcrText = extractedText;
        updateData.correctedText = extractedText;
      }

      const updatedRecord = await prisma.ocrQuestion.update({
        where: { id: questionId },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        isStaged: false,
        question: updatedRecord,
        extractedText,
        method: result.method || "pymupdf_vector",
        imagePath: `${dbQuestion.imagePath}?t=${Date.now()}`,
      });
    }

    // Fallback if record was neither in Neon nor Redis (e.g. ad-hoc recrop)
    return NextResponse.json({
      success: true,
      extractedText,
      method: result.method || "pymupdf_vector",
      pageWidth: result.pageWidth,
      pageHeight: result.pageHeight,
    });
  } catch (err: any) {
    console.error("Recrop API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
