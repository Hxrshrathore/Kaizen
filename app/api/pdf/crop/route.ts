import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBackendRunning } from "@/lib/backend-manager";

export async function GET(request: Request) {
  try {
    await ensureBackendRunning(15000);
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    let pdf = url.searchParams.get("pdf");
    let page = url.searchParams.get("page") || "1";
    let x0 = url.searchParams.get("x0");
    let y0 = url.searchParams.get("y0");
    let x1 = url.searchParams.get("x1");
    let y1 = url.searchParams.get("y1");

    const padTop = url.searchParams.get("padTop") || "0";
    const padBottom = url.searchParams.get("padBottom") || "0";
    const padLeft = url.searchParams.get("padLeft") || "0";
    const padRight = url.searchParams.get("padRight") || "0";
    const dpi = url.searchParams.get("dpi") || "200";

    if (id) {
      const q = await prisma.ocrQuestion.findUnique({ where: { id } });
      if (q) {
        pdf = q.sourcePdf || pdf;
        page = String(q.pageNumber || page);
        x0 = x0 || String(q.bboxX0 || 0);
        y0 = y0 || String(q.bboxY0 || 0);
        x1 = x1 || String(q.bboxX1 || (q.pageWidth || 595));
        y1 = y1 || String(q.bboxY1 || (q.pageHeight || 842));
      }
    }

    if (!pdf) {
      return NextResponse.json({ error: "Missing sourcePdf parameter" }, { status: 400 });
    }

    const fastApiUrl = `http://localhost:8000/api/pdf/crop?pdf=${encodeURIComponent(
      pdf
    )}&page=${page}&x0=${x0 || 0}&y0=${y0 || 0}&x1=${x1 || 595}&y1=${y1 || 842}&padTop=${padTop}&padBottom=${padBottom}&padLeft=${padLeft}&padRight=${padRight}&dpi=${dpi}`;

    const resp = await fetch(fastApiUrl);
    if (!resp.ok) {
      return NextResponse.json({ error: "Failed to crop PDF" }, { status: resp.status });
    }

    const imageBuffer = await resp.arrayBuffer();
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

