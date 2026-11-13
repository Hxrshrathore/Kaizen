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
  const user = await p.user.findFirst({ where: { email: '2330231@kiit.ac.in' } });
  if (!user) {
    console.error('User not found!');
    return;
  }

  console.log(`🌱 Seeding 7th-sem attendance report for ${user.email} (academics@kiit.ac.in)...`);

  // Report Date: 28/09/2026
  const reportDate = new Date(2026, 8, 28); // Sept 28, 2026
  const lastReportDate = '28/09/26';

  const report = [
    { courseCode: 'EX40003', percentage: 0.00, subjectName: 'Embedded Systems & IoT Laboratory' },
    { courseCode: 'CS40003', percentage: 0.00, subjectName: 'Software Testing and Automation' }
  ];

  for (const r of report) {
    const subj = await p.$queryRawUnsafe(`SELECT "id", "name" FROM "Subject" WHERE "code" = $1 LIMIT 1;`, r.courseCode);
    const subjectId = subj.length > 0 ? subj[0].id : null;
    const name = subj.length > 0 ? subj[0].name : r.subjectName;

    await p.$executeRawUnsafe(`
      INSERT INTO "AttendanceRecord" ("id", "userId", "courseCode", "subjectName", "attended", "total", "percentage", "date", "subjectId", "lastReportDate")
      VALUES (
        gen_random_uuid(),
        $1,
        $2,
        $3,
        0,
        30,
        $4,
        $5,
        $6,
        $7
      )
      ON CONFLICT ("userId", "courseCode", "date") DO UPDATE SET
        "percentage" = EXCLUDED."percentage",
        "subjectName" = EXCLUDED."subjectName",
        "subjectId" = EXCLUDED."subjectId",
        "lastReportDate" = EXCLUDED."lastReportDate";
    `, user.id, r.courseCode, name, r.percentage, reportDate, subjectId, lastReportDate);

    console.log(`   ✅ Seeded ${r.courseCode}: ${r.percentage}% (${name})`);
  }

  console.log('🎉 7th Semester attendance report seeded successfully!');
}

main().catch(console.error).finally(() => p.$disconnect());

