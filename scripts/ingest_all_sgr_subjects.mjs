import fs from 'fs';
import path from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const uploadDir = 'C:\\Users\\KIIT0001\\.gemini\\antigravity\\brain\\917db8b2-9c8d-4688-b51f-ead7625c0e59\\.user_uploaded';

const GRADE_POINTS = { O: 10, E: 9, A: 8, B: 7, C: 6, D: 5, F: 0 };

function parseSgrTokens(items) {
  let rollNumber = "Unknown";
  let currentSemester = 1;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rollM = item.match(/\b(\d{7})\b/);
    if (rollM && rollNumber === "Unknown") rollNumber = rollM[1];
    const semM = item.match(/\b([1-8])(st|nd|rd|th)\b/i);
    if (semM) currentSemester = parseInt(semM[1], 10);
  }

  const remarksIdx = items.findIndex(it => it.toUpperCase().includes("REMARKS"));
  const tableItems = remarksIdx !== -1 ? items.slice(0, remarksIdx) : items;

  const codeRegex = /^[A-Z]{2,4}\d{4,5}$/;
  const courseCodes = [];
  for (const it of tableItems) {
    if (codeRegex.test(it)) courseCodes.push(it);
  }
  const N = courseCodes.length;
  if (N === 0) return null;

  const validGradesSet = new Set(['O', 'E', 'A', 'B', 'C', 'D', 'F']);
  let grades = [];
  for (let i = 0; i <= tableItems.length - N; i++) {
    const window = tableItems.slice(i, i + N);
    if (window.every(t => validGradesSet.has(t))) {
      grades = window;
      break;
    }
  }

  let credits = [];
  for (let i = 0; i <= tableItems.length - N; i++) {
    const window = tableItems.slice(i, i + N);
    if (window.every(t => /^[1-9](\.0|\.5)?$/.test(t))) {
      credits = window.map(Number);
      break;
    }
  }

  const headerWords = new Set([
    'SEMESTER', 'GRADE', 'REPORT', 'ACADEMIC', 'OFFICE', 'YEAR', 'ADMISSION',
    'STUDENTS', 'NAME', 'STUDENT', 'COPY', 'ROLL', 'NUMBER', 'REGN', 'PROGRAMME',
    'COURSE', 'COURSENAME', 'CREDIT', 'REMARKS', 'PASS', 'FAIL', 'CURRENT', 'PERFORMANCE',
    'CUMULATIVE', 'CREDITS', 'INDEX', 'SGPA', 'CGPA', 'SCHOOLOFELECTRONICS', 'ENGINEERING',
    'CONTROLLER', 'EXAMINATIONS', 'DATE'
  ]);

  const isProbableSubjectName = (str) => {
    const s = str.toUpperCase().trim();
    if (codeRegex.test(s)) return false;
    if (validGradesSet.has(s)) return false;
    if (/^[1-9](\.0|\.5)?$/.test(s)) return false;
    if (headerWords.has(s.replace(/[^A-Z]/g, ''))) return false;
    if (s.length < 3) return false;
    return true;
  };

  let subjectNames = [];
  for (let i = 0; i <= tableItems.length - N; i++) {
    const window = tableItems.slice(i, i + N);
    if (window.every(isProbableSubjectName)) {
      subjectNames = window;
      break;
    }
  }

  const result = [];
  for (let i = 0; i < N; i++) {
    const code = courseCodes[i];
    const name = subjectNames[i] || `Subject ${code}`;
    const cr = credits[i] !== undefined ? credits[i] : 3;
    const isLab = code.includes('LAB') || 
                  code.includes('19') || 
                  code.includes('29') || 
                  code.includes('39') || 
                  name.toUpperCase().includes('LAB') || 
                  name.toUpperCase().includes('WORKSHOP') || 
                  name.toUpperCase().includes('DRAWING') || 
                  name.toUpperCase().includes('PROJECT') || 
                  cr <= 1.5;
    result.push({
      code,
      name,
      credits: cr,
      semester: currentSemester,
      type: isLab ? 'LAB' : 'CORE'
    });
  }
  return { semester: currentSemester, subjects: result };
}

async function main() {
  console.log('--- Ingesting all Subjects from 6 SGR PDFs into NeonDB Subject Table ---');
  const allFiles = fs.readdirSync(uploadDir).filter(f => f.endsWith('.pdf'));
  
  const distinctSizes = new Map();
  for (const f of allFiles) {
    const size = fs.statSync(path.join(uploadDir, f)).size;
    if (!distinctSizes.has(size)) {
      distinctSizes.set(size, f);
    }
  }

  let totalIngested = 0;
  for (const [size, f] of distinctSizes.entries()) {
    const filePath = path.join(uploadDir, f);
    const data = new Uint8Array(fs.readFileSync(filePath));
    const doc = await pdfjsLib.getDocument({ data }).promise;
    const page = await doc.getPage(1);
    const textContent = await page.getTextContent();
    const items = textContent.items.map(it => (it.str || '').trim()).filter(s => s.length > 0);

    const parsed = parseSgrTokens(items);
    if (!parsed) continue;

    console.log(`\nUpserting ${parsed.subjects.length} subjects for Semester ${parsed.semester}...`);
    for (const sub of parsed.subjects) {
      const subId = `subj-${sub.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      await prisma.$executeRawUnsafe(`
        INSERT INTO "Subject" ("id", "code", "name", "shortName", "semester", "type", "branch", "credits", "faculty", "classroom", "description", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, 'COMMON', $7, 'School Faculty', 'Campus 15', 'Extracted from institutional Semester Grade Report (SGR).', CURRENT_TIMESTAMP)
        ON CONFLICT ("code") DO UPDATE SET
          "name" = EXCLUDED."name",
          "credits" = EXCLUDED."credits",
          "semester" = EXCLUDED."semester",
          "type" = EXCLUDED."type",
          "updatedAt" = CURRENT_TIMESTAMP;
      `, subId, sub.code, sub.name, sub.code, sub.semester, sub.type, sub.credits);
      totalIngested++;
    }
  }

  console.log(`\n✅ Successfully ingested ${totalIngested} subjects across Semesters 1-6 into NeonDB!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
