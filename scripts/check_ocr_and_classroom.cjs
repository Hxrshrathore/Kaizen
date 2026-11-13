const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

if (!process.env.DATABASE_URL && fs.existsSync('.env')) {
  for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (m) {
      let v = m[2] || '';
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[m[1]] = v.trim();
    }
  }
}

const dbUrl = (process.env.DIRECT_URL || process.env.DATABASE_URL || '').replace('&channel_binding=require', '');
const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

async function main() {
  console.log('=== OCR QUESTION TABLE STATS ===');
  const count = await prisma.ocrQuestion.count();
  console.log('Total OCR Questions:', count);

  const bySubject = await prisma.$queryRawUnsafe(`
    SELECT "subjectCode", "subject", count(*) as total
    FROM "OcrQuestion"
    GROUP BY "subjectCode", "subject"
    ORDER BY total DESC
    LIMIT 15;
  `);
  console.log('By Subject:', bySubject);

  const sample = await prisma.ocrQuestion.findMany({
    where: {
      OR: [
        { subjectCode: { not: null } },
        { correctedText: { not: null } }
      ]
    },
    take: 3
  });
  console.log('Sample Questions:', sample.map(q => ({
    id: q.id,
    subjectCode: q.subjectCode,
    subject: q.subject,
    year: q.year,
    examType: q.examType,
    textPreview: (q.correctedText || q.rawOcrText || '').slice(0, 150)
  })));

  console.log('=== CLASSROOM MAPPINGS IN DB ===');
  const mappings = await prisma.classroomSubjectMapping.findMany({
    take: 10
  });
  console.log(mappings);
}

main().catch(console.error).finally(() => prisma.$disconnect());
