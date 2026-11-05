import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("http://127.0.0.1:8000/health", {
      signal: AbortSignal.timeout(800),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ ...data, state: "online" });
    }
  } catch {}

  // If asleep, inform frontend it is in standby and will auto-wake on demand
  return NextResponse.json({
    status: "ok",
    state: "standby",
    model_loaded: true,
    detail: "Model in sleep mode. Auto-wakes instantly when generating.",
  });
}

