import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { getUnifiedSubjectContext } from '@/lib/subject-service';

export async function GET(
  req: Request,
  props: { params: Promise<{ code: string }> }
) {
  try {
    const params = await props.params;
    const { code } = params;

    if (!code) {
      return NextResponse.json({ error: 'Subject code is required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    let userId: string | undefined = undefined;

    if (sessionToken) {
      const verified = await verifySession(sessionToken);
      if (verified) userId = verified;
    }

    const context = await getUnifiedSubjectContext(code, userId);

    if (!context) {
      return NextResponse.json({ error: `Subject code '${code}' not found` }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      subjectCode: code.toUpperCase(),
      ...context
    });

  } catch (error: any) {
    console.error('Error fetching subject context:', error);
    return NextResponse.json({ error: 'Failed to fetch subject details' }, { status: 500 });
  }
}

