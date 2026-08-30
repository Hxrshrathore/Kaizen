import { NextResponse } from "next/server";
// Ensure you have: npm install @google/genai
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();

    if (!topic || typeof topic !== "string") {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY missing" },
        { status: 500 }
      );
    }

    // 1. Initialize the SDK (Same as Vite)
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Generate 6 concise, high-value academic flashcards for the topic: "${topic}".
      Focus on key concepts, definitions, or critical logic.

      Return strictly a JSON array of objects with keys "question" and "answer".
      Example:
      [
        { "question": "What is Big O?", "answer": "Upper bound of algorithmic complexity." }
      ]
    `.trim();

    // 2. Use the EXACT model from your Vite code
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-09-2025",
      contents: { role: 'user', parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    // 3. 🔥 CRITICAL FIX: Access text as a PROPERTY, not a function
    const text = response.text; 
    
    if (!text) {
      return NextResponse.json(
        { error: "Empty AI response" },
        { status: 500 }
      );
    }

    let cards;
    try {
      // Clean potential markdown blocks
      const cleanText = text.replace(/```json|```/g, '').trim();
      cards = JSON.parse(cleanText);
    } catch (err) {
      console.error("JSON parse failed:", text);
      return NextResponse.json(
        { error: "Invalid JSON from model" },
        { status: 500 }
      );
    }

    return NextResponse.json({ cards });

  } catch (err: any) {
    console.error("Flashcard API error:", err);
    return NextResponse.json(
      {
        error: "Generation failed",
        details: err.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}