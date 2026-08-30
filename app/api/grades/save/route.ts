import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    // 1. Authenticate User
    const cookieHeader = req.headers.get('cookie');
    const token = cookieHeader?.split('session_token=')[1]?.split(';')[0];
    
    // Safety check: Ensure token exists before verifying
    if (!token) {
      return NextResponse.json({ error: "No session token found" }, { status: 401 });
    }

    const userId = await verifySession(token);
    if (!userId) {
      return NextResponse.json({ error: "Invalid Session" }, { status: 401 });
    }

    // 2. Parse Payload
    const { student, semesterPerformance, grades } = await req.json();
    const semNumber = parseInt(student.currentSemester);

    // 3. DATABASE TRANSACTION (With Increased Timeout)
    const result = await prisma.$transaction(async (tx) => {
      
      // A. Create/Update Academic Profile
      const profile = await tx.academicProfile.upsert({
        where: { userId: userId },
        create: {
          userId: userId,
          rollNumber: student.rollNumber,
          program: student.program,
          branch: student.branch,
          cgpa: parseFloat(semesterPerformance.cgpa) || 0.0
        },
        update: {
          rollNumber: student.rollNumber,
          cgpa: parseFloat(semesterPerformance.cgpa) || 0.0
        }
      });

      // B. UPSERT SEMESTER RECORD
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
          sgpa: parseFloat(semesterPerformance.sgpa) || 0,
          creditsRegistered: parseFloat(semesterPerformance.totalCredits) || 0,
          creditsEarned: parseFloat(semesterPerformance.creditIndex) || 0,
          remarks: semesterPerformance.remarks
        },
        update: {
          sgpa: parseFloat(semesterPerformance.sgpa) || 0,
          creditsRegistered: parseFloat(semesterPerformance.totalCredits) || 0,
          creditsEarned: parseFloat(semesterPerformance.creditIndex) || 0,
          remarks: semesterPerformance.remarks,
          updatedAt: new Date()
        }
      });

      // C. REPLACE GRADES
      await tx.gradeEntry.deleteMany({
        where: { semesterId: semester.id }
      });

      if (grades.length > 0) {
        await tx.gradeEntry.createMany({
          data: grades.map((g: any) => ({
            semesterId: semester.id,
            subjectCode: g.subjectCode,
            subjectName: g.subjectName,
            credits: parseFloat(g.credits) || 0,
            grade: g.grade
          }))
        });
      }

      return { semesterId: semester.id, action: "updated" };
    }, 
    // 👇 THIS IS THE FIX: Increase wait time to 10 seconds
    {
      maxWait: 5000, // Wait max 5s for a connection from the pool
      timeout: 10000 // Allow the transaction to run for 10s
    });

    return NextResponse.json({ success: true, data: result });

  } catch (error: any) {
    console.error("Save Grade Error:", error);
    return NextResponse.json({ error: error.message || "Database Error" }, { status: 500 });
  }
}