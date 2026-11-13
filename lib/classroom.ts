import { db } from './prisma';
import { getStudentEnrolledSubjects, ELECTIVE_SECTION_MAP, StudentEnrolledSubjectsResult } from './subject-service';

const CLASSROOM_API_BASE = 'https://classroom.googleapis.com/v1';

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
      console.warn(`Error fetching coursework for course ${courseId}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.courseWork || [];
  } catch (err) {
    console.warn(`Exception fetching coursework for course ${courseId}:`, err);
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
      // Submissions API might return 404 or 403 if coursework is empty or permissions restricted
      return [];
    }

    const data = await response.json();
    return data.studentSubmissions || [];
  } catch (err) {
    console.warn(`Exception fetching submissions for course ${courseId}:`, err);
    return [];
  }
}

// --- CLASSIFIER LOGIC ---

export interface CourseClassification {
  category: 'CURRENT_SEMESTER' | 'PREVIOUS_SEMESTER' | 'AMBIGUOUS';
  recommendedActive: boolean;
  matchedSubjectCode: string | null;
  matchedSubjectName: string | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
}

export function classifyCourseForStudent(
  course: any,
  studentData?: StudentEnrolledSubjectsResult | null
): CourseClassification {
  const name = (course.name || '').trim();
  const section = (course.section || '').trim();
  const desc = (course.descriptionHeading || '').trim();
  const combined = `${name} ${section} ${desc}`.toLowerCase();

  // 1. Explicit Backlog / Improvement / Supplementary / Repeat courses
  if (/(backlog|supplementary|improvement|grade improvement|re-registration)/i.test(combined)) {
    return {
      category: 'PREVIOUS_SEMESTER',
      recommendedActive: false,
      matchedSubjectCode: null,
      matchedSubjectName: null,
      confidence: 'HIGH',
      reason: 'Historical Backlog / Supplementary / Improvement Course',
    };
  }

  // 2. Explicit Previous Semesters (1st to 6th Sem)
  if (/\b([1-6](st|nd|rd|th)\s*sem(ester)?)\b/i.test(combined)) {
    return {
      category: 'PREVIOUS_SEMESTER',
      recommendedActive: false,
      matchedSubjectCode: null,
      matchedSubjectName: null,
      confidence: 'HIGH',
      reason: 'Explicitly labeled as 1st–6th semester coursework',
    };
  }

  // 3. Known Previous Semester core subjects, labs, or historical groups (5th/6th Sem)
  if (/\b(wta|mes|cvpr|fpm|dl:a&i|deep learning|software engineering|ad lab|algorithm lab|ecsc\s*6|dms_m)\b/i.test(combined)) {
    return {
      category: 'PREVIOUS_SEMESTER',
      recommendedActive: false,
      matchedSubjectCode: null,
      matchedSubjectName: null,
      confidence: 'HIGH',
      reason: 'Completed 5th/6th semester subject or lab',
    };
  }

  // 4. Tutor-Mentor Forum / Academic Mentorship
  if (/tutor_mentor|tutor mentor|mentorship|proctor/i.test(combined)) {
    return {
      category: 'CURRENT_SEMESTER',
      recommendedActive: true,
      matchedSubjectCode: 'MENTOR',
      matchedSubjectName: 'Tutor-Mentor Forum',
      confidence: 'HIGH',
      reason: 'Active Academic Mentorship Forum',
    };
  }

  // 5. Match Active 7th Semester Subjects
  // 5a. Core: Engineering Professional Practice (HS40001 / EX40003)
  if (/ex40003|hs40001|engineering professional practice|professional practice/i.test(combined) || combined.includes('7th semester')) {
    return {
      category: 'CURRENT_SEMESTER',
      recommendedActive: true,
      matchedSubjectCode: 'EX40003',
      matchedSubjectName: 'Engineering Professional Practice',
      confidence: 'HIGH',
      reason: '7th Semester Core Course (EX40003 / HS40001)',
    };
  }

  // 5b. Core: Training & Placement (TP40001)
  if (/tp40001|t&p|training & placement|placement/i.test(combined)) {
    return {
      category: 'CURRENT_SEMESTER',
      recommendedActive: true,
      matchedSubjectCode: 'TP40001',
      matchedSubjectName: 'Training & Placement',
      confidence: 'HIGH',
      reason: '7th Semester Training & Placement (TP40001)',
    };
  }

  // 5c. Core: Project-I (EC47001) / Minor (MN40001)
  if (/ec47001|project-i|project 1|minor project|mn40001/i.test(combined)) {
    return {
      category: 'CURRENT_SEMESTER',
      recommendedActive: true,
      matchedSubjectCode: 'EC47001',
      matchedSubjectName: 'Project-I / Minor',
      confidence: 'HIGH',
      reason: '7th Semester Project / Minor',
    };
  }

  // 5d. Match Student's Enrolled Elective (PE-IV)
  const elective = studentData?.currentSemesterSubjects?.find(s => s.isElective);
  if (elective) {
    const code = elective.code.toLowerCase();
    const short = (elective.shortName || '').toLowerCase();
    const elName = elective.name.toLowerCase();

    // Check SAT / ST&A / Software Testing
    if (code === 'cs40003' || short === 'st&a') {
      if (/\b(sat|st&a|software testing|automation|cs40003)\b/i.test(combined)) {
        return {
          category: 'CURRENT_SEMESTER',
          recommendedActive: true,
          matchedSubjectCode: elective.code,
          matchedSubjectName: elective.name,
          confidence: 'HIGH',
          reason: `Matches your 7th Sem Elective: ${elective.name} (${elective.code})`,
        };
      }
    }

    // Check HCI / CS40005
    if (code === 'cs40005' || short === 'hci') {
      if (/\b(hci|human computer interaction|cs40005)\b/i.test(combined)) {
        return {
          category: 'CURRENT_SEMESTER',
          recommendedActive: true,
          matchedSubjectCode: elective.code,
          matchedSubjectName: elective.name,
          confidence: 'HIGH',
          reason: `Matches your 7th Sem Elective: ${elective.name} (${elective.code})`,
        };
      }
    }

    // Check CNS / CS40015
    if (code === 'cs40015' || short === 'c&ns' || short === 'cns') {
      if (/\b(cns|c&ns|cryptography|network security|cs40015)\b/i.test(combined)) {
        return {
          category: 'CURRENT_SEMESTER',
          recommendedActive: true,
          matchedSubjectCode: elective.code,
          matchedSubjectName: elective.name,
          confidence: 'HIGH',
          reason: `Matches your 7th Sem Elective: ${elective.name} (${elective.code})`,
        };
      }
    }

    // Generic match against elective code or name
    if (combined.includes(code) || (short && combined.includes(short)) || combined.includes(elName)) {
      return {
        category: 'CURRENT_SEMESTER',
        recommendedActive: true,
        matchedSubjectCode: elective.code,
        matchedSubjectName: elective.name,
        confidence: 'HIGH',
        reason: `Matches your 7th Sem Elective: ${elective.name} (${elective.code})`,
      };
    }
  }

  // 6. Check other elective keywords if student elective not yet set or matched
  for (const [secKey, meta] of Object.entries(ELECTIVE_SECTION_MAP)) {
    const metaCode = meta.code.toLowerCase();
    const metaShort = meta.shortName.toLowerCase();
    const metaName = meta.name.toLowerCase();

    if (
      combined.includes(metaCode) ||
      combined.includes(metaShort) ||
      combined.includes(metaName) ||
      (metaCode === 'cs40003' && /\b(sat|st&a)\b/i.test(combined))
    ) {
      return {
        category: 'AMBIGUOUS',
        recommendedActive: false,
        matchedSubjectCode: meta.code,
        matchedSubjectName: meta.name,
        confidence: 'MEDIUM',
        reason: `Matches PE-IV Elective option: ${meta.name} (${meta.code}). Please confirm if you are enrolled in this section.`,
      };
    }
  }

  // 7. Check historical subjects from student transcript
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
          reason: `Completed in Semester ${h.semesterNumber || 'past'} (${h.code})`,
        };
      }
    }
  }

  // Fallback: Ambiguous
  return {
    category: 'AMBIGUOUS',
    recommendedActive: false,
    matchedSubjectCode: null,
    matchedSubjectName: null,
    confidence: 'LOW',
    reason: 'Unverified course - please confirm if this belongs to your current 7th semester.',
  };
}

export async function getClassroomData(userId: string) {
  const token = await getValidToken(userId);
  
  // Fetch hidden courses from the database
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

  // Fetch student profile & enrolled subjects for classification
  let studentData: StudentEnrolledSubjectsResult | null = null;
  try {
    studentData = await getStudentEnrolledSubjects(userId);
  } catch (err) {
    console.warn("Failed to resolve student enrolled subjects for classroom classification:", err);
  }

  const rawCourses = await fetchUserCourses(token);
  
  // Fetch assignments and student submissions in parallel for each course
  const coursesWithDetails = await Promise.all(
    rawCourses.map(async (course: any) => {
      const [assignments, submissions] = await Promise.all([
        fetchCourseWork(token, course.id),
        fetchStudentSubmissions(token, course.id)
      ]);

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

      // Classify course for current 7th semester
      const classification = classifyCourseForStudent(course, studentData);

      return {
        ...course,
        assignments: enrichedAssignments,
        stats: {
          total: totalAssignments,
          submitted: submittedAssignments,
          pending: pendingAssignments,
        },
        classification,
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

  return { 
    courses: coursesWithDetails,
    hiddenCourseIds,
    studentProfile: studentData?.student || null,
    enrolledSubjects: studentData?.currentSemesterSubjects || [],
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
    }
  };
}
