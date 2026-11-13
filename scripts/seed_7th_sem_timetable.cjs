const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

// Ensure DATABASE_URL is loaded from .env if needed
if (!process.env.DATABASE_URL && fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = match[2] || '';
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[match[1]] = val.trim();
    }
  }
}

// Prefer direct connection for script execution if available to avoid pooler channel-binding quirks
const dbUrl = process.env.DIRECT_URL 
  ? process.env.DIRECT_URL.replace('&channel_binding=require', '') 
  : (process.env.DATABASE_URL || '').replace('&channel_binding=require', '');

const prisma = new PrismaClient({
  datasources: {
    db: { url: dbUrl }
  }
});

// Group Metadata & Mapping
const groupsMeta = {
  'ECS GROUP-01': {
    enppFaculty: 'Prof. S. Padhy',
    enppRoom: 'CL-A-01',
    tpFaculty: 'Prof. S. Padhy, Prof. Princy Sharma',
    tpRoom: 'CL-A-01'
  },
  'ECS GROUP-02': {
    enppFaculty: 'Prof. S. Alpna',
    enppRoom: 'CL-A-02',
    tpFaculty: 'Prof. S. Alpna, Prof. Deepak Ku. Rout',
    tpRoom: 'CL-A-02'
  },
  'ECS GROUP-03': {
    enppFaculty: 'Prof. P. Dutta',
    enppRoom: 'CL-A-03',
    tpFaculty: 'Prof. P. Dutta, Prof. B Shivlal Patro',
    tpRoom: 'CL-A-03'
  },
  'ECS GROUP-04': {
    enppFaculty: 'Prof. A. Patnaik',
    enppRoom: 'CL-A-04',
    tpFaculty: 'Prof. B. K. Behera, Prof. V. K. Shrivastava',
    tpRoom: 'CL-A-04'
  },
  'ECS GROUP-05': {
    enppFaculty: 'Prof. S. S. Singh',
    enppRoom: 'CL-A-05',
    tpFaculty: 'Prof. Budhadeb Maity, Prof. M. R. Tripathy',
    tpRoom: 'CL-A-05'
  },
  'ECS GROUP-06': {
    enppFaculty: 'Prof. A. Bakshi',
    enppRoom: 'CL-A-06',
    tpFaculty: 'Prof. A. Bakshi, Prof. Suman Roy',
    tpRoom: 'CL-A-06'
  },
  'ECS GROUP-07': {
    enppFaculty: 'Prof. S. Alpna',
    enppRoom: 'CL-A-19',
    tpFaculty: 'Prof. Ganaraj PS, Prof. Sananda Kumar',
    tpRoom: 'CL-A-19'
  }
};

const peFacultyDefault = 'Prof. Suman Roy / Prof. S. Mishra / Prof. Suprava Patnaik';
const peRoomDefault = 'CL-A-01 / CL-A-05 / CL-A-10 / CL-A-19';

async function main() {
  console.log('⚡ Purging obsolete 6th-semester schedule records from NeonDB...');
  const deleted = await prisma.courseSchedule.deleteMany({});
  console.log(`🗑️ Deleted ${deleted.count} old routine records.`);

  console.log('🌱 Seeding official 7th Semester Timetable (School of Electronics Engineering, ECS)...');

  const slotsToInsert = [];

  // Iterate over all 7 ECS Groups
  for (let gNum = 1; gNum <= 7; gNum++) {
    const groupKey = `ECS GROUP-0${gNum}`;
    const meta = groupsMeta[groupKey];

    // Minor Specialization (11:00 - 13:00 Monday through Friday for all groups)
    ['MON', 'TUE', 'WED', 'THU', 'FRI'].forEach(day => {
      slotsToInsert.push({
        group: groupKey,
        day,
        startTime: '11:00',
        endTime: '13:00',
        subject: 'Minor',
        room: 'Designated Minor Rooms',
        faculty: 'Minor Department Faculty'
      });
    });

    // ───────────────── MONDAY ─────────────────
    if (gNum === 1 || gNum === 2 || gNum === 3) {
      slotsToInsert.push({
        group: groupKey,
        day: 'MON',
        startTime: '15:00',
        endTime: '17:00',
        subject: 'T&P',
        room: meta.tpRoom,
        faculty: meta.tpFaculty
      });
    } else if (gNum === 4) {
      // Official change Note 1: Group-4 ENPP shifted to Monday
      slotsToInsert.push({
        group: groupKey,
        day: 'MON',
        startTime: '14:00',
        endTime: '15:00',
        subject: 'ENPP',
        room: meta.enppRoom,
        faculty: meta.enppFaculty
      });
      slotsToInsert.push({
        group: groupKey,
        day: 'MON',
        startTime: '15:00',
        endTime: '17:00',
        subject: 'Project-I',
        room: 'Project Lab',
        faculty: 'Project Supervisor / Committee'
      });
    } else if (gNum === 5 || gNum === 6) {
      slotsToInsert.push({
        group: groupKey,
        day: 'MON',
        startTime: '15:00',
        endTime: '17:00',
        subject: 'Project-I',
        room: 'Project Lab',
        faculty: 'Project Supervisor / Committee'
      });
    } else if (gNum === 7) {
      slotsToInsert.push({
        group: groupKey,
        day: 'MON',
        startTime: '13:00',
        endTime: '14:00',
        subject: 'ENPP',
        room: meta.enppRoom,
        faculty: meta.enppFaculty
      });
      slotsToInsert.push({
        group: groupKey,
        day: 'MON',
        startTime: '14:00',
        endTime: '15:00',
        subject: 'ENPP',
        room: meta.enppRoom,
        faculty: meta.enppFaculty
      });
      slotsToInsert.push({
        group: groupKey,
        day: 'MON',
        startTime: '15:00',
        endTime: '17:00',
        subject: 'T&P',
        room: meta.tpRoom,
        faculty: meta.tpFaculty
      });
    }

    // ───────────────── TUESDAY ─────────────────
    if (gNum >= 1 && gNum <= 6) {
      slotsToInsert.push({
        group: groupKey,
        day: 'TUE',
        startTime: '14:00',
        endTime: '15:00',
        subject: 'ENPP',
        room: meta.enppRoom,
        faculty: meta.enppFaculty
      });
    }
    if (gNum >= 2 && gNum <= 6) {
      slotsToInsert.push({
        group: groupKey,
        day: 'TUE',
        startTime: '16:00',
        endTime: '18:00',
        subject: 'PE-IV',
        room: peRoomDefault,
        faculty: peFacultyDefault
      });
    }

    // ───────────────── WEDNESDAY ─────────────────
    if (gNum >= 1 && gNum <= 6) {
      slotsToInsert.push({
        group: groupKey,
        day: 'WED',
        startTime: '14:00',
        endTime: '15:00',
        subject: 'ENPP',
        room: meta.enppRoom,
        faculty: meta.enppFaculty
      });
    }
    if (gNum === 2) {
      slotsToInsert.push({
        group: groupKey,
        day: 'WED',
        startTime: '15:00',
        endTime: '16:00',
        subject: 'PE-IV',
        room: peRoomDefault,
        faculty: peFacultyDefault
      });
      slotsToInsert.push({
        group: groupKey,
        day: 'WED',
        startTime: '16:00',
        endTime: '17:00',
        subject: 'PE-IV',
        room: peRoomDefault,
        faculty: peFacultyDefault
      });
    } else if (gNum >= 3 && gNum <= 6) {
      slotsToInsert.push({
        group: groupKey,
        day: 'WED',
        startTime: '15:00',
        endTime: '16:00',
        subject: 'PE-IV',
        room: peRoomDefault,
        faculty: peFacultyDefault
      });
      slotsToInsert.push({
        group: groupKey,
        day: 'WED',
        startTime: '16:00',
        endTime: '17:00',
        subject: 'PE-IV',
        room: peRoomDefault,
        faculty: peFacultyDefault
      });
      slotsToInsert.push({
        group: groupKey,
        day: 'WED',
        startTime: '17:00',
        endTime: '18:00',
        subject: 'PE-IV',
        room: peRoomDefault,
        faculty: peFacultyDefault
      });
    }

    // ───────────────── THURSDAY ─────────────────
    // All groups G1-G7 have PE-IV 2-4 PM and 4-5 PM
    slotsToInsert.push({
      group: groupKey,
      day: 'THU',
      startTime: '14:00',
      endTime: '16:00',
      subject: 'PE-IV',
      room: peRoomDefault,
      faculty: peFacultyDefault
    });
    slotsToInsert.push({
      group: groupKey,
      day: 'THU',
      startTime: '16:00',
      endTime: '17:00',
      subject: 'PE-IV',
      room: peRoomDefault,
      faculty: peFacultyDefault
    });

    // ───────────────── FRIDAY ─────────────────
    if (gNum === 1 || gNum === 2 || gNum === 3 || gNum === 7) {
      slotsToInsert.push({
        group: groupKey,
        day: 'FRI',
        startTime: '15:00',
        endTime: '17:00',
        subject: 'Project-I',
        room: 'Project Lab',
        faculty: 'Project Supervisor / Committee'
      });
    } else if (gNum === 4 || gNum === 5 || gNum === 6) {
      slotsToInsert.push({
        group: groupKey,
        day: 'FRI',
        startTime: '15:00',
        endTime: '17:00',
        subject: 'T&P',
        room: meta.tpRoom,
        faculty: meta.tpFaculty
      });
    }
  }

  console.log(`📦 Bulk creating ${slotsToInsert.length} slots in NeonDB...`);
  const inserted = await prisma.courseSchedule.createMany({
    data: slotsToInsert
  });

  console.log(`🎉 Successfully seeded ${inserted.count} schedule slots for Groups ECS GROUP-01 through 07!`);

  // Verify by group
  for (let gNum = 1; gNum <= 7; gNum++) {
    const groupKey = `ECS GROUP-0${gNum}`;
    const count = await prisma.courseSchedule.count({ where: { group: groupKey } });
    console.log(`   • ${groupKey}: ${count} slots`);
  }
}

main()
  .catch(err => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
