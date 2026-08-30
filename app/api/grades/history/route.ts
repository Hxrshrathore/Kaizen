import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie');
    const token = cookieHeader?.split('session_token=')[1]?.split(';')[0];
    
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const userId = await verifySession(token);
    if (!userId) return NextResponse.json({ error: "Invalid Session" }, { status: 401 });

    // Fetch Profile -> Semesters -> Grades
    const profile = await prisma.academicProfile.findUnique({
      where: { userId },
      include: {
        semesters: {
          include: {
            grades: true
          },
          orderBy: { semesterNumber: 'desc' } // Latest sem first
        }
      }
    });

    if (!profile) {
      return NextResponse.json({ history: [] });
    }

    // Flatten the data structure for the frontend
    const history = profile.semesters.flatMap(sem => 
      sem.grades.map(grade => ({
        id: grade.id,
        semester: sem.semesterNumber,
        subjectCode: grade.subjectCode,
        subjectName: grade.subjectName,
        credits: grade.credits,
        grade: grade.grade
      }))
    );

    return NextResponse.json({ history });

  } catch (error) {
    console.error("Fetch History Error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}