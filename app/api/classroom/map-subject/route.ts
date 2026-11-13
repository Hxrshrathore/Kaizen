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
    const { 
      courseId, 
      courseName = 'Classroom Course', 
      subjectCode, 
      subjectName: customSubjectName,
      professorName,
      ownerId,
      sectionName,
      calculatedProb 
    } = body;

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
      INSERT INTO "ClassroomSubjectMapping" ("id", "userId", "courseId", "courseName", "subjectCode", "subjectName", "isManual", "professorName", "ownerId", "updatedAt")
      VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, true, $6, $7, NOW())
      ON CONFLICT ("userId", "courseId")
      DO UPDATE SET 
        "subjectCode" = EXCLUDED."subjectCode",
        "subjectName" = EXCLUDED."subjectName",
        "isManual" = true,
        "professorName" = COALESCE(EXCLUDED."professorName", "ClassroomSubjectMapping"."professorName"),
        "ownerId" = COALESCE(EXCLUDED."ownerId", "ClassroomSubjectMapping"."ownerId"),
        "updatedAt" = NOW();
      `,
      userId,
      courseId,
      courseName,
      cleanCode,
      finalSubjectName || cleanCode,
      professorName || null,
      ownerId || null
    );

    // ── SELF-HEALING FEEDBACK LOOP & TELEMETRY INGESTION ──
    try {
      const patternKey = courseName.toLowerCase().replace(/[^\w\s&]/g, ' ').replace(/\s+/g, ' ').trim();
      if (patternKey) {
        // Record verified self-healing pattern in database
        await db.$executeRawUnsafe(
          `
          INSERT INTO "ClassroomHealingPattern" ("id", "patternKey", "coursePattern", "targetCode", "category", "confidence", "sampleCount", "lastLearnedAt")
          VALUES (gen_random_uuid()::text, $1, $2, $3, 'CURRENT_SEMESTER', 1.0, 1, NOW())
          ON CONFLICT ("patternKey")
          DO UPDATE SET 
            "targetCode" = EXCLUDED."targetCode",
            "category" = 'CURRENT_SEMESTER',
            "sampleCount" = "ClassroomHealingPattern"."sampleCount" + 1,
            "confidence" = LEAST(1.0, "ClassroomHealingPattern"."confidence" + 0.05),
            "lastLearnedAt" = NOW();
          `,
          patternKey,
          courseName,
          cleanCode
        );

        // If ownerId is known, reinforce ClassroomTeacherDirectory
        if (ownerId && professorName) {
          await db.$executeRawUnsafe(
            `
            INSERT INTO "ClassroomTeacherDirectory" ("ownerId", "name", "subjectCode", "sampleCount", "updatedAt")
            VALUES ($1, $2, $3, 1, NOW())
            ON CONFLICT ("ownerId") DO UPDATE SET
              "name" = COALESCE(EXCLUDED."name", "ClassroomTeacherDirectory"."name"),
              "subjectCode" = EXCLUDED."subjectCode",
              "sampleCount" = "ClassroomTeacherDirectory"."sampleCount" + 1,
              "updatedAt" = NOW();
            `,
            ownerId,
            professorName,
            cleanCode
          );
        }

        // Record telemetry log with probability and professor metadata
        await db.$executeRawUnsafe(
          `
          INSERT INTO "ClassroomFeedbackLog" ("id", "userId", "courseId", "courseName", "confirmedCategory", "confirmedCode", "wasOverridden", "professorName", "ownerId", "sectionName", "calculatedProb")
          VALUES (gen_random_uuid()::text, $1, $2, $3, 'CURRENT_SEMESTER', $4, true, $5, $6, $7, $8);
          `,
          userId,
          courseId,
          courseName,
          cleanCode,
          professorName || null,
          ownerId || null,
          sectionName || null,
          typeof calculatedProb === 'number' ? calculatedProb : null
        );
      }
    } catch (feedbackErr) {
      console.warn('Self-healing telemetry warning:', feedbackErr);
    }

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
