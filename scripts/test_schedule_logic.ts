import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const rollNumber = '2330001'; // Known Roll from the Excel sheet
    console.log(`Simulating API Request for Roll No: ${rollNumber}`);

    const student = await prisma.studentDirectory.findUnique({
      where: { rollNo: rollNumber }
    });

    if (!student) {
        console.error("Student not found!");
        return;
    }
    console.log("Found Student:", student.name, "| Section:", student.section);

    const schedule = await prisma.courseSchedule.findMany({
        where: { group: student.section },
        orderBy: [
            { day: 'asc' }, 
            { startTime: 'asc' }
        ]
    });

    console.log(`\nFound ${schedule.length} classes for this week.`);
    console.log("\nSample Monday Morning Setup:");
    const mondayClasses = schedule.filter(s => s.day === 'MON');
    mondayClasses.forEach(c => {
        console.log(`[${c.startTime} - ${c.endTime}] ${c.subject} | Prof: ${c.faculty} | Room: ${c.room}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
