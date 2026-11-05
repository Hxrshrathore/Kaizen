import { prisma } from '../lib/prisma';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log("=== SYNCING BOUNDING BOXES TO NEON DB ===");
  const jsonPath = path.join(process.cwd(), 'data', 'bboxes.json');
  if (!fs.existsSync(jsonPath)) {
    console.error("bboxes.json not found!");
    return;
  }

  const bboxMap: Record<string, {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    width: number;
    height: number;
    sourcePdf: string;
    pageNumber: number;
  }> = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  const entries = Object.entries(bboxMap);
  console.log(`Loaded ${entries.length} bounding box definitions.`);

  let updatedCount = 0;
  const batchSize = 50;

  for (let i = 0; i < entries.length; i += batchSize) {
    const chunk = entries.slice(i, i + batchSize);
    await Promise.all(
      chunk.map(async ([imagePath, b]) => {
        try {
          const res = await prisma.ocrQuestion.updateMany({
            where: { imagePath },
            data: {
              bboxX0: b.x0,
              bboxY0: b.y0,
              bboxX1: b.x1,
              bboxY1: b.y1,
              pageWidth: b.width,
              pageHeight: b.height,
            }
          });
          updatedCount += res.count;
        } catch (e) {
          // ignore individual error
        }
      })
    );
    if ((i + batchSize) % 250 === 0 || i + batchSize >= entries.length) {
      console.log(`  Processed ${Math.min(i + batchSize, entries.length)} / ${entries.length} items (Updated DB rows: ${updatedCount})...`);
    }
  }

  console.log(`\n✓ Successfully synced bounding box coordinates to ${updatedCount} DB records!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

