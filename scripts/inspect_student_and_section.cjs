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
  console.log('=== USERS & ACADEMIC PROFILES ===');
  const users = await prisma.user.findMany({
    include: {
      academicProfile: true
    },
    take: 5
  });
  console.log(JSON.stringify(users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    profile: u.academicProfile
  })), null, 2));

  console.log('=== STUDENT DIRECTORY SAMPLE ===');
  const students = await prisma.studentDirectory.findMany({
    take: 5
  });
  console.log(students);

  console.log('=== COURSE SCHEDULE BY GROUP ===');
  const groups = await prisma.$queryRawUnsafe(`
    SELECT "group", count(*) as slots, array_agg(DISTINCT "subject") as subjects, array_agg(DISTINCT "faculty") as faculties
    FROM "CourseSchedule"
    GROUP BY "group"
  `);
  console.log(groups);

  console.log('=== SUBJECTS IN DB ===');
  const subjects = await prisma.$queryRawUnsafe(`
    SELECT "code", "name", "credits", "type"
    FROM "Subject"
    WHERE "code" IN ('EX40003', 'HS40001', 'CS40003', 'TP40001', 'EC47001') OR "name" ILIKE '%Professional%' OR "name" ILIKE '%Testing%'
  `);
  console.log(subjects);
}

main().catch(console.error).finally(() => prisma.$disconnect());
