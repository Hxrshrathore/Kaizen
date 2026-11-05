import { NextResponse } from "next/server";
import { ensureBackendRunning } from "@/lib/backend-manager";

export async function POST(request: Request) {
  try {
    const isAwake = await ensureBackendRunning(18000);
    if (!isAwake) {
      return NextResponse.json(
        { error: "Python backend failed to start. Check if model exists in llm_backend/models." },
        { status: 503 }
      );
    }

    const body = await request.json();

    const backendResp = await fetch("http://127.0.0.1:8000/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!backendResp.ok) {
      const err = await backendResp.json().catch(() => ({}));
      return NextResponse.json({ error: err.detail || "Generation failed" }, { status: backendResp.status });
    }

    const data = await backendResp.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("AI Generate proxy error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

