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

const excelPath = 'C:\\Users\\KIIT0001\\Downloads\\PE-IV Updted_06-07-26 (1).xlsx';

// Room mapping based on official 7th Sem Timetable Page 7
const sheetMeta = {
  'STA_A_SMH': {
    code: 'CS40003',
    subject: 'Software Testing and Automation',
    sectionName: 'ST&A (Group A)',
    room: 'CL-A-05',
    faculty: 'Prof. Subhashree Mishra'
  },
  'STA_A_PM': {
    code: 'CS40003',
    subject: 'Software Testing and Automation',
    sectionName: 'ST&A (Group A)',
    room: 'CL-A-06',
    faculty: 'Prof. Proshikshya Mukherjee'
  },
  'STA_B_SMH': {
    code: 'CS40003',
    subject: 'Software Testing and Automation',
    sectionName: 'ST&A (Group B)',
    room: 'CL-A-05',
    faculty: 'Prof. Subhashree Mishra'
  },
  'HCI_A_SBB': {
    code: 'CS40005',
    subject: 'Human Computer Interaction',
    sectionName: 'HCI (Group A)',
    room: 'CL-A-19',
    faculty: 'Prof. Seshadri Binay Behera'
  },
  'HCI_A_SSM': {
    code: 'CS40005',
    subject: 'Human Computer Interaction',
    sectionName: 'HCI (Group A)',
    room: 'CL-14',
    faculty: 'Prof. Sadhana Subhadarshini Mohanty'
  },
  'CNS_A_SMR': {
    code: 'CS40015',
    subject: 'Cryptography and Network Security',
    sectionName: 'C&NS (Group A)',
    room: 'CL-A-01',
    faculty: 'Prof. Suman Roy'
  },
  'SDN_A_ADATTA': {
    code: 'CS30023',
    subject: 'Software Defined Networking',
    sectionName: 'SDN (Group A)',
    room: 'CL-A-03',
    faculty: 'Prof. Amlan Datta'
  },
  'LPVD-A_MRT': {
    code: 'EC40007',
    subject: 'Low Power VLSI Design',
    sectionName: 'LP_VLSID (Group A)',
    room: 'CL-A-02',
    faculty: 'Prof. Manas Ranjan Tripathy'
  },
  'WBE_A_SB': {
    code: 'EE40013',
    subject: 'Wind and Biomass Energy',
    sectionName: 'Wind & Biomass Energy',
    room: 'CL-A-04',
    faculty: 'Prof. Subrat Behera'
  },
  'MLLP_A_SUP': {
    code: 'EM40001',
    subject: 'ML for Language Processing',
    sectionName: 'ML_LP (Group A)',
    room: 'CL-A-10',
    faculty: 'Prof. Suprava Patnaik'
  },
  'MLLP_B_SUP': {
    code: 'EM40001',
    subject: 'ML for Language Processing',
    sectionName: 'ML_LP (Group B)',
    room: 'CL-A-10',
    faculty: 'Prof. Suprava Patnaik'
  }
};

async function main() {
  console.log(`📖 Loading PE-IV Allotments from ${excelPath}...`);
  if (!fs.existsSync(excelPath)) {
    throw new Error(`File not found: ${excelPath}`);
  }

  const wb = xlsx.readFile(excelPath);
  const allotments = [];
  const rollSet = new Set();

  for (const sname of wb.SheetNames) {
    const meta = sheetMeta[sname] || {
      code: 'PE-IV',
      subject: 'Professional Elective IV',
      sectionName: sname,
      room: 'Campus 15',
      faculty: 'Faculty'
    };

    const sheet = wb.Sheets[sname];
    const rows = xlsx.utils.sheet_to_json(sheet);
    console.log(`   📄 Sheet "${sname}": ${rows.length} students (${meta.subject} - ${meta.faculty})`);

    for (const r of rows) {
      const rawRoll = r['Roll. No.'] ?? r['Roll Number'] ?? r['Roll No'] ?? r['Roll'];
      if (!rawRoll) continue;

      const rollNo = String(rawRoll).trim();
      if (!rollNo || !/^\d+$/.test(rollNo)) continue;

      if (rollSet.has(rollNo)) continue;
      rollSet.add(rollNo);

      const rawSubject = (r['Professional Elective IV'] ?? r['Subject'] ?? meta.subject).toString().trim();
      const rawFaculty = (r['Faculty Name'] ?? meta.faculty).toString().trim();

      allotments.push({
        rollNo,
        electiveSection: sname,
        electiveSubject: rawSubject,
        electiveFaculty: rawFaculty,
        electiveRoom: meta.room
      });
    }
  }

  console.log(`\n🔍 Found ${allotments.length} unique student elective allotments.`);

  // Batch update StudentDirectory in chunks of 100
  const chunkSize = 100;
  console.log(`⚡ Updating StudentDirectory with elective allotments in NeonDB...`);

  for (let i = 0; i < allotments.length; i += chunkSize) {
    const chunk = allotments.slice(i, i + chunkSize);

    // Using CASE WHEN for fast bulk update in a single SQL query
    const rollNos = chunk.map(c => `'${c.rollNo}'`).join(',');
    const secCases = chunk.map(c => `WHEN '${c.rollNo}' THEN '${c.electiveSection.replace(/'/g, "''")}'`).join(' ');
    const subCases = chunk.map(c => `WHEN '${c.rollNo}' THEN '${c.electiveSubject.replace(/'/g, "''")}'`).join(' ');
    const facCases = chunk.map(c => `WHEN '${c.rollNo}' THEN '${c.electiveFaculty.replace(/'/g, "''")}'`).join(' ');
    const roomCases = chunk.map(c => `WHEN '${c.rollNo}' THEN '${c.electiveRoom.replace(/'/g, "''")}'`).join(' ');

    const sql = `
      UPDATE "StudentDirectory"
      SET
        "electiveSection" = CASE "rollNo" ${secCases} END,
        "electiveSubject" = CASE "rollNo" ${subCases} END,
        "electiveFaculty" = CASE "rollNo" ${facCases} END,
        "electiveRoom"    = CASE "rollNo" ${roomCases} END,
        "updatedAt"       = NOW()
      WHERE "rollNo" IN (${rollNos});
    `;

    await prisma.$executeRawUnsafe(sql);
    console.log(`   ✅ Updated chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(allotments.length / chunkSize)} (${chunk.length} students)`);
  }

  console.log(`\n🎉 Successfully updated all ${allotments.length} students with their PE-IV allotments!`);

  // Now update AcademicProfile for all active registered users
  console.log('\n🔄 Updating active registered User AcademicProfiles with elective allotments...');
  const users = await prisma.user.findMany({
    include: { academicProfile: true }
  });

  for (const u of users) {
    const match = u.email.match(/^(\d+)@kiit\.ac\.in$/i);
    if (!match) continue;

    const roll = match[1];
    const allot = allotments.find(a => a.rollNo === roll);
    if (allot && u.academicProfile) {
      console.log(`   ✨ Updating user ${u.email}:`);
      console.log(`      Core Section: ${u.academicProfile.section}`);
      console.log(`      Elective Section: ${allot.electiveSection}`);
      console.log(`      Elective Subject: ${allot.electiveSubject}`);
      console.log(`      Faculty: ${allot.electiveFaculty} (${allot.electiveRoom})`);

      await prisma.$executeRawUnsafe(
        `UPDATE "AcademicProfile" 
         SET "electiveSection" = $1, "electiveSubject" = $2, "electiveFaculty" = $3, "electiveRoom" = $4 
         WHERE "id" = $5`,
        allot.electiveSection,
        allot.electiveSubject,
        allot.electiveFaculty,
        allot.electiveRoom,
        u.academicProfile.id
      );
      console.log(`      ✅ AcademicProfile elective fields updated in NeonDB!`);
    }
  }

  // Sample check
  const sample = await prisma.studentDirectory.findUnique({
    where: { rollNo: '2330231' }
  });
  console.log('\n🔍 Verification Sample (Roll 2330231):', sample);
}

main()
  .catch(err => {
    console.error('❌ Failed to seed PE-IV allotments:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
