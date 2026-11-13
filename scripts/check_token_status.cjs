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
    select: {
      id: true,
      email: true,
      accessToken: true,
      tokenExpiry: true,
      refreshToken: true
    }
  });
  console.log('User Token Status:', {
    hasAccessToken: !!user?.accessToken,
    tokenExpiry: user?.tokenExpiry,
    hasRefreshToken: !!user?.refreshToken,
    tokenPrefix: user?.accessToken ? user.accessToken.slice(0, 15) + '...' : null
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
