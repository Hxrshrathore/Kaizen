const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

if (!process.env.DATABASE_URL && fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = match[2] || '';
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[match[1]] = val.trim();
    }
  }
}

const dbUrl = process.env.DIRECT_URL 
  ? process.env.DIRECT_URL.replace('&channel_binding=require', '') 
  : (process.env.DATABASE_URL || '').replace('&channel_binding=require', '');

const prisma = new PrismaClient({
  datasources: { db: { url: dbUrl } }
});

async function main() {
  console.log('🔍 Checking existing GradeEntry records in NeonDB...');
  
  const entries = await prisma.$queryRaw`
    SELECT ge."subjectCode", ge."subjectName", ge."credits", sr."semesterNumber"
    FROM "GradeEntry" ge
    JOIN "SemesterRecord" sr ON ge."semesterId" = sr."id"
  `;

  console.log(`Found ${entries.length} GradeEntry rows.`);

  // Group unique by subjectCode
  const uniqueMap = new Map();
  for (const row of entries) {
    const code = (row.subjectCode || '').trim().toUpperCase();
    if (!code) continue;
    if (!uniqueMap.has(code)) {
      uniqueMap.set(code, {
        code,
        name: (row.subjectName || code).trim(),
        credits: parseFloat(row.credits) || 3.0,
        semester: parseInt(row.semesterNumber, 10) || 1
      });
    }
  }

  console.log(`Unique subjects in GradeEntry: ${uniqueMap.size}`);
  for (const [code, item] of uniqueMap) {
    console.log(` - ${code}: ${item.name} (${item.credits} CR, Sem ${item.semester})`);
  }

  // Ensure subjectId column exists in GradeEntry
  console.log('🛠️ Adding subjectId column to GradeEntry if missing...');
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "GradeEntry" ADD COLUMN IF NOT EXISTS "subjectId" TEXT;
  `);

  // Insert/Upsert into Subject table
  console.log('🌱 Upserting GradeEntry subjects into Subject table...');
  for (const [code, item] of uniqueMap) {
    const isLab = code.includes('LAB') || 
                  item.name.toUpperCase().includes('LAB') || 
                  item.name.toUpperCase().includes('PRACTICAL') || 
                  item.credits <= 1.5;
    const type = isLab ? 'LAB' : 'CORE';
    const subId = `subj-${code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    await prisma.$executeRawUnsafe(`
      INSERT INTO "Subject" ("id", "code", "name", "shortName", "semester", "type", "branch", "credits", "faculty", "classroom", "description", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, 'COMMON', $7, 'School Faculty', 'Campus 15', 'Coursework extracted from academic grade entry record.', CURRENT_TIMESTAMP)
      ON CONFLICT ("code") DO UPDATE SET
        "name" = CASE WHEN "Subject"."name" = "Subject"."code" THEN EXCLUDED."name" ELSE "Subject"."name" END,
        "credits" = EXCLUDED."credits",
        "semester" = EXCLUDED."semester",
        "updatedAt" = CURRENT_TIMESTAMP;
    `, subId, item.code, item.name, item.code, item.semester, type, item.credits);
  }

  // Link GradeEntry rows to Subject table
  console.log('🔗 Linking GradeEntry rows to Subject table IDs...');
  await prisma.$executeRawUnsafe(`
    UPDATE "GradeEntry" ge
    SET "subjectId" = s."id"
    FROM "Subject" s
    WHERE UPPER(ge."subjectCode") = UPPER(s."code");
  `);

  const linkedCount = await prisma.$queryRaw`
    SELECT COUNT(*)::int as count FROM "GradeEntry" WHERE "subjectId" IS NOT NULL;
  `;
  console.log(`✅ Successfully linked ${linkedCount[0].count} GradeEntry rows to Subject records!`);

  // Show total subjects in Subject table now
  const totalSubjects = await prisma.$queryRaw`
    SELECT COUNT(*)::int as count FROM "Subject";
  `;
  console.log(`📚 Total Subjects in NeonDB Subject table: ${totalSubjects[0].count}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

