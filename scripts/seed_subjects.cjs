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

const SUBJECTS_DATA = [
  {
    id: 'subj-cs40003',
    code: 'CS40003',
    name: 'Software Testing and Automation',
    shortName: 'ST&A',
    semester: 7,
    type: 'ELECTIVE',
    branch: 'ECSc',
    credits: 3.0,
    faculty: 'Prof. Proshikshya Mukherjee / Prof. Subhashree Mishra',
    classroom: 'CL-A-06 / CL-A-05',
    description: 'Black-box and white-box test design, Selenium automation, unit testing, test case metrics, CI/CD integration.'
  },
  {
    id: 'subj-cs40005',
    code: 'CS40005',
    name: 'Human Computer Interaction',
    shortName: 'HCI',
    semester: 7,
    type: 'ELECTIVE',
    branch: 'ECSc',
    credits: 3.0,
    faculty: 'Prof. Seshadri Binay Behera / Prof. Sadhana Subhadarshini Mohanty',
    classroom: 'CL-A-19 / CL-14',
    description: 'User-centered interface design, heuristic evaluation, cognitive modeling, prototyping and usability testing.'
  },
  {
    id: 'subj-cs40015',
    code: 'CS40015',
    name: 'Cryptography and Network Security',
    shortName: 'C&NS',
    semester: 7,
    type: 'ELECTIVE',
    branch: 'ETC, ECSc',
    credits: 3.0,
    faculty: 'Prof. Suman Roy',
    classroom: 'CL-A-01',
    description: 'Symmetric & asymmetric cryptography, AES, RSA, hash functions, TLS/SSL protocols, network vulnerability defense.'
  },
  {
    id: 'subj-cs30023',
    code: 'CS30023',
    name: 'Software Defined Networking',
    shortName: 'SDN',
    semester: 7,
    type: 'ELECTIVE',
    branch: 'ETC',
    credits: 3.0,
    faculty: 'Prof. Amlan Datta',
    classroom: 'CL-A-03',
    description: 'Control and data plane separation, OpenFlow protocol, SDN controllers (ONOS, Opendaylight), programmable network architectures.'
  },
  {
    id: 'subj-ec40007',
    code: 'EC40007',
    name: 'Low Power VLSI Design',
    shortName: 'LP_VLSID',
    semester: 7,
    type: 'ELECTIVE',
    branch: 'ETC',
    credits: 3.0,
    faculty: 'Prof. Manas Ranjan Tripathy',
    classroom: 'CL-A-02',
    description: 'Subthreshold leakage mitigation, dynamic power management, multi-VDD design, low power circuit synthesis.'
  },
  {
    id: 'subj-ee40013',
    code: 'EE40013',
    name: 'Wind and Biomass Energy',
    shortName: 'WBE',
    semester: 7,
    type: 'ELECTIVE',
    branch: 'EEE',
    credits: 3.0,
    faculty: 'Prof. Subrat Behera',
    classroom: 'CL-A-04',
    description: 'Aerodynamic conversion in wind turbines, grid synchronization, biomass gasification, renewable power economics.'
  },
  {
    id: 'subj-em40001',
    code: 'EM40001',
    name: 'Machine Learning for Language Processing',
    shortName: 'ML_LP',
    semester: 7,
    type: 'ELECTIVE',
    branch: 'ETC, ECSc',
    credits: 3.0,
    faculty: 'Prof. Suprava Patnaik',
    classroom: 'CL-A-10',
    description: 'Natural language processing, word representations, Transformer architectures, BERT, fine-tuning large language models.'
  },
  {
    id: 'subj-ex40003',
    code: 'EX40003',
    name: 'Embedded Systems & IoT Laboratory',
    shortName: 'ES_IOT',
    semester: 7,
    type: 'CORE',
    branch: 'COMMON',
    credits: 2.0,
    faculty: 'Faculty In-charge (ECE/ECS)',
    classroom: 'Campus 15 Lab',
    description: 'Microcontroller hardware interfacing, sensor networks, MQTT telemetry, FreeRTOS task scheduling.'
  },
  {
    id: 'subj-hs40001',
    code: 'HS40001',
    name: 'Engineering Economics and Project Management',
    shortName: 'ENPP',
    semester: 7,
    type: 'CORE',
    branch: 'COMMON',
    credits: 3.0,
    faculty: 'Prof. S. Padhy / Prof. S. Alpna / Prof. P. Dutta / Prof. A. Patnaik / Prof. S. S. Singh / Prof. A. Bakshi',
    classroom: 'CL-A-01 - CL-A-06, CL-A-19',
    description: 'Project lifecycle evaluation, NPV/IRR calculations, cost budgeting, CPM/PERT scheduling matrices.'
  },
  {
    id: 'subj-tp40001',
    code: 'TP40001',
    name: 'Training and Placement Aptitude & Technical Training',
    shortName: 'T&P',
    semester: 7,
    type: 'PLACEMENT',
    branch: 'COMMON',
    credits: 2.0,
    faculty: 'Training & Placement Faculty',
    classroom: 'CL-A-01 - CL-A-06, CL-A-19',
    description: 'Algorithms and data structures (Graphs, DP), technical mock coding rounds, quantitative problem solving.'
  },
  {
    id: 'subj-ec47001',
    code: 'EC47001',
    name: 'Capstone Project - Phase I',
    shortName: 'Project-I',
    semester: 7,
    type: 'CAPSTONE',
    branch: 'COMMON',
    credits: 3.0,
    faculty: 'Project Supervisor / Evaluation Committee',
    classroom: 'Project Laboratory',
    description: 'Problem formulation, literature review, architectural specification, preliminary design presentation.'
  },
  {
    id: 'subj-mn40001',
    code: 'MN40001',
    name: 'Minor Specialization Elective',
    shortName: 'Minor',
    semester: 7,
    type: 'MINOR',
    branch: 'COMMON',
    credits: 4.0,
    faculty: 'Department Faculty',
    classroom: 'Designated Minor Rooms',
    description: 'Cross-discipline specialization tracks in Artificial Intelligence, Cloud Infrastructure, or Cybersecurity.'
  },
  {
    id: 'subj-cs31001',
    code: 'CS31001',
    name: 'Software Engineering',
    shortName: 'SWE',
    semester: 6,
    type: 'CORE',
    branch: 'ECSc',
    credits: 4.0,
    faculty: 'Prof. A. K. Mohapatra',
    classroom: 'Campus 15',
    description: 'Agile sprints, C4 architectural modeling, unit test coverage, CI/CD automated deployments.'
  },
  {
    id: 'subj-cs30003',
    code: 'CS30003',
    name: 'Computer Networks',
    shortName: 'CN',
    semester: 6,
    type: 'CORE',
    branch: 'ECSc',
    credits: 4.0,
    faculty: 'Dr. B. C. Panda',
    classroom: 'Campus 15',
    description: 'TCP/IP layers, CIDR subnetting, BGP/OSPF routing, packet inspection and socket programming.'
  }
];

async function main() {
  console.log('🌱 Seeding Subject table in NeonDB...');

  for (const s of SUBJECTS_DATA) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Subject" ("id", "code", "name", "shortName", "semester", "type", "branch", "credits", "faculty", "classroom", "description", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
      ON CONFLICT ("code") DO UPDATE SET
        "name" = EXCLUDED."name",
        "shortName" = EXCLUDED."shortName",
        "semester" = EXCLUDED."semester",
        "type" = EXCLUDED."type",
        "branch" = EXCLUDED."branch",
        "credits" = EXCLUDED."credits",
        "faculty" = EXCLUDED."faculty",
        "classroom" = EXCLUDED."classroom",
        "description" = EXCLUDED."description",
        "updatedAt" = CURRENT_TIMESTAMP;
    `, s.id, s.code, s.name, s.shortName, s.semester, s.type, s.branch, s.credits, s.faculty, s.classroom, s.description);
  }

  console.log(`✅ Successfully seeded ${SUBJECTS_DATA.length} subjects!`);

  // Ensure subjectId columns exist in related tables
  console.log('🛠️ Adding subjectId columns to CourseSchedule & AttendanceRecord if missing...');
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "CourseSchedule" ADD COLUMN IF NOT EXISTS "subjectId" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "subjectId" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "lastReportDate" TEXT;
    `);
  } catch (e) {
    console.warn('Column add note:', e.message);
  }

  // Link CourseSchedule rows to Subject table
  console.log('🔗 Linking CourseSchedule rows to Subject table IDs...');
  await prisma.$executeRawUnsafe(`
    UPDATE "CourseSchedule" cs
    SET "subjectId" = s."id"
    FROM "Subject" s
    WHERE cs."subject" = s."code" 
       OR cs."subject" = s."shortName"
       OR (cs."subject" = 'Minor' AND s."code" = 'MN40001')
       OR (cs."subject" = 'ENPP' AND s."code" = 'HS40001')
       OR (cs."subject" = 'T&P' AND s."code" = 'TP40001')
       OR (cs."subject" = 'Project-I' AND s."code" = 'EC47001')
       OR (cs."subject" = 'PE-IV' AND s."code" = 'CS40003');
  `);

  console.log('🎉 CourseSchedule rows successfully linked to Subject table IDs!');
}

main().catch(console.error).finally(() => prisma.$disconnect());

