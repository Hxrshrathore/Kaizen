import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { 
  searchStudentsByRollOrName, 
  addTeammateToGroup, 
  removeTeammate, 
  lockProjectGroup, 
  ensureProjectTables 
} from '@/lib/project-storage';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    if (!query) return NextResponse.json({ results: [] });

    const results = await searchStudentsByRollOrName(query);
    return NextResponse.json({ results });
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
    const { action, groupId, student, rollNo } = body;

    if (!groupId) return NextResponse.json({ error: "Group ID is required" }, { status: 400 });

    if (action === 'LOCK') {
      await lockProjectGroup(groupId);
      return NextResponse.json({ success: true, message: "Team roster locked permanently." });
    }

    if (action === 'ADD') {
      let targetStudent = student;
      if (!targetStudent && rollNo) {
        // Find from directory
        const dir = await prisma.studentDirectory.findUnique({
          where: { rollNo: String(rollNo) }
        });
        if (dir) {
          targetStudent = {
            rollNo: dir.rollNo,
            name: dir.name,
            email: `${dir.rollNo}@kiit.ac.in`,
            section: dir.section,
            branch: 'E&CSc',
            semester: 7
          };
        } else {
          targetStudent = {
            rollNo: String(rollNo),
            name: `Student (${rollNo})`,
            email: `${rollNo}@kiit.ac.in`,
            section: 'ECS GROUP-03',
            branch: 'E&CSc',
            semester: 7
          };
        }
      }

      if (!targetStudent) {
        return NextResponse.json({ error: "Student details missing." }, { status: 400 });
      }

      const res = await addTeammateToGroup(groupId, targetStudent);
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/projects/teammates error:", error);
    return NextResponse.json({ error: error.message || "Operation failed" }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    await ensureProjectTables();

    const cookieHeader = req.headers.get('cookie');
    const token = cookieHeader?.split('session_token=')[1]?.split(';')[0];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { groupId, memberId } = body;

    if (!groupId || !memberId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const res = await removeTeammate(groupId, memberId);
    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to remove member" }, { status: 400 });
  }
}
