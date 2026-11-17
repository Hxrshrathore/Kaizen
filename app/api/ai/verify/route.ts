import { NextResponse } from "next/server";
import { verifyExaminationPaper } from "@/lib/paper-verification-engine";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paperText, subjectCode, subjectName, examType = "end_sem" } = body;

    if (!paperText || !subjectCode) {
      return NextResponse.json({ error: "Missing paperText or subjectCode" }, { status: 400 });
    }

    const report = await verifyExaminationPaper({
      paperText,
      subjectCode,
      subjectName: subjectName || subjectCode,
      examType
    });

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error("POST /api/ai/verify error:", error);
    return NextResponse.json({ error: error.message || "Verification failed" }, { status: 500 });
  }
}
