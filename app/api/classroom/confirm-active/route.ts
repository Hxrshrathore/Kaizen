import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
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

    const body = await req.json();
    const { activeCourseIds = [], hiddenCourseIds = [] } = body;

    if (!Array.isArray(activeCourseIds) || !Array.isArray(hiddenCourseIds)) {
      return NextResponse.json(
        { error: 'activeCourseIds and hiddenCourseIds must be arrays' },
        { status: 400 }
      );
    }

    // 1. Remove active courses from HiddenCourse table
    if (activeCourseIds.length > 0) {
      await db.hiddenCourse.deleteMany({
        where: {
          userId,
          courseId: { in: activeCourseIds }
        }
      });
    }

    // 2. Add hidden courses to HiddenCourse table in bulk
    for (const courseId of hiddenCourseIds) {
      if (!courseId) continue;
      await db.hiddenCourse.upsert({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
        update: {},
        create: {
          userId,
          courseId,
        },
      });
    }

    // Query updated list of hidden course ids
    const updatedHidden = await db.hiddenCourse.findMany({
      where: { userId },
      select: { courseId: true }
    });

    return NextResponse.json({
      success: true,
      message: 'Active classroom configuration synchronized successfully',
      activeCount: activeCourseIds.length,
      hiddenCount: hiddenCourseIds.length,
      hiddenCourseIds: updatedHidden.map(r => r.courseId)
    });
  } catch (error: any) {
    console.error('Error confirming active classrooms:', error);
    return NextResponse.json(
      { error: 'Failed to save active classroom preferences', details: error.message },
      { status: 500 }
    );
  }
}

