import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: {
      email: {
        contains: '@gmail.com'
      }
    }
  });

  if (!user) {
    console.error('No user found');
    return;
  }

  console.log(`Setting section for user: ${user.email}`);

  await prisma.academicProfile.upsert({
    where: { userId: user.id },
    update: { section: 'ECSc3' },
    create: {
      userId: user.id,
      section: 'ECSc3',
      rollNumber: '2330231', // Example from logs
      program: 'B.Tech',
      branch: 'CSE',
      cgpa: 8.5
    }
  });

  console.log('✅ Section set to ECSc3');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
