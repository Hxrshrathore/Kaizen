import { NextResponse } from "next/server";
import { ensureBackendRunning } from "@/lib/backend-manager";

export async function POST(request: Request) {
  try {
    await ensureBackendRunning(15000);
    const body = await request.json();
    const {
      sourcePdf,
      pageNumber = 1,
      bboxX0 = 0,
      bboxY0 = 0,
      bboxX1 = 595,
      bboxY1 = 842,
      rotation = 0,
      dpi = 200,
      forceGemini = false,
      apiKey = null,
    } = body;

    if (!sourcePdf) {
      return NextResponse.json({ error: "sourcePdf is required" }, { status: 400 });
    }

    const startTime = Date.now();

    // Call FastAPI backend recrop endpoint
    const resp = await fetch("http://127.0.0.1:8000/api/pdf/recrop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourcePdf,
        pageNumber,
        x0: bboxX0,
        y0: bboxY0,
        x1: bboxX1,
        y1: bboxY1,
        dpi,
        rotation,
        forceGemini,
      }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      return NextResponse.json({ error: err.detail || "OCR execution failed" }, { status: resp.status });
    }

    const data = await resp.json();
    const elapsed = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      extractedText: data.text || "",
      method: data.method || "pymupdf_vector",
      latencyMs: elapsed,
      bbox: data.bbox,
      pageWidth: data.pageWidth,
      pageHeight: data.pageHeight,
      tokensExtracted: (data.text || "").split(/\s+/).filter(Boolean).length,
      hasLatex: /\$.*?\$|\\int|\\frac|\\sum|\\alpha|\\beta/i.test(data.text || ""),
    });
  } catch (err: any) {
    console.error("OCR Test error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

