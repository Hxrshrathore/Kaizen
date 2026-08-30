import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = await verifySession(sessionToken);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get user's academic profile (to find their section/group)
    const profile = await prisma.academicProfile.findUnique({
      where: { userId },
      select: { section: true }
    });

    if (!profile || !profile.section) {
      return NextResponse.json({ 
        error: 'Academic profile not set', 
        message: 'Please update your section in settings to see your schedule.' 
      }, { status: 404 });
    }

    // 2. Normalize the group name (Section "ECSc3" -> "ECS GROUP-03")
    // This matches the normalization in scripts/import_routine.ts
    const match = profile.section.match(/ECSc(\d)/i);
    let normalizedGroup = profile.section;
    if (match) {
        const num = match[1].padStart(2, '0');
        normalizedGroup = `ECS GROUP-${num}`;
    }

    // 3. Fetch the full schedule for this group
    const schedule = await prisma.courseSchedule.findMany({
      where: {
        group: normalizedGroup
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    return NextResponse.json({
      section: profile.section,
      normalizedGroup,
      schedule
    });

  } catch (error: any) {
    console.error('Schedule fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}
