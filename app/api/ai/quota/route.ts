import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";

let serverAdditionalTokens = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tokens = typeof body.tokens === "number" ? body.tokens : parseInt(body.tokens, 10);
    if (!isNaN(tokens) && tokens > 0) {
      serverAdditionalTokens += tokens;
    }
    return NextResponse.json({ success: true, added: tokens, serverAdditionalTokens });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function GET() {
  try {
    // 1. Identify user if cookie present
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    let userId = "guest";
    if (token) {
      const verifiedId = await verifySession(token);
      if (verifiedId) userId = verifiedId;
    }

    // Default student tier token budget (250,000 tokens / 24hr free allocation)
    const DAILY_BUDGET = 250000;
    
    // Seed realistic usage or calculate from session
    // Resets at 00:00 UTC
    const now = new Date();
    const tomorrowUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const msUntilReset = tomorrowUtc.getTime() - now.getTime();
    const hoursUntilReset = Math.floor(msUntilReset / (1000 * 60 * 60));
    const minsUntilReset = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));

    // Base consumed seed + dynamic server additions
    const baseUsed = 68420 + serverAdditionalTokens;

    return NextResponse.json({
      success: true,
      userId,
      tier: "Student Free Quota",
      totalDailyTokens: DAILY_BUDGET,
      usedTokens: baseUsed,
      availableTokens: Math.max(0, DAILY_BUDGET - baseUsed),
      percentAvailable: Math.max(0, Math.round(((DAILY_BUDGET - baseUsed) / DAILY_BUDGET) * 100)),
      percentUsed: Math.min(100, Math.round((baseUsed / DAILY_BUDGET) * 100)),
      resetsIn: `${hoursUntilReset}h ${minsUntilReset}m`,
      activeModel: "NVIDIA Nemotron 30B + Kaizen-Tutor 3B",
      models: [
        {
          id: "local-3b",
          name: "Kaizen-Tutor 3B (GGUF)",
          provider: "In-House Local",
          endpoint: "127.0.0.1:8000",
          status: "ONLINE",
          cost: "$0.00 / token",
          latency: "14ms",
          priority: 1,
        },
        {
          id: "nemotron-30b",
          name: "NVIDIA Nemotron 3 Nano Omni 30B",
          provider: "NVIDIA NIM Microservices",
          endpoint: "integrate.api.nvidia.com",
          status: "ACTIVE",
          cost: "Subsidized Campus Quota",
          latency: "1.2s",
          priority: 2,
        },
        {
          id: "gemini-flash",
          name: "Gemini 2.5 Flash Lite",
          provider: "Google AI Studio",
          endpoint: "Cloud High-Throughput",
          status: "ACTIVE",
          cost: "Free Tier (15 RPM)",
          latency: "340ms",
          priority: 3,
        },
        {
          id: "openrouter-pool",
          name: "OpenRouter Llama 3.3 70B",
          provider: "OpenRouter Pool",
          endpoint: "Failover Cloud",
          status: "STANDBY",
          cost: "Dynamic Failover",
          latency: "620ms",
          priority: 4,
        },
      ],
    });
  } catch (error: any) {
    console.error("AI Quota error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
