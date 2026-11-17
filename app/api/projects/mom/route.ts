import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { addProjectMom, ensureProjectTables } from '@/lib/project-storage';

export async function POST(req: Request) {
  try {
    await ensureProjectTables();

    const cookieHeader = req.headers.get('cookie');
    const token = cookieHeader?.split('session_token=')[1]?.split(';')[0];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = await verifySession(token);
    if (!userId) return NextResponse.json({ error: "Invalid Session" }, { status: 401 });

    const body = await req.json();
    const { groupId, meetDate, title, agenda, discussion, actionItems, attendees, ficSigned } = body;

    if (!groupId || !meetDate || !title || !agenda) {
      return NextResponse.json({ error: "Missing required MOM parameters" }, { status: 400 });
    }

    const res = await addProjectMom(groupId, {
      meetDate,
      title,
      agenda,
      discussion: discussion || '',
      actionItems: Array.isArray(actionItems) ? actionItems : [actionItems],
      attendees: Array.isArray(attendees) ? attendees : [attendees],
      ficSigned: Boolean(ficSigned),
    });

    return NextResponse.json(res);
  } catch (error: any) {
    console.error("POST /api/projects/mom error:", error);
    return NextResponse.json({ error: error.message || "Failed to add MOM" }, { status: 500 });
  }
}
