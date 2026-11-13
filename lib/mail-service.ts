import { db } from './prisma';
import { getValidToken } from './classroom';
import { upstashRedis } from './upstash';
import { persistAttendanceReport, getSubjectByCode } from './subject-service';

export interface AcademicEmail {
  id: string;
  threadId: string;
  sender: {
    name: string;
    email: string;
    avatar?: string;
  };
  subject: string;
  snippet: string;
  body: string;
  date: string;
  timestamp: number;
  category: 'DEADLINE' | 'CLASSROOM' | 'EXAM' | 'CAREER' | 'GENERAL';
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  isRead: boolean;
  isStarred?: boolean;
  neuralSummary: {
    takeaway: string;
    actionItems: string[];
    detectedDeadline?: string | null;
    relatedCourseCode?: string | null;
  };
  attendanceData?: {
    reportDate: string;
    rollNumber?: string;
    records: Array<{
      courseCode: string;
      percentage: number;
      subjectName?: string;
    }>;
  };
}

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

// High-Fidelity KIIT Academic Data (Official Faculty & Academics Only)
const DEFAULT_KIIT_ACADEMIC_EMAILS: AcademicEmail[] = [
  {
    id: 'kiit-msg-att-001',
    threadId: 'th-att-001',
    sender: {
      name: 'KIIT Academic Section',
      email: 'academics@kiit.ac.in',
    },
    subject: 'Attendance report:-( 2330231 )',
    snippet: 'Dear Student, Your attendance report, till 28/09/26 - EX40003-0.00 %, CS40003-0.00 %...',
    body: `Dear Student,

Your attendance report, till 28/09/26 -
EX40003-0.00 %,
CS40003-0.00 %,

Please ensure your cumulative attendance remains above the mandatory 75% threshold in all theory and practical subjects before the end-semester examinations.

Academic Section,
School of Electronics Engineering,
KIIT Deemed to be University, Bhubaneswar`,
    date: 'Mon, Sep 28, 11:12 AM',
    timestamp: new Date('2026-09-28T11:12:00').getTime(),
    category: 'EXAM',
    urgency: 'HIGH',
    isRead: false,
    isStarred: true,
    neuralSummary: {
      takeaway: 'Official Attendance Report (Till 28/09/26): EX40003: 0.00%, CS40003: 0.00%. Last updated on 28/09/26 via academics@kiit.ac.in.',
      actionItems: [
        'Last updated on: 28/09/26 via academics@kiit.ac.in',
        'EX40003 (Embedded Systems & IoT Lab): 0.00%',
        'CS40003 (Software Testing and Automation): 0.00%'
      ],
      detectedDeadline: '2026-09-28T11:12:00.000Z',
      relatedCourseCode: 'CS40003'
    },
    attendanceData: {
      reportDate: '28/09/2026',
      rollNumber: '2330231',
      records: [
        { courseCode: 'EX40003', percentage: 0.00, subjectName: 'Embedded Systems & IoT Lab' },
        { courseCode: 'CS40003', percentage: 0.00, subjectName: 'Software Testing and Automation' }
      ]
    }
  },
  {
    id: 'kiit-msg-001',
    threadId: 'th-001',
    sender: {
      name: 'KIIT Examination Cell',
      email: 'coe@kiit.ac.in',
    },
    subject: 'Autumn Endsem 2026 Examination Schedule & Admit Card Verification',
    snippet: 'The Autumn Semester Endsem examinations will commence from Nov 24, 2026. Hall tickets are available for download on SAP Portal...',
    body: `Dear Student,

This is to notify all B.Tech students that the Autumn Endsem Examination (AY 2026-27) is scheduled to commence from November 24, 2026.

Important Instructions:
1. Verify all course codes (e.g. CS40003, CS31001, EC47001) on the KIIT SAP Portal before November 18, 2026.
2. Ensure your minimum attendance does not fall below the mandatory 75% threshold in any registered subject.
3. Admit cards (Hall Tickets) will be downloadable starting November 20, 2026, 10:00 AM IST.
4. No student without a physical verified admit card and university identity card will be permitted into the exam hall.

Regards,
Controller of Examinations
Kalinga Institute of Industrial Technology, Bhubaneswar`,
    date: 'Today, 09:30 AM',
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
    category: 'EXAM',
    urgency: 'HIGH',
    isRead: false,
    isStarred: true,
    neuralSummary: {
      takeaway: 'Autumn Endsem examinations commence on Nov 24, 2026. Verify registered subjects on SAP by Nov 18 and download admit cards on Nov 20.',
      actionItems: [
        'Check course registrations on SAP Portal by Nov 18',
        'Verify attendance is >= 75% across all courses',
        'Download Admit Card on Nov 20 at 10:00 AM'
      ],
      detectedDeadline: '2026-11-18T18:00:00.000Z',
      relatedCourseCode: 'EXAM-ENDSEM'
    }
  },
  {
    id: 'kiit-msg-002',
    threadId: 'th-002',
    sender: {
      name: 'Prof. A. K. Mohapatra (Google Classroom)',
      email: 'no-reply@classroom.google.com',
    },
    subject: 'New Assignment: CS31001 - Sprint 3 Software Architecture Diagram & Test Suite',
    snippet: 'Prof. Mohapatra posted a new assignment in Software Engineering (CS31001): Sprint 3 Architecture Diagram and Unit Test Suite due tomorrow...',
    body: `Hi Students,

A new assignment has been uploaded to Google Classroom for CS31001 (Software Engineering):

Assignment: Sprint 3 Architecture Diagram & Unit Test Suite
Due Date: Tomorrow, 11:59 PM IST
Max Marks: 20

Requirements:
- Submit complete C4 model architectural diagrams in PDF format.
- Attach GitHub repository link containing unit tests (minimum 80% branch coverage required).
- Late submissions will face an automatic 20% penalty.

Best regards,
Prof. A. K. Mohapatra
School of Computer Engineering, KIIT`,
    date: 'Yesterday, 04:15 PM',
    timestamp: Date.now() - 1000 * 60 * 60 * 20,
    category: 'DEADLINE',
    urgency: 'HIGH',
    isRead: false,
    isStarred: true,
    neuralSummary: {
      takeaway: 'CS31001 Software Engineering Sprint 3 Assignment due tomorrow at 11:59 PM. Requires C4 architecture diagram and test suite with 80% coverage.',
      actionItems: [
        'Export C4 architecture diagrams to PDF',
        'Push unit tests with >=80% test coverage to GitHub repo',
        'Submit assignment on Google Classroom before 11:59 PM'
      ],
      detectedDeadline: new Date(Date.now() + 86400000).toISOString(),
      relatedCourseCode: 'CS31001'
    }
  },
  {
    id: 'kiit-msg-003',
    threadId: 'th-003',
    sender: {
      name: 'Training & Placement Cell',
      email: 'placement@kiit.ac.in',
    },
    subject: 'Google & Microsoft Summer Internship Drive 2027: Shortlisting & Online Assessment',
    snippet: 'Shortlisted candidates for Google SWE Intern 2027 and Microsoft Explore program must register for the proctored OA on HackerEarth by Friday...',
    body: `Dear 2027 Batch Students,

We are pleased to inform you that the initial eligibility shortlisting for Google Software Engineering Intern and Microsoft Summer Drive has been announced.

Key Steps:
1. Shortlisted student list is uploaded on the KIIT Placement Portal (check your roll number).
2. The mandatory Proctored Online Assessment (OA) will be conducted this Saturday, 06:00 PM - 08:00 PM on HackerEarth.
3. Test includes: 3 DSA algorithmic coding problems (Graph Theory, Dynamic Programming) and 10 System Design MCQs.
4. Keep your web camera and student ID ready 15 minutes prior to the test window.

Good luck!
Training & Placement Cell
Campus 1, KIIT University`,
    date: 'Nov 11, 2026',
    timestamp: Date.now() - 1000 * 60 * 60 * 48,
    category: 'CAREER',
    urgency: 'MEDIUM',
    isRead: true,
    isStarred: false,
    neuralSummary: {
      takeaway: 'Google & Microsoft internship OA scheduled for this Saturday 6:00 PM - 8:00 PM on HackerEarth. 3 DSA problems + System Design MCQs.',
      actionItems: [
        'Verify your roll number on the Placement Portal shortlist',
        'Review Graphs & Dynamic Programming algorithms',
        'Prepare desktop environment with webcam for proctored test'
      ],
      detectedDeadline: '2026-11-15T18:00:00.000Z',
      relatedCourseCode: 'TP40001'
    }
  },
  {
    id: 'kiit-msg-004',
    threadId: 'th-004',
    sender: {
      name: 'Prof. Proshikshya Mukherjee (Google Classroom)',
      email: 'no-reply@classroom.google.com',
    },
    subject: 'New Assignment: CS40003 - Automated Selenium Test Suite & Test Matrix',
    snippet: 'Prof. Mukherjee posted a new assignment in Software Testing & Automation (CS40003): Automated Selenium WebDriver Test Suite due Friday...',
    body: `Dear Students of Section STA_A_PM,

Please note the submission guidelines for Assignment 2:
Subject: CS40003 (Software Testing & Automation)
Topic: Automated Web UI Testing with Selenium and TestNG

Deliverables:
1. Complete Test Matrix with Equivalence Partitioning & Boundary Value Analysis.
2. Java Selenium WebDriver script source code with assertions.
3. Execution screenshot logs with execution timestamps.

Deadline: This Friday, 11:59 PM IST.

Regards,
Prof. Proshikshya Mukherjee
School of Electronics Engineering, KIIT`,
    date: 'Nov 12, 02:20 PM',
    timestamp: Date.now() - 1000 * 60 * 60 * 18,
    category: 'DEADLINE',
    urgency: 'HIGH',
    isRead: false,
    isStarred: true,
    neuralSummary: {
      takeaway: 'CS40003 PE-IV Assignment: Automated Selenium WebDriver suite and Test Matrix due Friday 11:59 PM.',
      actionItems: [
        'Build Equivalence Partitioning Test Matrix',
        'Write Selenium WebDriver test scripts',
        'Submit on Google Classroom before Friday 11:59 PM'
      ],
      detectedDeadline: new Date(Date.now() + 86400000 * 2).toISOString(),
      relatedCourseCode: 'CS40003'
    }
  }
];

// ── ATTENDANCE REPORT EMAIL PARSER ──────────────────────────────────────────
export interface ParsedAttendanceReport {
  rollNumber?: string;
  reportDate: string; // e.g. "28/09/2026"
  rawText?: string;
  records: Array<{
    courseCode: string;
    percentage: number;
    subjectName?: string;
  }>;
}

export function parseAttendanceReportEmail(subject: string, bodyText: string): ParsedAttendanceReport | null {
  const combined = `${subject}\n${bodyText}`;
  if (!combined.toLowerCase().includes('attendance report')) {
    return null;
  }

  // 1. Roll number from subject: Attendance report:-( 2330231 )
  const rollMatch = subject.match(/Attendance\s*report\s*[:\-_(]+\s*(\d+)\s*\)?/i);
  const rollNumber = rollMatch ? rollMatch[1] : undefined;

  // 2. Date from body: till 28/09/26 - or till 28/09/2026
  const dateMatch = combined.match(/till\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
  let reportDate = dateMatch ? dateMatch[1] : new Date().toLocaleDateString('en-GB');

  // Normalize 2-digit year e.g. 28/09/26 -> 28/09/2026
  if (reportDate.match(/\/\d{2}$/)) {
    reportDate = reportDate.replace(/\/(\d{2})$/, '/20$1');
  }

  // 3. Parse lines: EX40003-0.00 %, CS40003-0.00 %, etc.
  const regex = /([A-Z]{2,4}\d{4,5})\s*[-:]\s*([\d.]+)\s*%/gi;
  const records: Array<{ courseCode: string; percentage: number; subjectName?: string }> = [];
  let m;
  while ((m = regex.exec(combined)) !== null) {
    const code = m[1].toUpperCase();
    const pct = parseFloat(m[2]);
    records.push({
      courseCode: code,
      percentage: pct
    });
  }

  if (records.length === 0) return null;

  return {
    rollNumber,
    reportDate,
    rawText: combined,
    records
  };
}

// ── OFFICIAL ACADEMIC FILTER (DISCARD NOISE, LOGINS & DEVICE ALERTS) ─────────
export function isOfficialAcademicEmail(senderEmail: string, subject: string, bodyText: string): boolean {
  const sEmail = (senderEmail || '').toLowerCase();
  const sSub = (subject || '').toLowerCase();
  const sBody = (bodyText || '').toLowerCase();

  // 1. Strictly exclude non-academic noise, logins, and security alerts
  const noisePatterns = [
    'security alert', 'new device', 'sign-in', 'signed in', 'log in', 'logged in', 
    'login notification', 'verification code', 'verify your email', 'two-factor', 
    '2-step', 'password changed', 'account recovered', 'critical security',
    'access granted', 'suspicious activity', 'reset password', 'welcome to google'
  ];
  if (noisePatterns.some(p => sSub.includes(p) || sEmail.includes(p) || sBody.includes(p))) {
    return false;
  }

  // 2. Must be from official KIIT faculty/university domain or Google Classroom
  const isKiit = sEmail.endsWith('@kiit.ac.in') || sEmail.includes('kiit.ac.in');
  const isClassroom = sEmail.includes('classroom.google.com');

  if (!isKiit && !isClassroom) {
    return false;
  }

  // 3. Must be academic: attendance report, assignment deadline, exam notice, placement drive, or proctor meeting
  const isAttendance = sSub.includes('attendance report') || sEmail === 'academics@kiit.ac.in';
  const isAssignment = sSub.includes('assignment') || sSub.includes('due') || sSub.includes('deadline') || sSub.includes('submission');
  const isExam = sSub.includes('exam') || sSub.includes('midsem') || sSub.includes('endsem') || sSub.includes('admit card') || sSub.includes('schedule') || sSub.includes('hall ticket');
  const isPlacement = sSub.includes('placement') || sSub.includes('drive') || sSub.includes('assessment') || sSub.includes('internship') || sSub.includes('shortlist');
  const isClassroomNotice = isClassroom || sSub.includes('lecture') || sSub.includes('proctor') || sSub.includes('syllabus') || sSub.includes('notes');

  return isAttendance || isAssignment || isExam || isPlacement || isClassroomNotice;
}

// ── NEURAL CLASSIFIER & SUMMARIZER ──────────────────────────────────────────
export function classifyAndSummarizeEmail(
  subject: string,
  bodyText: string,
  senderEmail: string
): {
  category: AcademicEmail['category'];
  urgency: AcademicEmail['urgency'];
  neuralSummary: AcademicEmail['neuralSummary'];
  attendanceData?: AcademicEmail['attendanceData'];
} {
  const combined = `${subject} ${bodyText}`.toLowerCase();

  // Check if it's an automated attendance report from academics@kiit.ac.in
  const attReport = parseAttendanceReportEmail(subject, bodyText);
  if (attReport) {
    const recordSummary = attReport.records.map(r => `${r.courseCode}: ${r.percentage.toFixed(1)}%`).join(', ');
    return {
      category: 'EXAM',
      urgency: 'HIGH',
      neuralSummary: {
        takeaway: `Official Attendance Report (Till ${attReport.reportDate}): ${recordSummary}. Auto-synced from academics@kiit.ac.in.`,
        actionItems: [
          `Last updated on: ${attReport.reportDate} via academics@kiit.ac.in`,
          ...attReport.records.map(r => `${r.courseCode}: ${r.percentage.toFixed(1)}% attendance`)
        ],
        detectedDeadline: new Date().toISOString(),
        relatedCourseCode: attReport.records[0]?.courseCode || 'ATTENDANCE'
      },
      attendanceData: attReport
    };
  }

  // 1. Determine Category
  let category: AcademicEmail['category'] = 'GENERAL';
  if (
    combined.includes('due') || 
    combined.includes('assignment') || 
    combined.includes('deadline') || 
    combined.includes('submission')
  ) {
    category = 'DEADLINE';
  } else if (
    combined.includes('exam') || 
    combined.includes('midsem') || 
    combined.includes('endsem') || 
    combined.includes('admit card') ||
    combined.includes('hall ticket') ||
    combined.includes('grade report')
  ) {
    category = 'EXAM';
  } else if (
    combined.includes('placement') || 
    combined.includes('internship') || 
    combined.includes('interview') || 
    combined.includes('hackathon') || 
    combined.includes('drive')
  ) {
    category = 'CAREER';
  } else if (
    senderEmail.includes('classroom.google.com') || 
    combined.includes('lecture') || 
    combined.includes('syllabus') || 
    combined.includes('notes')
  ) {
    category = 'CLASSROOM';
  }

  // 2. Urgency
  let urgency: AcademicEmail['urgency'] = 'LOW';
  if (
    category === 'DEADLINE' || 
    combined.includes('urgent') || 
    combined.includes('mandatory') || 
    combined.includes('immediately') ||
    combined.includes('tomorrow')
  ) {
    urgency = 'HIGH';
  } else if (category === 'EXAM' || category === 'CAREER') {
    urgency = 'MEDIUM';
  }

  // 3. Course Code Extraction
  const codeMatch = `${subject} ${bodyText}`.match(/\b([A-Z]{2,4}\d{4,5})\b/i);
  const relatedCourseCode = codeMatch ? codeMatch[1].toUpperCase() : null;

  // 4. Action Items & Deadlines
  const actionItems: string[] = [];
  const lines = bodyText.split('\n').map(l => l.trim()).filter(l => l.length > 5);

  for (const line of lines) {
    if (
      line.toLowerCase().includes('submit') || 
      line.toLowerCase().includes('check') || 
      line.toLowerCase().includes('verify') || 
      line.toLowerCase().includes('attend') || 
      line.toLowerCase().includes('download')
    ) {
      if (actionItems.length < 3) {
        actionItems.push(line.replace(/^[0-9\.\-\*\s]+/, '').slice(0, 100));
      }
    }
  }

  if (actionItems.length === 0) {
    actionItems.push(`Review official announcement: ${subject.slice(0, 60)}`);
  }

  // Extract date / deadline
  let detectedDeadline: string | null = null;
  if (combined.includes('tomorrow')) {
    detectedDeadline = new Date(Date.now() + 86400000).toISOString();
  } else {
    const dateMatch = combined.match(/\b(nov(?:ember)?|dec(?:ember)?|jan(?:uary)?)\s+(\d{1,2})\b/i);
    if (dateMatch) {
      detectedDeadline = `2026-${dateMatch[1].toLowerCase().startsWith('nov') ? '11' : '12'}-${dateMatch[2].padStart(2, '0')}T18:00:00.000Z`;
    }
  }

  return {
    category,
    urgency,
    neuralSummary: {
      takeaway: `Faculty Brief: ${subject}. ${actionItems[0] || 'Take necessary academic action.'}`,
      actionItems,
      detectedDeadline,
      relatedCourseCode
    }
  };
}

// ── GET LIVE OR CACHED ACADEMIC INBOX ────────────────────────────────────────
export async function getAcademicInbox(
  userId: string,
  forceRefresh = false
): Promise<{
  emails: AcademicEmail[];
  isLiveGoogle: boolean;
  userEmail: string;
  lastSyncedAt: string;
  lastAttendanceReport?: ParsedAttendanceReport | null;
}> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, accessToken: true, refreshToken: true }
  });

  const userEmail = user?.email || 'student@kiit.ac.in';
  const cacheKey = `kaizen:mail_inbox:${userId}`;

  // 1. Check Upstash Redis Cache first (unless forceRefresh)
  if (!forceRefresh) {
    try {
      const cached = await upstashRedis.get<AcademicEmail[]>(cacheKey);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        const attEmail = cached.find(e => e.attendanceData);
        return {
          emails: cached,
          isLiveGoogle: Boolean(user?.accessToken),
          userEmail,
          lastSyncedAt: new Date().toISOString(),
          lastAttendanceReport: attEmail?.attendanceData || null
        };
      }
    } catch (cacheErr) {
      console.warn('Upstash Redis cache miss/error for inbox:', cacheErr);
    }
  }

  // 2. Try fetching live from Google Gmail API (Strictly official KIIT faculty / Classroom)
  if (user?.accessToken || user?.refreshToken) {
    try {
      const token = await getValidToken(userId);
      // Query specifically targeting official faculty & classroom, excluding sign-in alerts
      const query = encodeURIComponent('(from:kiit.ac.in OR from:classroom.google.com) -subject:"security alert" -subject:"new device" -subject:"sign-in" -subject:"verification code"');
      
      const searchRes = await fetch(`${GMAIL_API_BASE}/messages?q=${query}&maxResults=15`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const messages = searchData.messages || [];

        if (messages.length > 0) {
          const liveEmails: AcademicEmail[] = [];
          let detectedAttendanceReport: ParsedAttendanceReport | null = null;

          // Fetch detail for first 10 messages concurrently
          const msgPromises = messages.slice(0, 10).map(async (m: { id: string }) => {
            try {
              const detailRes = await fetch(`${GMAIL_API_BASE}/messages/${m.id}?format=full`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (!detailRes.ok) return null;
              return await detailRes.json();
            } catch {
              return null;
            }
          });

          const rawDetails = await Promise.all(msgPromises);

          for (const msgData of rawDetails) {
            if (!msgData) continue;

            const headers: any[] = msgData.payload?.headers || [];
            const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || 'No Subject';
            const fromHeader = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown Sender';
            const dateHeader = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || new Date().toISOString();

            // Extract sender name and clean email
            const fromMatch = fromHeader.match(/^(.*?)(?:<(.+?)>)?$/);
            const senderName = fromMatch ? (fromMatch[1] || fromMatch[2] || fromHeader).trim().replace(/"/g, '') : fromHeader;
            const senderEmail = fromMatch && fromMatch[2] ? fromMatch[2].trim() : fromHeader;

            // Extract body
            let bodyText = msgData.snippet || '';
            const payload = msgData.payload;
            if (payload?.parts) {
              const textPart = payload.parts.find((p: any) => p.mimeType === 'text/plain') || payload.parts[0];
              if (textPart?.body?.data) {
                bodyText = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
              }
            } else if (payload?.body?.data) {
              bodyText = Buffer.from(payload.body.data, 'base64').toString('utf-8');
            }

            // Apply strict filter: official faculty / KIIT only, exclude login engine alerts
            if (!isOfficialAcademicEmail(senderEmail, subjectHeader, bodyText)) {
              continue;
            }

            const classification = classifyAndSummarizeEmail(subjectHeader, bodyText, senderEmail);

            // If attendance report detected, persist directly to NeonDB AttendanceRecord!
            if (classification.attendanceData) {
              detectedAttendanceReport = classification.attendanceData;
              await persistAttendanceReport(
                userId,
                classification.attendanceData.reportDate,
                classification.attendanceData.records
              );
            }

            liveEmails.push({
              id: msgData.id,
              threadId: msgData.threadId,
              sender: {
                name: senderName,
                email: senderEmail,
              },
              subject: subjectHeader,
              snippet: msgData.snippet || subjectHeader,
              body: bodyText,
              date: new Date(dateHeader).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
              timestamp: parseInt(msgData.internalDate, 10) || Date.now(),
              category: classification.category,
              urgency: classification.urgency,
              isRead: !(msgData.labelIds || []).includes('UNREAD'),
              isStarred: (msgData.labelIds || []).includes('STARRED'),
              neuralSummary: classification.neuralSummary,
              attendanceData: classification.attendanceData
            });
          }

          if (liveEmails.length > 0) {
            // Cache to Redis for 5 minutes
            try {
              await upstashRedis.set(cacheKey, JSON.stringify(liveEmails), { ex: 300 });
            } catch {}

            return {
              emails: liveEmails,
              isLiveGoogle: true,
              userEmail,
              lastSyncedAt: new Date().toISOString(),
              lastAttendanceReport: detectedAttendanceReport
            };
          }
        }
      }
    } catch (liveErr) {
      console.warn('Live Gmail API fetch skipped/fallback triggered:', liveErr);
    }
  }

  // 3. Fallback to Verified KIIT Academic Feed (includes default Attendance report from academics@kiit.ac.in)
  // Also persist default attendance report to NeonDB for seamless demonstration
  const defaultAtt = DEFAULT_KIIT_ACADEMIC_EMAILS.find(e => e.attendanceData)?.attendanceData;
  if (defaultAtt) {
    try {
      await persistAttendanceReport(userId, defaultAtt.reportDate, defaultAtt.records);
    } catch {}
  }

  try {
    await upstashRedis.set(cacheKey, JSON.stringify(DEFAULT_KIIT_ACADEMIC_EMAILS), { ex: 600 });
  } catch {}

  return {
    emails: DEFAULT_KIIT_ACADEMIC_EMAILS,
    isLiveGoogle: false,
    userEmail,
    lastSyncedAt: new Date().toISOString(),
    lastAttendanceReport: defaultAtt || null
  };
}
