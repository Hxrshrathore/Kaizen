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

async function testDownload() {
  const user = await prisma.user.findUnique({
    where: { email: '2330231@kiit.ac.in' },
    select: { accessToken: true }
  });

  const fileId = '1rFT_ayx-EVVvMZEDj2g9aJKzAG9F9UGm'; // Model Questions(Till Mid Semester).pdf
  console.log('Testing Drive download for file:', fileId);

  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${user.accessToken}` }
    });
    console.log('Drive status:', res.status);
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      console.log('Downloaded bytes:', buf.length);
      fs.writeFileSync('scripts/test_downloaded_model_questions.pdf', buf);
      console.log('Saved to scripts/test_downloaded_model_questions.pdf');
    } else {
      const err = await res.text();
      console.log('Drive error:', err);
    }
  } catch (e) {
    console.error('Fetch error:', e.message);
  }
}

testDownload().finally(() => prisma.$disconnect());
