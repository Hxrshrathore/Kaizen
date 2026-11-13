import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession, createHealthSyncToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value || cookieStore.get('auth-token')?.value;

    let userId: string | null = null;
    if (token) {
      userId = await verifySession(token);
    }

    // If no session found, look up default student user or first user for seamless onboarding
    if (!userId) {
      const demoUser = await prisma.user.findFirst({
        where: { email: { contains: '@kiit.ac.in' } },
        select: { id: true },
      });
      userId = demoUser?.id || "demo-student-id";
    }

    const syncToken = await createHealthSyncToken(userId);
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const webhookUrl = `${protocol}://${host}/api/health/sync`;

    return NextResponse.json({
      success: true,
      userId,
      syncToken,
      webhookUrl,
      appleShortcuts: {
        setupGuide: "Open Apple Shortcuts > New Automation > When Waking Up > Get Health Samples > Get Contents of URL",
        samplePayload: {
          source: "apple_health",
          sleepHours: 7.5,
          deepSleepMin: 75,
          restingHeartRate: 62,
          hrv: 64,
          steps: 8200,
        },
      },
      androidHealth: {
        provider: "Google Health Connect / Tasker",
        webhookUrl,
      },
    });
  } catch (error: any) {
    console.error("Health token generator error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
