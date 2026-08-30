import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { getClassroomData } from '@/lib/classroom';

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

    const classroomData = await getClassroomData(userId);

    return NextResponse.json({ 
      success: true, 
      courses: classroomData.courses,
      hiddenCourseIds: classroomData.hiddenCourseIds 
    });

  } catch (error: any) {
    console.error('Classroom API Route Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch Classroom data', 
      details: error.message 
    }, { status: 500 });
  }
}
