import * as xlsx from 'xlsx';
import { PrismaClient } from '@prisma/client';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Loading Excel file...');
  const filePath = path.join(process.cwd(), 'student.xlsx');
  
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Assuming first sheet
    const sheet = workbook.Sheets[sheetName];
    
    // Parse sheet to JSON array
    // Since row 1 is headers, we can use { header: 1 } to get arrays, or without to get objects based on first row
    const data = xlsx.utils.sheet_to_json(sheet, { defval: "" }) as any[];
    
    console.log(`Found ${data.length} rows. Parsing...`);
    
    let imported = 0;
    
    for (const row of data) {
        // Excel headers based on the user's sample:
        // "Roll No." or "Roll No" might be used. We normalize the keys.
        const rollNoKey = Object.keys(row).find(k => k.toLowerCase().includes('roll'));
        const nameKey = Object.keys(row).find(k => k.toLowerCase().includes('name'));
        const sectionKey = Object.keys(row).find(k => k.toLowerCase().includes('section') || k.toLowerCase().includes('group'));
        const programKey = Object.keys(row).find(k => k.toLowerCase().includes('program'));

        if (!rollNoKey || !nameKey) continue; // Skip invalid rows like empty ones

        const rollNo = String(row[rollNoKey]).trim();
        const name = String(row[nameKey]).trim();
        const section = sectionKey ? String(row[sectionKey]).trim() : "Unknown";
        const program = programKey ? String(row[programKey]).trim() : "B.Tech ECS";

        // Skip rows without valid roll numbers (e.g. headers if not parsed correctly)
        if (!rollNo || isNaN(Number(rollNo))) continue;

        // Upsert to DB
        await prisma.studentDirectory.upsert({
            where: { rollNo },
            update: {
                name,
                section,
                program
            },
            create: {
                rollNo,
                name,
                section,
                program
            }
        });
        
        imported++;
        if (imported % 50 === 0) {
            console.log(`Imported ${imported} students...`);
        }
    }

    console.log(`✅ Successfully imported ${imported} students from the Excel sheet.`);
  } catch (err) {
    console.error("Error parsing the file:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
