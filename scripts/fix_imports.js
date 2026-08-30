const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  "app/api/user/profile/route.ts",
  "app/api/schedule/route.ts",
  "app/api/grades/save/route.ts",
  "app/api/grades/history/route.ts",
  "app/api/classroom/hide/route.ts",
  "app/api/auth/callback/google/route.ts",
  "app/api/attendance/route.ts",
  "app/api/attendance/sync/route.ts"
];

for (const p of filesToUpdate) {
  const fullPath = path.join(__dirname, '..', p);
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipped: ${p} (not found)`);
    continue;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Replace import
  content = content.replace(/import\s*\{\s*db\s*\}\s*from\s*['"]@\/lib\/db['"]/g, "import { prisma } from '@/lib/prisma'");
  
  // Replace references
  // Using word boundary to ensure we only replace `db` when used as an object
  content = content.replace(/\bdb\./g, 'prisma.');
  
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Updated: ${p}`);
}
