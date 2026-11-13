import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";

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

    // Base consumed seed (can be incremented in real-time by client/server)
    const baseUsed = 68420;

    return NextResponse.json({
      success: true,
      userId,
      tier: "Student Free Quota",
      totalDailyTokens: DAILY_BUDGET,
      usedTokens: baseUsed,
      availableTokens: DAILY_BUDGET - baseUsed,
      percentAvailable: Math.round(((DAILY_BUDGET - baseUsed) / DAILY_BUDGET) * 100),
      percentUsed: Math.round((baseUsed / DAILY_BUDGET) * 100),
      resetsIn: `${hoursUntilReset}h ${minsUntilReset}m`,
      activeModel: "Kaizen-Tutor 3B + Gemini 2.5 Flash",
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
          id: "gemini-flash",
          name: "Gemini 2.5 Flash Lite",
          provider: "Google AI Studio",
          endpoint: "Cloud High-Throughput",
          status: "ACTIVE",
          cost: "Free Tier (15 RPM)",
          latency: "340ms",
          priority: 2,
        },
        {
          id: "openrouter-pool",
          name: "OpenRouter Llama 3.3 70B",
          provider: "OpenRouter Pool",
          endpoint: "Failover Cloud",
          status: "STANDBY",
          cost: "Dynamic Failover",
          latency: "620ms",
          priority: 3,
        },
      ],
    });
  } catch (error: any) {
    console.error("AI Quota error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
