import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.studentDirectory.count();
    console.log(`Total students in DB: ${count}`);
    if (count > 0) {
      const sample = await prisma.studentDirectory.findFirst();
      console.log('Sample Data:', sample);
    }
  } catch (err) {
    console.error('Error fetching from DB:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
