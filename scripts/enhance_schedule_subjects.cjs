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
const p = new PrismaClient({ datasources: { db: { url: dbUrl } } });

async function main() {
  console.log('🛠️ Checking CourseSchedule columns...');
  const cols = await p.$queryRawUnsafe(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'CourseSchedule'
  `);
  console.log('CourseSchedule columns:', cols.map(c => c.column_name));

  // Add subjectCode and subjectId if missing
  await p.$executeRawUnsafe(`ALTER TABLE "CourseSchedule" ADD COLUMN IF NOT EXISTS "subjectCode" TEXT;`);
  await p.$executeRawUnsafe(`ALTER TABLE "CourseSchedule" ADD COLUMN IF NOT EXISTS "subjectId" TEXT;`);
  await p.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CourseSchedule_subjectCode_idx" ON "CourseSchedule"("subjectCode");`);

  // Map subjects
  // ENPP -> HS40001
  // T&P -> TP40001
  // Project-I -> EC47001
  // Minor -> MN40001
  // PE-IV -> PE-IV (or mapped per student)
  console.log('🔄 Mapping subjectCode in CourseSchedule...');
  
  await p.$executeRawUnsafe(`
    UPDATE "CourseSchedule" cs
    SET "subjectCode" = 'HS40001', "subjectId" = s."id"
    FROM "Subject" s
    WHERE UPPER(cs."subject") LIKE '%ENPP%' AND s."code" = 'HS40001';
  `);

  await p.$executeRawUnsafe(`
    UPDATE "CourseSchedule" cs
    SET "subjectCode" = 'TP40001', "subjectId" = s."id"
    FROM "Subject" s
    WHERE UPPER(cs."subject") LIKE '%T&P%' AND s."code" = 'TP40001';
  `);

  await p.$executeRawUnsafe(`
    UPDATE "CourseSchedule" cs
    SET "subjectCode" = 'EC47001', "subjectId" = s."id"
    FROM "Subject" s
    WHERE UPPER(cs."subject") LIKE '%PROJECT%' AND s."code" = 'EC47001';
  `);

  await p.$executeRawUnsafe(`
    UPDATE "CourseSchedule" cs
    SET "subjectCode" = 'MN40001', "subjectId" = s."id"
    FROM "Subject" s
    WHERE UPPER(cs."subject") LIKE '%MINOR%' AND s."code" = 'MN40001';
  `);

  await p.$executeRawUnsafe(`
    UPDATE "CourseSchedule" cs
    SET "subjectCode" = 'PE-IV'
    WHERE UPPER(cs."subject") LIKE '%PE-IV%';
  `);

  const sample = await p.$queryRawUnsafe(`
    SELECT "group", "day", "startTime", "endTime", "subject", "subjectCode", "subjectId"
    FROM "CourseSchedule"
    WHERE "group" = 'ECS GROUP-03'
    ORDER BY "day", "startTime"
    LIMIT 10;
  `);
  console.log('Sample ECS GROUP-03 slots:', sample);

  // Also add subjectId to OcrQuestion table if not present
  console.log('🛠️ Adding subjectId to OcrQuestion table...');
  await p.$executeRawUnsafe(`ALTER TABLE "OcrQuestion" ADD COLUMN IF NOT EXISTS "subjectId" TEXT;`);
  await p.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "OcrQuestion_subjectCode_idx" ON "OcrQuestion"("subjectCode");`);
  await p.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "OcrQuestion_subjectId_idx" ON "OcrQuestion"("subjectId");`);

  // Link OcrQuestion to Subject
  await p.$executeRawUnsafe(`
    UPDATE "OcrQuestion" oq
    SET "subjectId" = s."id"
    FROM "Subject" s
    WHERE UPPER(oq."subjectCode") = UPPER(s."code");
  `);

  const ocrCheck = await p.$queryRawUnsafe(`
    SELECT "id", "subjectCode", "subject", "subjectId"
    FROM "OcrQuestion"
    LIMIT 5;
  `);
  console.log('OcrQuestion check:', ocrCheck);

  // Also sync AcademicProfile section for 2330231 to ECS GROUP-03
  await p.$executeRawUnsafe(`
    UPDATE "AcademicProfile"
    SET "section" = 'ECS GROUP-03'
    WHERE "rollNumber" = '2330231';
  `);
  console.log('✅ AcademicProfile section synchronized to ECS GROUP-03');
}

main().catch(console.error).finally(() => p.$disconnect());

