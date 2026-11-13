import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { getSubjectByCode } from '@/lib/subject-service';

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
    const { courseId, courseName = 'Classroom Course', subjectCode, subjectName: customSubjectName } = body;

    if (!courseId || !subjectCode) {
      return NextResponse.json(
        { error: 'courseId and subjectCode are required' },
        { status: 400 }
      );
    }

    const cleanCode = subjectCode.trim().toUpperCase();
    
    // Look up official subject name from Subject table if not provided
    let finalSubjectName = customSubjectName;
    if (!finalSubjectName) {
      const subj = await getSubjectByCode(cleanCode);
      if (subj) finalSubjectName = subj.name;
    }

    // Upsert into ClassroomSubjectMapping using raw query
    await db.$executeRawUnsafe(
      `
      INSERT INTO "ClassroomSubjectMapping" ("id", "userId", "courseId", "courseName", "subjectCode", "subjectName", "isManual", "updatedAt")
      VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, true, NOW())
      ON CONFLICT ("userId", "courseId")
      DO UPDATE SET 
        "subjectCode" = EXCLUDED."subjectCode",
        "subjectName" = EXCLUDED."subjectName",
        "isManual" = true,
        "updatedAt" = NOW();
      `,
      userId,
      courseId,
      courseName,
      cleanCode,
      finalSubjectName || cleanCode
    );

    return NextResponse.json({
      success: true,
      mapping: {
        userId,
        courseId,
        courseName,
        subjectCode: cleanCode,
        subjectName: finalSubjectName || cleanCode,
        isManual: true,
      }
    });
  } catch (error: any) {
    console.error('Error saving classroom subject mapping:', error);
    return NextResponse.json(
      { error: 'Failed to map classroom to subject', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
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
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    await db.$executeRawUnsafe(
      `DELETE FROM "ClassroomSubjectMapping" WHERE "userId" = $1 AND "courseId" = $2;`,
      userId,
      courseId
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting classroom subject mapping:', error);
    return NextResponse.json(
      { error: 'Failed to remove classroom mapping', details: error.message },
      { status: 500 }
    );
  }
}
