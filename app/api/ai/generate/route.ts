import { NextResponse } from "next/server";
import { ensureBackendRunning } from "@/lib/backend-manager";
import { GoogleGenAI } from "@google/genai";
import { 
  CandidateQuestion, 
  solveCombinatorialExamination, 
  formatCombinatorialExaminerPrompt 
} from "@/lib/exam-combinatorial-engine";

const NVIDIA_API_BASE = "https://integrate.api.nvidia.com/v1";

function textToSparse(text: string) {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
  const tf: Record<number, number> = {};
  for (const w of words) {
    let hash = 0;
    for (let i = 0; i < w.length; i++) hash = (hash * 31 + w.charCodeAt(i)) & 0xffff;
    tf[hash] = (tf[hash] || 0) + 1;
  }
  const indices = Object.keys(tf).map(Number);
  const values = Object.values(tf).map((v) => Math.log(1 + v));
  return { indices, values };
}

async function retrieveVectorGrounding(
  queryText: string,
  subjectCode?: string,
  subject?: string,
  examType: "mid_sem" | "end_sem" = "end_sem"
): Promise<{ groundingText: string; count: number; blueprint?: any }> {
  const upstashUrl = process.env.UPSTASH_VECTOR_REST_URL;
  const upstashToken = process.env.UPSTASH_VECTOR_REST_TOKEN;
  const geminiKey = process.env.GEMINI_API_KEY;

  const candidates: CandidateQuestion[] = [];
  const seenTexts = new Set<string>();

  const isEpp = /ex40003|hs40001/i.test(subjectCode || "") || /professional|economics/i.test(subject || "");
  const isTesting = /cs40003/i.test(subjectCode || "") || /testing|automation/i.test(subject || "");

  // 1. Query Upstash Vector DB
  if (upstashUrl && upstashToken && geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const embRes = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: `${subject || ""} ${subjectCode || ""} examination questions: ${queryText.slice(0, 300)}`,
        config: { outputDimensionality: 1536 },
      });
      const vector = embRes.embeddings?.[0]?.values;

      if (vector) {
        const sparseVector = textToSparse(queryText);
        const queryBody: any = {
          vector,
          sparseVector,
          topK: 12,
          includeMetadata: true,
        };
        if (subjectCode) {
          queryBody.filter = `subjectCode = '${subjectCode}'`;
        }

        const queryRes = await fetch(`${upstashUrl}/query`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${upstashToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(queryBody),
        });

        if (queryRes.ok) {
          const queryData = await queryRes.json();
          if (Array.isArray(queryData.result)) {
            for (const item of queryData.result) {
              const q = item.metadata?.question;
              if (q && !seenTexts.has(q)) {
                seenTexts.add(q);
                candidates.push({
                  id: item.id || `vec_${candidates.length}`,
                  text: q,
                  marks: Number(item.metadata?.marks) || 10,
                  co: (item.metadata?.co as any) || "CO1",
                  bloomLevel: (item.metadata?.bloomLevel as any) || "L3_APPLY",
                  topic: item.metadata?.module || item.metadata?.topic || subject || "Core Topic",
                  module: item.metadata?.module || "Curriculum",
                  recurrenceScore: Number(item.score) || 0.85,
                  year: item.metadata?.year,
                  source: item.metadata?.source,
                });
              }
            }
          }
        }
      }
    } catch (vectorErr) {
      console.warn("Upstash Vector query warning:", vectorErr);
    }
  }

  // 2. Query NeonDB OcrQuestion table as reliable dual grounding
  try {
    const { prisma } = await import("@/lib/prisma");
    const dbFilter: any = isEpp
      ? { OR: [{ subjectCode: "EX40003" }, { subjectCode: "HS40001" }, { subject: { contains: "Professional", mode: "insensitive" } }] }
      : (subjectCode ? { subjectCode } : {});

    const dbQuestions = await prisma.ocrQuestion.findMany({
      where: {
        ...dbFilter,
        status: "APPROVED",
      },
      take: 15,
      orderBy: { createdAt: "desc" },
    });

    for (const q of dbQuestions) {
      const qText = q.correctedText || q.rawOcrText;
      if (qText && !seenTexts.has(qText)) {
        seenTexts.add(qText);
        candidates.push({
          id: q.id,
          text: qText,
          marks: 10,
          co: "CO2",
          bloomLevel: "L3_APPLY",
          topic: q.subject || subject || "Curriculum",
          module: q.sourcePdf || "Approved Question Bank",
          recurrenceScore: 0.88,
          year: q.year || undefined,
          source: q.sourcePdf || undefined,
        });
      }
    }
  } catch (dbErr) {
    console.warn("NeonDB question bank query warning:", dbErr);
  }

  if (candidates.length === 0) return { groundingText: "", count: 0 };

  // 3. Run Constrained Combinatorial Optimization Engine
  const blueprint = solveCombinatorialExamination(
    candidates,
    subjectCode || (isEpp ? "EX40003" : "CS40003"),
    subject || (isEpp ? "Engineering Professional Practice" : "Software Testing and Automation"),
    examType
  );

  const groundingText = formatCombinatorialExaminerPrompt(blueprint);

  return { groundingText, count: candidates.length, blueprint };
}

export async function POST(request: Request) {
  const startTime = Date.now();
  try {
    const body = await request.json();
    const { 
      prompt, 
      subject = "Academic Coursework", 
      subjectCode = "CS40003", 
      examType = "end_sem", 
      faculty = "",
      section = "",
      classroomContext = "",
      model = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
      max_tokens = 8192 
    } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // ── 0. VECTOR DB GROUNDING (Upstash Vector + NeonDB + Combinatorial ML Optimization) ──
    let vectorGroundingContext = "";
    let vectorGroundingCount = 0;
    let combinatorialBlueprint: any = null;
    try {
      const ragResult = await retrieveVectorGrounding(
        prompt, 
        subjectCode, 
        subject, 
        examType === "mid_sem" ? "mid_sem" : "end_sem"
      );
      vectorGroundingContext = ragResult.groundingText;
      vectorGroundingCount = ragResult.count;
      combinatorialBlueprint = ragResult.blueprint;
    } catch (ragErr) {
      console.warn("Vector DB retrieval error:", ragErr);
    }

    const effectivePrompt = vectorGroundingContext 
      ? `${prompt}\n\n${vectorGroundingContext}`
      : prompt;

    // ── 1. LOCAL IN-HOUSE GGUF (Kaizen-Tutor 3B) ──
    if (model === "kaizen-tutor-3b" || model === "local-3b") {
      try {
        const isAwake = await ensureBackendRunning(12000);
        if (isAwake) {
          const backendResp = await fetch("http://127.0.0.1:8000/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: effectivePrompt, max_tokens, temperature: 0.7, top_p: 0.9 }),
          });

          if (backendResp.ok) {
            const data = await backendResp.json();
            return NextResponse.json({
              response: data.response,
              model: "Kaizen-Tutor 3B (GGUF)",
              tokens_consumed: Math.round((effectivePrompt.length + (data.response?.length || 0)) / 4),
              time_taken: parseFloat(((Date.now() - startTime) / 1000).toFixed(2)),
              provider: "local",
              vector_grounded: vectorGroundingCount > 0,
              vector_grounding_count: vectorGroundingCount,
            });
          }
        }
      } catch (localErr) {
        console.warn("Local backend unavailable, falling back to cloud inference:", localErr);
      }
    }

    // ── 2. NVIDIA NIM INFERENCE MICROSERVICES (Primary Generation Engine) ──
    const nvidiaKey = process.env.NVIDIA_API_KEY;
    const isNimModel = model.includes("nemotron") || model.includes("deepseek") || model.includes("kimi") || model.includes("minimax") || model.includes("nvidia");

    if (nvidiaKey && isNimModel) {
      try {
        // Map frontend IDs to official NIM microservice names
        const nimModelMap: Record<string, string> = {
          "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
          "nemotron-3-nano-omni-30b": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
          "nemotron-3.5-bolt-e4b": "nvidia/nemotron-3.5-bolt-e4b",
          "deepseek-v4.1-flash": "deepseek-ai/deepseek-v4.1-flash",
          "kimi-k3.1-pro": "moonshotai/kimi-k3.1-pro",
        };
        const targetNimModel = nimModelMap[model] || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning";
        const effectiveMaxTokens = Math.max(max_tokens || 8192, 6144);

        const nimResp = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${nvidiaKey}`,
          },
          body: JSON.stringify({
            model: targetNimModel,
            messages: [{ role: "user", content: effectivePrompt }],
            temperature: 0.6,
            top_p: 0.95,
            max_tokens: effectiveMaxTokens,
          }),
          signal: AbortSignal.timeout(10000),
        });

        if (nimResp.ok) {
          const nimData = await nimResp.json();
          const choice = nimData.choices?.[0];
          const rawText = choice?.message?.content || "";
          const generatedText = rawText.replace(/\s*\(?ECS GROUP-03\)?/gi, "");
          const reasoningContent = choice?.message?.reasoning_content || "";
          return NextResponse.json({
            response: generatedText,
            reasoning: reasoningContent,
            model: "NVIDIA Nemotron 3 Nano Omni 30B (Reasoning)",
            tokens_consumed: nimData.usage?.total_tokens || Math.round((effectivePrompt.length + generatedText.length) / 4),
            time_taken: parseFloat(((Date.now() - startTime) / 1000).toFixed(2)),
            provider: "nvidia_nim",
            vector_grounded: vectorGroundingCount > 0,
            vector_grounding_count: vectorGroundingCount,
            combinatorial_blueprint: combinatorialBlueprint,
          });
        } else {
          const errBody = await nimResp.text();
          console.warn(`NVIDIA NIM returned HTTP ${nimResp.status}:`, errBody);
        }
      } catch (nimErr) {
        console.warn("NVIDIA NIM call failed, falling back to Gemini:", nimErr);
      }
    }

    // ── 3. GEMINI 3.5 FLASH LITE CLOUD ENGINE (High Throughput Fallback - 500 RPD) ──
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      
      const targetGeminiModels = [
        "gemini-3.5-flash-lite",
        "gemini-3.5-flash",
        "gemini-3.1-flash-lite",
        "gemini-2.5-flash",
      ];

      for (const geminiModel of targetGeminiModels) {
        try {
          const geminiResp = await ai.models.generateContent({
            model: geminiModel,
            contents: { role: "user", parts: [{ text: effectivePrompt }] },
            config: {
              temperature: 0.65,
              maxOutputTokens: max_tokens,
            },
          });

          const rawText = geminiResp.text || "";
          const generatedText = rawText.replace(/\s*\(?ECS GROUP-03\)?/gi, "");
          return NextResponse.json({
            response: generatedText,
            model: `Gemini (${geminiModel})`,
            tokens_consumed: Math.round((effectivePrompt.length + generatedText.length) / 4),
            time_taken: parseFloat(((Date.now() - startTime) / 1000).toFixed(2)),
            provider: "gemini",
            vector_grounded: vectorGroundingCount > 0,
            vector_grounding_count: vectorGroundingCount,
            combinatorial_blueprint: combinatorialBlueprint,
          });
        } catch (geminiModelErr: any) {
          console.warn(`Gemini model ${geminiModel} failed:`, geminiModelErr.message);
        }
      }
    }

    return NextResponse.json(
      { error: "No available LLM provider. Ensure GEMINI_API_KEY or NVIDIA_API_KEY is configured." },
      { status: 503 }
    );
  } catch (err: any) {
    console.error("AI Generate route exception:", err);
    return NextResponse.json({ error: err.message || "Generation error" }, { status: 500 });
  }
}
