// Script to insert existing cropped images into OcrQuestion table
// Run with: npx ts-node scripts/seed_ocr_images.ts

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const DATASET_DIR = path.join(process.cwd(), 'public', 'dataset', 'raw');

function parseFilename(filename: string) {
  // Pattern: YYYY_pP_C.png or YYYY_N_pP_C.png
  // Examples: 2021_p0_0.png, 2024_2_p0_2.png
  const cleanName = filename.replace('.png', '');
  const parts = cleanName.split('_');

  let year = parts[0];
  let pageNum = 0;
  let examType = 'end_sem';

  // Find page number (starts with 'p')
  const pagePart = parts.find(p => p.startsWith('p'));
  if (pagePart) {
    pageNum = parseInt(pagePart.replace('p', ''));
  }

  // Extract exam number if present (e.g., "2024_2" means 2nd exam paper)
  if (parts[1] && /^\d+$/.test(parts[1])) {
    examType = `exam_${parts[1]}`;
  }

  return {
    year,
    pageNum,
    examType,
    subject: 'Unknown', // Will be filled by user later
    imagePath: `/dataset/raw/${filename}`,
    sourcePdf: `${year}.pdf`,
  };
}

async function main() {
  const files = fs.readdirSync(DATASET_DIR)
    .filter(f => f.endsWith('.png'))
    .sort();

  console.log(`Found ${files.length} cropped images`);

  // Check existing records
  const existingCount = await prisma.ocrQuestion.count();
  if (existingCount > 0) {
    console.log(`Database already has ${existingCount} records.`);
    console.log('Delete existing records first if you want to re-seed:');
    console.log('  npx prisma studio -> Delete all OcrQuestion records');
    return;
  }

  const records = files.map(filename => {
    const parsed = parseFilename(filename);
    return {
      imagePath: parsed.imagePath,
      subject: parsed.subject,
      year: parsed.year,
      examType: parsed.examType,
      sourcePdf: parsed.sourcePdf,
      pageNumber: parsed.pageNum,
      rawOcrText: '',
      correctedText: '',
      status: 'PENDING' as const,
    };
  });

  // Insert in batches
  const batchSize = 50;
  let inserted = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const result = await prisma.ocrQuestion.createMany({
      data: batch,
    });
    inserted += result.count;
    console.log(`Inserted batch ${i / batchSize + 1}: ${result.count} records`);
  }

  console.log(`\n✓ Successfully inserted ${inserted} image records`);
  console.log('Next steps:');
  console.log('  1. Run TrOCR: cd llm_backend && python run_ocr_model.py');
  console.log('  2. Open http://localhost:3000/dashboard/data-ingestion');
  console.log('  3. Review and approve extracted questions');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
