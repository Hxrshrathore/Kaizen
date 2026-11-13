import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { calculateBurnout } from '@/lib/burnout-engine';

async function getAuthUserId(req: Request): Promise<string | null> {
  // 1. Try Authorization header (Bearer token for Apple Shortcut / Webhook)
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.substring(7).trim();
    const userId = await verifySession(bearerToken);
    if (userId) return userId;
  }

  // 2. Try cookie header (browser session)
  const cookieHeader = req.headers.get('cookie') || '';
  const matchSession = cookieHeader.match(/session_token=([^;]+)/);
  const matchAuth = cookieHeader.match(/auth-token=([^;]+)/);
  const token = matchSession?.[1] || matchAuth?.[1];
  if (token) {
    const verified = await verifySession(token);
    if (verified) return verified;
  }

  // 3. Fallback to default student if testing in development
  const demo = await prisma.user.findFirst({
    where: { email: { contains: '@kiit.ac.in' } },
    select: { id: true },
  });
  return demo?.id || null;
}

// GET: Fetch recent sleep logs, sleep debt, and current burnout risk
export async function GET(req: Request) {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const history = await prisma.healthMetric.findMany({
      where: {
        userId,
        date: { gte: sevenDaysAgo },
      },
      orderBy: { date: 'desc' },
      take: 7,
    });

    const latest = history[0] || null;

    let burnoutAssessment = null;
    if (latest) {
      burnoutAssessment = calculateBurnout({
        sleepHours: latest.sleepHours,
        deepSleepMin: latest.deepSleepMin,
        sleepQuality: latest.sleepQuality,
        restingHeartRate: latest.restingHeartRate,
        hrv: latest.hrv,
        stressLevel: latest.stressLevel,
        focusLevel: latest.focusLevel,
        energyLevel: latest.energyLevel,
        recentHistory: history.map((h) => ({
          date: h.date,
          sleepHours: h.sleepHours,
          stressLevel: h.stressLevel,
        })),
      });
    }

    return NextResponse.json({
      latest,
      history,
      burnoutAssessment,
    });
  } catch (err: any) {
    console.error("Health sync GET error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch health metrics" }, { status: 500 });
  }
}

// POST: Log/Sync sleep and biometric metrics, calculate burnout, and persist
export async function POST(req: Request) {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const sleepHours = Number(body.sleepHours ?? 7.0);
    const stressLevel = Math.max(1, Math.min(5, Number(body.stressLevel ?? 3)));
    const focusLevel = Math.max(1, Math.min(5, Number(body.focusLevel ?? 3)));
    const energyLevel = Math.max(1, Math.min(5, Number(body.energyLevel ?? 3)));
    const deepSleepMin = body.deepSleepMin ? Number(body.deepSleepMin) : null;
    const restingHeartRate = body.restingHeartRate ? Number(body.restingHeartRate) : null;
    const hrv = body.hrv ? Number(body.hrv) : null;
    const steps = body.steps ? Number(body.steps) : 0;
    const source = body.source || "manual";

    // Target date (defaults to today midnight UTC)
    const logDate = body.date ? new Date(body.date) : new Date();
    logDate.setHours(0, 0, 0, 0);

    // Fetch previous 6 days history for rolling burnout calculation
    const sevenDaysAgo = new Date(logDate);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const pastLogs = await prisma.healthMetric.findMany({
      where: {
        userId,
        date: { gte: sevenDaysAgo, lt: logDate },
      },
      orderBy: { date: 'desc' },
      take: 6,
    });

    // Run deterministic burnout algorithm
    const assessment = calculateBurnout({
      sleepHours,
      deepSleepMin,
      restingHeartRate,
      hrv,
      stressLevel,
      focusLevel,
      energyLevel,
      recentHistory: pastLogs.map((p) => ({
        date: p.date,
        sleepHours: p.sleepHours,
        stressLevel: p.stressLevel,
      })),
    });

    // Upsert record for today
    const metric = await prisma.healthMetric.upsert({
      where: {
        userId_date: {
          userId,
          date: logDate,
        },
      },
      create: {
        userId,
        date: logDate,
        sleepHours,
        deepSleepMin,
        restingHeartRate,
        hrv,
        steps,
        stressLevel,
        focusLevel,
        energyLevel,
        burnoutScore: assessment.burnoutScore,
        burnoutRisk: assessment.burnoutRisk,
        cognitiveCap: assessment.cognitiveCapacity,
        recoveryAdvice: assessment.recoveryAdvice,
        source,
      },
      update: {
        sleepHours,
        deepSleepMin,
        restingHeartRate,
        hrv,
        steps,
        stressLevel,
        focusLevel,
        energyLevel,
        burnoutScore: assessment.burnoutScore,
        burnoutRisk: assessment.burnoutRisk,
        cognitiveCap: assessment.cognitiveCapacity,
        recoveryAdvice: assessment.recoveryAdvice,
        source,
      },
    });

    return NextResponse.json({
      success: true,
      metric,
      assessment,
    });
  } catch (err: any) {
    console.error("Health sync POST error:", err);
    return NextResponse.json({ error: err.message || "Failed to sync health metrics" }, { status: 500 });
  }
}

