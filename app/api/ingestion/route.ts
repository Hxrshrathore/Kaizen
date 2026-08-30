import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "PENDING";
    
    const records = await prisma.ocrQuestion.findMany({
      where: {
        status: status as any
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(records);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, correctedText, status, subject, year, examType } = data;

    const updated = await prisma.ocrQuestion.update({
      where: { id },
      data: {
        correctedText,
        subject: subject !== undefined ? subject : undefined,
        year: year !== undefined ? year : undefined,
        examType: examType !== undefined ? examType : undefined,
        status: status || "APPROVED"
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
