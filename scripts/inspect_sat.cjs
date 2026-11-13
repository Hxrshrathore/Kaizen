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

async function checkSAT() {
  const user = await prisma.user.findUnique({
    where: { email: '2330231@kiit.ac.in' },
    select: { accessToken: true }
  });
  const resp = await fetch('https://classroom.googleapis.com/v1/courses/855484886398/courseWork', {
    headers: { Authorization: 'Bearer ' + user.accessToken }
  });
  const data = await resp.json();
  console.log(JSON.stringify(data, null, 2));
}

checkSAT().finally(() => prisma.$disconnect());
