import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { ensureBackendRunning } from "@/lib/backend-manager";

export async function POST(request: Request) {
  try {
    await ensureBackendRunning(15000);
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const filename = file.name;
    const ext = path.extname(filename).toLowerCase();
    const allowed = [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".docx", ".pptx"];
    if (!allowed.includes(ext)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${ext}. Allowed: PDF, PNG, JPG, WEBP, DOCX, PPTX` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Save to data/pyqs/raw
    const rawDir = path.join(process.cwd(), "data", "pyqs", "raw");
    await mkdir(rawDir, { recursive: true });
    const targetPath = path.join(rawDir, filename);
    await writeFile(targetPath, buffer);

    // Call FastAPI ingestion pipeline endpoint
    const fastApiResp = await fetch("http://localhost:8000/api/ingest/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename }),
    });

    if (!fastApiResp.ok) {
      const err = await fastApiResp.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || "FastAPI pipeline ingestion failed" },
        { status: 500 }
      );
    }

    const result = await fastApiResp.json();
    return NextResponse.json({
      success: true,
      message: `Ingested ${filename}: ${result.totalPages} pages enhanced & ${result.stagedQuestionsCount} questions staged to Upstash Redis!`,
      result,
    });
  } catch (err: any) {
    console.error("Upload API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
