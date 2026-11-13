import { db } from './prisma';

export interface SubjectItem {
  id: string;
  code: string;
  name: string;
  shortName: string | null;
  semester: number;
  type: string;
  branch: string | null;
  credits: number | null;
  faculty: string | null;
  classroom: string | null;
  description: string | null;
}

export interface StudentProfileInfo {
  userId: string;
  email: string;
  name: string;
  rollNumber: string;
  section: string;
  branch: string;
  semester: number;
  program: string;
  electiveSection: string | null;
  electiveSubject: string | null;
  electiveFaculty: string | null;
  electiveRoom: string | null;
}

export interface EnrolledSubject extends SubjectItem {
  isElective: boolean;
  allottedFaculty?: string | null;
  allottedRoom?: string | null;
  electiveSection?: string | null;
  attendancePercentage?: number | null;
  attendanceStatus?: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'NO_DATA';
}

export interface HistoricalSubject extends SubjectItem {
  grade?: string;
  semesterNumber?: number;
}

export interface StudentEnrolledSubjectsResult {
  student: StudentProfileInfo;
  currentSemesterSubjects: EnrolledSubject[];
  currentSubjectCodes: string[];
  historicalSubjects: HistoricalSubject[];
  allSubjectCodes: string[];
}

export interface SubjectScheduleSlot {
  id: string;
  group: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  room: string | null;
  faculty: string | null;
  subjectCode: string;
  subjectId: string | null;
  isElective?: boolean;
}

export interface SubjectPyqQuestion {
  id: string;
  imagePath: string;
  subject: string | null;
  subjectCode: string | null;
  year: string | null;
  examType: string | null;
  sourcePdf: string | null;
  pageNumber: number | null;
  rawOcrText: string | null;
  correctedText: string | null;
  status: string;
  subjectId: string | null;
}

// ── ELECTIVE MAPPING DICTIONARY ─────────────────────────────────────────────
export const ELECTIVE_SECTION_MAP: Record<string, { code: string; name: string; shortName: string; defaultRoom: string; defaultFaculty: string }> = {
  'STA_A_SMH': {
    code: 'CS40003',
    name: 'Software Testing and Automation',
    shortName: 'ST&A',
    defaultRoom: 'CL-A-05',
    defaultFaculty: 'Prof. Subhashree Mishra'
  },
  'STA_A_PM': {
    code: 'CS40003',
    name: 'Software Testing and Automation',
    shortName: 'ST&A',
    defaultRoom: 'CL-A-06',
    defaultFaculty: 'Prof. Proshikshya Mukherjee'
  },
  'STA_B_SMH': {
    code: 'CS40003',
    name: 'Software Testing and Automation',
    shortName: 'ST&A',
    defaultRoom: 'CL-A-05',
    defaultFaculty: 'Prof. Subhashree Mishra'
  },
  'HCI_A_SBB': {
    code: 'CS40005',
    name: 'Human Computer Interaction',
    shortName: 'HCI',
    defaultRoom: 'CL-A-19',
    defaultFaculty: 'Prof. Seshadri Binay Behera'
  },
  'HCI_A_SSM': {
    code: 'CS40005',
    name: 'Human Computer Interaction',
    shortName: 'HCI',
    defaultRoom: 'CL-14',
    defaultFaculty: 'Prof. Sadhana Subhadarshini Mohanty'
  },
  'CNS_A_SMR': {
    code: 'CS40015',
    name: 'Cryptography and Network Security',
    shortName: 'C&NS',
    defaultRoom: 'CL-A-01',
    defaultFaculty: 'Prof. Suman Roy'
  },
  'SDN_A_ADATTA': {
    code: 'CS30023',
    name: 'Software Defined Networking',
    shortName: 'SDN',
    defaultRoom: 'CL-A-03',
    defaultFaculty: 'Prof. Amlan Datta'
  },
  'LPVD-A_MRT': {
    code: 'EC40007',
    name: 'Low Power VLSI Design',
    shortName: 'LP_VLSID',
    defaultRoom: 'CL-A-02',
    defaultFaculty: 'Prof. Manas Ranjan Tripathy'
  },
  'WBE_A_SB': {
    code: 'EE40013',
    name: 'Wind and Biomass Energy',
    shortName: 'WBE',
    defaultRoom: 'CL-A-04',
    defaultFaculty: 'Prof. Subrat Behera'
  },
  'MLLP_A_SUP': {
    code: 'EM40001',
    name: 'ML for Language Processing',
    shortName: 'ML_LP',
    defaultRoom: 'CL-A-10',
    defaultFaculty: 'Prof. Suprava Patnaik'
  },
  'MLLP_B_SUP': {
    code: 'EM40001',
    name: 'ML for Language Processing',
    shortName: 'ML_LP',
    defaultRoom: 'CL-A-10',
    defaultFaculty: 'Prof. Suprava Patnaik'
  }
};

/**
 * Fetch all academic subjects from NeonDB
 */
export async function getAllSubjects(): Promise<SubjectItem[]> {
  try {
    const subjects = await db.$queryRaw<SubjectItem[]>`
      SELECT "id", "code", "name", "shortName", "semester", "type", "branch", "credits", "faculty", "classroom", "description"
      FROM "Subject"
      ORDER BY "semester" DESC, "code" ASC;
    `;
    return subjects;
  } catch (error) {
    console.error('Failed to fetch subjects from DB:', error);
    return [];
  }
}

/**
 * Find subject by course code (e.g. CS40003, EX40003, HS40001)
 */
export async function getSubjectByCode(code: string): Promise<SubjectItem | null> {
  try {
    const clean = code.trim().toUpperCase();
    const rows = await db.$queryRaw<SubjectItem[]>`
      SELECT "id", "code", "name", "shortName", "semester", "type", "branch", "credits", "faculty", "classroom", "description"
      FROM "Subject"
      WHERE UPPER("code") = ${clean} OR UPPER("shortName") = ${clean}
      LIMIT 1;
    `;
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.warn(`Subject lookup for ${code} warning:`, error);
    return null;
  }
}

/**
 * Map Google Classroom or email coursework to a canonical Subject in DB
 */
export async function mapCourseworkToSubject(query: string): Promise<SubjectItem | null> {
  try {
    const upper = query.toUpperCase();
    
    // Check direct code match (e.g. CS40003, CS31001)
    const codeMatch = upper.match(/\b([A-Z]{2,4}\d{4,5})\b/);
    if (codeMatch) {
      const byCode = await getSubjectByCode(codeMatch[1]);
      if (byCode) return byCode;
    }

    // Name-based fuzzy search
    const subjects = await getAllSubjects();
    for (const s of subjects) {
      if (upper.includes(s.code.toUpperCase())) return s;
      if (s.shortName && upper.includes(s.shortName.toUpperCase())) return s;
      if (upper.includes(s.name.toUpperCase())) return s;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Resolve student academic profile from NeonDB (User + AcademicProfile + StudentDirectory)
 */
export async function getStudentProfile(userId: string): Promise<StudentProfileInfo> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { academicProfile: true }
  });

  const rollNumber = user?.academicProfile?.rollNumber || 
    (user?.email?.match(/^(\d+)@kiit\.ac\.in$/i)?.[1] ?? '2330231');

  // Query StudentDirectory for authoritative details
  const dirRows = await db.$queryRaw<any[]>`
    SELECT "rollNo", "name", "section", "branch", "semester", "program", "electiveSection", "electiveSubject", "electiveFaculty", "electiveRoom"
    FROM "StudentDirectory"
    WHERE "rollNo" = ${rollNumber}
    LIMIT 1;
  `;

  const dir = dirRows.length > 0 ? dirRows[0] : null;

  // Query AcademicProfile for any user overrides or elective allotments
  const apRows = await db.$queryRaw<any[]>`
    SELECT "section", "branch", "program", "electiveSection", "electiveSubject", "electiveFaculty", "electiveRoom"
    FROM "AcademicProfile"
    WHERE "userId" = ${userId}
    LIMIT 1;
  `;
  const ap = apRows.length > 0 ? apRows[0] : null;

  const section = dir?.section || ap?.section || 'ECS GROUP-03';
  const branch = dir?.branch || ap?.branch || 'E&CSc';
  const semester = 7;
  const name = dir?.name || user?.name || 'Student';
  const email = user?.email || `${rollNumber}@kiit.ac.in`;
  const program = dir?.program || ap?.program || 'B.Tech in Electronics & Computer Science (7th Sem)';
  const electiveSection = dir?.electiveSection || ap?.electiveSection || null;
  const electiveSubject = dir?.electiveSubject || ap?.electiveSubject || null;
  const electiveFaculty = dir?.electiveFaculty || ap?.electiveFaculty || null;
  const electiveRoom = dir?.electiveRoom || ap?.electiveRoom || null;

  return {
    userId,
    email,
    name,
    rollNumber,
    section,
    branch,
    semester,
    program,
    electiveSection,
    electiveSubject,
    electiveFaculty,
    electiveRoom
  };
}

/**
 * Resolve student's allotted subjects:
 * 1. 7th Semester Core subjects (HS40001, TP40001, EC47001, MN40001, EX40003)
 * 2. Specific allotted PE-IV elective (e.g. CS40003 for STA_A_PM)
 * 3. Historical subjects completed from GradeEntry
 */
export async function getStudentEnrolledSubjects(userId: string): Promise<StudentEnrolledSubjectsResult> {
  const student = await getStudentProfile(userId);

  // 1. Fetch official 7th Semester Core Subjects from DB
  const coreSubjectCodes = ['HS40001', 'TP40001', 'EC47001', 'MN40001', 'EX40003'];
  const allSubjects = await getAllSubjects();
  const subjectMap = new Map(allSubjects.map(s => [s.code.toUpperCase(), s]));

  // 2. Resolve Elective Code
  let electiveCode = 'CS40003';
  if (student.electiveSection && ELECTIVE_SECTION_MAP[student.electiveSection]) {
    electiveCode = ELECTIVE_SECTION_MAP[student.electiveSection].code;
  } else if (student.electiveSubject) {
    const match = student.electiveSubject.match(/\b([A-Z]{2,4}\d{4,5})\b/);
    if (match) electiveCode = match[1];
  }

  // 3. Fetch latest attendance for this student to enrich subjects
  const attendanceRows = await db.$queryRaw<any[]>`
    SELECT DISTINCT ON ("courseCode") "courseCode", "percentage", "lastReportDate"
    FROM "AttendanceRecord"
    WHERE "userId" = ${userId}
    ORDER BY "courseCode", "date" DESC;
  `;
  const attMap = new Map(attendanceRows.map(a => [a.courseCode.toUpperCase(), a.percentage]));

  // Build current semester subject list
  const currentSemesterSubjects: EnrolledSubject[] = [];

  // Add core subjects
  for (const code of coreSubjectCodes) {
    const subj = subjectMap.get(code);
    if (subj) {
      const pct = attMap.get(code) ?? null;
      let status: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'NO_DATA' = 'NO_DATA';
      if (pct !== null) {
        status = pct >= 75 ? 'NORMAL' : pct >= 60 ? 'WARNING' : 'CRITICAL';
      }
      currentSemesterSubjects.push({
        ...subj,
        isElective: false,
        allottedFaculty: subj.faculty,
        allottedRoom: subj.classroom,
        attendancePercentage: pct,
        attendanceStatus: status
      });
    }
  }

  // Add elective subject
  const electiveSubj = subjectMap.get(electiveCode.toUpperCase());
  if (electiveSubj) {
    const pct = attMap.get(electiveCode.toUpperCase()) ?? null;
    let status: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'NO_DATA' = 'NO_DATA';
    if (pct !== null) {
      status = pct >= 75 ? 'NORMAL' : pct >= 60 ? 'WARNING' : 'CRITICAL';
    }
    currentSemesterSubjects.push({
      ...electiveSubj,
      isElective: true,
      allottedFaculty: student.electiveFaculty || electiveSubj.faculty,
      allottedRoom: student.electiveRoom || electiveSubj.classroom,
      electiveSection: student.electiveSection || undefined,
      attendancePercentage: pct,
      attendanceStatus: status
    });
  }

  // 4. Fetch historical subjects from GradeEntry for this student
  const historicalRows = await db.$queryRaw<any[]>`
    SELECT 
      ge."subjectCode", 
      ge."subjectName", 
      ge."credits", 
      ge."grade", 
      sr."semesterNumber",
      s."id" as "subjectId",
      s."type" as "subjectType",
      s."branch" as "subjectBranch",
      s."description" as "subjectDesc"
    FROM "GradeEntry" ge
    JOIN "SemesterRecord" sr ON ge."semesterId" = sr."id"
    JOIN "AcademicProfile" ap ON sr."profileId" = ap."id"
    LEFT JOIN "Subject" s ON UPPER(ge."subjectCode") = UPPER(s."code")
    WHERE ap."userId" = ${userId}
    ORDER BY sr."semesterNumber" DESC, ge."subjectCode" ASC;
  `;

  const historicalSubjects: HistoricalSubject[] = historicalRows.map(h => ({
    id: h.subjectId || `subj-${h.subjectCode.toLowerCase()}`,
    code: h.subjectCode,
    name: h.subjectName,
    shortName: h.subjectCode,
    semester: h.semesterNumber,
    type: h.subjectType || 'CORE',
    branch: h.subjectBranch || 'COMMON',
    credits: h.credits,
    faculty: null,
    classroom: null,
    description: h.subjectDesc || null,
    grade: h.grade,
    semesterNumber: h.semesterNumber
  }));

  const currentSubjectCodes = currentSemesterSubjects.map(s => s.code);
  const histCodes = historicalSubjects.map(s => s.code);
  const allSubjectCodes = Array.from(new Set([...currentSubjectCodes, ...histCodes]));

  return {
    student,
    currentSemesterSubjects,
    currentSubjectCodes,
    historicalSubjects,
    allSubjectCodes
  };
}

/**
 * Fetch unified student timetable slots mapped by subject code
 */
export async function getStudentSchedule(userId: string, groupOverride?: string): Promise<{
  section: string;
  normalizedGroup: string;
  allottedElective: {
    electiveSection: string;
    electiveSubject: string;
    electiveFaculty: string;
    electiveRoom: string;
    electiveCode: string;
  };
  schedule: SubjectScheduleSlot[];
}> {
  const enrollment = await getStudentEnrolledSubjects(userId);
  const activeSection = groupOverride || enrollment.student.section || 'ECS GROUP-03';

  // Normalize group (G1-G7, ECSc1-7, ECS GROUP-01-07)
  let normalizedGroup = activeSection.trim();
  const gMatch = normalizedGroup.match(/^G0?(\d+)$/i);
  if (gMatch) {
    normalizedGroup = `ECS GROUP-${gMatch[1].padStart(2, '0')}`;
  } else {
    const match = normalizedGroup.match(/ECSc?0?(\d+)/i);
    if (match) {
      normalizedGroup = `ECS GROUP-${match[1].padStart(2, '0')}`;
    } else {
      const dMatch = normalizedGroup.match(/^0?([1-7])$/);
      if (dMatch) normalizedGroup = `ECS GROUP-${dMatch[1].padStart(2, '0')}`;
    }
  }

  // Find student's elective subject item
  const electiveItem = enrollment.currentSemesterSubjects.find(s => s.isElective);
  const electiveCode = electiveItem?.code || 'PE-IV';
  const electiveSubject = electiveItem ? `${electiveItem.code} ${electiveItem.name}` : (enrollment.student.electiveSubject || 'Professional Elective IV');
  const electiveFaculty = enrollment.student.electiveFaculty || electiveItem?.faculty || 'Department Elective Faculty';
  const electiveRoom = enrollment.student.electiveRoom || electiveItem?.classroom || 'CL-A-01 - CL-A-19';
  const electiveSection = enrollment.student.electiveSection || 'ELECTIVE';

  // Query schedule slots for this group
  const rawSlots = await db.$queryRaw<any[]>`
    SELECT "id", "group", "day", "startTime", "endTime", "subject", "room", "faculty", "subjectCode", "subjectId"
    FROM "CourseSchedule"
    WHERE "group" = ${normalizedGroup}
    ORDER BY "day" ASC, "startTime" ASC;
  `;

  const schedule: SubjectScheduleSlot[] = rawSlots.map(slot => {
    const isPE = slot.subject === 'PE-IV' || slot.subjectCode === 'PE-IV';
    if (isPE) {
      return {
        id: slot.id,
        group: slot.group,
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        subject: `PE-IV: ${electiveItem?.name || 'Software Testing and Automation'}`,
        room: electiveRoom,
        faculty: electiveFaculty,
        subjectCode: electiveCode,
        subjectId: electiveItem?.id || slot.subjectId,
        isElective: true
      };
    }

    return {
      id: slot.id,
      group: slot.group,
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
      subject: slot.subject,
      room: slot.room,
      faculty: slot.faculty,
      subjectCode: slot.subjectCode || slot.subject,
      subjectId: slot.subjectId,
      isElective: false
    };
  });

  return {
    section: enrollment.student.section,
    normalizedGroup,
    allottedElective: {
      electiveSection,
      electiveSubject,
      electiveFaculty,
      electiveRoom,
      electiveCode
    },
    schedule
  };
}

/**
 * Fetch PYQ examination questions for a specific subject code from OcrQuestion
 */
export async function getPyqsForSubject(subjectCode: string): Promise<SubjectPyqQuestion[]> {
  try {
    const clean = subjectCode.trim().toUpperCase();
    const rows = await db.$queryRaw<SubjectPyqQuestion[]>`
      SELECT 
        "id", "imagePath", "subject", "subjectCode", "year", "examType", 
        "sourcePdf", "pageNumber", "rawOcrText", "correctedText", "status", "subjectId"
      FROM "OcrQuestion"
      WHERE UPPER("subjectCode") = ${clean}
      ORDER BY "year" DESC NULLS LAST, "pageNumber" ASC;
    `;
    return rows;
  } catch (error) {
    console.error(`Failed to fetch PYQs for subject ${subjectCode}:`, error);
    return [];
  }
}

/**
 * Unified deep dive for any subject:
 * Combines Subject definition + Timetable slots + Latest Attendance + PYQ questions
 */
export async function getUnifiedSubjectContext(subjectCode: string, userId?: string) {
  const clean = subjectCode.trim().toUpperCase();
  const subject = await getSubjectByCode(clean);
  if (!subject) return null;

  // 1. Fetch PYQs
  const pyqs = await getPyqsForSubject(clean);

  // 2. Fetch attendance if user is provided
  let attendance: any = null;
  if (userId) {
    const attRows = await db.$queryRaw<any[]>`
      SELECT "percentage", "attended", "total", "lastReportDate", "date"
      FROM "AttendanceRecord"
      WHERE "userId" = ${userId} AND UPPER("courseCode") = ${clean}
      ORDER BY "date" DESC
      LIMIT 1;
    `;
    if (attRows.length > 0) {
      attendance = attRows[0];
    }
  }

  // 3. Fetch schedule slots
  let scheduleSlots: any[] = [];
  if (userId) {
    const sched = await getStudentSchedule(userId);
    scheduleSlots = sched.schedule.filter(s => s.subjectCode.toUpperCase() === clean);
  } else {
    scheduleSlots = await db.$queryRaw<any[]>`
      SELECT "id", "group", "day", "startTime", "endTime", "subject", "room", "faculty", "subjectCode"
      FROM "CourseSchedule"
      WHERE UPPER("subjectCode") = ${clean}
      ORDER BY "day" ASC, "startTime" ASC;
    `;
  }

  return {
    subject,
    scheduleSlots,
    attendance,
    pyqs,
    pyqCount: pyqs.length
  };
}

/**
 * Persist parsed attendance report from academics@kiit.ac.in into NeonDB AttendanceRecord
 */
export async function persistAttendanceReport(
  userId: string,
  reportDateStr: string,
  records: Array<{ courseCode: string; percentage: number }>
) {
  try {
    const parts = reportDateStr.split('/');
    let reportDate = new Date();
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      reportDate = new Date(year, month, day);
    }

    for (const rec of records) {
      const subject = await getSubjectByCode(rec.courseCode);
      const subjectName = subject ? subject.name : rec.courseCode;
      const subjectId = subject ? subject.id : null;

      // Upsert into AttendanceRecord
      await db.$executeRawUnsafe(`
        INSERT INTO "AttendanceRecord" ("id", "userId", "courseCode", "subjectName", "attended", "total", "percentage", "date", "subjectId", "lastReportDate")
        VALUES (
          gen_random_uuid(),
          $1,
          $2,
          $3,
          ROUND($4::numeric * 0.4)::integer,
          40,
          $4,
          $5,
          $6,
          $7
        )
        ON CONFLICT ("userId", "courseCode", "date") DO UPDATE SET
          "percentage" = EXCLUDED."percentage",
          "subjectName" = EXCLUDED."subjectName",
          "subjectId" = EXCLUDED."subjectId",
          "lastReportDate" = EXCLUDED."lastReportDate";
      `, userId, rec.courseCode, subjectName, rec.percentage, reportDate, subjectId, reportDateStr);
    }

    console.log(`✅ Saved ${records.length} attendance records for user ${userId} till ${reportDateStr}`);
  } catch (err) {
    console.error('Failed to persist attendance records to NeonDB:', err);
  }
}
