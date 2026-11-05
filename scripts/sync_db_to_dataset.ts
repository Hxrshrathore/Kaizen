import { prisma } from '../lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

const CSV_PATH = path.join(process.cwd(), 'data', 'pyqs', 'sample_dataset.csv');

async function main() {
  console.log("=== SYNCING NEON DB QUESTIONS TO TRAINING DATASET ===");
  
  // Read existing CSV
  const existingRows = new Set<string>();
  let existingLines: string[] = [];
  if (fs.existsSync(CSV_PATH)) {
    existingLines = fs.readFileSync(CSV_PATH, 'utf-8').trim().split('\n');
    for (const line of existingLines.slice(1)) {
      existingRows.add(line);
    }
  }

  console.log(`Current sample_dataset.csv has ${existingRows.size} questions.`);

  // Fetch approved questions + clean pending questions with valid text
  const questions = await prisma.ocrQuestion.findMany({
    where: {
      OR: [
        { status: 'APPROVED' },
        { status: 'PENDING', rawOcrText: { not: '' } }
      ]
    },
    take: 4000
  });

  console.log(`Found ${questions.length} candidate questions in Neon DB.`);

  let added = 0;
  const newLines = [...existingLines];

  for (const q of questions) {
    const text = (q.correctedText || q.rawOcrText || "").trim();
    if (text.length < 35 || text.length > 500) continue;
    // Remove newlines and quotes
    const cleanText = text.replace(/[\r\n]+/g, ' ').replace(/"/g, '""');
    const subj = q.subject || 'Engineering';
    const year = q.year || '2023';
    
    // Heuristic marks extraction
    let marks = 10;
    const mMatch = cleanText.match(/\[(\d+)\s*(?:marks?|M)?\]|\((\d+)\s*(?:marks?|M)?\)|(\d+)\s*marks?/i);
    if (mMatch) {
      marks = parseInt(mMatch[1] || mMatch[2] || mMatch[3]) || 10;
    }

    const topic = subj;
    const csvRow = `"${subj}","${cleanText}",${marks},${year},"${topic}"`;

    // Deduplicate by question snippet
    const snippet = cleanText.slice(0, 50);
    let isDupe = false;
    for (const row of existingRows) {
      if (row.includes(snippet)) {
        isDupe = true;
        break;
      }
    }

    if (!isDupe) {
      existingRows.add(csvRow);
      newLines.push(csvRow);
      added++;
    }
  }

  if (newLines.length > 0 && !newLines[0].startsWith('Subject,Question')) {
    newLines.unshift('Subject,Question,Marks,Year,Topic');
  }

  fs.writeFileSync(CSV_PATH, newLines.join('\n'), 'utf-8');
  console.log(`✓ Added ${added} new high-quality questions to ${CSV_PATH}`);
  console.log(`✓ Total dataset size now: ${newLines.length - 1} questions.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

