import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { submitProjectGrades, ensureProjectTables } from '@/lib/project-storage';

export async function POST(req: Request) {
  try {
    await ensureProjectTables();

    const cookieHeader = req.headers.get('cookie');
    const token = cookieHeader?.split('session_token=')[1]?.split(';')[0];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = await verifySession(token);
    if (!userId) return NextResponse.json({ error: "Invalid Session" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: userId } });

    const body = await req.json();
    const { groupId, studentRoll, studentName, internalMarks, panelMarks, evaluatorRole, evaluatorName, remarks } = body;

    if (!groupId || !studentRoll) {
      return NextResponse.json({ error: "groupId and studentRoll are required" }, { status: 400 });
    }

    const res = await submitProjectGrades(
      groupId,
      studentRoll,
      studentName || `Student (${studentRoll})`,
      Number(internalMarks || 0),
      Number(panelMarks || 0),
      {
        evaluatorRole: evaluatorRole || 'FIC',
        evaluatorName: evaluatorName || user?.name || 'Evaluator',
        remarks,
      }
    );

    return NextResponse.json(res);
  } catch (error: any) {
    console.error("POST /api/projects/grades error:", error);
    return NextResponse.json({ error: error.message || "Failed to submit grades" }, { status: 500 });
  }
}
