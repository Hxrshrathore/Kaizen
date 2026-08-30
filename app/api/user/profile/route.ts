import { NextResponse } from 'next/server';
import {prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie');
    const token = cookieHeader?.split('session_token=')[1]?.split(';')[0];
    
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const userId = await verifySession(token);
    if (!userId) return NextResponse.json({ error: "Invalid Session" }, { status: 401 });

    // Fetch User with Academic Profile and Semesters
    const user = await prisma.user.findUnique({
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

    // Calculate Stats
    const academic = user.academicProfile;
    const semestersLogged = academic?.semesters.length || 0;
    
    // Calculate Total Credits across all semesters
    const totalCredits = academic?.semesters.reduce((acc: any, sem: any) => acc + sem.creditsEarned, 0) || 0;

    return NextResponse.json({
      name: user.name || "Student",
      email: user.email,
      rollNumber: academic?.rollNumber || "N/A",
      program: academic?.program || "N/A",
      section: academic?.section || "N/A",
      currentCGPA: academic?.cgpa || 0.0,
      totalCredits: totalCredits,
      semestersLogged: semestersLogged
    });

  } catch (error) {
    console.error("Profile Fetch Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
