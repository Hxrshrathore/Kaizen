require('dotenv').config();
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { GoogleGenAI } = require('@google/genai');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const upstashUrl = process.env.UPSTASH_VECTOR_REST_URL;
const upstashToken = process.env.UPSTASH_VECTOR_REST_TOKEN;

function textToSparse(text) {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const tf = {};
  for (const w of words) {
    let hash = 0;
    for (let i = 0; i < w.length; i++) {
      hash = (hash * 31 + w.charCodeAt(i)) & 0xffff;
    }
    tf[hash] = (tf[hash] || 0) + 1;
  }
  const indices = Object.keys(tf).map(Number);
  const values = Object.values(tf).map(v => Math.log(1 + v));
  return { indices, values };
}

async function getEmbeddingWithRetry(text, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await ai.models.embedContent({
        model: 'gemini-embedding-001',
        contents: text,
        config: { outputDimensionality: 1536 }
      });
      if (res.embeddings?.[0]?.values) {
        return res.embeddings[0].values;
      }
      throw new Error('No embedding values returned');
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`Retry ${attempt} for embedding due to: ${err.message}`);
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
}

async function main() {
  console.log('🚀 Starting STA End-Sem Question Bank Ingestion...');
  console.log('Subject Code: CS40003 | Subject: Software Testing and Automation | Year: 2026-2027');

  const content = fs.readFileSync('scripts/sta_questions_extracted.txt', 'utf8');
  const qbIndex = content.indexOf('QUESTION BANK');
  const qbText = content.slice(qbIndex);

  const pattern = /(?:^|\n)(\d+)\s*\.\s*([\s\S]*?)(?=(?:\n\d+\s*\.|\n*as END SEM Question bank|$))/g;
  let match;
  const questions = [];
  while ((match = pattern.exec(qbText)) !== null) {
    const num = parseInt(match[1], 10);
    const text = match[2].trim();
    questions.push({ num, text });
  }

  console.log(`📋 Parsed ${questions.length} questions from raw question bank.`);

  // 1. Ingest into NeonDB OcrQuestion table
  console.log('\n--- 1. Ingesting into NeonDB (Prisma OcrQuestion) ---');
  let neonSuccessCount = 0;
  for (const q of questions) {
    const imagePath = `dataset/raw/sta_qb/q${q.num}.png`;
    // Find or create
    const existing = await prisma.ocrQuestion.findFirst({
      where: {
        subjectCode: 'CS40003',
        rawOcrText: q.text
      }
    });

    if (existing) {
      await prisma.ocrQuestion.update({
        where: { id: existing.id },
        data: {
          subject: 'Software Testing and Automation',
          subjectCode: 'CS40003',
          year: '2026-2027',
          examType: 'End_Sem_Question_Bank',
          sourcePdf: 'STA_END_SEM_QUESTION_BANK_2026.pdf',
          status: 'APPROVED',
          pageNumber: Math.ceil(q.num / 10),
          correctedText: q.text
        }
      });
    } else {
      await prisma.ocrQuestion.create({
        data: {
          imagePath,
          subject: 'Software Testing and Automation',
          subjectCode: 'CS40003',
          year: '2026-2027',
          examType: 'End_Sem_Question_Bank',
          sourcePdf: 'STA_END_SEM_QUESTION_BANK_2026.pdf',
          pageNumber: Math.ceil(q.num / 10),
          rawOcrText: q.text,
          correctedText: q.text,
          status: 'APPROVED'
        }
      });
    }
    neonSuccessCount++;
    process.stdout.write(`\rNeonDB synced: ${neonSuccessCount}/${questions.length}`);
  }
  console.log('\n✅ NeonDB Ingestion Complete!');

  // 2. Ingest into Upstash Vector DB
  console.log('\n--- 2. Ingesting into Upstash Vector DB (Hybrid Embeddings) ---');
  const upstashVectors = [];
  let embCount = 0;

  for (const q of questions) {
    embCount++;
    process.stdout.write(`\rGenerating embeddings: ${embCount}/${questions.length}`);
    const denseVector = await getEmbeddingWithRetry(`Question ${q.num}: ${q.text}`);
    const sparse = textToSparse(q.text);

    upstashVectors.push({
      id: `sta_qb_cs40003_q${q.num}`,
      vector: denseVector,
      sparseVector: sparse,
      metadata: {
        subjectCode: 'CS40003',
        subject: 'Software Testing and Automation',
        year: '2026-2027',
        examType: 'End_Sem_Question_Bank',
        questionNumber: q.num,
        question: q.text,
        marks: 5,
        source: 'STA End-Sem Question Bank'
      }
    });

    // Slight delay to be gentle on API rate limit
    await new Promise(r => setTimeout(r, 120));
  }
  console.log('\nAll dense & sparse vectors prepared. Upserting to Upstash in batches...');

  // Upsert in batches of 10
  const BATCH_SIZE = 10;
  for (let i = 0; i < upstashVectors.length; i += BATCH_SIZE) {
    const batch = upstashVectors.slice(i, i + BATCH_SIZE);
    const resp = await fetch(`${upstashUrl}/upsert`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${upstashToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(batch)
    });
    const resData = await resp.json();
    console.log(`Upserted batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(upstashVectors.length / BATCH_SIZE)}:`, resData.result || resData);
  }

  // 3. Verify Upstash index info and query
  console.log('\n--- 3. Verifying Upstash Vector DB ---');
  const infoRes = await fetch(`${upstashUrl}/info`, {
    headers: { 'Authorization': `Bearer ${upstashToken}` }
  });
  const infoData = await infoRes.json();
  console.log('Upstash Vector Index Stats:', infoData.result);

  // Test query on 'Regression Testing'
  const testQueryEmb = await getEmbeddingWithRetry('Explain Regression Testing and test case prioritization');
  const testQuerySparse = textToSparse('Explain Regression Testing and test case prioritization');
  const queryRes = await fetch(`${upstashUrl}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${upstashToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      vector: testQueryEmb,
      sparseVector: testQuerySparse,
      topK: 3,
      includeMetadata: true,
      filter: "subjectCode = 'CS40003'"
    })
  });
  const queryData = await queryRes.json();
  console.log('\n🔍 Verification Query Results (Regression Testing):');
  queryData.result?.forEach((match, idx) => {
    console.log(`[#${idx + 1}] ID: ${match.id} (Score: ${match.score.toFixed(4)})`);
    console.log(`    Q: ${match.metadata?.question?.slice(0, 100)}...`);
  });

  await prisma.$disconnect();
  console.log('\n🎉 STA Question Bank Successfully Ingested into NeonDB and Upstash Vector DB!');
}

main().catch(err => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});
