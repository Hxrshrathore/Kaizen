import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { upstashRedis, StagedQuestion } from "@/lib/upstash";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const format = url.searchParams.get("format") || "alpaca"; // "alpaca" | "chatml" | "sharegpt" | "csv"
    const source = url.searchParams.get("source") || "neon"; // "neon" | "redis" | "both"
    const subject = url.searchParams.get("subject");
    const subjectCode = url.searchParams.get("subjectCode");
    const examType = url.searchParams.get("examType");
    const year = url.searchParams.get("year");
    const limit = parseInt(url.searchParams.get("limit") || "5000", 10);

    const questions: Array<{
      id: string;
      subject: string;
      subjectCode: string;
      year: string;
      examType: string;
      text: string;
      solution?: string;
    }> = [];

    // 1. Fetch from Neon DB (Approved Golden Questions)
    if (source === "neon" || source === "both") {
      const where: any = { status: "APPROVED" };
      if (subject) where.subject = subject;
      if (subjectCode) where.subjectCode = subjectCode;
      if (examType) where.examType = examType;
      if (year) where.year = year;

      const neonRows = await prisma.ocrQuestion.findMany({
        where,
        take: limit,
        orderBy: { createdAt: "desc" },
      });

      for (const r of neonRows) {
        questions.push({
          id: r.id,
          subject: r.subject || "General Engineering",
          subjectCode: r.subjectCode || "ENG2001",
          year: r.year || "2024",
          examType: r.examType || "Endsem",
          text: r.correctedText || r.rawOcrText || "",
          solution: "", // Can be filled by students or AI
        });
      }
    }

    // 2. Fetch from Upstash Redis (Staged/Reviewed Questions)
    if (source === "redis" || source === "both") {
      const queueIds = await upstashRedis.smembers("kaizen:staging:queue");
      const remainingLimit = limit - questions.length;
      if (remainingLimit > 0 && queueIds.length > 0) {
        const fetchPromises = queueIds.slice(0, remainingLimit).map((id) =>
          upstashRedis.get<StagedQuestion>(`kaizen:staging:item:${id}`)
        );
        const redisItems = await Promise.all(fetchPromises);
        for (const item of redisItems) {
          if (!item) continue;
          if (subject && item.subject !== subject) continue;
          if (subjectCode && item.subjectCode !== subjectCode) continue;
          if (examType && item.examType !== examType) continue;
          if (year && item.year !== year) continue;

          questions.push({
            id: item.id,
            subject: item.subject,
            subjectCode: item.subjectCode,
            year: item.year,
            examType: item.examType,
            text: item.cleanText || item.rawOcrText,
            solution: item.solution || "",
          });
        }
      }
    }

    // ── FORMAT 1: Alpaca / Unsloth Instruction Tuning JSONL ──────────────────
    if (format === "alpaca" || format === "unsloth") {
      const jsonlLines = questions.map((q) => {
        const sample = {
          instruction: `You are Kaizen AI, an expert academic tutor for KIIT university. Answer the following ${q.subject} (${q.subjectCode}) ${q.year} ${q.examType} examination question with clear step-by-step reasoning, mathematical formulas in LaTeX, and correct options if applicable.`,
          input: q.text,
          output: q.solution || `[Pending Solution Synthesis for ${q.subjectCode}]`,
        };
        return JSON.stringify(sample);
      });

      const body = jsonlLines.join("\n");
      return new NextResponse(body, {
        headers: {
          "Content-Type": "application/x-jsonlines",
          "Content-Disposition": `attachment; filename="kaizen_finetune_alpaca_${Date.now()}.jsonl"`,
        },
      });
    }

    // ── FORMAT 2: OpenAI / Gemini / ChatML JSONL ─────────────────────────────
    if (format === "chatml" || format === "gemini" || format === "openai") {
      const jsonlLines = questions.map((q) => {
        const sample = {
          messages: [
            {
              role: "system",
              content:
                "You are Kaizen, an advanced AI tutor for engineering students. You provide mathematically rigorous, step-by-step solutions to examination questions, citing formulas, derivations, and final conclusions clearly.",
            },
            {
              role: "user",
              content: `[${q.subjectCode} - ${q.subject} | ${q.year} ${q.examType}]\n\n${q.text}`,
            },
            {
              role: "assistant",
              content: q.solution || `[Step-by-step solution for: ${q.text.slice(0, 60)}...]`,
            },
          ],
        };
        return JSON.stringify(sample);
      });

      const body = jsonlLines.join("\n");
      return new NextResponse(body, {
        headers: {
          "Content-Type": "application/x-jsonlines",
          "Content-Disposition": `attachment; filename="kaizen_finetune_chatml_${Date.now()}.jsonl"`,
        },
      });
    }

    // ── FORMAT 3: ShareGPT JSONL ─────────────────────────────────────────────
    if (format === "sharegpt") {
      const jsonlLines = questions.map((q) => {
        const sample = {
          conversations: [
            {
              from: "human",
              value: `[${q.subjectCode} ${q.year} ${q.examType}]\n${q.text}`,
            },
            {
              from: "gpt",
              value: q.solution || `Solution for ${q.subjectCode}`,
            },
          ],
        };
        return JSON.stringify(sample);
      });

      const body = jsonlLines.join("\n");
      return new NextResponse(body, {
        headers: {
          "Content-Type": "application/x-jsonlines",
          "Content-Disposition": `attachment; filename="kaizen_finetune_sharegpt_${Date.now()}.jsonl"`,
        },
      });
    }

    // ── FORMAT 4: Standard CSV ───────────────────────────────────────────────
    const csvRows = ["ID,Subject,SubjectCode,Year,ExamType,QuestionText,Solution"];
    for (const q of questions) {
      const cleanQ = (q.text || "").replace(/"/g, '""');
      const cleanS = (q.solution || "").replace(/"/g, '""');
      csvRows.push(
        `"${q.id}","${q.subject}","${q.subjectCode}","${q.year}","${q.examType}","${cleanQ}","${cleanS}"`
      );
    }
    const csvBody = csvRows.join("\n");
    return new NextResponse(csvBody, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="kaizen_dataset_${Date.now()}.csv"`,
      },
    });
  } catch (err: any) {
    console.error("Export error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

