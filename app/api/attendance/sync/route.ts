import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { fetchLatestAttendanceEmail, parseAttendanceData } from '@/lib/gmail';

// POST: Trigger an attendance sync from the user's Gmail
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

    // Lookup subject names from GradeEntry to provide a mapping for the parser
    const grades = await prisma.gradeEntry.findMany({
      where: {
        semester: {
          profile: {
            userId
          }
        }
      },
      select: {
        subjectCode: true,
        subjectName: true
      }
    });

    const subjectMap = new Map(grades.map(g => [g.subjectCode, g.subjectName]));

    // 1. Fetch latest attendance email
    const emailData = await fetchLatestAttendanceEmail(userId);
    if (!emailData) {
      return NextResponse.json({ message: 'No new attendance emails found.' }, { status: 200 });
    }

    // 2. Parse the body to extract records
    const records = parseAttendanceData(emailData.body);

    if (records.length === 0) {
      return NextResponse.json({ 
        message: 'Email found, but no parseable attendance records identified.',
        debugBody: emailData.body // Giving the user a chance to see what failed to parse
      }, { status: 200 });
    }

    // 3. Save to database using a transaction
    await prisma.$transaction(
      records.map(record => 
        prisma.attendanceRecord.upsert({
          where: {
            userId_courseCode_date: {
              userId,
              courseCode: record.courseCode,
              date: emailData.date
            }
          },
          update: {
            subjectName: subjectMap.get(record.courseCode) || record.courseCode,
            attended: record.attended,
            total: record.total,
            percentage: record.percentage
          },
          create: {
            userId,
            courseCode: record.courseCode,
            subjectName: subjectMap.get(record.courseCode) || record.courseCode,
            attended: record.attended,
            total: record.total,
            percentage: record.percentage,
            date: emailData.date
          }
        })
      )
    );

    return NextResponse.json({ 
      success: true, 
      message: `Synced ${records.length} records.`,
      records 
    });

  } catch (error: any) {
    console.error('Attendance sync error:', error);
    return NextResponse.json({ error: error.message || 'Failed to sync attendance' }, { status: 500 });
  }
}
