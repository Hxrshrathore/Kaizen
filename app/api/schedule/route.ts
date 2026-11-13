import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { getAcademicInbox } from '@/lib/mail-service';
import { getStudentEnrolledSubjects, ELECTIVE_SECTION_MAP } from '@/lib/subject-service';

// Helper to normalize ECS group (supports G1-G7, ECSc1-ECSc7, ECS GROUP-01-07)
function normalizeGroup(section: string): string {
  if (!section) return 'ECS GROUP-03';
  const trimmed = section.trim();
  const gMatch = trimmed.match(/^G0?(\d+)$/i);
  if (gMatch) {
    return `ECS GROUP-${gMatch[1].padStart(2, '0')}`;
  }
  const match = trimmed.match(/ECSc?0?(\d+)/i);
  if (match) {
    const num = match[1].padStart(2, '0');
    return `ECS GROUP-${num}`;
  }
  const digitOnly = trimmed.match(/^0?([1-7])$/);
  if (digitOnly) {
    return `ECS GROUP-${digitOnly[1].padStart(2, '0')}`;
  }
  return trimmed;
}

// ── GET: FETCH TIMETABLE & AVAILABLE GROUPS ─────────────────────────────────
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
    const overrideGroup = searchParams.get('group');

    // 1. Resolve student's roll number and user profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        name: true,
        academicProfile: {
          select: { section: true, rollNumber: true }
        }
      }
    });

    const rollNumber = user?.academicProfile?.rollNumber || 
      (user?.email ? user.email.match(/^(\d+)@kiit\.ac\.in$/i)?.[1] : null);

    // 2. Fetch authoritative student record from StudentDirectory (imported directly from official Excel sheets)
    let studentDir: {
      rollNo: string;
      name: string;
      section: string;
      branch: string | null;
      electiveSection: string | null;
      electiveSubject: string | null;
      electiveFaculty: string | null;
      electiveRoom: string | null;
    } | null = null;

    if (rollNumber) {
      const dirRows = await prisma.$queryRaw<any[]>`
        SELECT "rollNo", "name", "section", "branch", "electiveSection", "electiveSubject", "electiveFaculty", "electiveRoom"
        FROM "StudentDirectory"
        WHERE "rollNo" = ${rollNumber}
        LIMIT 1;
      `;
      if (dirRows && dirRows.length > 0) {
        studentDir = dirRows[0];
      }
    }

    // 3. Dynamically resolve PE-IV allotment for this exact student based on their roll number
    let dynamicElectiveCode: string | null = null;
    let dynamicElectiveTitle: string | null = null;
    let dynamicElectiveRoom: string | null = studentDir?.electiveRoom || null;
    let dynamicElectiveFaculty: string | null = studentDir?.electiveFaculty || null;
    const dynamicElectiveSection = studentDir?.electiveSection || null;

    if (dynamicElectiveSection && ELECTIVE_SECTION_MAP[dynamicElectiveSection]) {
      const meta = ELECTIVE_SECTION_MAP[dynamicElectiveSection];
      dynamicElectiveCode = meta.code;
      dynamicElectiveTitle = meta.name;
      dynamicElectiveRoom = dynamicElectiveRoom || meta.defaultRoom;
      dynamicElectiveFaculty = dynamicElectiveFaculty || meta.defaultFaculty;
    } else if (studentDir?.electiveSubject) {
      const codeMatch = studentDir.electiveSubject.match(/\b([A-Z]{2,4}\d{4,5})\b/);
      if (codeMatch) dynamicElectiveCode = codeMatch[1];
      dynamicElectiveTitle = studentDir.electiveSubject.replace(/^[A-Z]{2,4}\d{4,5}\s*/i, '').trim();
    }

    const allottedElective = dynamicElectiveSection ? {
      electiveSection: dynamicElectiveSection,
      electiveSubject: dynamicElectiveTitle || studentDir?.electiveSubject || 'Professional Elective IV',
      electiveCode: dynamicElectiveCode || 'PE-IV',
      electiveFaculty: dynamicElectiveFaculty || 'Elective Faculty',
      electiveRoom: dynamicElectiveRoom || 'Designated Room'
    } : null;

    // 4. Determine active group: override or student's section from directory, or profile, or default ECS GROUP-03
    const activeSection = overrideGroup || studentDir?.section || user?.academicProfile?.section || 'ECS GROUP-03';
    const normalizedGroup = normalizeGroup(activeSection);

    // 5. Fetch full schedule for this group with subjectCode and subjectId
    const rawSchedule = await prisma.$queryRaw<any[]>`
      SELECT "id", "group", "day", "startTime", "endTime", "subject", "room", "faculty", "subjectCode", "subjectId"
      FROM "CourseSchedule"
      WHERE "group" = ${normalizedGroup}
      ORDER BY 
        CASE "day" 
          WHEN 'MON' THEN 1 
          WHEN 'TUE' THEN 2 
          WHEN 'WED' THEN 3 
          WHEN 'THU' THEN 4 
          WHEN 'FRI' THEN 5 
          ELSE 6 
        END,
        "startTime" ASC;
    `;

    // Fetch enrolled subjects for student
    let enrolledSubjects: any[] = [];
    try {
      const enrollment = await getStudentEnrolledSubjects(userId);
      enrolledSubjects = enrollment.currentSemesterSubjects;
    } catch (e) {
      console.warn('Enrolled subjects fetch warning:', e);
    }

    // 6. Populate PE-IV slots dynamically with user's allotted elective details from the PE-IV sheet
    const schedule = rawSchedule.map(slot => {
      const isPE = slot.subject === 'PE-IV' || slot.subjectCode === 'PE-IV';
      if (isPE) {
        if (allottedElective) {
          const code = allottedElective.electiveCode;
          return {
            ...slot,
            subject: `PE-IV: ${allottedElective.electiveSubject}`,
            room: allottedElective.electiveRoom,
            faculty: allottedElective.electiveFaculty,
            subjectCode: code,
            subjectId: code !== 'PE-IV' ? `subj-${code.toLowerCase()}` : slot.subjectId,
            isElective: true,
            electiveSection: allottedElective.electiveSection
          };
        } else {
          return {
            ...slot,
            subject: 'PE-IV (Allotment Pending)',
            room: slot.room || 'CL-A-01 - CL-A-19',
            faculty: slot.faculty || 'Department Elective Faculty',
            subjectCode: 'PE-IV',
            subjectId: slot.subjectId,
            isElective: true,
            electiveSection: null
          };
        }
      }
      return {
        ...slot,
        subjectCode: slot.subjectCode || slot.subject,
        isElective: false
      };
    });

    // 3. Fetch integrated academic items (Classroom assignments, exams, and notices)
    let academicItems: any[] = [];
    let lastAttendanceReport: any = null;
    try {
      const inbox = await getAcademicInbox(userId, false);
      if (inbox) {
        lastAttendanceReport = inbox.lastAttendanceReport || null;
        if (lastAttendanceReport && lastAttendanceReport.records) {
          const activeCodes = new Set(enrolledSubjects.map(s => s.code.toUpperCase()));
          lastAttendanceReport.records = lastAttendanceReport.records.filter((r: any) => 
            activeCodes.has((r.courseCode || '').toUpperCase())
          );
        }
        if (inbox.emails) {
          academicItems = inbox.emails
            .filter(e => e.category === 'DEADLINE' || e.category === 'CLASSROOM' || e.category === 'EXAM' || e.category === 'CAREER' || e.neuralSummary?.detectedDeadline)
            .map(e => ({
              id: e.id,
              title: e.subject,
              category: e.category,
              urgency: e.urgency,
              courseCode: e.neuralSummary?.relatedCourseCode || (e.category === 'EXAM' ? 'EXAM CELL' : 'ACADEMIC'),
              deadline: e.neuralSummary?.detectedDeadline || e.date,
              takeaway: e.neuralSummary?.takeaway,
              actionItems: e.neuralSummary?.actionItems || [],
              sender: e.sender.name,
              source: e.sender.email.includes('classroom.google.com') ? 'Google Classroom' : 
                      e.category === 'EXAM' ? 'Examination Cell' :
                      e.category === 'CAREER' ? 'Placement Cell' : 'University Notice',
              attendanceData: e.attendanceData || null
            }));
        }
      }
    } catch (e) {
      console.warn('Academic items fetch warning in /api/schedule:', e);
    }

    // 4. Fetch all available groups in database
    let availableGroups = await prisma.courseSchedule.findMany({
      select: { group: true },
      distinct: ['group'],
      orderBy: { group: 'asc' }
    });

    if (!availableGroups || availableGroups.length === 0) {
      availableGroups = [
        { group: 'ECS GROUP-01' },
        { group: 'ECS GROUP-02' },
        { group: 'ECS GROUP-03' },
        { group: 'ECS GROUP-04' },
        { group: 'ECS GROUP-05' },
        { group: 'ECS GROUP-06' },
        { group: 'ECS GROUP-07' },
      ];
    }

    return NextResponse.json({
      success: true,
      rollNumber,
      studentName: studentDir?.name || user?.name || null,
      section: studentDir?.section || user?.academicProfile?.section || null,
      activeSection,
      normalizedGroup,
      schedule,
      enrolledSubjects,
      availableGroups: availableGroups.map(g => g.group),
      allottedElective,
      academicItems,
      lastAttendanceReport
    });

  } catch (error: any) {
    console.error('Schedule fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}

// ── POST: UPDATE USER SECTION OR ADD CUSTOM SLOT ───────────────────────────
export async function POST(req: Request) {
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

    const body = await req.json();
    const { section, group, action } = body;

    // Action 1: Switch User Section
    if (section || group) {
      const targetSection = section || group;
      const normalized = normalizeGroup(targetSection);

      await prisma.academicProfile.upsert({
        where: { userId },
        create: {
          userId,
          section: targetSection,
          program: 'B.Tech',
          branch: 'CSE',
          cgpa: 0.0
        },
        update: {
          section: targetSection
        }
      });

      return NextResponse.json({
        success: true,
        message: `Section updated to ${targetSection} (${normalized}) in NeonDB`,
        section: targetSection,
        normalizedGroup: normalized
      });
    }

    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  } catch (error: any) {
    console.error('Schedule POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update section' }, { status: 500 });
  }
}
