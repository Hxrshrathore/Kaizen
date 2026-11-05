import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBackendRunning } from "@/lib/backend-manager";

export async function POST(request: Request) {
  try {
    await ensureBackendRunning(15000);
    const data = await request.json();
    const { questionId, bboxX0, bboxY0, bboxX1, bboxY1, updateText = true, forceGemini = false, rotation = 0 } = data;

    if (!questionId) {
      return NextResponse.json({ error: "Missing questionId" }, { status: 400 });
    }

    const question = await prisma.ocrQuestion.findUnique({
      where: { id: questionId },
    });

    if (!question || !question.sourcePdf) {
      return NextResponse.json({ error: "Question or sourcePdf not found" }, { status: 404 });
    }

    // Call FastAPI to crop image from PDF and extract clean text
    const fastApiResp = await fetch("http://localhost:8000/api/pdf/recrop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourcePdf: question.sourcePdf,
        pageNumber: question.pageNumber || 1,
        x0: bboxX0,
        y0: bboxY0,
        x1: bboxX1,
        y1: bboxY1,
        saveFilename: question.imagePath,
        dpi: 200,
        forceGemini: Boolean(forceGemini),
        rotation: Number(rotation || 0),
      }),
    });

    if (!fastApiResp.ok) {
      const err = await fastApiResp.json().catch(() => ({}));
      return NextResponse.json({ error: err.detail || "FastAPI recrop failed" }, { status: 500 });
    }

    const result = await fastApiResp.json();

    // Update DB record with new coordinates and new extracted text
    const updateData: any = {
      bboxX0,
      bboxY0,
      bboxX1,
      bboxY1,
      pageWidth: result.pageWidth,
      pageHeight: result.pageHeight,
    };

    if (updateText && result.text) {
      updateData.rawOcrText = result.text;
      updateData.correctedText = result.text;
    }

    const updatedRecord = await prisma.ocrQuestion.update({
      where: { id: questionId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      question: updatedRecord,
      extractedText: result.text,
      method: result.method || "pymupdf_vector",
      // Add cache buster to imagePath
      imagePath: `${question.imagePath}?t=${Date.now()}`,
    });
  } catch (err: any) {
    console.error("Recrop API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

