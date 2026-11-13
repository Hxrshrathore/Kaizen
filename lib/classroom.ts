import { db } from './prisma';
import { getStudentEnrolledSubjects, ELECTIVE_SECTION_MAP, StudentEnrolledSubjectsResult } from './subject-service';

const CLASSROOM_API_BASE = 'https://classroom.googleapis.com/v1';

// --- TYPES ---

export interface SubjectPoolItem {
  code: string;
  name: string;
  type: 'CORE' | 'ELECTIVE' | 'MENTOR';
  isAllotted?: boolean;
  faculty?: string;
  room?: string;
  description?: string;
}

export interface MappedSubjectInfo {
  code: string;
  name: string | null;
  isManual: boolean;
}

export interface CourseTeacher {
  userId: string;
  name: string;
  email?: string;
  photoUrl?: string;
}

export interface ProbabilityBreakdown {
  profScore: number;
  secScore: number;
  regexScore: number;
  empiricalScore: number;
  sampleCount: number;
}

export interface CourseClassification {
  category: 'CURRENT_SEMESTER' | 'PREVIOUS_SEMESTER' | 'AMBIGUOUS';
  recommendedActive: boolean;
  matchedSubjectCode: string | null;
  matchedSubjectName: string | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
  probability?: number;
  detectedProfessor?: string | null;
  detectedSection?: string | null;
  probabilityBreakdown?: ProbabilityBreakdown;
  evidence?: string[];
}

// --- API FUNCTIONS ---

export async function getValidToken(userId: string): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { accessToken: true, refreshToken: true, tokenExpiry: true }
  });

  if (!user || !user.accessToken) {
    throw new Error('User not authenticated with Google or tokens missing');
  }

  // Check if token is expired (with 1 minute buffer)
  if (user.tokenExpiry && new Date(user.tokenExpiry).getTime() - 60000 < Date.now()) {
    if (!user.refreshToken) {
      throw new Error('Access token expired and no refresh token available');
    }

    // Refresh the token
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: user.refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Failed to refresh Google token:', data);
      throw new Error('Failed to refresh Google token');
    }

    const newExpiry = new Date(Date.now() + data.expires_in * 1000);

    await db.user.update({
      where: { id: userId },
      data: {
        accessToken: data.access_token,
        tokenExpiry: newExpiry,
      },
    });

    return data.access_token;
  }

  return user.accessToken;
}

export async function fetchUserCourses(accessToken: string) {
  const response = await fetch(`${CLASSROOM_API_BASE}/courses?courseStates=ACTIVE`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('Error fetching courses:', error);
    throw new Error('Failed to fetch courses from Google Classroom');
  }

  const data = await response.json();
  return data.courses || [];
}

export async function fetchCourseWork(accessToken: string, courseId: string) {
  try {
    const response = await fetch(`${CLASSROOM_API_BASE}/courses/${courseId}/courseWork`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.courseWork || [];
  } catch (err) {
    return [];
  }
}

export async function fetchStudentSubmissions(accessToken: string, courseId: string) {
  try {
    const response = await fetch(
      `${CLASSROOM_API_BASE}/courses/${courseId}/courseWork/-/studentSubmissions?userId=me`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.studentSubmissions || [];
  } catch (err) {
    return [];
  }
}

/**
 * Fetch teachers for a course from Google Classroom API.
 * Gracefully returns an empty array if scope is missing or forbidden.
 */
export async function fetchCourseTeachers(accessToken: string, courseId: string): Promise<CourseTeacher[]> {
  try {
    const response = await fetch(`${CLASSROOM_API_BASE}/courses/${courseId}/teachers`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return (data.teachers || []).map((t: any) => ({
      userId: t.userId,
      name: t.profile?.name?.fullName || t.profile?.name?.givenName || 'Faculty',
      email: t.profile?.emailAddress || '',
      photoUrl: t.profile?.photoUrl || '',
    }));
  } catch {
    return [];
  }
}

/**
 * Fetch verified teacher directory indexed by ownerId from NeonDB
 */
export async function getTeacherDirectory(): Promise<Map<string, { name: string; email: string; department?: string; subjectCode?: string; sampleCount: number }>> {
  try {
    const rows = await db.$queryRawUnsafe<any[]>(
      `SELECT "ownerId", "name", "email", "department", "subjectCode", "sampleCount" FROM "ClassroomTeacherDirectory";`
    );
    const map = new Map();
    for (const r of rows) {
      map.set(r.ownerId, r);
    }
    return map;
  } catch {
    return new Map();
  }
}

// --- MATHEMATICAL / BAYESIAN PROBABILITY ENGINE ---

interface ProbCalcInput {
  course: any;
  candidateSubject: {
    code: string;
    name: string;
    shortName?: string | null;
    faculty?: string | null;
    classroom?: string | null;
    room?: string | null;
  };
  studentProfile?: any;
  detectedProfessor?: string | null;
  sampleCount?: number;
  positiveConfirmations?: number;
}

/**
 * Computes a calibrated mathematical probability score P(Subject | Course, Student, Teacher)
 * based on multi-factor evidence: Professor (0.35) + Section/Room (0.25) + Lexical/Regex (0.20) + Empirical (0.20-0.30)
 */
export function calculateCourseSubjectProbability({
  course,
  candidateSubject,
  studentProfile,
  detectedProfessor,
  sampleCount = 0,
  positiveConfirmations = 0,
}: ProbCalcInput): {
  probability: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  breakdown: ProbabilityBreakdown;
  evidence: string[];
} {
  const courseName = (course.name || '').toLowerCase();
  const courseSection = (course.section || '').toLowerCase();
  const courseSubject = (course.subject || '').toLowerCase();
  const courseRoom = (course.room || '').toLowerCase();
  const courseDesc = (course.descriptionHeading || course.description || '').toLowerCase();
  const combinedCourseText = `${courseName} ${courseSection} ${courseSubject} ${courseRoom} ${courseDesc}`;

  const subCode = candidateSubject.code.toLowerCase();
  const subName = candidateSubject.name.toLowerCase();
  const subFaculty = (candidateSubject.faculty || '').toLowerCase();
  const subRoom = (candidateSubject.classroom || candidateSubject.room || '').toLowerCase();

  const evidence: string[] = [];

  // 1. Evidence Factor 1: Professor / Teacher Match (Weight: 0.35)
  let profScore = 0.0;
  if (detectedProfessor) {
    const pClean = detectedProfessor.toLowerCase().replace(/^(prof|dr|mr|mrs)\.?\s+/i, '').trim();
    const pTokens = pClean.split(/\s+/).filter(t => t.length > 2);

    const studentElectiveFaculty = (studentProfile?.electiveFaculty || '').toLowerCase();
    const isStudentAllottedProf = pTokens.some(tok => studentElectiveFaculty.includes(tok));
    const isSubjectFacultyRoster = pTokens.some(tok => subFaculty.includes(tok));

    if (isStudentAllottedProf) {
      profScore = 1.0;
      evidence.push(`Direct Faculty Match: Assigned professor [${detectedProfessor}]`);
    } else if (isSubjectFacultyRoster) {
      profScore = 0.85;
      evidence.push(`Faculty Roster Match: [${detectedProfessor}] teaches ${candidateSubject.code}`);
    } else {
      profScore = 0.05;
    }
  } else {
    // If no professor detected, use a neutral baseline
    profScore = 0.20;
  }

  // 2. Evidence Factor 2: Student Allotted Section & Room Match (Weight: 0.25)
  let secScore = 0.0;
  const studentSec = (studentProfile?.section || '').toLowerCase();
  const studentElectiveSec = (studentProfile?.electiveSection || '').toLowerCase(); // e.g. STA_A_PM

  if (courseSection) {
    const hasGroupA = /\b(group\s*a|a)\b/i.test(courseSection) && /(_a_|_a$|group\s*a)/i.test(studentElectiveSec);
    const hasGroupB = /\b(group\s*b|b)\b/i.test(courseSection) && /(_b_|_b$|group\s*b)/i.test(studentElectiveSec);
    const hasCohortSec = studentSec && courseSection.includes(studentSec);

    if (hasGroupA || hasGroupB) {
      secScore = 1.0;
      evidence.push(`Section group matches your allotted elective group (${course.section})`);
    } else if (hasCohortSec) {
      secScore = 0.85;
      evidence.push(`Classroom section matches your cohort section (${course.section})`);
    } else if (/group/i.test(courseSection)) {
      secScore = 0.50;
      evidence.push(`Section matches departmental group format (${course.section})`);
    } else {
      secScore = 0.20;
    }
  } else {
    secScore = 0.30;
  }

  // Room verification
  if (courseRoom && subRoom && subRoom.includes(courseRoom)) {
    secScore = Math.min(1.0, secScore + 0.3);
    evidence.push(`Room matches designated classroom: ${course.room}`);
  }

  // 3. Evidence Factor 3: Regex & Lexical Matching (Weight: 0.20)
  let regexScore = 0.0;
  const codeRegex = new RegExp(`\\b${subCode}\\b`, 'i');
  if (codeRegex.test(combinedCourseText)) {
    regexScore = 1.0;
    evidence.push(`Explicit Subject Code detected: ${candidateSubject.code}`);
  } else if (courseSubject && (courseSubject.includes(subName) || subName.includes(courseSubject))) {
    regexScore = 0.95;
    evidence.push(`Classroom course subject matches: ${course.subject}`);
  } else if (subCode === 'cs40003' && /\b(sat|st&a|software testing)\b/i.test(combinedCourseText)) {
    regexScore = 0.90;
    evidence.push(`Standard acronym match: SAT/ST&A for ${candidateSubject.name}`);
  } else if (subCode === 'ex40003' && /\b(engineering professional practice|professional practice|epp)\b/i.test(combinedCourseText)) {
    regexScore = 0.92;
    evidence.push(`Core curricular match: Engineering Professional Practice`);
  } else if (subCode === 'tp40001' && /\b(t&p|training & placement|placement)\b/i.test(combinedCourseText)) {
    regexScore = 0.90;
    evidence.push(`T&P curricular match`);
  } else if (subCode === 'mentor' && /\b(tutor_mentor|mentorship|proctor)\b/i.test(combinedCourseText)) {
    regexScore = 0.95;
    evidence.push(`University mentorship group match`);
  } else if (combinedCourseText.includes(subName) || (candidateSubject.shortName && combinedCourseText.includes(candidateSubject.shortName.toLowerCase()))) {
    regexScore = 0.85;
    evidence.push(`Subject title lexical match: ${candidateSubject.name}`);
  } else {
    regexScore = 0.05;
  }

  // 4. Evidence Factor 4: Empirical Bayesian Frequency Factor (Weight: 0.20 to 0.30)
  const alpha = 2; // Laplace smoothing parameters
  const beta = 1;
  const empiricalScore = (positiveConfirmations + alpha) / (sampleCount + alpha + beta);
  const dynamicEmpiricalWeight = 0.20 + 0.10 * Math.min(1.0, sampleCount / 5);

  if (sampleCount > 0) {
    evidence.push(`Learned collective prior: ${positiveConfirmations}/${sampleCount} cohort confirmations (${Math.round(empiricalScore * 100)}%)`);
  }

  // Weighted posterior combination
  const wProf = 0.35;
  const wSec = 0.25;
  const wRegex = 0.20;
  const wEmp = dynamicEmpiricalWeight;

  const totalWeight = wProf + wSec + wRegex + wEmp;
  const rawProb = (wProf * profScore + wSec * secScore + wRegex * regexScore + wEmp * empiricalScore) / totalWeight;
  const finalProb = Math.min(0.99, Math.max(0.01, Math.round(rawProb * 1000) / 1000));

  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  if (finalProb >= 0.70) confidence = 'HIGH';
  else if (finalProb >= 0.40) confidence = 'MEDIUM';

  return {
    probability: finalProb,
    confidence,
    breakdown: {
      profScore: Math.round(profScore * 100) / 100,
      secScore: Math.round(secScore * 100) / 100,
      regexScore: Math.round(regexScore * 100) / 100,
      empiricalScore: Math.round(empiricalScore * 100) / 100,
      sampleCount,
    },
    evidence,
  };
}

// --- CLASSIFIER LOGIC ---

export function classifyCourseForStudent(
  course: any,
  studentData?: StudentEnrolledSubjectsResult | null,
  healingPatterns?: any[],
  detectedProfessor?: string | null
): CourseClassification {
  const name = (course.name || '').trim();
  const section = (course.section || '').trim();
  const desc = (course.descriptionHeading || course.description || '').trim();
  const sub = (course.subject || '').trim();
  const combined = `${name} ${section} ${sub} ${desc}`.toLowerCase();

  // 1. Negative Filters: Explicit Backlog / Improvement / Supplementary / Repeat courses
  if (/(backlog|supplementary|improvement|grade improvement|re-registration)/i.test(combined)) {
    return {
      category: 'PREVIOUS_SEMESTER',
      recommendedActive: false,
      matchedSubjectCode: null,
      matchedSubjectName: null,
      confidence: 'HIGH',
      probability: 0.02,
      detectedProfessor: detectedProfessor || null,
      detectedSection: section || null,
      reason: 'Historical Backlog / Supplementary / Improvement Course',
    };
  }

  // 2. Negative Filters: Explicit Previous Semesters (1st to 6th Sem)
  if (/\b([1-6](st|nd|rd|th)\s*sem(ester)?)\b/i.test(combined)) {
    return {
      category: 'PREVIOUS_SEMESTER',
      recommendedActive: false,
      matchedSubjectCode: null,
      matchedSubjectName: null,
      confidence: 'HIGH',
      probability: 0.01,
      detectedProfessor: detectedProfessor || null,
      detectedSection: section || null,
      reason: 'Explicitly labeled as 1st–6th semester coursework',
    };
  }

  // 3. Negative Filters: Known Previous Semester core subjects, labs, or historical groups
  if (/\b(wta|mes|cvpr|fpm|dl:a&i|deep learning|software engineering|ad lab|algorithm lab|ecsc\s*6|dms_m)\b/i.test(combined)) {
    return {
      category: 'PREVIOUS_SEMESTER',
      recommendedActive: false,
      matchedSubjectCode: null,
      matchedSubjectName: null,
      confidence: 'HIGH',
      probability: 0.03,
      detectedProfessor: detectedProfessor || null,
      detectedSection: section || null,
      reason: 'Completed 5th/6th semester subject or lab',
    };
  }

  // 4. Candidate Subject Pool for Student's Current Semester
  const candidatePool = buildCurrentSemesterSubjectsPool(studentData);

  // Check self-healing patterns for initial counts
  const patternStats = new Map<string, { samples: number; confidence: number }>();
  if (healingPatterns && healingPatterns.length > 0) {
    for (const hp of healingPatterns) {
      const pKey = (hp.patternKey || '').toLowerCase().trim();
      if (pKey) {
        patternStats.set(pKey, {
          samples: hp.sampleCount || 1,
          confidence: hp.confidence || 0.8,
        });
      }
    }
  }

  // 5. Run Mathematical Probability Scoring for each Candidate Subject
  let bestCandidate: any = null;
  let bestProbResult: any = null;

  for (const cand of candidatePool) {
    const pKey = `${(cand.code || '').toLowerCase()}_${(section || 'gen').toLowerCase()}`;
    const pStats = patternStats.get(pKey) || { samples: 0, confidence: 0.5 };

    const probRes = calculateCourseSubjectProbability({
      course,
      candidateSubject: cand,
      studentProfile: studentData?.student,
      detectedProfessor,
      sampleCount: pStats.samples,
      positiveConfirmations: Math.round(pStats.samples * pStats.confidence),
    });

    if (!bestProbResult || probRes.probability > bestProbResult.probability) {
      bestProbResult = probRes;
      bestCandidate = cand;
    }
  }

  // 6. Thresholding & Category Determination
  if (bestProbResult && bestProbResult.probability >= 0.70) {
    const isMentor = bestCandidate.code === 'MENTOR';
    return {
      category: 'CURRENT_SEMESTER',
      recommendedActive: true,
      matchedSubjectCode: bestCandidate.code,
      matchedSubjectName: bestCandidate.name,
      confidence: 'HIGH',
      probability: bestProbResult.probability,
      detectedProfessor: detectedProfessor || null,
      detectedSection: section || null,
      probabilityBreakdown: bestProbResult.breakdown,
      evidence: bestProbResult.evidence,
      reason: isMentor 
        ? 'Active Academic Mentorship Forum' 
        : `${Math.round(bestProbResult.probability * 100)}% Match: ${bestCandidate.name} (${bestCandidate.code})`,
    };
  }

  if (bestProbResult && bestProbResult.probability >= 0.40) {
    return {
      category: 'AMBIGUOUS',
      recommendedActive: false,
      matchedSubjectCode: bestCandidate.code,
      matchedSubjectName: bestCandidate.name,
      confidence: 'MEDIUM',
      probability: bestProbResult.probability,
      detectedProfessor: detectedProfessor || null,
      detectedSection: section || null,
      probabilityBreakdown: bestProbResult.breakdown,
      evidence: bestProbResult.evidence,
      reason: `${Math.round(bestProbResult.probability * 100)}% Probability: Matches ${bestCandidate.name} (${bestCandidate.code}). Please confirm your section.`,
    };
  }

  // Check historical subjects from student transcript
  if (studentData?.historicalSubjects) {
    for (const h of studentData.historicalSubjects) {
      const hCode = h.code.toLowerCase();
      const hName = h.name.toLowerCase();
      if (combined.includes(hCode) || combined.includes(hName)) {
        return {
          category: 'PREVIOUS_SEMESTER',
          recommendedActive: false,
          matchedSubjectCode: h.code,
          matchedSubjectName: h.name,
          confidence: 'HIGH',
          probability: 0.05,
          detectedProfessor: detectedProfessor || null,
          detectedSection: section || null,
          reason: `Completed in Semester ${h.semesterNumber || 'past'} (${h.code})`,
        };
      }
    }
  }

  // Fallback: Ambiguous / Low confidence
  return {
    category: 'AMBIGUOUS',
    recommendedActive: false,
    matchedSubjectCode: null,
    matchedSubjectName: null,
    confidence: 'LOW',
    probability: bestProbResult?.probability || 0.15,
    detectedProfessor: detectedProfessor || null,
    detectedSection: section || null,
    reason: 'Unverified course - please confirm if this belongs to your current active semester.',
  };
}

/**
 * Build complete pool of Current Semester Subjects for the student to select from
 */
export function buildCurrentSemesterSubjectsPool(studentData?: StudentEnrolledSubjectsResult | null): SubjectPoolItem[] {
  const pool: SubjectPoolItem[] = [];
  const semNum = studentData?.student?.semester || 7;

  // 1. Dynamic subjects from student's enrolled subjects profile
  if (studentData?.currentSemesterSubjects && studentData.currentSemesterSubjects.length > 0) {
    for (const s of studentData.currentSemesterSubjects) {
      pool.push({
        code: s.code,
        name: s.name,
        type: (s.type as any) || (s.isElective ? 'ELECTIVE' : 'CORE'),
        isAllotted: s.isElective,
        faculty: s.allottedFaculty || s.faculty || undefined,
        room: s.allottedRoom || s.classroom || undefined,
        description: s.description || (s.isElective ? 'Your Allotted Elective' : `Core ${s.name} (Semester ${semNum})`),
      });
    }
  } else {
    // Fallback if enrollment data not yet loaded
    pool.push(
      {
        code: 'EX40003',
        name: 'Engineering Professional Practice',
        type: 'CORE',
        faculty: 'Faculty In-Charge (ECE/ECS)',
        room: 'Group-3 / Campus 15 Lab',
        description: 'Core Practical Laboratory & Ethics',
      },
      {
        code: 'HS40001',
        name: 'Engineering Economics and Project Management',
        type: 'CORE',
        faculty: 'Prof. S. Padhy / Prof. S. Alpna / Prof. P. Dutta',
        room: 'CL-A-01 - CL-A-06',
        description: 'Core Humanities & Economics',
      },
      {
        code: 'TP40001',
        name: 'Training & Placement',
        type: 'CORE',
        faculty: 'Training & Placement Faculty',
        room: 'CL-A-01 - CL-A-06',
        description: 'Career Advisory & Placement Preparation',
      },
      {
        code: 'EC47001',
        name: 'Project-I',
        type: 'CORE',
        faculty: 'Project Supervisor / Evaluation Committee',
        room: 'Project Laboratory',
        description: 'Major Capstone Project Phase-I',
      },
      {
        code: 'MN40001',
        name: 'Minor Project',
        type: 'CORE',
        faculty: 'Department Faculty',
        room: 'Designated Minor Rooms',
        description: 'Interdisciplinary Minor Coursework',
      }
    );
  }

  // 2. Add Tutor-Mentor Forum
  const hasMentor = pool.some(p => p.code === 'MENTOR');
  if (!hasMentor) {
    pool.push({
      code: 'MENTOR',
      name: 'Tutor-Mentor Forum',
      type: 'MENTOR',
      faculty: 'Academic Proctor / Tutor Mentor',
      room: 'Campus-12',
      description: 'Proctorial & Student Mentorship Group',
    });
  }

  return pool;
}

export async function getClassroomData(userId: string) {
  const token = await getValidToken(userId);
  
  // 1. Fetch hidden courses from database
  let hiddenCourseIds: string[] = [];
  try {
    const hiddenRecords = await db.hiddenCourse.findMany({
      where: { userId },
      select: { courseId: true }
    });
    hiddenCourseIds = hiddenRecords.map((r: { courseId: string }) => r.courseId);
  } catch (err) {
    console.warn("Failed to fetch hidden courses:", err);
  }

  // 2. Fetch student profile & enrolled subjects for classification
  let studentData: StudentEnrolledSubjectsResult | null = null;
  try {
    studentData = await getStudentEnrolledSubjects(userId);
  } catch (err) {
    console.warn("Failed to resolve student enrolled subjects for classroom classification:", err);
  }

  // 3. Fetch persistent subject mappings from ClassroomSubjectMapping
  let existingMappings: any[] = [];
  try {
    existingMappings = await db.$queryRawUnsafe<any[]>(
      `SELECT "courseId", "subjectCode", "subjectName", "isManual", "professorName" FROM "ClassroomSubjectMapping" WHERE "userId" = $1;`,
      userId
    );
  } catch (mapErr) {
    console.warn("Failed to query ClassroomSubjectMapping:", mapErr);
  }
  const mappingByCourseId = new Map<string, any>(existingMappings.map(m => [m.courseId, m]));

  // 4. Fetch self-healing institutional patterns
  let healingPatterns: any[] = [];
  try {
    healingPatterns = await db.$queryRawUnsafe<any[]>(
      `SELECT "patternKey", "coursePattern", "targetCode", "category", "confidence", "sampleCount" FROM "ClassroomHealingPattern";`
    );
  } catch (patErr) {
    console.warn("Failed to query ClassroomHealingPattern:", patErr);
  }

  // 5. Fetch teacher directory from NeonDB
  const teacherDirectory = await getTeacherDirectory();

  const rawCourses = await fetchUserCourses(token);
  
  // 6. Fetch assignments, submissions, and teachers in parallel for each course
  const coursesWithDetails = await Promise.all(
    rawCourses.map(async (course: any) => {
      // Teacher Resolution: Try API first, fallback to directory by ownerId, then course heuristics
      let detectedProfessor: string | null = null;
      let teacherEmail: string | null = null;

      // Check persistent mapping first
      if (mappingByCourseId.has(course.id) && mappingByCourseId.get(course.id).professorName) {
        detectedProfessor = mappingByCourseId.get(course.id).professorName;
      }

      // If not yet known, check directory by ownerId
      if (!detectedProfessor && course.ownerId && teacherDirectory.has(course.ownerId)) {
        const tEntry = teacherDirectory.get(course.ownerId);
        detectedProfessor = tEntry?.name || null;
        teacherEmail = tEntry?.email || null;
      }

      // Try fetching teachers from Google Classroom API
      const [assignments, submissions, teachers] = await Promise.all([
        fetchCourseWork(token, course.id),
        fetchStudentSubmissions(token, course.id),
        detectedProfessor ? Promise.resolve([]) : fetchCourseTeachers(token, course.id)
      ]);

      if (teachers && teachers.length > 0) {
        detectedProfessor = teachers[0].name;
        teacherEmail = teachers[0].email || null;

        // Upsert newly discovered teacher into NeonDB directory
        if (course.ownerId && detectedProfessor) {
          try {
            await db.$executeRawUnsafe(
              `
              INSERT INTO "ClassroomTeacherDirectory" ("ownerId", "name", "email", "updatedAt")
              VALUES ($1, $2, $3, NOW())
              ON CONFLICT ("ownerId") DO UPDATE SET
                "name" = EXCLUDED."name",
                "email" = COALESCE(EXCLUDED."email", "ClassroomTeacherDirectory"."email"),
                "updatedAt" = NOW();
              `,
              course.ownerId,
              detectedProfessor,
              teacherEmail || ''
            );
          } catch {}
        }
      }

      // Map submissions by courseWorkId
      const submissionsMap = new Map<string, any>();
      for (const s of submissions) {
        if (s.courseWorkId) {
          submissionsMap.set(s.courseWorkId, s);
        }
      }

      // Enrich assignments with live submission status
      const enrichedAssignments = assignments.map((cw: any) => {
        const sub = submissionsMap.get(cw.id);
        const state = sub?.state || 'NEW';
        const isSubmitted = state === 'TURNED_IN' || state === 'RETURNED';
        const isLate = Boolean(sub?.late);
        const assignedGrade = typeof sub?.assignedGrade === 'number' ? sub.assignedGrade : null;
        const maxPoints = typeof cw.maxPoints === 'number' ? cw.maxPoints : null;
        const alternateLink = sub?.alternateLink || cw.alternateLink;

        return {
          id: cw.id,
          title: cw.title,
          description: cw.description,
          alternateLink,
          dueDate: cw.dueDate,
          dueTime: cw.dueTime,
          maxPoints,
          isSubmitted,
          submissionState: state,
          isLate,
          assignedGrade,
          submissionLink: sub?.alternateLink || null,
        };
      });

      // Calculate stats
      const totalAssignments = enrichedAssignments.length;
      const submittedAssignments = enrichedAssignments.filter((a: any) => a.isSubmitted).length;
      const pendingAssignments = totalAssignments - submittedAssignments;

      // Classify course using mathematical probability engine
      const classification = classifyCourseForStudent(course, studentData, healingPatterns, detectedProfessor);

      // Determine Subject Mapping (Persistent DB Mapping vs Auto-Detection)
      let mappedSubject: MappedSubjectInfo | null = null;
      let needsSubjectSelection = false;

      if (mappingByCourseId.has(course.id)) {
        const saved = mappingByCourseId.get(course.id);
        mappedSubject = {
          code: saved.subjectCode,
          name: saved.subjectName,
          isManual: Boolean(saved.isManual),
        };
      } else if (classification.matchedSubjectCode && classification.confidence === 'HIGH') {
        // High-confidence auto-detection: automatically persist in DB
        mappedSubject = {
          code: classification.matchedSubjectCode,
          name: classification.matchedSubjectName || classification.matchedSubjectCode,
          isManual: false,
        };

        // Auto-persist in DB asynchronously
        try {
          await db.$executeRawUnsafe(
            `
            INSERT INTO "ClassroomSubjectMapping" ("id", "userId", "courseId", "courseName", "subjectCode", "subjectName", "isManual", "professorName", "ownerId", "updatedAt")
            VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, false, $6, $7, NOW())
            ON CONFLICT ("userId", "courseId") DO NOTHING;
            `,
            userId,
            course.id,
            course.name,
            classification.matchedSubjectCode,
            classification.matchedSubjectName || classification.matchedSubjectCode,
            detectedProfessor || null,
            course.ownerId || null
          );
        } catch (e) {
          console.warn('Auto-persist mapping warning for course:', course.id, e);
        }
      } else {
        // Unmapped or ambiguous: needs student selection
        needsSubjectSelection = classification.category !== 'PREVIOUS_SEMESTER';
      }

      return {
        ...course,
        detectedProfessor,
        teacherEmail,
        assignments: enrichedAssignments,
        stats: {
          total: totalAssignments,
          submitted: submittedAssignments,
          pending: pendingAssignments,
        },
        classification,
        mappedSubject,
        needsSubjectSelection,
      };
    })
  );

  const hiddenSet = new Set(hiddenCourseIds);
  const totalCourses = coursesWithDetails.length;
  const activeCourses = coursesWithDetails.filter(c => !hiddenSet.has(c.id));
  const hiddenCourses = coursesWithDetails.filter(c => hiddenSet.has(c.id));

  // Determine if there are past semester courses that are NOT yet hidden
  const unfilteredPastCourses = coursesWithDetails.filter(
    c => c.classification.category === 'PREVIOUS_SEMESTER' && !hiddenSet.has(c.id)
  );
  const hasUnfilteredPastCourses = unfilteredPastCourses.length > 0;

  const recommendedActiveIds = coursesWithDetails
    .filter(c => c.classification.recommendedActive)
    .map(c => c.id);

  const recommendedHiddenIds = coursesWithDetails
    .filter(c => !c.classification.recommendedActive)
    .map(c => c.id);

  // Build the student's 7th-semester subjects pool for manual mapping
  const currentSemesterSubjectsPool = buildCurrentSemesterSubjectsPool(studentData);

  return { 
    courses: coursesWithDetails,
    hiddenCourseIds,
    studentProfile: studentData?.student || null,
    enrolledSubjects: studentData?.currentSemesterSubjects || [],
    currentSemesterSubjectsPool,
    summary: {
      totalCourses,
      activeCount: activeCourses.length,
      hiddenCount: hiddenCourses.length,
      recommendedActiveCount: recommendedActiveIds.length,
      recommendedHiddenCount: recommendedHiddenIds.length,
      hasUnfilteredPastCourses,
      unfilteredPastCount: unfilteredPastCourses.length,
      recommendedActiveIds,
      recommendedHiddenIds,
      unmappedActiveCount: activeCourses.filter(c => !c.mappedSubject).length,
    }
  };
}
