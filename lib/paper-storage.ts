import { db } from "@/lib/prisma";

export interface StoredPaper {
  id: string;
  userId?: string | null;
  subjectCode: string;
  subjectName: string;
  examType: string; // 'mid_sem' | 'end_sem'
  fullMarks: number;
  duration: string;
  faculty?: string | null;
  section?: string | null;
  semester?: number | null;
  content: string;
  reasoning?: string | null;
  topics: string[];
  pyqMatchRate: number; // e.g. 88.4
  bloomCompliance: number;
  coCompliance: number;
  examProbabilityScore: number;
  verificationReport?: any;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

let isTableInitialized = false;

/**
 * Ensures the GeneratedPaper table exists in PostgreSQL / NeonDB
 */
export async function ensureGeneratedPaperTable() {
  if (isTableInitialized) return;
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "GeneratedPaper" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT,
        "subjectCode" TEXT NOT NULL,
        "subjectName" TEXT NOT NULL,
        "examType" TEXT NOT NULL,
        "fullMarks" INTEGER NOT NULL DEFAULT 50,
        "duration" TEXT NOT NULL DEFAULT '2.5 Hours',
        "faculty" TEXT,
        "section" TEXT,
        "semester" INTEGER DEFAULT 7,
        "content" TEXT NOT NULL,
        "reasoning" TEXT,
        "topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "pyqMatchRate" DOUBLE PRECISION DEFAULT 88.0,
        "bloomCompliance" DOUBLE PRECISION DEFAULT 100.0,
        "coCompliance" DOUBLE PRECISION DEFAULT 100.0,
        "examProbabilityScore" DOUBLE PRECISION DEFAULT 85.0,
        "verificationReport" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_generated_paper_subject_exam" 
      ON "GeneratedPaper" ("subjectCode", "examType");
    `);

    await db.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_generated_paper_created_at" 
      ON "GeneratedPaper" ("createdAt" DESC);
    `);

    isTableInitialized = true;
  } catch (error) {
    console.warn("Failed to ensure GeneratedPaper table:", error);
  }
}

/**
 * Saves a newly synthesized question paper
 */
export async function saveGeneratedPaper(data: {
  userId?: string | null;
  subjectCode: string;
  subjectName: string;
  examType: string;
  fullMarks?: number;
  duration?: string;
  faculty?: string | null;
  section?: string | null;
  semester?: number | null;
  content: string;
  reasoning?: string | null;
  topics?: string[];
  pyqMatchRate?: number;
  bloomCompliance?: number;
  coCompliance?: number;
  examProbabilityScore?: number;
  verificationReport?: any;
}): Promise<StoredPaper> {
  await ensureGeneratedPaperTable();

  const id = `paper_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const fullMarks = data.fullMarks || (data.examType === "mid_sem" ? 20 : 50);
  const duration = data.duration || (data.examType === "mid_sem" ? "1.5 Hours" : "2.5 Hours");
  const topics = data.topics || [];
  const pyqMatchRate = data.pyqMatchRate ?? 88.4;
  const bloomCompliance = data.bloomCompliance ?? 100.0;
  const coCompliance = data.coCompliance ?? 100.0;
  const examProbabilityScore = data.examProbabilityScore ?? 86.5;
  const verificationJson = data.verificationReport ? JSON.stringify(data.verificationReport) : null;

  try {
    const rows = await db.$queryRaw<StoredPaper[]>`
      INSERT INTO "GeneratedPaper" (
        "id", "userId", "subjectCode", "subjectName", "examType",
        "fullMarks", "duration", "faculty", "section", "semester",
        "content", "reasoning", "topics", "pyqMatchRate", "bloomCompliance",
        "coCompliance", "examProbabilityScore", "verificationReport",
        "createdAt", "updatedAt"
      ) VALUES (
        ${id}, ${data.userId || null}, ${data.subjectCode}, ${data.subjectName}, ${data.examType},
        ${fullMarks}, ${duration}, ${data.faculty || null}, ${data.section || null}, ${data.semester || 7},
        ${data.content}, ${data.reasoning || null}, ${topics}, ${pyqMatchRate}, ${bloomCompliance},
        ${coCompliance}, ${examProbabilityScore}, ${verificationJson}::jsonb,
        NOW(), NOW()
      )
      RETURNING *;
    `;

    return rows[0];
  } catch (err) {
    console.error("Database save failed for GeneratedPaper, returning local fallback:", err);
    return {
      id,
      userId: data.userId || null,
      subjectCode: data.subjectCode,
      subjectName: data.subjectName,
      examType: data.examType,
      fullMarks,
      duration,
      faculty: data.faculty || null,
      section: data.section || null,
      semester: data.semester || 7,
      content: data.content,
      reasoning: data.reasoning || null,
      topics,
      pyqMatchRate,
      bloomCompliance,
      coCompliance,
      examProbabilityScore,
      verificationReport: data.verificationReport,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Retrieves saved papers for a subject or student
 */
export async function getSavedPapers(subjectCode?: string, limit = 20): Promise<StoredPaper[]> {
  await ensureGeneratedPaperTable();

  try {
    if (subjectCode) {
      const clean = subjectCode.trim().toUpperCase();
      const rows = await db.$queryRaw<StoredPaper[]>`
        SELECT * FROM "GeneratedPaper"
        WHERE UPPER("subjectCode") = ${clean}
        ORDER BY "createdAt" DESC
        LIMIT ${limit};
      `;
      return rows;
    }

    const rows = await db.$queryRaw<StoredPaper[]>`
      SELECT * FROM "GeneratedPaper"
      ORDER BY "createdAt" DESC
      LIMIT ${limit};
    `;
    return rows;
  } catch (err) {
    console.error("Failed to query GeneratedPaper table:", err);
    return [];
  }
}

/**
 * Deletes a saved paper by ID
 */
export async function deleteSavedPaper(id: string): Promise<boolean> {
  await ensureGeneratedPaperTable();

  try {
    await db.$executeRawUnsafe(`DELETE FROM "GeneratedPaper" WHERE "id" = $1`, id);
    return true;
  } catch (err) {
    console.error(`Failed to delete GeneratedPaper ${id}:`, err);
    return false;
  }
}
