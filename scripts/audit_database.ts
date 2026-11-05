import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("=== NEON DATABASE AUDIT ===");
  const users = await prisma.user.count();
  const profiles = await prisma.academicProfile.count();
  const semesters = await prisma.semesterRecord.count();
  const grades = await prisma.gradeEntry.count();
  const attendance = await prisma.attendanceRecord.count();
  const schedules = await prisma.courseSchedule.count();
  const students = await prisma.studentDirectory.count();
  const ocrTotal = await prisma.ocrQuestion.count();
  const ocrPending = await prisma.ocrQuestion.count({ where: { status: 'PENDING' } });
  const ocrApproved = await prisma.ocrQuestion.count({ where: { status: 'APPROVED' } });
  const ocrRejected = await prisma.ocrQuestion.count({ where: { status: 'REJECTED' } });

  console.log({
    users,
    profiles,
    semesters,
    grades,
    attendance,
    schedules,
    students,
    ocr: { total: ocrTotal, pending: ocrPending, approved: ocrApproved, rejected: ocrRejected }
  });

  if (users > 0) {
    const userList = await prisma.user.findMany({
      include: {
        academicProfile: {
          include: {
            semesters: {
              include: { grades: true }
            }
          }
        }
      }
    });
    console.log("\nUser details:", JSON.stringify(userList, null, 2));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
