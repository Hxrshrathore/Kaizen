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
  const user = await prisma.user.findUnique({
    where: { email: '2330231@kiit.ac.in' },
    select: { accessToken: true, refreshToken: true }
  });

  const courseIds = [
    { id: '798417072045', name: 'EPP (EX40003)' },
    { id: '855484886398', name: 'SAT (CS40003)' }
  ];

  for (const c of courseIds) {
    console.log(`\n=== FETCHING COURSEWORK FOR: ${c.name} (${c.id}) ===`);
    try {
      const resp = await fetch(`https://classroom.googleapis.com/v1/courses/${c.id}/courseWork`, {
        headers: { Authorization: `Bearer ${user.accessToken}` }
      });
      const data = await resp.json();
      console.log('Status:', resp.status);
      if (data.courseWork) {
        console.log(`Found ${data.courseWork.length} assignments:`);
        data.courseWork.forEach(cw => {
          console.log(`- [${cw.workType}] ${cw.title}`);
          if (cw.description) console.log(`  Desc: ${cw.description.slice(0, 100)}...`);
        });
      } else {
        console.log('No courseWork or error:', data);
      }
    } catch (e) {
      console.error('Error:', e.message);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
