/**
 * Kaizen Model Router & AI Priority Cascade
 * Routes prompts dynamically based on task weight:
 * 1. In-House Local GGUF (Kaizen-Tutor 3B/1.5B via FastAPI) - $0
 * 2. Gemini Flash / Lite API (Free & High-Throughput) - $0
 * 3. OpenRouter API Pool (Fallback to free/paid open-source models)
 */

import { GoogleGenAI } from "@google/genai";

export type TaskWeight = "light" | "medium" | "heavy" | "vision" | "batch";

export interface ModelConfig {
  provider: "local" | "gemini" | "openrouter";
  model: string;
  maxTokens: number;
  costPer1kTokens: number;
}

export interface RouterResult {
  text: string;
  model: string;
  provider: "local" | "gemini" | "openrouter";
  latencyMs: number;
  costEst: number;
}

export const MODEL_CASCADE: Record<TaskWeight, ModelConfig[]> = {
  light: [
    { provider: "local", model: "kaizen-tutor-3b", maxTokens: 512, costPer1kTokens: 0 },
    { provider: "gemini", model: "gemini-flash-lite-latest", maxTokens: 1024, costPer1kTokens: 0 },
    { provider: "openrouter", model: "openrouter/free", maxTokens: 1024, costPer1kTokens: 0 },
  ],
  medium: [
    { provider: "gemini", model: "gemini-flash-lite-latest", maxTokens: 2048, costPer1kTokens: 0 },
    { provider: "local", model: "kaizen-tutor-3b", maxTokens: 2048, costPer1kTokens: 0 },
    { provider: "gemini", model: "gemini-2.5-flash", maxTokens: 2048, costPer1kTokens: 0 },
    { provider: "openrouter", model: "openrouter/free", maxTokens: 4096, costPer1kTokens: 0 },
  ],
  heavy: [
    { provider: "gemini", model: "gemini-2.5-flash", maxTokens: 8192, costPer1kTokens: 0.075 },
    { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct", maxTokens: 8192, costPer1kTokens: 0.12 },
    { provider: "gemini", model: "gemini-pro-latest", maxTokens: 8192, costPer1kTokens: 0.30 },
  ],
  vision: [
    { provider: "gemini", model: "gemini-flash-lite-latest", maxTokens: 4096, costPer1kTokens: 0 },
    { provider: "gemini", model: "gemini-2.5-flash", maxTokens: 8192, costPer1kTokens: 0.075 },
  ],
  batch: [
    { provider: "local", model: "kaizen-tutor-3b", maxTokens: 2048, costPer1kTokens: 0 },
    { provider: "gemini", model: "gemini-flash-lite-latest", maxTokens: 2048, costPer1kTokens: 0 },
  ],
};

/**
 * Executes prompt against Local FastAPI LLM
 */
async function callLocalBackend(prompt: string, maxTokens: number): Promise<string> {
  const resp = await fetch("http://127.0.0.1:8000/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, max_tokens: maxTokens }),
    signal: AbortSignal.timeout(6000),
  });

  if (!resp.ok) {
    throw new Error(`Local LLM failed with HTTP ${resp.status}`);
  }

  const data = await resp.json();
  const text = data.text || data.response || data.generated_text;
  if (!text || typeof text !== "string") {
    throw new Error("Local LLM returned empty response");
  }
  return text.trim();
}

/**
 * Executes prompt against Gemini API
 */
async function callGemini(modelName: string, prompt: string, systemPrompt?: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: modelName,
    contents: { role: "user", parts: [{ text: prompt }] },
    config: systemPrompt ? { systemInstruction: systemPrompt } : undefined,
  });

  const text = response.text;
  if (!text) {
    throw new Error(`Gemini ${modelName} returned empty text`);
  }
  return text.trim();
}

/**
 * Executes prompt against OpenRouter API
 */
async function callOpenRouter(modelName: string, prompt: string, systemPrompt?: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const messages: Array<{ role: string; content: string }> = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://nexus-kiit.pages.dev",
      "X-Title": "Nexus Kaizen Academic Engine",
    },
    body: JSON.stringify({
      model: modelName,
      messages,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`OpenRouter (${modelName}) failed [${resp.status}]: ${errText.slice(0, 200)}`);
  }

  const data = await resp.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("OpenRouter returned empty choices");
  }
  return text.trim();
}

/**
 * Priority Cascade Dispatcher
 * Automatically cascades through models until one succeeds.
 */
export async function routeToModel(options: {
  weight: TaskWeight;
  prompt: string;
  systemPrompt?: string;
  overrideModel?: string;
}): Promise<RouterResult> {
  const startTime = Date.now();
  const cascade = MODEL_CASCADE[options.weight] || MODEL_CASCADE.medium;

  const errors: string[] = [];

  for (const config of cascade) {
    try {
      let text = "";
      if (config.provider === "local") {
        text = await callLocalBackend(options.prompt, config.maxTokens);
      } else if (config.provider === "gemini") {
        text = await callGemini(config.model, options.prompt, options.systemPrompt);
      } else if (config.provider === "openrouter") {
        text = await callOpenRouter(config.model, options.prompt, options.systemPrompt);
      }

      if (text) {
        const latencyMs = Date.now() - startTime;
        return {
          text,
          model: config.model,
          provider: config.provider,
          latencyMs,
          costEst: config.costPer1kTokens,
        };
      }
    } catch (err: any) {
      console.warn(`[Model Router] ${config.provider}:${config.model} failed: ${err.message}. Cascading...`);
      errors.push(`${config.provider}:${config.model} -> ${err.message}`);
    }
  }

  throw new Error(`All model cascade tiers failed for weight '${options.weight}'. Errors: ${errors.join(" | ")}`);
}

