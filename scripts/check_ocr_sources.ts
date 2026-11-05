import { prisma } from '../lib/prisma';

async function main() {
  const sources = await prisma.ocrQuestion.groupBy({
    by: ['sourcePdf'],
    _count: { id: true }
  });
  console.log(`Total distinct source PDFs in DB: ${sources.length}`);
  for (const s of sources) {
    console.log(` - ${s.sourcePdf}: ${s._count.id} questions`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

