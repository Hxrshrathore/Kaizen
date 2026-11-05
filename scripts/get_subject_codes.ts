import { prisma } from '../lib/prisma';

async function main() {
  const grades = await prisma.gradeEntry.findMany({
    select: { subjectCode: true, subjectName: true },
    distinct: ['subjectCode']
  });
  console.log('Known Subject Codes in KIIT DB:');
  for (const g of grades) {
    console.log(`  ${g.subjectCode.padEnd(10)} -> ${g.subjectName}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

