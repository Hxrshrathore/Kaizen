const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

async function getCourseDetails() {
  const user = await prisma.user.findFirst({
    where: { email: '2330231@kiit.ac.in' }
  });

  const token = user.accessToken;
  const courseId = '798417072045';

  const [cwRes, matRes] = await Promise.all([
    fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/courseWork`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
    fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/courseWorkMaterials`, {
      headers: { Authorization: `Bearer ${token}` }
    })
  ]);

  const cwData = await cwRes.json();
  const matData = await matRes.json();

  console.log('=== EPP COURSEWORK & ASSIGNMENTS ===');
  cwData.courseWork?.forEach((cw, i) => {
    console.log(`\n[${i+1}] Title: ${cw.title}`);
    console.log(`    Description: ${cw.description?.slice(0, 150)}`);
    console.log(`    Files: ${cw.materials?.map(m => m.driveFile?.driveFile?.title).filter(Boolean).join(', ')}`);
  });

  console.log('\n=== EPP STUDY MATERIALS & MODULES ===');
  matData.courseWorkMaterial?.forEach((mat, i) => {
    console.log(`\n[${i+1}] Title: ${mat.title}`);
    console.log(`    Description: ${mat.description?.slice(0, 150)}`);
    console.log(`    Files: ${mat.materials?.map(m => m.driveFile?.driveFile?.title).filter(Boolean).join(', ')}`);
  });
}

getCourseDetails().catch(console.error).finally(() => prisma.$disconnect());

