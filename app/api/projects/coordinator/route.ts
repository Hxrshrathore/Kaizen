import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { 
  getCoordinatorOverview, 
  coordinatorReassignFic, 
  coordinatorAssignPanel, 
  coordinatorOverrideLock,
  ensureProjectTables 
} from '@/lib/project-storage';

export async function GET(req: Request) {
  try {
    await ensureProjectTables();

    const cookieHeader = req.headers.get('cookie');
    const token = cookieHeader?.split('session_token=')[1]?.split(';')[0];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = await verifySession(token);
    if (!userId) return NextResponse.json({ error: "Invalid Session" }, { status: 401 });

    const data = await getCoordinatorOverview();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureProjectTables();

    const cookieHeader = req.headers.get('cookie');
    const token = cookieHeader?.split('session_token=')[1]?.split(';')[0];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = await verifySession(token);
    if (!userId) return NextResponse.json({ error: "Invalid Session" }, { status: 401 });

    const body = await req.json();
    const { action, groupId, newFicId, panelId, unlock } = body;

    if (!groupId) return NextResponse.json({ error: "groupId is required" }, { status: 400 });

    if (action === 'REASSIGN_FIC') {
      if (!newFicId) return NextResponse.json({ error: "newFicId is required" }, { status: 400 });
      const res = await coordinatorReassignFic(groupId, newFicId);
      return NextResponse.json(res);
    }

    if (action === 'ASSIGN_PANEL') {
      if (!panelId) return NextResponse.json({ error: "panelId is required" }, { status: 400 });
      const res = await coordinatorAssignPanel(groupId, panelId);
      return NextResponse.json(res);
    }

    if (action === 'OVERRIDE_LOCK') {
      const res = await coordinatorOverrideLock(groupId, Boolean(unlock));
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/projects/coordinator error:", error);
    return NextResponse.json({ error: error.message || "Failed coordinator action" }, { status: 500 });
  }
}
