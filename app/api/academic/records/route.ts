import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { cookies } from 'next/headers';

// KIIT Standard 10-Point Grade Scale
function getGradePoint(grade: string): number {
  switch (grade.trim().toUpperCase()) {
    case 'O': return 10;
    case 'E': return 9;
    case 'A': return 8;
    case 'B': return 7;
    case 'C': return 6;
    case 'D': return 5;
    case 'F': return 0;
    default: return 0;
  }
}

// Helper to recalculate SGPA for a semester and CGPA for the profile
async function recalculateAcademicAverages(profileId: string, targetSemesterId?: string) {
  const semesters = await prisma.semesterRecord.findMany({
    where: { profileId },
    include: { grades: true }
  });

  let totalCreditPoints = 0;
  let totalCreditsOverall = 0;

  for (const sem of semesters) {
    if (sem.grades.length > 0) {
      let semPoints = 0;
      let semCredits = 0;

      for (const g of sem.grades) {
        const pt = getGradePoint(g.grade);
        semPoints += pt * g.credits;
        semCredits += g.credits;
      }

      const calculatedSGPA = semCredits > 0 ? parseFloat((semPoints / semCredits).toFixed(2)) : sem.sgpa;
      const isFailed = sem.grades.some(g => g.grade.trim().toUpperCase() === 'F');

      if (targetSemesterId === sem.id || calculatedSGPA !== sem.sgpa) {
        await prisma.semesterRecord.update({
          where: { id: sem.id },
          data: {
            sgpa: calculatedSGPA,
            creditsRegistered: semCredits,
            creditsEarned: isFailed ? 0 : semCredits,
            remarks: isFailed ? 'FAIL' : 'PASS',
            updatedAt: new Date(),
          }
        });
      }

      totalCreditPoints += calculatedSGPA * semCredits;
      totalCreditsOverall += semCredits;
    } else {
      totalCreditPoints += sem.sgpa * sem.creditsEarned;
      totalCreditsOverall += sem.creditsEarned;
    }
  }

  const finalCGPA = totalCreditsOverall > 0 
    ? parseFloat((totalCreditPoints / totalCreditsOverall).toFixed(2)) 
    : 0.0;

  await prisma.academicProfile.update({
    where: { id: profileId },
    data: { cgpa: finalCGPA }
  });

  return finalCGPA;
}

// ── GET: FETCH ALL ACADEMIC RECORDS FROM NEON DB ───────────────────────────
export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = await verifySession(sessionToken);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid Session' }, { status: 401 });
    }

    // Retrieve user and academic profile with all semesters and subject grades
    let profile = await prisma.academicProfile.findUnique({
      where: { userId },
      include: {
        semesters: {
          include: {
            grades: {
              orderBy: { subjectCode: 'asc' }
            }
          },
          orderBy: { semesterNumber: 'asc' }
        }
      }
    });

    if (!profile) {
      // Auto-create academic profile enriched from StudentDirectory if user exists
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      const rollMatch = user.email.match(/^(\d+)@kiit\.ac\.in$/i);
      let studentDir = null;
      if (rollMatch) {
        try {
          studentDir = await prisma.studentDirectory.findUnique({ where: { rollNo: rollMatch[1] } });
        } catch {}
      }

      profile = await prisma.academicProfile.create({
        data: {
          userId,
          rollNumber: rollMatch ? rollMatch[1] : 'N/A',
          program: studentDir?.program || 'B.Tech in Electronics Engineering (7th Sem)',
          branch: (studentDir as any)?.branch || 'E&CSc',
          section: studentDir?.section || 'ECS GROUP-03',
          cgpa: 0.0
        },
        include: {
          semesters: {
            include: { grades: true }
          }
        }
      });
    } else if (profile.branch === 'CSE' || profile.section === 'ECSc3') {
      // Self-heal default placeholder branch/section with official 7th sem roster
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const rollMatch = user?.email.match(/^(\d+)@kiit\.ac\.in$/i);
      if (rollMatch) {
        try {
          const studentDir = await prisma.studentDirectory.findUnique({ where: { rollNo: rollMatch[1] } });
          if (studentDir) {
            profile = await prisma.academicProfile.update({
              where: { id: profile.id },
              data: {
                branch: (studentDir as any)?.branch || profile.branch,
                section: studentDir.section || profile.section,
                program: studentDir.program || profile.program,
              },
              include: {
                semesters: {
                  include: {
                    grades: { orderBy: { subjectCode: 'asc' } }
                  },
                  orderBy: { semesterNumber: 'asc' }
                }
              }
            });
          }
        } catch {}
      }
    }

    // Auto-heal any historical records where creditsEarned was mistakenly saved as creditIndex
    let needsRecalculation = false;
    for (const sem of profile.semesters) {
      if (sem.grades.length > 0) {
        const correctRegistered = sem.grades.reduce((acc, g) => acc + (g.credits || 0), 0);
        const correctEarned = sem.grades
          .filter(g => g.grade.trim().toUpperCase() !== 'F')
          .reduce((acc, g) => acc + (g.credits || 0), 0);

        if (sem.creditsEarned !== correctEarned || sem.creditsRegistered !== correctRegistered) {
          await prisma.semesterRecord.update({
            where: { id: sem.id },
            data: {
              creditsRegistered: correctRegistered,
              creditsEarned: correctEarned,
              updatedAt: new Date()
            }
          });
          sem.creditsRegistered = correctRegistered;
          sem.creditsEarned = correctEarned;
          needsRecalculation = true;
        }
      }
    }

    if (needsRecalculation) {
      const updatedCGPA = await recalculateAcademicAverages(profile.id);
      profile.cgpa = updatedCGPA;
    }

    // Compute aggregated stats
    let totalCreditsRegistered = 0;
    let totalCreditsEarned = 0;
    let totalSubjectsCount = 0;

    for (const sem of profile.semesters) {
      totalCreditsRegistered += sem.creditsRegistered || 0;
      totalCreditsEarned += sem.creditsEarned || 0;
      totalSubjectsCount += sem.grades.length;
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        rollNumber: profile.rollNumber,
        program: profile.program,
        branch: profile.branch,
        section: profile.section,
        cgpa: profile.cgpa,
      },
      stats: {
        semestersCount: profile.semesters.length,
        totalCreditsRegistered,
        totalCreditsEarned,
        totalSubjectsCount,
        overallCGPA: profile.cgpa,
      },
      semesters: profile.semesters,
      database: 'Neon Serverless PostgreSQL (Direct Persistent Storage)'
    });

  } catch (error: any) {
    console.error('Academic Records GET Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch academic records' }, { status: 500 });
  }
}

// ── POST: ADD SEMESTER OR SUBJECT TO NEON DB ──────────────────────────────
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    if (!sessionToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = await verifySession(sessionToken);
    if (!userId) return NextResponse.json({ error: 'Invalid Session' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    const profile = await prisma.academicProfile.findUnique({ where: { userId } });
    if (!profile) return NextResponse.json({ error: 'Academic profile not found' }, { status: 404 });

    // ACTION 1: Add a New Semester Record
    if (action === 'addSemester') {
      const { semesterNumber, sgpa = 0.0, remarks = 'PASS' } = body;
      const semNum = parseInt(semesterNumber, 10);

      if (isNaN(semNum) || semNum < 1 || semNum > 12) {
        return NextResponse.json({ error: 'Valid semester number (1-12) required' }, { status: 400 });
      }

      // Check if semester already exists
      const existing = await prisma.semesterRecord.findUnique({
        where: {
          profileId_semesterNumber: {
            profileId: profile.id,
            semesterNumber: semNum
          }
        }
      });

      if (existing) {
        return NextResponse.json({ error: `Semester ${semNum} already exists in database` }, { status: 409 });
      }

      const newSemester = await prisma.semesterRecord.create({
        data: {
          profileId: profile.id,
          semesterNumber: semNum,
          sgpa: parseFloat(sgpa) || 0.0,
          creditsRegistered: 0,
          creditsEarned: 0,
          remarks: remarks || 'PASS'
        },
        include: { grades: true }
      });

      await recalculateAcademicAverages(profile.id, newSemester.id);

      return NextResponse.json({ 
        success: true, 
        message: `Semester ${semNum} created in NeonDB`, 
        semester: newSemester 
      });
    }

    // ACTION 2: Add Subject Grade to a Semester
    if (action === 'addSubject') {
      const { semesterId, subjectCode, subjectName, credits, grade } = body;

      if (!semesterId || !subjectCode || !subjectName || credits === undefined || !grade) {
        return NextResponse.json({ error: 'Missing required subject parameters' }, { status: 400 });
      }

      const numCredits = parseFloat(credits);
      if (isNaN(numCredits) || numCredits <= 0) {
        return NextResponse.json({ error: 'Credits must be a positive number' }, { status: 400 });
      }

      // Upsert Grade Entry
      const cleanCode = subjectCode.trim().toUpperCase();
      const cleanGrade = grade.trim().toUpperCase();

      const gradeEntry = await prisma.gradeEntry.upsert({
        where: {
          semesterId_subjectCode: {
            semesterId,
            subjectCode: cleanCode
          }
        },
        create: {
          semesterId,
          subjectCode: cleanCode,
          subjectName: subjectName.trim(),
          credits: numCredits,
          grade: cleanGrade
        },
        update: {
          subjectName: subjectName.trim(),
          credits: numCredits,
          grade: cleanGrade
        }
      });

      // Recalculate SGPA & CGPA
      await recalculateAcademicAverages(profile.id, semesterId);

      return NextResponse.json({
        success: true,
        message: `Subject ${cleanCode} saved to NeonDB`,
        gradeEntry
      });
    }

    return NextResponse.json({ error: 'Invalid action provided' }, { status: 400 });

  } catch (error: any) {
    console.error('Academic Records POST Error:', error);
    return NextResponse.json({ error: error.message || 'Database transaction failed' }, { status: 500 });
  }
}

// ── PUT: UPDATE SUBJECT OR SEMESTER IN NEON DB ─────────────────────────────
export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    if (!sessionToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = await verifySession(sessionToken);
    if (!userId) return NextResponse.json({ error: 'Invalid Session' }, { status: 401 });

    const profile = await prisma.academicProfile.findUnique({ where: { userId } });
    if (!profile) return NextResponse.json({ error: 'Academic profile not found' }, { status: 404 });

    const body = await req.json();
    const { action } = body;

    // ACTION 1: Update an Individual Subject Grade
    if (action === 'updateSubject') {
      const { gradeId, subjectCode, subjectName, credits, grade } = body;

      if (!gradeId) {
        return NextResponse.json({ error: 'Grade ID required' }, { status: 400 });
      }

      const existingGrade = await prisma.gradeEntry.findUnique({
        where: { id: gradeId },
        include: { semester: true }
      });

      if (!existingGrade || existingGrade.semester.profileId !== profile.id) {
        return NextResponse.json({ error: 'Grade record not found or unauthorized' }, { status: 404 });
      }

      const updateData: any = {};
      if (subjectCode) updateData.subjectCode = subjectCode.trim().toUpperCase();
      if (subjectName) updateData.subjectName = subjectName.trim();
      if (credits !== undefined) updateData.credits = parseFloat(credits);
      if (grade) updateData.grade = grade.trim().toUpperCase();

      const updatedGrade = await prisma.gradeEntry.update({
        where: { id: gradeId },
        data: updateData
      });

      // Auto-recalculate SGPA for this semester & overall CGPA
      const newCGPA = await recalculateAcademicAverages(profile.id, existingGrade.semesterId);

      return NextResponse.json({
        success: true,
        message: `Grade entry updated in NeonDB`,
        grade: updatedGrade,
        newCGPA
      });
    }

    // ACTION 2: Update Semester Metadata
    if (action === 'updateSemester') {
      const { semesterId, sgpa, remarks, creditsRegistered, creditsEarned } = body;

      const sem = await prisma.semesterRecord.findUnique({ where: { id: semesterId } });
      if (!sem || sem.profileId !== profile.id) {
        return NextResponse.json({ error: 'Semester record not found' }, { status: 404 });
      }

      const updateData: any = { updatedAt: new Date() };
      if (sgpa !== undefined) updateData.sgpa = parseFloat(sgpa);
      if (remarks !== undefined) updateData.remarks = remarks;
      if (creditsRegistered !== undefined) updateData.creditsRegistered = parseFloat(creditsRegistered);
      if (creditsEarned !== undefined) updateData.creditsEarned = parseFloat(creditsEarned);

      const updatedSem = await prisma.semesterRecord.update({
        where: { id: semesterId },
        data: updateData
      });

      const newCGPA = await recalculateAcademicAverages(profile.id, semesterId);

      return NextResponse.json({
        success: true,
        message: `Semester ${updatedSem.semesterNumber} updated in NeonDB`,
        semester: updatedSem,
        newCGPA
      });
    }

    // ACTION 3: Recompute All Averages
    if (action === 'recalculate') {
      const newCGPA = await recalculateAcademicAverages(profile.id);
      return NextResponse.json({
        success: true,
        message: 'Recalculated all SGPA and CGPA in NeonDB',
        newCGPA
      });
    }

    return NextResponse.json({ error: 'Invalid update action' }, { status: 400 });

  } catch (error: any) {
    console.error('Academic Records PUT Error:', error);
    return NextResponse.json({ error: error.message || 'Database update failed' }, { status: 500 });
  }
}

// ── DELETE: REMOVE SUBJECT OR SEMESTER FROM NEON DB ───────────────────────
export async function DELETE(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    if (!sessionToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = await verifySession(sessionToken);
    if (!userId) return NextResponse.json({ error: 'Invalid Session' }, { status: 401 });

    const profile = await prisma.academicProfile.findUnique({ where: { userId } });
    if (!profile) return NextResponse.json({ error: 'Academic profile not found' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const gradeId = searchParams.get('gradeId');
    const semesterId = searchParams.get('semesterId');

    // Case 1: Delete a single course grade
    if (gradeId) {
      const grade = await prisma.gradeEntry.findUnique({
        where: { id: gradeId },
        include: { semester: true }
      });

      if (!grade || grade.semester.profileId !== profile.id) {
        return NextResponse.json({ error: 'Grade not found or unauthorized' }, { status: 404 });
      }

      await prisma.gradeEntry.delete({ where: { id: gradeId } });
      const newCGPA = await recalculateAcademicAverages(profile.id, grade.semesterId);

      return NextResponse.json({
        success: true,
        message: `Subject ${grade.subjectCode} removed from NeonDB`,
        newCGPA
      });
    }

    // Case 2: Delete an entire semester
    if (semesterId) {
      const semester = await prisma.semesterRecord.findUnique({ where: { id: semesterId } });

      if (!semester || semester.profileId !== profile.id) {
        return NextResponse.json({ error: 'Semester not found or unauthorized' }, { status: 404 });
      }

      // Delete grades first then semester (or cascade)
      await prisma.gradeEntry.deleteMany({ where: { semesterId } });
      await prisma.semesterRecord.delete({ where: { id: semesterId } });

      const newCGPA = await recalculateAcademicAverages(profile.id);

      return NextResponse.json({
        success: true,
        message: `Semester ${semester.semesterNumber} removed from NeonDB`,
        newCGPA
      });
    }

    return NextResponse.json({ error: 'Either gradeId or semesterId query param required' }, { status: 400 });

  } catch (error: any) {
    console.error('Academic Records DELETE Error:', error);
    return NextResponse.json({ error: error.message || 'Database deletion failed' }, { status: 500 });
  }
}

