import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { 
  getStudentEnrolledSubjects, 
  getStudentSchedule, 
  getPyqsForSubject,
  getSubjectByCode 
} from '@/lib/subject-service';
import { getAcademicInbox } from '@/lib/mail-service';

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
    const groupOverride = searchParams.get('group') || undefined;

    // 1. Fetch student enrolled subjects & profile
    const enrollment = await getStudentEnrolledSubjects(userId);

    // 2. Fetch student timetable slots mapped by subject code
    const scheduleResult = await getStudentSchedule(userId, groupOverride);

    // 3. For each current semester subject, attach schedule slots count and PYQs
    const pyqsBySubject: Record<string, any[]> = {};
    const enrichedCurrentSubjects = await Promise.all(
      enrollment.currentSemesterSubjects.map(async (subj) => {
        const pyqs = await getPyqsForSubject(subj.code);
        pyqsBySubject[subj.code] = pyqs;

        const subjectSlots = scheduleResult.schedule.filter(
          s => s.subjectCode.toUpperCase() === subj.code.toUpperCase()
        );

        return {
          ...subj,
          scheduleSlotsCount: subjectSlots.length,
          scheduleSlots: subjectSlots,
          pyqCount: pyqs.length
        };
      })
    );

    // 4. Fetch integrated academic coursework & notices from mail service
    let classroomTasks: any[] = [];
    let lastAttendanceReport: any = null;
    try {
      const inbox = await getAcademicInbox(userId, false);
      if (inbox) {
        lastAttendanceReport = inbox.lastAttendanceReport || null;
        if (inbox.emails) {
          classroomTasks = inbox.emails
            .filter(e => e.category === 'DEADLINE' || e.category === 'CLASSROOM' || e.category === 'EXAM')
            .map(e => ({
              id: e.id,
              title: e.subject,
              category: e.category,
              urgency: e.urgency,
              courseCode: e.neuralSummary?.relatedCourseCode || 'ACADEMIC',
              deadline: e.neuralSummary?.detectedDeadline || e.date,
              takeaway: e.neuralSummary?.takeaway,
              actionItems: e.neuralSummary?.actionItems || [],
              source: e.sender.email.includes('classroom.google.com') ? 'Google Classroom' : 'Faculty Notice'
            }));
        }
      }
    } catch (e) {
      console.warn('Classroom tasks fetch warning:', e);
    }

    return NextResponse.json({
      success: true,
      student: enrollment.student,
      currentSemesterSubjects: enrichedCurrentSubjects,
      currentSubjectCodes: enrollment.currentSubjectCodes,
      historicalSubjectsCount: enrollment.historicalSubjects.length,
      historicalSubjects: enrollment.historicalSubjects,
      schedule: scheduleResult.schedule,
      allottedElective: scheduleResult.allottedElective,
      classroomTasks,
      pyqsBySubject,
      lastAttendanceReport
    });

  } catch (error: any) {
    console.error('Error fetching student subjects:', error);
    return NextResponse.json({ error: 'Failed to fetch student subject profile' }, { status: 500 });
  }
}

