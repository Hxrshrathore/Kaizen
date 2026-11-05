import { prisma } from "../lib/prisma";
import { upstashRedis } from "../lib/upstash";
import fs from "fs";
import path from "path";

async function main() {
  console.log("=================================================");
  console.log("DELETING ALL OLD EXTRACTED OCR IMAGES & DATA");
  console.log("=================================================\n");

  // 1. Delete all old records from Neon PostgreSQL DB (OcrQuestion)
  console.log("[1/4] Clearing Neon DB OcrQuestion table...");
  const deleteResult = await prisma.ocrQuestion.deleteMany({});
  console.log(`  ✓ Successfully deleted ${deleteResult.count} old records from Neon DB.`);

  // 2. Delete old Redis staging keys (kaizen:staging:*, kaizen:doc:*)
  console.log("\n[2/4] Clearing Upstash Redis staging buffer...");
  try {
    const stagingItemKeys = await upstashRedis.keys("kaizen:staging:item:*");
    const stagingDocKeys = await upstashRedis.keys("kaizen:staging:doc:*");
    const docKeys = await upstashRedis.keys("kaizen:doc:*");
    const allStagingKeys = [...stagingItemKeys, ...stagingDocKeys, ...docKeys, "kaizen:staging:queue"];

    let redisDeleted = 0;
    if (allStagingKeys.length > 0) {
      for (const k of allStagingKeys) {
        try {
          await upstashRedis.del(k);
          redisDeleted++;
        } catch {
          // ignore
        }
      }
    }
    console.log(`  ✓ Cleared ${redisDeleted} staging keys from Upstash Redis.`);
  } catch (err: any) {
    console.log(`  [Redis notice]: ${err.message}`);
  }

  // 3. Clear local extracted images in public/dataset/raw
  console.log("\n[3/4] Clearing old extracted image files...");
  const rawDir = path.join(process.cwd(), "public", "dataset", "raw");
  if (fs.existsSync(rawDir)) {
    const files = fs.readdirSync(rawDir);
    let deletedFiles = 0;
    for (const file of files) {
      if (file !== ".gitkeep") {
        fs.unlinkSync(path.join(rawDir, file));
        deletedFiles++;
      }
    }
    console.log(`  ✓ Deleted ${deletedFiles} old crop image files from public/dataset/raw/`);
  }

  // 4. Remove old bboxes.json & sample_dataset.csv
  console.log("\n[4/4] Removing obsolete bbox and sample CSV files...");
  const bboxesPath = path.join(process.cwd(), "data", "bboxes.json");
  if (fs.existsSync(bboxesPath)) {
    fs.unlinkSync(bboxesPath);
    console.log("  ✓ Removed data/bboxes.json");
  }

  const sampleCsvPath = path.join(process.cwd(), "data", "pyqs", "sample_dataset.csv");
  if (fs.existsSync(sampleCsvPath)) {
    fs.unlinkSync(sampleCsvPath);
    console.log("  ✓ Removed data/pyqs/sample_dataset.csv");
  }

  console.log("\n=================================================");
  console.log("ALL OLD OCR IMAGES & DATA WIPED CLEAN SUCCESSFULLY");
  console.log("=================================================");
}

main()
  .catch((err) => {
    console.error("Cleanup error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
