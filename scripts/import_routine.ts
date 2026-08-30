import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const TIME_SLOTS = [
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

function normalizeECSGroupName(rawGroup: string): string {
    const match = rawGroup.match(/ECSc(\d)/i);
    if (match) {
        const num = match[1].padStart(2, '0');
        return `ECS GROUP-${num}`;
    }
    return rawGroup;
}

// Complex Mapping handled perfectly
function getFacultyAndVenue(groupNumber: number, subject: string): { faculty: string, room: string } {
    const sub = subject.trim();
    
    if (sub.includes('MINOR/OE')) return { faculty: 'Various assigned by University', room: 'Various Open Elective Halls' };
    
    if (sub.includes('PE-III')) {
        // Grouping logic for PE-III based on user's schema
        if (sub.includes('GrA')) return { faculty: 'Prof. T. Kar (Cloud)', room: 'CL-A-02' };
        if (sub.includes('GrB')) return { faculty: 'Prof. Vimal Ku Shrivastava', room: 'CL-A-08' };
        return { faculty: 'Elective Faculty', room: 'TBA' };
    }

    // Labs (Simplified logic, assumes groups use specific labs)
    if (sub === 'AD LAB') return { faculty: 'Prof. Proshikshya / Seshadri', room: 'Electronics Design Lab' };
    if (sub === 'VLSID LAB') return { faculty: 'Prof. Sruti S. Singh', room: 'VLSI Design Lab' };
    if (sub === 'CN LAB') return { faculty: 'Prof. A. Bakshi', room: 'WCN Lab' };

    // Core Subjects
    if (groupNumber === 1) {
        if (sub === 'SWE') return { faculty: 'Prof. Deepak Kumar Rout', room: 'CL-A-01' };
        if (sub === 'VLSIC&S') return { faculty: 'Prof. R. Prasad', room: 'CL-A-01' };
        if (sub === 'CN') return { faculty: 'Prof. P. Dutta', room: 'CL-A-01' };
        if (sub === 'EECO') return { faculty: 'Dr. Sugyanta Priyadarshini', room: 'CL-A-01' };
    } else if (groupNumber === 2) {
        if (sub === 'SWE') return { faculty: 'Prof. M. Behera', room: 'CL-A-02' };
        if (sub === 'VLSIC&S') return { faculty: 'Prof. Ruby Mishra', room: 'CL-A-02' };
        if (sub === 'CN') return { faculty: 'Prof. Manas Ranjan Tripathy', room: 'CL-A-02' };
        if (sub === 'EECO') return { faculty: 'Dr. Seba Mohanty', room: 'CL-A-02' };
    } else if (groupNumber === 3) {
        if (sub === 'SWE') return { faculty: 'Prof. Proshikshya Mukherjee', room: 'CL-A-03' };
        if (sub === 'VLSIC&S') return { faculty: 'Prof. S. K. Maity', room: 'CL-A-03' };
        if (sub === 'CN') return { faculty: 'Prof. Sruti S. Singh', room: 'CL-A-03' };
        if (sub === 'EECO') return { faculty: 'Dr. Seba Mohanty', room: 'CL-A-03' };
    } else if (groupNumber === 4) {
        if (sub === 'SWE') return { faculty: 'Prof. S. Mishra', room: 'CL-A-04' };
        if (sub === 'VLSIC&S') return { faculty: 'Prof. A. Bakshi', room: 'CL-A-04' };
        if (sub === 'CN') return { faculty: 'Prof. Sruti S. Singh', room: 'CL-A-04' };
        if (sub === 'EECO') return { faculty: 'Prof. Tarak K Sahoo', room: 'CL-A-04' };
    } else if (groupNumber === 5) {
        if (sub === 'SWE') return { faculty: 'Prof. S. Pahadsingh', room: 'CL-07' };
        if (sub === 'VLSIC&S') return { faculty: 'Prof. Soumya Shatakshi Panda', room: 'CL-07' };
        if (sub === 'CN') return { faculty: 'Prof. P. Sunil', room: 'CL-07' };
        if (sub === 'EECO') return { faculty: 'Dr. Smitirupa Pradhan', room: 'CL-07' };
    } else if (groupNumber === 6) {
        if (sub === 'SWE') return { faculty: 'Prof. S. Mishra', room: 'CL-A-06' };
        if (sub === 'VLSIC&S') return { faculty: 'Prof. B. P. De', room: 'CL-A-06' };
        if (sub === 'CN') return { faculty: 'Prof. P. Dutta', room: 'CL-A-06' };
        if (sub === 'EECO') return { faculty: 'Dr. S. B. Mishra', room: 'CL-A-06' };
    }

    return { faculty: 'Faculty TBA', room: 'Room TBA' };
}

async function main() {
    console.log('Loading ECS Schedule...');
    const csvPath = path.join(process.cwd(), 'data', 'master_schedule.csv');
    const fileContent = fs.readFileSync(csvPath, 'utf8');

    const lines = fileContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    console.log('Clearing old schedules...');
    await prisma.courseSchedule.deleteMany({});
    
    let insertCount = 0;

    for (let i = 1; i < lines.length; i++) { // Skip header
        const columns = lines[i].split(',');
        if (columns.length < 12) continue;

        const program = columns[0];
        if (program !== 'ECSC') continue; // Verify isolation strictly to ECSC

        const day = columns[1];
        const rawGroup = columns[2]; // e.g. "ECSc1"
        const groupNumber = parseInt(rawGroup.replace('ECSc', '')); 

        const dbGroupName = normalizeECSGroupName(rawGroup); // "ECS GROUP-01"
        const slots = columns.slice(3, 12);

        for (let s = 0; s < slots.length; s++) {
            let subject = slots[s].trim();
            if (!subject || subject === 'X') continue;
            
            // Handle alternating subjects like "VLSIC&S / X" -> "VLSIC&S"
            if (subject.includes('/')) {
                const parts = subject.split('/');
                subject = parts[0].trim() !== 'X' ? parts[0].trim() : parts[1].trim();
                // Avoid capturing MINOR/OE as alternating paper
                if (subject.includes('MINOR')) subject = 'MINOR/OE (16:30-18:00)';
                if (subject === 'X' || !subject) continue; 
            }

            const { faculty, room } = getFacultyAndVenue(groupNumber, subject);

            await prisma.courseSchedule.create({
                data: {
                    group: dbGroupName,
                    day: day,
                    startTime: TIME_SLOTS[s].start,
                    endTime: TIME_SLOTS[s].end,
                    subject: subject,
                    room: room,
                    faculty: faculty
                }
            });
            insertCount++;
        }
    }

    console.log(`✅ Successfully mapped and mapped ${insertCount} ECS Time Slots with Faculty/Venue Database.`);
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
