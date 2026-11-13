import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { getOfficialBadge } from '@/lib/rbac';

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie');
    const token = cookieHeader?.split('session_token=')[1]?.split(';')[0];
    
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const userId = await verifySession(token);
    if (!userId) return NextResponse.json({ error: "Invalid Session" }, { status: 401 });

    // Fetch User with Academic Profile, Semesters and RBAC Fields
    let user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        academicProfile: {
          include: {
            semesters: true
          }
        }
      }
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Auto-enrich / self-heal using StudentDirectory based on roll number
    const rollMatch = user.email.match(/^(\d+)@kiit\.ac\.in$/i);
    const extractedRoll = user.academicProfile?.rollNumber || (rollMatch ? rollMatch[1] : null);
    let directoryStudent: any = null;

    if (extractedRoll) {
      try {
        directoryStudent = await prisma.studentDirectory.findUnique({
          where: { rollNo: extractedRoll }
        });

        if (directoryStudent) {
          const targetSection = directoryStudent.section || 'ECS GROUP-03';
          const targetProgram = directoryStudent.program || 'B.Tech in Electronics Engineering (7th Sem)';
          const targetBranch = directoryStudent.branch || (targetProgram.includes('ETC') ? 'ETC' : targetProgram.includes('EEE') ? 'EEE' : 'E&CSc');

          // If academic profile doesn't exist, create it
          if (!user.academicProfile) {
            const newProfile = await prisma.academicProfile.create({
              data: {
                userId: user.id,
                rollNumber: extractedRoll,
                section: targetSection,
                branch: targetBranch,
                program: targetProgram,
                cgpa: 0.0
              },
              include: { semesters: true }
            });
            user = { ...user, academicProfile: newProfile };
          } else if (!user.academicProfile.branch || user.academicProfile.section === 'ECSc3' || !user.academicProfile.section) {
            // Update to normalized official section & branch
            const updatedProfile = await prisma.academicProfile.update({
              where: { id: user.academicProfile.id },
              data: {
                section: targetSection,
                branch: targetBranch,
                program: user.academicProfile.program || targetProgram
              },
              include: { semesters: true }
            });
            user = { ...user, academicProfile: updatedProfile };
          }

          // If department or name needs updating
          if (!user.department || user.department === 'School of Computer Engineering') {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                department: 'School of Electronics Engineering'
              }
            });
            user.department = 'School of Electronics Engineering';
          }
        }
      } catch (err) {
        console.warn("Directory self-heal warning:", err);
      }
    }

    // Query elective allotment from AcademicProfile or StudentDirectory
    let electiveAllotment: any = null;
    try {
      if (extractedRoll) {
        const apElective = await prisma.$queryRaw<any[]>`
          SELECT "electiveSection", "electiveSubject", "electiveFaculty", "electiveRoom"
          FROM "AcademicProfile"
          WHERE "userId" = ${userId}
          LIMIT 1
        `;
        if (apElective && apElective.length > 0 && apElective[0].electiveSection) {
          electiveAllotment = apElective[0];
        } else {
          const dirElective = await prisma.$queryRaw<any[]>`
            SELECT "electiveSection", "electiveSubject", "electiveFaculty", "electiveRoom"
            FROM "StudentDirectory"
            WHERE "rollNo" = ${extractedRoll}
            LIMIT 1
          `;
          if (dirElective && dirElective.length > 0 && dirElective[0].electiveSection) {
            electiveAllotment = dirElective[0];
          }
        }
      }
    } catch (e) {
      console.warn("Elective allotment query error:", e);
    }

    // Calculate Stats
    const academic = user.academicProfile;
    const semestersLogged = academic?.semesters.length || 0;
    
    // Calculate Total Credits across all semesters
    const totalCredits = academic?.semesters.reduce((acc: any, sem: any) => acc + sem.creditsEarned, 0) || 0;

    const badge = getOfficialBadge(user);

    return NextResponse.json({
      id: user.id,
      name: user.name || directoryStudent?.name || "Student",
      email: user.email,
      image: user.image,
      userType: user.userType,
      officialTag: user.officialTag,
      officialTags: user.officialTags,
      permissions: user.permissions,
      department: user.department || "School of Electronics Engineering",
      designation: user.designation,
      badge: badge,
      rollNumber: academic?.rollNumber || extractedRoll || "N/A",
      program: academic?.program || directoryStudent?.program || "B.Tech",
      branch: academic?.branch || directoryStudent?.branch || "E&CSc",
      section: academic?.section || directoryStudent?.section || "ECS GROUP-03",
      electiveSection: electiveAllotment?.electiveSection || null,
      electiveSubject: electiveAllotment?.electiveSubject || null,
      electiveFaculty: electiveAllotment?.electiveFaculty || null,
      electiveRoom: electiveAllotment?.electiveRoom || null,
      currentCGPA: academic?.cgpa || 0.0,
      totalCredits: totalCredits,
      semestersLogged: semestersLogged
    });

  } catch (error) {
    console.error("Profile Fetch Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
