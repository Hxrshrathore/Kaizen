import { NextResponse } from 'next/server';
import { getAllSubjects, getSubjectByCode } from '@/lib/subject-service';
import { verifySession } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (code) {
      const subject = await getSubjectByCode(code);
      return NextResponse.json({ success: true, subject });
    }

    const subjects = await getAllSubjects();
    return NextResponse.json({ success: true, subjects });

  } catch (error: any) {
    console.error('Failed to fetch subjects API:', error);
    return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 });
  }
}

