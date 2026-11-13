import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

const GRADE_POINTS: Record<string, number> = {
  O: 10,
  E: 9,
  A: 8,
  B: 7,
  C: 6,
  D: 5,
  F: 0
};

export async function POST(req: Request) {
  try {
    // 1. Authenticate User
    const cookieHeader = req.headers.get('cookie');
    const token = cookieHeader?.split('session_token=')[1]?.split(';')[0];
    
    if (!token) {
      return NextResponse.json({ error: "No session token found" }, { status: 401 });
    }

    const userId = await verifySession(token);
    if (!userId) {
      return NextResponse.json({ error: "Invalid Session" }, { status: 401 });
    }

    // 2. Parse Payload
    const { student, semesterPerformance, grades } = await req.json();
    const semNumber = parseInt(student.currentSemester, 10) || 1;

    // 3. Ground Truth Calculations from Verified Grades Array
    let semCredits = 0;
    let semEarnedCredits = 0;
    let semCreditPoints = 0;
    let hasFail = false;

    const validatedGrades = (grades || []).map((g: any) => {
      const credits = parseFloat(g.credits) || 0;
      const cleanGrade = (g.grade || 'O').trim().toUpperCase();
      const pt = GRADE_POINTS[cleanGrade] ?? 0;

      semCredits += credits;
      if (cleanGrade !== 'F') {
        semEarnedCredits += credits;
      } else {
        hasFail = true;
      }
      semCreditPoints += credits * pt;

      return {
        subjectCode: (g.subjectCode || 'SUB').trim().toUpperCase(),
        subjectName: (g.subjectName || 'Course Title').trim(),
        credits: credits,
        grade: cleanGrade
      };
    });

    const calculatedSGPA = semCredits > 0 ? parseFloat((semCreditPoints / semCredits).toFixed(2)) : 0.0;
    const finalSGPA = parseFloat(semesterPerformance?.sgpa) > 0 ? parseFloat(semesterPerformance.sgpa) : calculatedSGPA;
    const finalRegistered = semCredits > 0 ? semCredits : (parseFloat(semesterPerformance?.totalCredits) || 21.0);
    const finalEarned = semEarnedCredits > 0 ? semEarnedCredits : (parseFloat(semesterPerformance?.creditsEarned) || finalRegistered);
    const finalRemarks = hasFail ? 'FAIL' : (semesterPerformance?.remarks || 'PASS');

    // 4. DATABASE TRANSACTION (Neon Postgres)
    const result = await prisma.$transaction(async (tx: any) => {
      
      // A. Create/Update Academic Profile
      const profile = await tx.academicProfile.upsert({
        where: { userId: userId },
        create: {
          userId: userId,
          rollNumber: student?.rollNumber || null,
          program: student?.program || 'B.Tech',
          branch: student?.branch || 'CSE',
          section: 'ECSc3',
          cgpa: parseFloat(semesterPerformance?.cgpa) || finalSGPA
        },
        update: {
          rollNumber: student?.rollNumber || undefined,
          program: student?.program || undefined,
          branch: student?.branch || undefined,
        }
      });

      // B. UPSERT SEMESTER RECORD (Never confuse creditIndex with creditsEarned!)
      const semester = await tx.semesterRecord.upsert({
        where: {
          profileId_semesterNumber: {
            profileId: profile.id,
            semesterNumber: semNumber
          }
        },
        create: {
          profileId: profile.id,
          semesterNumber: semNumber,
          sgpa: finalSGPA,
          creditsRegistered: finalRegistered,
          creditsEarned: finalEarned,
          remarks: finalRemarks
        },
        update: {
          sgpa: finalSGPA,
          creditsRegistered: finalRegistered,
          creditsEarned: finalEarned,
          remarks: finalRemarks,
          updatedAt: new Date()
        }
      });

      // C. UPSERT SUBJECTS INTO SUBJECT TABLE & REPLACE GRADES
      for (const g of validatedGrades) {
        const isLab = g.subjectCode.includes('LAB') || 
                      g.subjectName.toUpperCase().includes('LAB') || 
                      g.subjectName.toUpperCase().includes('PRACTICAL') || 
                      g.credits <= 1.5;
        const subType = isLab ? 'LAB' : 'CORE';
        const subId = `subj-${g.subjectCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

        await tx.$executeRawUnsafe(`
          INSERT INTO "Subject" ("id", "code", "name", "shortName", "semester", "type", "branch", "credits", "faculty", "classroom", "description", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'School Faculty', 'Campus 15', 'Coursework extracted from academic grade report (SGR).', CURRENT_TIMESTAMP)
          ON CONFLICT ("code") DO UPDATE SET
            "name" = CASE WHEN "Subject"."name" = "Subject"."code" THEN EXCLUDED."name" ELSE "Subject"."name" END,
            "credits" = EXCLUDED."credits",
            "semester" = EXCLUDED."semester",
            "updatedAt" = CURRENT_TIMESTAMP;
        `, subId, g.subjectCode, g.subjectName, g.subjectCode, semNumber, subType, student?.branch || 'COMMON', g.credits);
      }

      // Delete old grades for this semester before inserting fresh ones
      await tx.gradeEntry.deleteMany({
        where: { semesterId: semester.id }
      });

      if (validatedGrades.length > 0) {
        await tx.gradeEntry.createMany({
          data: validatedGrades.map((g: any) => ({
            semesterId: semester.id,
            subjectCode: g.subjectCode,
            subjectName: g.subjectName,
            credits: g.credits,
            grade: g.grade
          }))
        });

        // Link GradeEntry rows to Subject table IDs via subjectCode
        await tx.$executeRawUnsafe(`
          UPDATE "GradeEntry" ge
          SET "subjectId" = s."id"
          FROM "Subject" s
          WHERE ge."semesterId" = $1 AND UPPER(ge."subjectCode") = UPPER(s."code");
        `, semester.id);
      }

      // D. RECALCULATE OVERALL CGPA ACROSS ALL RECORDED SEMESTERS
      const allSemesters = await tx.semesterRecord.findMany({
        where: { profileId: profile.id }
      });

      let totalPoints = 0;
      let totalEarned = 0;
      for (const s of allSemesters) {
        totalPoints += s.sgpa * s.creditsEarned;
        totalEarned += s.creditsEarned;
      }
      const calculatedCGPA = totalEarned > 0 ? parseFloat((totalPoints / totalEarned).toFixed(2)) : finalSGPA;

      const finalCGPA = parseFloat(semesterPerformance?.cgpa) > 0 
        ? parseFloat(semesterPerformance.cgpa) 
        : calculatedCGPA;

      await tx.academicProfile.update({
        where: { id: profile.id },
        data: { cgpa: finalCGPA }
      });

      return { 
        semesterId: semester.id, 
        action: "saved", 
        semesterNumber: semNumber,
        sgpa: finalSGPA, 
        cgpa: finalCGPA,
        creditsRegistered: finalRegistered,
        creditsEarned: finalEarned
      };
    }, 
    {
      maxWait: 5000,
      timeout: 10000
    });

    return NextResponse.json({ success: true, data: result });

  } catch (error: any) {
    console.error("Save Grade Error:", error);
    return NextResponse.json({ error: error.message || "Database Error" }, { status: 500 });
  }
}
