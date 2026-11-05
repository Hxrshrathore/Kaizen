import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ensureBackendRunning } from "@/lib/backend-manager";
import { upstashRedis } from "@/lib/upstash";

export async function GET() {
  try {
    const rawDir = path.join(process.cwd(), "data", "pyqs", "raw");
    if (!fs.existsSync(rawDir)) {
      return NextResponse.json({ files: [] });
    }

    const allFiles = fs.readdirSync(rawDir);
    const pdfs = allFiles.filter((f) => f.toLowerCase().endsWith(".pdf"));

    return NextResponse.json({
      total: pdfs.length,
      files: pdfs.sort(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureBackendRunning(15000);
    const body = await request.json();
    const { filename, action = "single" } = body;

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    // Call FastAPI pipeline endpoint
    const fastApiResp = await fetch("http://localhost:8000/api/ingest/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename }),
    });

    if (!fastApiResp.ok) {
      const err = await fastApiResp.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || "FastAPI pipeline ingestion failed" },
        { status: 500 }
      );
    }

    const result = await fastApiResp.json();

    // Check Redis queue length
    const queueIds = await upstashRedis.smembers("kaizen:staging:queue");

    return NextResponse.json({
      success: true,
      filename,
      totalPages: result.totalPages || 1,
      stagedCount: result.stagedQuestionsCount || 0,
      totalPendingInRedis: queueIds?.length || 0,
      questions: (result.questions || []).map((q: any) => ({
        id: q.id,
        questionNumber: q.questionNumber,
        text: q.cleanText || q.rawOcrText,
        bbox: q.bbox,
        imageUrl: q.imageUrl,
        pageNumber: q.pageNumber,
      })),
    });
  } catch (err: any) {
    console.error("Pipeline run error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

