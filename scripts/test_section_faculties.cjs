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

async function testSectionFaculties() {
  for (let i = 1; i <= 7; i++) {
    const group = `ECS GROUP-0${i}`;
    const slots = await prisma.$queryRawUnsafe(`
      SELECT DISTINCT "subjectCode", "subject", "faculty", "room"
      FROM "CourseSchedule"
      WHERE "group" = '${group}'
    `);
    const enpp = slots.find(s => /enpp|ex40003|hs40001/i.test(`${s.subjectCode} ${s.subject}`));
    console.log(`${group} -> EPP Professor: ${enpp?.faculty} (Room: ${enpp?.room})`);
  }
}

testSectionFaculties().catch(console.error).finally(() => prisma.$disconnect());
