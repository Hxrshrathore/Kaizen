import { NextResponse } from "next/server";
import { ensureBackendRunning } from "@/lib/backend-manager";
import { GoogleGenAI } from "@google/genai";

const NVIDIA_API_BASE = "https://integrate.api.nvidia.com/v1";

export async function POST(request: Request) {
  const startTime = Date.now();
  try {
    const body = await request.json();
    const { 
      prompt, 
      subject = "Academic Coursework", 
      subjectCode = "CS40003", 
      examType = "end_sem", 
      model = "nemotron-3.5-bolt-e4b",
      max_tokens = 1200 
    } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // ── 1. LOCAL IN-HOUSE GGUF (Kaizen-Tutor 3B) ──
    if (model === "kaizen-tutor-3b" || model === "local-3b") {
      try {
        const isAwake = await ensureBackendRunning(12000);
        if (isAwake) {
          const backendResp = await fetch("http://127.0.0.1:8000/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt, max_tokens, temperature: 0.7, top_p: 0.9 }),
          });

          if (backendResp.ok) {
            const data = await backendResp.json();
            return NextResponse.json({
              response: data.response,
              model: "Kaizen-Tutor 3B (GGUF)",
              tokens_consumed: Math.round((prompt.length + (data.response?.length || 0)) / 4),
              time_taken: parseFloat(((Date.now() - startTime) / 1000).toFixed(2)),
              provider: "local",
            });
          }
        }
      } catch (localErr) {
        console.warn("Local backend unavailable, falling back to cloud inference:", localErr);
      }
    }

    // ── 2. NVIDIA NIM INFERENCE MICROSERVICES ──
    const nvidiaKey = process.env.NVIDIA_API_KEY;
    const isNimModel = model.includes("nemotron") || model.includes("deepseek") || model.includes("kimi") || model.includes("minimax");

    if (nvidiaKey && isNimModel) {
      try {
        // Map frontend IDs to official NIM microservice names
        const nimModelMap: Record<string, string> = {
          "nemotron-3.5-bolt-e4b": "nvidia/nemotron-3.5-bolt-e4b",
          "deepseek-v4.1-flash": "deepseek-ai/deepseek-v4.1-flash",
          "kimi-k3.1-pro": "moonshotai/kimi-k3.1-pro",
        };
        const targetNimModel = nimModelMap[model] || "nvidia/nemotron-3.5-bolt-e4b";

        const nimResp = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${nvidiaKey}`,
          },
          body: JSON.stringify({
            model: targetNimModel,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: max_tokens,
          }),
        });

        if (nimResp.ok) {
          const nimData = await nimResp.json();
          const generatedText = nimData.choices?.[0]?.message?.content || "";
          return NextResponse.json({
            response: generatedText,
            model: targetNimModel,
            tokens_consumed: nimData.usage?.total_tokens || Math.round((prompt.length + generatedText.length) / 4),
            time_taken: parseFloat(((Date.now() - startTime) / 1000).toFixed(2)),
            provider: "nvidia_nim",
          });
        }
      } catch (nimErr) {
        console.warn("NVIDIA NIM call failed, falling back to Gemini:", nimErr);
      }
    }

    // ── 3. GEMINI 2.5 FLASH CLOUD ENGINE (High Throughput Fallback) ──
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const geminiResp = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-09-2025",
        contents: { role: "user", parts: [{ text: prompt }] },
        config: {
          temperature: 0.7,
          maxOutputTokens: max_tokens,
        },
      });

      const generatedText = geminiResp.text || "";
      return NextResponse.json({
        response: generatedText,
        model: "Gemini 2.5 Flash",
        tokens_consumed: Math.round((prompt.length + generatedText.length) / 4),
        time_taken: parseFloat(((Date.now() - startTime) / 1000).toFixed(2)),
        provider: "gemini",
      });
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
