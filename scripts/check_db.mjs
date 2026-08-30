// Quick DB check script - run with: node scripts/check_db.mjs
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("\n=== NEXUS DATABASE CHECK ===\n");
  
  try {
    // Total count
    const total = await prisma.ocrQuestion.count();
    console.log(`Total OcrQuestion records: ${total}`);
    
    if (total === 0) {
      console.log("\n[RESULT] Database is EMPTY - safe to seed sample data.\n");
    } else {
      // Group by status
      const grouped = await prisma.ocrQuestion.groupBy({
        by: ['status'],
        _count: { status: true },
      });
      
      console.log("\nBreakdown by status:");
      for (const g of grouped) {
        console.log(`  ${g.status}: ${g._count.status}`);
      }

      // Show latest 3 records
      const latest = await prisma.ocrQuestion.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: { id: true, subject: true, year: true, status: true, createdAt: true, rawOcrText: true }
      });
      
      console.log("\nLatest 3 records:");
      for (const r of latest) {
        console.log(`  [${r.status}] ${r.subject || 'N/A'} ${r.year || ''} | ${(r.rawOcrText || '').substring(0, 60)}...`);
      }
      
      console.log("\n[RESULT] Database has existing data - DO NOT seed blindly.\n");
    }
  } catch (err) {
    console.error("\n[ERROR] Could not connect to database:", err.message);
    console.error("Check your DATABASE_URL in .env\n");
  } finally {
    await prisma.$disconnect();
  }
}

main();
