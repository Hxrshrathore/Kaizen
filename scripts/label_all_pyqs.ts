import { prisma } from '../lib/prisma';

export const SUBJECT_RULES: Array<{
  code: string;
  canonicalName: string;
  pattern: RegExp;
}> = [
  {
    code: 'EC20007',
    canonicalName: 'Microprocessors',
    pattern: /\b(microprocessors?|mp)\b/i,
  },
  {
    code: 'EC20004',
    canonicalName: 'Digital Electronics',
    pattern: /\b(digital[\s_-]*electronics?|de)\b/i,
  },
  {
    code: 'CS20002',
    canonicalName: 'Operating Systems',
    pattern: /\b(operating[\s_-]*systems?|os)\b/i,
  },
  {
    code: 'CS20006',
    canonicalName: 'Database Management Systems',
    pattern: /\b(database[\s_-]*management[\s_-]*systems?|dbms)\b/i,
  },
  {
    code: 'CS20001',
    canonicalName: 'Computer Networks',
    pattern: /\b(computer[\s_-]*networks?|cn)\b/i,
  },
  {
    code: 'CS20004',
    canonicalName: 'Software Engineering',
    pattern: /\b(software[\s_-]*engineering|se)\b/i,
  },
  {
    code: 'CS20003',
    canonicalName: 'Design & Analysis of Algorithms',
    pattern: /\b(design\s*(&|and)?\s*analysis\s*of\s*algorithms?|daa|algorithms?)\b/i,
  },
  {
    code: 'CS21001',
    canonicalName: 'Data Structures',
    pattern: /\b(data[\s_-]*structures?|ds)\b/i,
  },
  {
    code: 'MA21002',
    canonicalName: 'Discrete Structures',
    pattern: /\b(discrete[\s_-]*(structures?|mathematics?)|dm)\b/i,
  },
  {
    code: 'MA21001',
    canonicalName: 'Probability and Statistics',
    pattern: /\b(probability[\s_-]*(and|&)?[\s_-]*statistics?|prob[\s_-]*stat)\b/i,
  },
  {
    code: 'HS20001',
    canonicalName: 'Engineering Economics & Costing',
    pattern: /\b(engineering[\s_-]*economics?(\s*(&|and)\s*costing)?|economics?)\b/i,
  },
  {
    code: 'EX20003',
    canonicalName: 'Scientific and Technical Writing',
    pattern: /\b(scientific[\s_-]*(and|&)?[\s_-]*technical[\s_-]*writing|stw)\b/i,
  },
  {
    code: 'HU10001',
    canonicalName: 'Universal Human Values',
    pattern: /\b(universal[\s_-]*human[\s_-]*values?|uhv)\b/i,
  },
];

export function resolveMetadata(sourcePdf: string, currentSubject: string | null, rawSample?: string | null) {
  // 1. Exam Type
  let examType = 'Endsem';
  const cleanPdf = sourcePdf.toLowerCase();
  if (cleanPdf.includes('midsem') || cleanPdf.includes('mid_sem') || cleanPdf.includes('makeup-midsem')) {
    examType = 'Midsem';
  } else if (cleanPdf.includes('endsem') || cleanPdf.includes('end_sem')) {
    examType = 'Endsem';
  }

  // 2. Year
  const yearMatch = sourcePdf.match(/\b(20\d{2})\b/);
  const year = yearMatch ? yearMatch[1] : '2024';

  // 3. Subject Matching
  const sanitizedPdf = sourcePdf
    .replace(/\b(midsem|endsem|makeup-midsem|semester)\b/gi, ' ')
    .replace(/\.pdf$/i, '')
    .replace(/[_\-]/g, ' ');

  // Try matching sanitized PDF filename FIRST (highest fidelity)
  for (const rule of SUBJECT_RULES) {
    if (rule.pattern.test(sanitizedPdf)) {
      return { examType, year, subject: rule.canonicalName, subjectCode: rule.code };
    }
  }

  // Fallback: search in raw OCR sample or current subject
  const fallbackTarget = `${currentSubject || ''} ${rawSample ? rawSample.slice(0, 200) : ''}`;
  for (const rule of SUBJECT_RULES) {
    if (rule.pattern.test(fallbackTarget)) {
      return { examType, year, subject: rule.canonicalName, subjectCode: rule.code };
    }
  }

  return {
    examType,
    year,
    subject: currentSubject && currentSubject !== 'Unknown' && currentSubject !== 'Engineering' ? currentSubject : 'General Engineering',
    subjectCode: 'ENG2001',
  };
}

async function main() {
  console.log("=== BATCH LABELING & STANDARDIZING ALL PYQS IN NEON DB ===");

  const distinctPdfs = await prisma.ocrQuestion.groupBy({
    by: ['sourcePdf'],
    _count: { id: true }
  });

  console.log(`Found ${distinctPdfs.length} distinct PDF papers to categorize.`);

  let totalUpdated = 0;
  for (const item of distinctPdfs) {
    const pdfName = item.sourcePdf || 'Unknown.pdf';
    const sample = await prisma.ocrQuestion.findFirst({
      where: { sourcePdf: pdfName },
      select: { subject: true, rawOcrText: true }
    });

    const meta = resolveMetadata(pdfName, sample?.subject || null, sample?.rawOcrText || null);

    const res = await prisma.ocrQuestion.updateMany({
      where: { sourcePdf: pdfName },
      data: {
        examType: meta.examType,
        year: meta.year,
        subject: meta.subject,
        subjectCode: meta.subjectCode,
      }
    });

    console.log(`✓ [${meta.examType.padEnd(6)}] ${meta.subjectCode.padEnd(8)} - ${meta.subject.padEnd(32)} (${meta.year}): updated ${res.count} questions (${pdfName})`);
    totalUpdated += res.count;
  }

  console.log(`\n========================================`);
  console.log(`SUCCESS: Total questions standardized in DB: ${totalUpdated}`);
  console.log(`========================================`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
