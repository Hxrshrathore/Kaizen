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
  console.log('🔍 Checking existing tables in NeonDB...');
  const tables = await prisma.$queryRaw`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
  `;
  console.log('Tables:', tables.map(t => t.table_name));

  console.log('🛠️ Creating Subject table if it does not exist...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Subject" (
      "id" TEXT PRIMARY KEY,
      "code" TEXT UNIQUE NOT NULL,
      "name" TEXT NOT NULL,
      "shortName" TEXT,
      "semester" INTEGER NOT NULL DEFAULT 7,
      "type" TEXT NOT NULL DEFAULT 'CORE',
      "branch" TEXT,
      "credits" DOUBLE PRECISION DEFAULT 3.0,
      "faculty" TEXT,
      "classroom" TEXT,
      "description" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('🛠️ Creating indexes on Subject table...');
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Subject_code_idx" ON "Subject"("code");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Subject_semester_idx" ON "Subject"("semester");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Subject_type_idx" ON "Subject"("type");`);

  console.log('✅ Subject table ready in NeonDB!');
}

main().catch(console.error).finally(() => prisma.$disconnect());

