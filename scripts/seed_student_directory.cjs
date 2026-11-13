const xlsx = require('xlsx');
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
  datasources: {
    db: { url: dbUrl }
  }
});

const excelPath = 'C:\\Users\\KIIT0001\\Downloads\\2023_Electronics_Group.xlsx';

function normalizeSection(rawSection, sheetName) {
  const src = (rawSection || sheetName || '').toString().trim();
  const match = src.match(/(\d+)/);
  if (match) {
    const num = match[1].padStart(2, '0');
    return `ECS GROUP-${num}`;
  }
  return src;
}

function getBranchFullName(branch) {
  switch (branch) {
    case 'E&CSc':
      return 'Electronics & Computer Science';
    case 'ETC':
      return 'Electronics & Telecommunication';
    case 'EEE':
      return 'Electrical & Electronics Engineering';
    default:
      return branch || 'Electronics Engineering';
  }
}

async function main() {
  console.log(`📖 Reading Excel file: ${excelPath}...`);
  const workbook = xlsx.readFile(excelPath);
  const students = [];
  const rollSet = new Set();

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet);

    for (const r of rows) {
      const rawRoll = r['Roll Number'] ?? r['Roll'] ?? r['RollNo'];
      if (!rawRoll) continue;

      const rollNo = String(rawRoll).trim();
      if (!rollNo || !/^\d+$/.test(rollNo)) continue;


      
      console.log(`      Branch: ${student.branch} (${student.program})`);

      // Update User
      await prisma.user.update({
        where: { id: u.id },
        data: {
          department: 'School of Electronics Engineering',
          ...(u.name === 'Student' || !u.name || u.name.includes('@') ? { name: student.name } : {})
        }
      });

      // Update or create AcademicProfile
      await prisma.academicProfile.upsert({
        where: { userId: u.id },
        create: {
          userId: u.id,
          rollNumber: student.rollNo,
          section: student.section,
          branch: student.branch,
          program: student.program,
          cgpa: 0.0
        },
        update: {
          rollNumber: student.rollNo,
          section: student.section,
          branch: student.branch,
          program: student.program
        }
      });
      console.log(`      ✅ AcademicProfile synced to NeonDB!`);
    }
  }
}

main()
  .catch(err => {
    console.error('❌ Failed to seed student directory:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
