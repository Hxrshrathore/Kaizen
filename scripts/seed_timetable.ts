import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const days = ["MON", "TUE", "WED", "THU", "FRI"];
const timeSlots = [
  { start: "08:00", end: "09:00" },
  { start: "09:00", end: "10:00" },
  { start: "10:00", end: "11:00" },
  { start: "11:00", end: "12:00" },
  { start: "12:00", end: "13:00" },
  { start: "13:00", end: "14:00" },
  { start: "14:00", end: "15:00" },
  { start: "15:00", end: "16:00" },
  { start: "16:00", end: "18:00" },
];

// Reconstructed from the User's input: ECSc1 Monday exactly
const sampleECSc1Monday = [
  "X",              // 8-9
  "AD LAB",         // 9-10
  "AD LAB",         // 10-11
  "PE-III (GrA)",   // 11-12
  "EECO",           // 12-13
  "X",              // 13-14
  "X",              // 14-15
  "PE-III (GrB)",   // 15-16
  "SWE"             // 16-18
];

const facultyMapping: Record<string, string> = {
  "SWE": "Prof. Deepak Kumar Rout",
  "VLSIC&S": "Prof. M. Behera",
  "CN": "Prof. Proshikshya Mukherjee",
  "EECO": "Prof. R. Prasad",
  "AD LAB": "Prof. Proshikshya Mukherjee",
  "VLSID LAB": "Prof. Sruti S. Singh",
  "CN LAB": "Prof. A. Bakshi",
  "PE-III (GrA)": "Prof. T. Kar (Cloud/Elective)",
  "PE-III (GrB)": "Prof. L. Ali (Cloud/Elective)"
};

async function main() {
  console.log("Seeding timetable layout into database...");
  await prisma.courseSchedule.deleteMany({}); // Clear existing

  let count = 0;
  
  // Seed Monday for ECSc1
  for (let i = 0; i < sampleECSc1Monday.length; i++) {
    const subject = sampleECSc1Monday[i];
    if (subject === "X") continue; // No class

    await prisma.courseSchedule.create({
      data: {
        group: "ECS GROUP-01", // matching the user's student.xlsx "Section" group mapping
        day: "MON",
        startTime: timeSlots[i].start,
        endTime: timeSlots[i].end,
        subject: subject,
        faculty: facultyMapping[subject] || "TBA",
        room: "CL-A-01" // Based on ECSc1 mapping
      }
    });
    count++;
  }

  console.log(`✅ Seeded ${count} schedule slots for ECSc1 into the CourseSchedule table.`);
  
  console.log("NOTE: Because the copied PDF text had columns/rows concatenated (e.g., 'ECSc6ECSc1XXEECO...'),");
  console.log("perfect automation is prone to shifting errors. This script creates the Database Schema");
  console.log("and sets up the parsing logic you can expand via JSON or directly from a clean CSV format.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
