import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const result = await prisma.ocrQuestion.create({
      data: {
        imagePath: data.imagePath,
        subject: data.subject,
        year: data.year,
        examType: data.examType,
        sourcePdf: data.sourcePdf,
        pageNumber: data.pageNumber,
        status: "PENDING",
        rawOcrText: data.rawOcrText || "",
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Ingestion insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
