import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { 
  getStudentProjectGroup, 
  createProjectGroup, 
  getFacultyPoolWithQuotas, 
  getRecruitmentBoard,
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { academicProfile: true }
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const rollMatch = user.email.match(/^(\d+)@kiit\.ac\.in$/i);
    const rollNo = user.academicProfile?.rollNumber || (rollMatch ? rollMatch[1] : '22051867');

    // Determine semester: Check program string or default 7
    let semester = 7;
    const prog = user.academicProfile?.program || '';
    const semMatch = prog.match(/(\d+)(?:st|nd|rd|th)?\s*sem/i);
    if (semMatch) {
      semester = parseInt(semMatch[1], 10);
    }

    // Eligibility: Active only for 6th, 7th, and 8th semester students (and faculty/coordinators)
    const isEligible = semester >= 6 && semester <= 8;

    // Fetch user's current project group (if any)
    const userGroup = await getStudentProjectGroup(user.id, rollNo);

    // Fetch faculty pool with dynamic active group counts
    const facultyPool = await getFacultyPoolWithQuotas();

    // Fetch active teammate recruitment posts
    const recruitmentBoard = await getRecruitmentBoard();

    return NextResponse.json({
      isEligible,
      semester,
      rollNo,
      user: {
        id: user.id,
        name: user.name || "Student",
        email: user.email,
        officialTag: user.officialTag,
        section: user.academicProfile?.section || 'ECS GROUP-03',
        branch: user.academicProfile?.branch || 'E&CSc',
        isCoordinator: user.officialTag === 'FIC' || user.email.includes('akray') || user.email.includes('coordinator')
      },
      projectData: userGroup,
      facultyPool,
      recruitmentBoard
    });
  } catch (error: any) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch project portal" }, { status: 500 });
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { academicProfile: true }
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { title, domain, projectType, abstract } = body;

    if (!title || !domain) {
      return NextResponse.json({ error: "Title and Domain are required." }, { status: 400 });
    }

    const rollMatch = user.email.match(/^(\d+)@kiit\.ac\.in$/i);
    const rollNo = user.academicProfile?.rollNumber || (rollMatch ? rollMatch[1] : '22051867');

    let semester = 7;
    const prog = user.academicProfile?.program || '';
    const semMatch = prog.match(/(\d+)(?:st|nd|rd|th)?\s*sem/i);
    if (semMatch) semester = parseInt(semMatch[1], 10);

    // Check if student already in another group
    const existingGroup = await getStudentProjectGroup(user.id, rollNo);
    if (existingGroup) {
      return NextResponse.json({ error: "You are already enrolled in a project group." }, { status: 400 });
    }

    const groupId = await createProjectGroup({
      title,
      domain,
      projectType: projectType || (semester === 6 ? 'MINOR' : 'MAJOR'),
      semester,
      abstract,
      leaderId: user.id,
      leaderRoll: rollNo,
      leaderName: user.name || "Student Leader",
      leaderEmail: user.email,
      section: user.academicProfile?.section || 'ECS GROUP-03',
      branch: user.academicProfile?.branch || 'E&CSc'
    });

    return NextResponse.json({ success: true, groupId });
  } catch (error: any) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json({ error: error.message || "Failed to create group" }, { status: 500 });
  }
}
