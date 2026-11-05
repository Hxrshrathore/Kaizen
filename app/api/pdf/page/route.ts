import { NextResponse } from "next/server";
import { ensureBackendRunning } from "@/lib/backend-manager";

export async function GET(request: Request) {
  try {
    await ensureBackendRunning(15000);
    const url = new URL(request.url);
    const pdf = url.searchParams.get("pdf");
    const page = url.searchParams.get("page") || "1";
    const dpi = url.searchParams.get("dpi") || "150";
    const rotation = url.searchParams.get("rotation") || "0";

    if (!pdf) {
      return NextResponse.json({ error: "Missing pdf parameter" }, { status: 400 });
    }

    const resp = await fetch(
      `http://localhost:8000/api/pdf/page?pdf=${encodeURIComponent(pdf)}&page=${page}&dpi=${dpi}&rotation=${rotation}`
    );

    if (!resp.ok) {
      return NextResponse.json({ error: "Failed to render PDF page" }, { status: resp.status });
    }

    const imageBuffer = await resp.arrayBuffer();
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

