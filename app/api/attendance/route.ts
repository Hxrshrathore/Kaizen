import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET: Fetch all active attendance records for the user
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

    // Use Prisma to fetch the newest record per course Code
    const records = await prisma.attendanceRecord.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      select: {
        id: true,
        courseCode: true,
        subjectName: true,
        attended: true,
        total: true,
        percentage: true,
        date: true
      }
    });

    // Deduplicate: Keep only the latest record per course
    const latestRecordsMap = new Map<string, typeof records[0]>();
    for (const record of records) {
      if (!latestRecordsMap.has(record.courseCode)) {
        latestRecordsMap.set(record.courseCode, record);
      }
    }

    const latestRecords = Array.from(latestRecordsMap.values());

    return NextResponse.json({ records: latestRecords });

  } catch (error: any) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}
