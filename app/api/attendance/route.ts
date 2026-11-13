import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { getAllSubjects, getStudentEnrolledSubjects } from '@/lib/subject-service';

// GET: Fetch active attendance records strictly for the student's current enrolled courses
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

    // 1. Fetch student's enrolled subjects for the current semester
    const enrollment = await getStudentEnrolledSubjects(userId);
    const activeSubjectCodes = new Set(enrollment.currentSubjectCodes.map(c => c.toUpperCase()));

    // 2. Query attendance records from NeonDB
    const rawRecords = await prisma.$queryRaw<any[]>`
      SELECT "id", "courseCode", "subjectName", "attended", "total", "percentage", "date", "subjectId", "lastReportDate"
      FROM "AttendanceRecord"
      WHERE "userId" = ${userId}
      ORDER BY "date" DESC;
    `;

    // 3. Fetch canonical subjects for name enrichment
    const subjects = await getAllSubjects();
    const subjectMap = new Map(subjects.map(s => [s.code.toUpperCase(), s]));

    // 4. Strictly filter to only current semester enrolled subjects
    const latestRecordsMap = new Map<string, any>();
    let overallLastReportDate: string | null = null;

    for (const record of rawRecords) {
      const codeUpper = (record.courseCode || '').trim().toUpperCase();
      
      // Filter out historical subjects that are NOT allotted in current semester
      if (!activeSubjectCodes.has(codeUpper)) {
        continue;
      }

      if (!latestRecordsMap.has(codeUpper)) {
        const enrichedSubject = subjectMap.get(codeUpper);
        // Subject name is primary title, code is subtitle
        const displayTitle = enrichedSubject ? enrichedSubject.name : (record.subjectName || record.courseCode);
        
        if (!overallLastReportDate && record.lastReportDate) {
          overallLastReportDate = record.lastReportDate;
        }

        latestRecordsMap.set(codeUpper, {
          id: record.id,
          courseCode: record.courseCode, // Subtitle (e.g. EX40003, CS40003)
          subjectName: displayTitle,     // Title (e.g. Embedded Systems & IoT Laboratory)
          percentage: Number(record.percentage),
          attended: record.attended,
          total: record.total,
          credits: enrichedSubject?.credits || 3.0,
          faculty: enrichedSubject?.faculty || null,
          classroom: enrichedSubject?.classroom || null,
          lastReportDate: record.lastReportDate || overallLastReportDate || '28/09/2026'
        });
      }
    }

    const records = Array.from(latestRecordsMap.values());

    return NextResponse.json({
      success: true,
      rollNumber: enrollment.student.rollNumber,
      studentName: enrollment.student.name,
      records,
      lastReportDate: overallLastReportDate || '28/09/2026',
      source: 'academics@kiit.ac.in'
    });

  } catch (error: any) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}
