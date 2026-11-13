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

async function checkMaterials() {
  const user = await prisma.user.findUnique({
    where: { email: '2330231@kiit.ac.in' },
    select: { accessToken: true }
  });

  const courseId = '798417072045'; // EPP

  console.log('--- Checking courseWorkMaterials ---');
  try {
    const res = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/courseWorkMaterials`, {
      headers: { Authorization: `Bearer ${user.accessToken}` }
    });
    console.log('courseWorkMaterials status:', res.status);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e.message);
  }

  console.log('\n--- Checking announcements ---');
  try {
    const res = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/announcements`, {
      headers: { Authorization: `Bearer ${user.accessToken}` }
    });
    console.log('announcements status:', res.status);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e.message);
  }
}

checkMaterials().finally(() => prisma.$disconnect());
