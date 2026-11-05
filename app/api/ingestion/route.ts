import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const statsOnly = url.searchParams.get("stats") === "true";

    if (statsOnly) {
      // 1. Quick status totals
      const statusCounts = await prisma.ocrQuestion.groupBy({
        by: ["status"],
        _count: { id: true },
      });

      let pending = 0;
      let approved = 0;
      let rejected = 0;
      let total = 0;

      for (const row of statusCounts) {
        if (row.status === "PENDING") pending += row._count.id;
        else if (row.status === "APPROVED") approved += row._count.id;
        else if (row.status === "REJECTED") rejected += row._count.id;
        total += row._count.id;
      }

      // 2. Exam types
      const examCounts = await prisma.ocrQuestion.groupBy({
        by: ["examType"],
        _count: { id: true },
      });

      // 3. Subjects with codes
      const subjectCounts = await prisma.ocrQuestion.groupBy({
        by: ["subject", "subjectCode"],
        _count: { id: true },
      });

      // 4. Papers with metadata and count
      const paperGroups = await prisma.ocrQuestion.groupBy({
        by: ["sourcePdf", "subject", "subjectCode", "examType", "year"],
        _count: { id: true },
      });

      // Paper pending breakdown for badges
      const paperPending = await prisma.ocrQuestion.groupBy({
        by: ["sourcePdf"],
        where: { status: "PENDING" },
        _count: { id: true },
      });
      const pendingMap = new Map<string, number>();
      for (const p of paperPending) {
        if (p.sourcePdf) pendingMap.set(p.sourcePdf, p._count.id);
      }

      const examTypes = examCounts
        .map((e) => ({
          examType: e.examType || "Unknown",
          count: e._count.id,
        }))
        .sort((a, b) => b.count - a.count);

      const subjects = subjectCounts
        .map((s) => ({
          subject: s.subject || "General",
          subjectCode: s.subjectCode || "ENG2001",
          count: s._count.id,
        }))
        .sort((a, b) => b.count - a.count);

      const papers = paperGroups
        .map((pg) => ({
          sourcePdf: pg.sourcePdf,
          subject: pg.subject,
          subjectCode: pg.subjectCode,
          examType: pg.examType,
          year: pg.year,
          total: pg._count.id,
          pending: pendingMap.get(pg.sourcePdf || "") || 0,
        }))
        .sort((a, b) => {
          if (a.subject !== b.subject) return (a.subject || "").localeCompare(b.subject || "");
          if (a.year !== b.year) return (b.year || "").localeCompare(a.year || "");
          return (a.sourcePdf || "").localeCompare(b.sourcePdf || "");
        });

      return NextResponse.json({
        stats: { pending, approved, rejected, total },
        examTypes,
        subjects,
        papers,
      });
    }

    // Standard list query with filters
    const status = url.searchParams.get("status");
    const examType = url.searchParams.get("examType");
    const subject = url.searchParams.get("subject");
    const subjectCode = url.searchParams.get("subjectCode");
    const sourcePdf = url.searchParams.get("sourcePdf");
    const search = url.searchParams.get("search");
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status;
    }
    if (examType && examType !== "ALL") {
      where.examType = examType;
    }
    if (subject && subject !== "ALL") {
      where.subject = subject;
    }
    if (subjectCode && subjectCode !== "ALL") {
      where.subjectCode = subjectCode;
    }
    if (sourcePdf && sourcePdf !== "ALL") {
      where.sourcePdf = sourcePdf;
    }
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { correctedText: { contains: q, mode: "insensitive" } },
        { rawOcrText: { contains: q, mode: "insensitive" } },
        { sourcePdf: { contains: q, mode: "insensitive" } },
        { subjectCode: { contains: q, mode: "insensitive" } },
      ];
    }

    // STRICT sequential sorting: by paper, then page number ascending, then id ascending
    const records = await prisma.ocrQuestion.findMany({
      where,
      orderBy: [
        { sourcePdf: "asc" },
        { pageNumber: "asc" },
        { id: "asc" },
      ],
      take: limit || 150,
    });

    return NextResponse.json(records);
  } catch (error: any) {
    console.error("API /api/ingestion error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, correctedText, status, subject, subjectCode, year, examType } = data;

    if (!id) {
      return NextResponse.json({ error: "Missing question ID" }, { status: 400 });
    }

    const updated = await prisma.ocrQuestion.update({
      where: { id },
      data: {
        correctedText: correctedText !== undefined ? correctedText : undefined,
        subject: subject !== undefined ? subject : undefined,
        subjectCode: subjectCode !== undefined ? subjectCode : undefined,
        year: year !== undefined ? year : undefined,
        examType: examType !== undefined ? examType : undefined,
        status: status || "APPROVED",
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("API PUT /api/ingestion error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing question ID" }, { status: 400 });
    }

    await prisma.ocrQuestion.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("API DELETE /api/ingestion error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
