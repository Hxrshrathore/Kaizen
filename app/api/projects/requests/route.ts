import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { 
  sendFicSupervisionRequest, 
  respondToFicRequest, 
  ensureProjectTables, 
  expireOverdueFicRequests 
} from '@/lib/project-storage';

export async function POST(req: Request) {
  try {
    await ensureProjectTables();
    await expireOverdueFicRequests();

    const cookieHeader = req.headers.get('cookie');
    const token = cookieHeader?.split('session_token=')[1]?.split(';')[0];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = await verifySession(token);
    if (!userId) return NextResponse.json({ error: "Invalid Session" }, { status: 401 });

    const body = await req.json();
    const { groupId, ficId, message } = body;

    if (!groupId || !ficId) {
      return NextResponse.json({ error: "groupId and ficId are required" }, { status: 400 });
    }

    const res = await sendFicSupervisionRequest(groupId, ficId, message);
    return NextResponse.json(res);
  } catch (error: any) {
    console.error("POST /api/projects/requests error:", error);
    return NextResponse.json({ error: error.message || "Failed to send supervision request" }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    await ensureProjectTables();

    const cookieHeader = req.headers.get('cookie');
    const token = cookieHeader?.split('session_token=')[1]?.split(';')[0];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { requestId, action } = body; // action: 'ACCEPT' | 'REJECT'

    if (!requestId || !action) {
      return NextResponse.json({ error: "requestId and action are required" }, { status: 400 });
    }

    const res = await respondToFicRequest(requestId, action);
    return NextResponse.json(res);
  } catch (error: any) {
    console.error("PATCH /api/projects/requests error:", error);
    return NextResponse.json({ error: error.message || "Failed to process request" }, { status: 400 });
  }
}
