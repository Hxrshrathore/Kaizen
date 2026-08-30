import { NextResponse } from "next/server";
// Ensure you have: npm install @google/genai
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const { message, userContext, gradeContext } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Server API Key missing" }, { status: 500 });
    }

    // 1. Initialize the SDK (Same as Vite/Flashcards)
    const ai = new GoogleGenAI({ apiKey });

    // Construct the System Prompt
    const systemPrompt = `
      You are Kaizen Lite, a rule-based academic assistant for a student named ${userContext.name}.
      
      STUDENT METRICS:
      - Current CGPA: ${userContext.currentCGPA}
      - Total Credits: ${userContext.totalCredits}
      - Academic History:
      ${gradeContext}

      DIRECTIVES:
      1. **Persona**: You are a futuristic, efficient, and data-driven AI. Be concise.
      2. **Capabilities**: You can analyze *past* performance, identify weak subjects (Grade C, D, F), and explain topics related to the subject names provided.
      3. **RESTRICTION (CRITICAL)**: You represent the "Lite" version of the system. 
         - If the user asks for *predictions* (e.g., "Will I pass next sem?", "What if I get an O?", "Predict my final CGPA"), you MUST REFUSE.
         - Standard Refusal Message: "Predictive Stochastic Modeling is a Phase 2 feature (LOCKED). I can only analyze existing deterministic data."
      4. **Wellness**: If the user seems stressed, offer brief, stoic advice on academic resilience.
    `;

    // 2. Use the EXACT model from your working code
    // 3. Pass systemInstruction in config
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-09-2025", 
      contents: { role: 'user', parts: [{ text: message }] },
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    // 4. 🔥 CRITICAL FIX: Access text as a PROPERTY, not a function
    // The @google/genai SDK returns text as a getter property
    const text = response.text;

    if (!text) {
       throw new Error("Empty response from AI");
    }

    return NextResponse.json({ text });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ 
      error: "Failed to generate response", 
      details: error.message 
    }, { status: 500 });
  }
}