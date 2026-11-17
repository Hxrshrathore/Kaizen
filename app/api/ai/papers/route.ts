import { NextResponse } from "next/server";
import { saveGeneratedPaper, getSavedPapers } from "@/lib/paper-storage";
import { verifyExaminationPaper } from "@/lib/paper-verification-engine";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectCode = searchParams.get("subjectCode") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const papers = await getSavedPapers(subjectCode, limit);
    return NextResponse.json({ success: true, papers });
  } catch (error: any) {
    console.error("GET /api/ai/papers error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch saved papers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      subjectCode, 
      subjectName, 
      examType = "end_sem", 
      fullMarks, 
      duration, 
      faculty, 
      section, 
      semester = 7, 
      content, 
      reasoning, 
      topics = [] 
    } = body;

    if (!content || !subjectCode) {
      return NextResponse.json({ error: "Missing required paper content or subjectCode" }, { status: 400 });
    }

    // Attempt to verify session if user is logged in
    let userId: string | null = null;
    try {
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get("session_token")?.value;
      if (sessionToken) {
        userId = await verifySession(sessionToken);
      }
    } catch {}

    // Run Smart AI Verification against ingested PYQ corpus
    const verificationReport = await verifyExaminationPaper({
      paperText: content,
      subjectCode,
      subjectName: subjectName || subjectCode,
      examType
    });

    // Save paper with verification metrics
    const saved = await saveGeneratedPaper({
      userId,
      subjectCode,
      subjectName: subjectName || subjectCode,
      examType,
      fullMarks: fullMarks || (examType === "mid_sem" ? 20 : 50),
      duration: duration || (examType === "mid_sem" ? "1.5 Hours" : "2.5 Hours"),
      faculty,
      section,
      semester,
      content,
      reasoning,
      topics,
      pyqMatchRate: verificationReport.pyqMatchRate,
      bloomCompliance: verificationReport.bloomCompliance,
      coCompliance: verificationReport.coCompliance,
      examProbabilityScore: verificationReport.examProbabilityScore,
      verificationReport
    });

    return NextResponse.json({ 
      success: true, 
      paper: saved,
      verification: verificationReport 
    });
  } catch (error: any) {
    console.error("POST /api/ai/papers error:", error);
    return NextResponse.json({ error: error.message || "Failed to save generated paper" }, { status: 500 });
  }
}
