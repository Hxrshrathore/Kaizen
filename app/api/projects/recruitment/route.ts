import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { createRecruitmentPost, ensureProjectTables } from '@/lib/project-storage';

export async function POST(req: Request) {
  try {
    await ensureProjectTables();

    const cookieHeader = req.headers.get('cookie');
    const token = cookieHeader?.split('session_token=')[1]?.split(';')[0];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = await verifySession(token);
    if (!userId) return NextResponse.json({ error: "Invalid Session" }, { status: 401 });

    const body = await req.json();
    const { groupId, title, domain, skills, openSlots, contactEmail } = body;

    if (!groupId || !title || !domain) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const res = await createRecruitmentPost(groupId, {
      title,
      domain,
      skills: Array.isArray(skills) ? skills : [skills],
      openSlots: Number(openSlots || 2),
      contactEmail: contactEmail || 'student@kiit.ac.in',
    });

    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create recruitment post" }, { status: 500 });
  }
}
