import { db } from "@/lib/prisma";

export interface FacultyMember {
  id: string;
  name: string;
  designation: string;
  department: string;
  email: string;
  domain: string;
  maxActiveGroups: number; // strictly 3
  isCoordinator?: boolean;
}

export const KIIT_FACULTY_POOL: FacultyMember[] = [
  {
    id: "fic-akray",
    name: "Dr. A. K. Ray",
    designation: "Professor & School Project Coordinator",
    department: "School of Electronics Engineering",
    email: "akray@kiit.ac.in",
    domain: "Computer Vision, Edge AI & Deep Learning Architectures",
    maxActiveGroups: 3,
    isCoordinator: true,
  },
  {
    id: "fic-sksabut",
    name: "Dr. S. K. Sabut",
    designation: "Professor & FIC (Biomedical Systems)",
    department: "School of Electronics Engineering",
    email: "sksabut@kiit.ac.in",
    domain: "Biomedical Signal Processing & AI Health Diagnostics",
    maxActiveGroups: 3,
  },
  {
    id: "fic-mdas",
    name: "Prof. Manoranjan Das",
    designation: "Associate Professor & FIC (VLSI)",
    department: "School of Electronics Engineering",
    email: "mdas@kiit.ac.in",
    domain: "VLSI Design, FPGA Acceleration & Digital CMOS Systems",
    maxActiveGroups: 3,
  },
  {
    id: "fic-bsgouda",
    name: "Dr. Bhabani Sankar Gouda",
    designation: "Assistant Professor & FIC (Embedded Systems)",
    department: "School of Electronics Engineering",
    email: "bsgouda@kiit.ac.in",
    domain: "Cyber-Physical Systems, Embedded IoT & Smart Sensor Networks",
    maxActiveGroups: 3,
  },
  {
    id: "fic-djena",
    name: "Dr. Debashis Jena",
    designation: "Associate Professor & FIC (Security)",
    department: "School of Electronics Engineering",
    email: "djena@kiit.ac.in",
    domain: "Cyber Security, Quantum Cryptography & Trust Computing",
    maxActiveGroups: 3,
  },
  {
    id: "fic-abasak",
    name: "Dr. Arindam Basak",
    designation: "Associate Professor & FIC (Cloud & Distributed)",
    department: "School of Electronics Engineering",
    email: "abasak@kiit.ac.in",
    domain: "Distributed Cloud Architecture, DevOps & Microservices",
    maxActiveGroups: 3,
  },
  {
    id: "fic-skumar",
    name: "Dr. Suman Kumar",
    designation: "Associate Professor & FIC (Robotics)",
    department: "School of Electronics Engineering",
    email: "skumar@kiit.ac.in",
    domain: "Autonomous Robotics, Motion Planning & UAV Navigation",
    maxActiveGroups: 3,
  },
  {
    id: "fic-sdas",
    name: "Dr. Suchismita Das",
    designation: "Assistant Professor & FIC (Data Systems)",
    department: "School of Electronics Engineering",
    email: "sdas@kiit.ac.in",
    domain: "Intelligent Web Architectures, LLM Systems & Knowledge Graphs",
    maxActiveGroups: 3,
  },
];

let isProjectSchemaInitialized = false;

/**
 * Initializes PostgreSQL tables safely with CREATE TABLE IF NOT EXISTS
 */
export async function ensureProjectTables() {
  if (isProjectSchemaInitialized) return;
  try {
    // 1. ProjectGroup
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ProjectGroup" (
        "id" TEXT PRIMARY KEY,
        "title" TEXT NOT NULL,
        "domain" TEXT NOT NULL,
        "projectType" TEXT NOT NULL DEFAULT 'MAJOR',
        "semester" INTEGER NOT NULL DEFAULT 7,
        "academicYear" TEXT DEFAULT '2026-27',
        "abstract" TEXT,
        "status" TEXT NOT NULL DEFAULT 'FORMING',
        "leaderId" TEXT NOT NULL,
        "leaderRoll" TEXT NOT NULL,
        "leaderName" TEXT NOT NULL,
        "ficId" TEXT,
        "ficName" TEXT,
        "ficEmail" TEXT,
        "panelId" TEXT,
        "githubRepo" TEXT,
        "whatsappLink" TEXT,
        "isLocked" BOOLEAN DEFAULT FALSE,
        "lockedAt" TIMESTAMP WITH TIME ZONE,
        "allottedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 2. ProjectMember (2-4 students per group)
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ProjectMember" (
        "id" TEXT PRIMARY KEY,
        "groupId" TEXT NOT NULL,
        "userId" TEXT,
        "rollNo" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'MEMBER',
        "section" TEXT,
        "branch" TEXT,
        "semester" INTEGER DEFAULT 7,
        "joinedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 3. ProjectFicRequest (max 3 active pending per group, 3-day expiry)
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ProjectFicRequest" (
        "id" TEXT PRIMARY KEY,
        "groupId" TEXT NOT NULL,
        "ficId" TEXT NOT NULL,
        "ficName" TEXT NOT NULL,
        "ficEmail" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "requestMessage" TEXT,
        "sentAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "respondedAt" TIMESTAMP WITH TIME ZONE
      );
    `);

    // 4. ProjectMessage (Chatroom for 5 participants + attachments)
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ProjectMessage" (
        "id" TEXT PRIMARY KEY,
        "groupId" TEXT NOT NULL,
        "senderId" TEXT NOT NULL,
        "senderName" TEXT NOT NULL,
        "senderRole" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "attachmentUrl" TEXT,
        "attachmentName" TEXT,
        "attachmentType" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 5. ProjectMom (Minutes of Meeting)
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ProjectMom" (
        "id" TEXT PRIMARY KEY,
        "groupId" TEXT NOT NULL,
        "meetDate" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "agenda" TEXT NOT NULL,
        "discussion" TEXT NOT NULL,
        "actionItems" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "attendees" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "ficSigned" BOOLEAN DEFAULT FALSE,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 6. ProjectRecruitmentPost (Teammate Finder board)
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ProjectRecruitmentPost" (
        "id" TEXT PRIMARY KEY,
        "groupId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "domain" TEXT NOT NULL,
        "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "openSlots" INTEGER DEFAULT 2,
        "contactEmail" TEXT,
        "status" TEXT DEFAULT 'OPEN',
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 7. ProjectJoinRequest
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ProjectJoinRequest" (
        "id" TEXT PRIMARY KEY,
        "groupId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "rollNo" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "skills" TEXT,
        "status" TEXT DEFAULT 'PENDING',
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 8. ProjectPanel (3 to 4 Evaluation Panels)
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ProjectPanel" (
        "id" TEXT PRIMARY KEY,
        "panelNumber" INTEGER NOT NULL,
        "name" TEXT NOT NULL,
        "domain" TEXT NOT NULL,
        "coordinatorId" TEXT,
        "coordinatorName" TEXT,
        "examiners" JSONB NOT NULL DEFAULT '[]'::JSONB,
        "assignedGroupIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "scheduledDate" TEXT,
        "venue" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 9. ProjectGrade (40 marks Internal FIC + 60 marks External Panel = 100)
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ProjectGrade" (
        "id" TEXT PRIMARY KEY,
        "groupId" TEXT NOT NULL,
        "studentRoll" TEXT NOT NULL,
        "studentName" TEXT NOT NULL,
        "internalFicMarks" DOUBLE PRECISION DEFAULT 0,
        "internalBreakdown" JSONB DEFAULT '{"regularity": 10, "mom": 10, "implementation": 10, "report": 10}'::JSONB,
        "panelMarks" DOUBLE PRECISION DEFAULT 0,
        "panelBreakdown" JSONB DEFAULT '{"problemFormulation": 15, "architecture": 15, "demo": 15, "viva": 15}'::JSONB,
        "totalMarks" DOUBLE PRECISION DEFAULT 0,
        "gradeLetter" TEXT DEFAULT 'O',
        "remarks" TEXT,
        "evaluatedByFic" TEXT,
        "evaluatedByPanel" TEXT,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Ensure default panels exist (3-4 evaluation panels planned by Coordinator)
    await initializeDefaultPanels();

    isProjectSchemaInitialized = true;
  } catch (error) {
    console.error("ensureProjectTables error:", error);
  }
}

/**
 * Initializes the 4 official evaluation panels planned by the Project Coordinator
 */
async function initializeDefaultPanels() {
  try {
    const existingPanels = await db.$queryRaw<any[]>`SELECT id FROM "ProjectPanel" LIMIT 1`;
    if (existingPanels && existingPanels.length > 0) return;

    const panels = [
      {
        id: "panel-01",
        panelNumber: 1,
        name: "Evaluation Panel 1: Artificial Intelligence & Edge Systems",
        domain: "AI/ML, Deep Learning, Edge Computing & Computer Vision",
        coordinatorId: "fic-akray",
        coordinatorName: "Dr. A. K. Ray",
        examiners: JSON.stringify([
          { id: "fic-akray", name: "Dr. A. K. Ray", designation: "Professor (Coordinator)" },
          { id: "fic-sdas", name: "Dr. Suchismita Das", designation: "Assistant Professor" },
        ]),
        venue: "Lab 304, Campus 15",
        scheduledDate: "2026-12-10 10:00 AM",
      },
      {
        id: "panel-02",
        panelNumber: 2,
        name: "Evaluation Panel 2: Embedded IoT & Cyber-Physical Systems",
        domain: "IoT, Sensors, Cyber-Physical Hardware & Robotics",
        coordinatorId: "fic-akray",
        coordinatorName: "Dr. A. K. Ray",
        examiners: JSON.stringify([
          { id: "fic-bsgouda", name: "Dr. Bhabani Sankar Gouda", designation: "Assistant Professor" },
          { id: "fic-skumar", name: "Dr. Suman Kumar", designation: "Associate Professor" },
        ]),
        venue: "Embedded Systems Lab, Campus 15",
        scheduledDate: "2026-12-11 10:00 AM",
      },
      {
        id: "panel-03",
        panelNumber: 3,
        name: "Evaluation Panel 3: VLSI, Microelectronics & Signal Processing",
        domain: "VLSI, ASIC, FPGA & Biomedical Instrumentation",
        coordinatorId: "fic-akray",
        coordinatorName: "Dr. A. K. Ray",
        examiners: JSON.stringify([
          { id: "fic-mdas", name: "Prof. Manoranjan Das", designation: "Associate Professor" },
          { id: "fic-sksabut", name: "Dr. S. K. Sabut", designation: "Professor" },
        ]),
        venue: "VLSI CAD Lab, Campus 15",
        scheduledDate: "2026-12-12 10:00 AM",
      },
      {
        id: "panel-04",
        panelNumber: 4,
        name: "Evaluation Panel 4: Cyber Security, Networks & Distributed Systems",
        domain: "Cloud Networks, Cryptography, Blockchain & Distributed Computing",
        coordinatorId: "fic-akray",
        coordinatorName: "Dr. A. K. Ray",
        examiners: JSON.stringify([
          { id: "fic-djena", name: "Dr. Debashis Jena", designation: "Associate Professor" },
          { id: "fic-abasak", name: "Dr. Arindam Basak", designation: "Associate Professor" },
        ]),
        venue: "Network Security Lab, Campus 15",
        scheduledDate: "2026-12-14 10:00 AM",
      },
    ];

    for (const p of panels) {
      await db.$executeRawUnsafe(`
        INSERT INTO "ProjectPanel" 
        ("id", "panelNumber", "name", "domain", "coordinatorId", "coordinatorName", "examiners", "venue", "scheduledDate")
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)
        ON CONFLICT ("id") DO NOTHING;
      `, p.id, p.panelNumber, p.name, p.domain, p.coordinatorId, p.coordinatorName, p.examiners, p.venue, p.scheduledDate);
    }
  } catch (e) {
    console.warn("Panel init warning:", e);
  }
}

/**
 * Auto-expires any FIC requests older than 3 days (72 hours)
 */
export async function expireOverdueFicRequests() {
  try {
    await db.$executeRawUnsafe(`
      UPDATE "ProjectFicRequest"
      SET "status" = 'EXPIRED'
      WHERE "status" = 'PENDING' AND "expiresAt" < NOW();
    `);
  } catch (e) {
    console.warn("Auto-expiry warning:", e);
  }
}

/**
 * Returns faculty pool with dynamic active supervised group count (Max 3)
 */
export async function getFacultyPoolWithQuotas(): Promise<Array<FacultyMember & { activeSupervisedCount: number; isCapacityFull: boolean }>> {
  await ensureProjectTables();
  await expireOverdueFicRequests();

  try {
    const counts = await db.$queryRaw<any[]>`
      SELECT "ficId", COUNT(*)::int as count 
      FROM "ProjectGroup" 
      WHERE "ficId" IS NOT NULL AND "status" IN ('ALLOTTED', 'UNDER_EVALUATION', 'COMPLETED')
      GROUP BY "ficId";
    `;

    const countMap: Record<string, number> = {};
    for (const c of counts) {
      if (c.ficId) countMap[c.ficId] = Number(c.count);
    }

    return KIIT_FACULTY_POOL.map((fic) => {
      const activeCount = countMap[fic.id] || 0;
      return {
        ...fic,
        activeSupervisedCount: activeCount,
        isCapacityFull: activeCount >= fic.maxActiveGroups,
      };
    });
  } catch (error) {
    console.error("getFacultyPoolWithQuotas error:", error);
    return KIIT_FACULTY_POOL.map((fic) => ({
      ...fic,
      activeSupervisedCount: 0,
      isCapacityFull: false,
    }));
  }
}

/**
 * Retrieves the project group for a given student (either as Leader or Member)
 */
export async function getStudentProjectGroup(userId?: string, rollNo?: string) {
  await ensureProjectTables();
  await expireOverdueFicRequests();

  if (!userId && !rollNo) return null;

  try {
    // 1. Find if student is in ProjectMember
    let memberRows: any[] = [];
    if (rollNo && rollNo !== 'N/A') {
      memberRows = await db.$queryRaw<any[]>`
        SELECT "groupId" FROM "ProjectMember" 
        WHERE "rollNo" = ${rollNo}
        LIMIT 1;
      `;
    }

    if (memberRows.length === 0 && userId) {
      memberRows = await db.$queryRaw<any[]>`
        SELECT "groupId" FROM "ProjectMember" 
        WHERE "userId" = ${userId}
        LIMIT 1;
      `;
    }

    if (memberRows.length === 0) return null;
    const groupId = memberRows[0].groupId;

    // 2. Fetch Group
    const groupRows = await db.$queryRaw<any[]>`
      SELECT * FROM "ProjectGroup" WHERE "id" = ${groupId} LIMIT 1;
    `;
    if (groupRows.length === 0) return null;
    const group = groupRows[0];

    // 3. Fetch Members
    const members = await db.$queryRaw<any[]>`
      SELECT * FROM "ProjectMember" WHERE "groupId" = ${groupId} ORDER BY "joinedAt" ASC;
    `;

    // 4. Fetch Active & Recent FIC Requests
    const ficRequests = await db.$queryRaw<any[]>`
      SELECT *, 
        ROUND(EXTRACT(EPOCH FROM ("expiresAt" - NOW())) / 3600)::int as "hoursRemaining"
      FROM "ProjectFicRequest" 
      WHERE "groupId" = ${groupId}
      ORDER BY "sentAt" DESC;
    `;

    // 5. Fetch MOMs
    const moms = await db.$queryRaw<any[]>`
      SELECT * FROM "ProjectMom" WHERE "groupId" = ${groupId} ORDER BY "meetDate" DESC;
    `;

    // 6. Fetch Assigned Panel
    let panel: any = null;
    if (group.panelId) {
      const pRows = await db.$queryRaw<any[]>`
        SELECT * FROM "ProjectPanel" WHERE "id" = ${group.panelId} LIMIT 1;
      `;
      if (pRows.length > 0) panel = pRows[0];
    }

    // 7. Fetch Grades
    const grades = await db.$queryRaw<any[]>`
      SELECT * FROM "ProjectGrade" WHERE "groupId" = ${groupId};
    `;

    return {
      group,
      members,
      ficRequests,
      moms,
      panel,
      grades,
    };
  } catch (error) {
    console.error("getStudentProjectGroup error:", error);
    return null;
  }
}

/**
 * Creates a new project group with the creator as Leader
 */
export async function createProjectGroup(data: {
  title: string;
  domain: string;
  projectType: 'MINOR' | 'MAJOR';
  semester: number;
  abstract?: string;
  leaderId: string;
  leaderRoll: string;
  leaderName: string;
  leaderEmail: string;
  section?: string;
  branch?: string;
}) {
  await ensureProjectTables();

  const groupId = `proj-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const memberId = `mem-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

  await db.$executeRawUnsafe(`
    INSERT INTO "ProjectGroup" (
      "id", "title", "domain", "projectType", "semester", "abstract",
      "status", "leaderId", "leaderRoll", "leaderName", "isLocked", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, 'FORMING', $7, $8, $9, FALSE, NOW(), NOW());
  `, groupId, data.title, data.domain, data.projectType, data.semester, data.abstract || null, data.leaderId, data.leaderRoll, data.leaderName);

  await db.$executeRawUnsafe(`
    INSERT INTO "ProjectMember" (
      "id", "groupId", "userId", "rollNo", "name", "email", "role", "section", "branch", "semester", "joinedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, 'LEADER', $7, $8, $9, NOW());
  `, memberId, groupId, data.leaderId, data.leaderRoll, data.leaderName, data.leaderEmail, data.section || 'ECS GROUP-03', data.branch || 'E&CSc', data.semester);

  return groupId;
}

/**
 * Searches students by Roll Number or Name in StudentDirectory and User
 */
export async function searchStudentsByRollOrName(query: string) {
  if (!query || query.trim().length < 2) return [];
  const clean = `%${query.trim()}%`;

  try {
    // 1. Search StudentDirectory
    const directory = await db.$queryRaw<any[]>`
      SELECT "rollNo", "name", "section", "program"
      FROM "StudentDirectory"
      WHERE "rollNo" ILIKE ${clean} OR "name" ILIKE ${clean}
      LIMIT 8;
    `;

    return directory.map((d) => ({
      rollNo: d.rollNo,
      name: d.name,
      section: d.section || 'ECS GROUP-03',
      program: d.program || 'B.Tech in Electronics Engineering',
      email: `${d.rollNo}@kiit.ac.in`,
    }));
  } catch (error) {
    console.warn("searchStudents error:", error);
    return [];
  }
}

/**
 * Adds a member to a group (Enforces: team max 4 members, cannot add if locked)
 */
export async function addTeammateToGroup(
  groupId: string,
  student: {
    userId?: string;
    rollNo: string;
    name: string;
    email: string;
    section?: string;
    branch?: string;
    semester?: number;
  }
) {
  await ensureProjectTables();

  // 1. Check if group is locked
  const groupRows = await db.$queryRaw<any[]>`
    SELECT "isLocked", "status" FROM "ProjectGroup" WHERE "id" = ${groupId} LIMIT 1;
  `;
  if (groupRows.length === 0) throw new Error("Project group not found.");
  if (groupRows[0].isLocked) throw new Error("Group roster is locked. New teammates cannot be added.");

  // 2. Check team size (Max 4 members)
  const existingMembers = await db.$queryRaw<any[]>`
    SELECT "rollNo" FROM "ProjectMember" WHERE "groupId" = ${groupId};
  `;
  if (existingMembers.length >= 4) {
    throw new Error("Maximum team size reached (4 members).");
  }

  // 3. Check if already member
  if (existingMembers.some((m) => m.rollNo === student.rollNo)) {
    throw new Error("Student is already in this project group.");
  }

  // 4. Check if student already in another group
  const inOther = await db.$queryRaw<any[]>`
    SELECT "groupId" FROM "ProjectMember" WHERE "rollNo" = ${student.rollNo} LIMIT 1;
  `;
  if (inOther.length > 0) {
    throw new Error(`Student ${student.rollNo} is already enrolled in another project group.`);
  }

  const memberId = `mem-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  await db.$executeRawUnsafe(`
    INSERT INTO "ProjectMember" (
      "id", "groupId", "userId", "rollNo", "name", "email", "role", "section", "branch", "semester", "joinedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, 'MEMBER', $7, $8, $9, NOW());
  `, memberId, groupId, student.userId || null, student.rollNo, student.name, student.email, student.section || 'ECS GROUP-03', student.branch || 'E&CSc', student.semester || 7);

  return { success: true, memberId };
}

/**
 * Removes a member (only before locking, leader cannot be removed unless group dissolved)
 */
export async function removeTeammate(groupId: string, memberId: string, isCoordinator = false) {
  await ensureProjectTables();

  const groupRows = await db.$queryRaw<any[]>`SELECT "isLocked" FROM "ProjectGroup" WHERE "id" = ${groupId}`;
  if (groupRows.length === 0) throw new Error("Group not found");
  if (groupRows[0].isLocked && !isCoordinator) {
    throw new Error("Group roster is permanently locked. Only the Project Coordinator can make adjustments.");
  }

  const memberRows = await db.$queryRaw<any[]>`SELECT "role" FROM "ProjectMember" WHERE "id" = ${memberId}`;
  if (memberRows.length > 0 && memberRows[0].role === 'LEADER' && !isCoordinator) {
    throw new Error("Team leader cannot be removed from group.");
  }

  await db.$executeRawUnsafe(`DELETE FROM "ProjectMember" WHERE "id" = $1 AND "groupId" = $2;`, memberId, groupId);
  return { success: true };
}

/**
 * Locks the team roster (Requires min 2 members, max 4 members)
 */
export async function lockProjectGroup(groupId: string) {
  await ensureProjectTables();

  const members = await db.$queryRaw<any[]>`
    SELECT id FROM "ProjectMember" WHERE "groupId" = ${groupId};
  `;

  if (members.length < 2) {
    throw new Error("Minimum team size of 2 members is required before locking the roster.");
  }
  if (members.length > 4) {
    throw new Error("Maximum team size is 4 members.");
  }

  await db.$executeRawUnsafe(`
    UPDATE "ProjectGroup"
    SET "isLocked" = TRUE, "lockedAt" = NOW(), "status" = 'LOCKED', "updatedAt" = NOW()
    WHERE "id" = $1;
  `, groupId);

  return { success: true };
}

/**
 * Sends a supervision request to an FIC
 * - Team must be locked
 * - Max 3 active pending requests per group
 * - FIC cannot exceed 3 groups
 * - Auto-rejects in 3 days (expiresAt = NOW() + 3 days)
 */
export async function sendFicSupervisionRequest(groupId: string, ficId: string, message?: string) {
  await ensureProjectTables();
  await expireOverdueFicRequests();

  // 1. Verify group is locked
  const groupRows = await db.$queryRaw<any[]>`
    SELECT "isLocked", "status", "ficId" FROM "ProjectGroup" WHERE "id" = ${groupId} LIMIT 1;
  `;
  if (groupRows.length === 0) throw new Error("Project group not found.");
  if (!groupRows[0].isLocked) {
    throw new Error("You must lock your team roster (min 2 members) before requesting faculty supervision.");
  }
  if (groupRows[0].ficId) {
    throw new Error("Your project group already has an allotted Faculty In-Charge.");
  }

  // 2. Check active pending requests limit (Max 3)
  const pendingRequests = await db.$queryRaw<any[]>`
    SELECT id, "ficId" FROM "ProjectFicRequest" 
    WHERE "groupId" = ${groupId} AND "status" = 'PENDING';
  `;
  if (pendingRequests.length >= 3) {
    throw new Error("Maximum pending requests limit reached (3 active requests). Please wait or cancel an existing request.");
  }

  // Check if duplicate request to same FIC
  if (pendingRequests.some((r) => r.ficId === ficId)) {
    throw new Error("You have already sent an active supervision request to this faculty member.");
  }

  // 3. Check FIC capacity (Max 3 groups)
  const fic = KIIT_FACULTY_POOL.find((f) => f.id === ficId);
  if (!fic) throw new Error("Selected faculty member is not recognized.");

  const ficAllotted = await db.$queryRaw<any[]>`
    SELECT count(*)::int as count FROM "ProjectGroup"
    WHERE "ficId" = ${ficId} AND "status" IN ('ALLOTTED', 'UNDER_EVALUATION', 'COMPLETED');
  `;
  const count = Number(ficAllotted[0]?.count || 0);
  if (count >= fic.maxActiveGroups) {
    throw new Error(`${fic.name} has already reached the maximum supervision capacity (${fic.maxActiveGroups} groups).`);
  }

  // 4. Create Request with 3-day (72h) expiry
  const requestId = `req-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  await db.$executeRawUnsafe(`
    INSERT INTO "ProjectFicRequest" (
      "id", "groupId", "ficId", "ficName", "ficEmail", "status", "requestMessage", "sentAt", "expiresAt"
    ) VALUES ($1, $2, $3, $4, $5, 'PENDING', $6, NOW(), NOW() + INTERVAL '3 days');
  `, requestId, groupId, fic.id, fic.name, fic.email, message || `Respected ${fic.name}, our team requests your mentorship and supervision for our autonomous project.`);

  return { success: true, requestId };
}

/**
 * FIC accepts or rejects a supervision request
 */
export async function respondToFicRequest(requestId: string, action: 'ACCEPT' | 'REJECT') {
  await ensureProjectTables();

  const reqRows = await db.$queryRaw<any[]>`
    SELECT * FROM "ProjectFicRequest" WHERE "id" = ${requestId} LIMIT 1;
  `;
  if (reqRows.length === 0) throw new Error("Request not found.");
  const req = reqRows[0];

  if (req.status !== 'PENDING') {
    throw new Error(`This request has already been ${req.status.toLowerCase()}.`);
  }

  if (action === 'ACCEPT') {
    // Check faculty capacity
    const fic = KIIT_FACULTY_POOL.find((f) => f.id === req.ficId);
    const maxCapacity = fic?.maxActiveGroups || 3;

    const currentAllotted = await db.$queryRaw<any[]>`
      SELECT count(*)::int as count FROM "ProjectGroup"
      WHERE "ficId" = ${req.ficId} AND "status" IN ('ALLOTTED', 'UNDER_EVALUATION', 'COMPLETED');
    `;
    if (Number(currentAllotted[0]?.count || 0) >= maxCapacity) {
      throw new Error(`Faculty supervision capacity limit reached (${maxCapacity} groups).`);
    }

    // 1. Mark this request accepted
    await db.$executeRawUnsafe(`
      UPDATE "ProjectFicRequest"
      SET "status" = 'ACCEPTED', "respondedAt" = NOW()
      WHERE "id" = $1;
    `, requestId);

    // 2. Allot FIC to group and set status = ALLOTTED
    await db.$executeRawUnsafe(`
      UPDATE "ProjectGroup"
      SET "ficId" = $1, "ficName" = $2, "ficEmail" = $3,
          "status" = 'ALLOTTED', "allottedAt" = NOW(), "updatedAt" = NOW()
      WHERE "id" = $4;
    `, req.ficId, req.ficName, req.ficEmail, req.groupId);

    // 3. Auto-cancel all other pending requests for this group
    await db.$executeRawUnsafe(`
      UPDATE "ProjectFicRequest"
      SET "status" = 'CANCELLED', "respondedAt" = NOW()
      WHERE "groupId" = $1 AND "id" != $2 AND "status" = 'PENDING';
    `, req.groupId, requestId);

    // 4. Send initial welcome message in the project chatroom
    await sendProjectChat(req.groupId, {
      senderId: req.ficId,
      senderName: req.ficName,
      senderRole: 'FIC',
      message: `Welcome team! I have officially accepted the supervision request for this project. Let us convene our preliminary meeting soon and initialize the Minutes of Meeting (MOM). Please update the GitHub repository and WhatsApp links here.`,
    });

    return { success: true, status: 'ALLOTTED' };
  } else {
    // REJECT
    await db.$executeRawUnsafe(`
      UPDATE "ProjectFicRequest"
      SET "status" = 'REJECTED', "respondedAt" = NOW()
      WHERE "id" = $1;
    `, requestId);
    return { success: true, status: 'REJECTED' };
  }
}

/**
 * Real-Time Workspace Chatroom (5 Participants: 4 Students + 1 FIC + Coordinator)
 */
export async function getProjectChatMessages(groupId: string) {
  await ensureProjectTables();
  return await db.$queryRaw<any[]>`
    SELECT * FROM "ProjectMessage"
    WHERE "groupId" = ${groupId}
    ORDER BY "createdAt" ASC;
  `;
}

export async function sendProjectChat(
  groupId: string,
  data: {
    senderId: string;
    senderName: string;
    senderRole: 'LEADER' | 'MEMBER' | 'FIC' | 'COORDINATOR';
    message: string;
    attachmentUrl?: string;
    attachmentName?: string;
    attachmentType?: string;
  }
) {
  await ensureProjectTables();
  const msgId = `msg-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

  await db.$executeRawUnsafe(`
    INSERT INTO "ProjectMessage" (
      "id", "groupId", "senderId", "senderName", "senderRole", "message",
      "attachmentUrl", "attachmentName", "attachmentType", "createdAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW());
  `, msgId, groupId, data.senderId, data.senderName, data.senderRole, data.message, data.attachmentUrl || null, data.attachmentName || null, data.attachmentType || null);

  return { success: true, msgId };
}

/**
 * Updates Project Links (GitHub repository and WhatsApp group link)
 */
export async function updateProjectLinks(groupId: string, githubRepo?: string, whatsappLink?: string) {
  await ensureProjectTables();
  await db.$executeRawUnsafe(`
    UPDATE "ProjectGroup"
    SET "githubRepo" = COALESCE($1, "githubRepo"),
        "whatsappLink" = COALESCE($2, "whatsappLink"),
        "updatedAt" = NOW()
    WHERE "id" = $3;
  `, githubRepo || null, whatsappLink || null, groupId);

  return { success: true };
}

/**
 * Minutes of Meeting (MOM) logger
 */
export async function addProjectMom(
  groupId: string,
  data: {
    meetDate: string;
    title: string;
    agenda: string;
    discussion: string;
    actionItems: string[];
    attendees: string[];
    ficSigned?: boolean;
  }
) {
  await ensureProjectTables();
  const momId = `mom-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

  await db.$executeRawUnsafe(`
    INSERT INTO "ProjectMom" (
      "id", "groupId", "meetDate", "title", "agenda", "discussion",
      "actionItems", "attendees", "ficSigned", "createdAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW());
  `, momId, groupId, data.meetDate, data.title, data.agenda, data.discussion, data.actionItems, data.attendees, data.ficSigned || false);

  return { success: true, momId };
}

/**
 * Evaluation Panels Management (Coordinator Only)
 */
export async function getAllPanels() {
  await ensureProjectTables();
  return await db.$queryRaw<any[]>`
    SELECT * FROM "ProjectPanel" ORDER BY "panelNumber" ASC;
  `;
}

/**
 * Full Coordinator View: List all groups with stats & panels
 */
export async function getCoordinatorOverview() {
  await ensureProjectTables();
  const groups = await db.$queryRaw<any[]>`
    SELECT * FROM "ProjectGroup" ORDER BY "createdAt" DESC;
  `;
  const panels = await getAllPanels();
  const faculty = await getFacultyPoolWithQuotas();

  return { groups, panels, faculty };
}

/**
 * Coordinator Full CRUD: Reassign supervisor or change panel
 */
export async function coordinatorReassignFic(groupId: string, newFicId: string) {
  await ensureProjectTables();
  const fic = KIIT_FACULTY_POOL.find((f) => f.id === newFicId);
  if (!fic) throw new Error("Faculty not found");

  await db.$executeRawUnsafe(`
    UPDATE "ProjectGroup"
    SET "ficId" = $1, "ficName" = $2, "ficEmail" = $3,
        "status" = 'ALLOTTED', "updatedAt" = NOW()
    WHERE "id" = $4;
  `, fic.id, fic.name, fic.email, groupId);

  return { success: true };
}

export async function coordinatorAssignPanel(groupId: string, panelId: string) {
  await ensureProjectTables();
  await db.$executeRawUnsafe(`
    UPDATE "ProjectGroup"
    SET "panelId" = $1, "updatedAt" = NOW()
    WHERE "id" = $2;
  `, panelId, groupId);

  return { success: true };
}

export async function coordinatorOverrideLock(groupId: string, unlock: boolean) {
  await ensureProjectTables();
  await db.$executeRawUnsafe(`
    UPDATE "ProjectGroup"
    SET "isLocked" = $1, "status" = CASE WHEN $1 THEN 'LOCKED' ELSE 'FORMING' END, "updatedAt" = NOW()
    WHERE "id" = $2;
  `, !unlock, groupId);

  return { success: true };
}

/**
 * Grading & Evaluation (100 Marks: 40 Internal FIC + 60 External Panel)
 */
export async function submitProjectGrades(
  groupId: string,
  studentRoll: string,
  studentName: string,
  internalMarks: number, // max 40
  panelMarks: number, // max 60
  evaluatorInfo: { evaluatorRole: 'FIC' | 'PANEL' | 'COORDINATOR'; evaluatorName: string; remarks?: string }
) {
  await ensureProjectTables();

  const total = Math.min(100, Math.max(0, internalMarks + panelMarks));
  let gradeLetter = 'F';
  if (total >= 90) gradeLetter = 'O';
  else if (total >= 80) gradeLetter = 'E';
  else if (total >= 70) gradeLetter = 'A';
  else if (total >= 60) gradeLetter = 'B';
  else if (total >= 50) gradeLetter = 'C';
  else if (total >= 40) gradeLetter = 'D';

  const existing = await db.$queryRaw<any[]>`
    SELECT id FROM "ProjectGrade" WHERE "groupId" = ${groupId} AND "studentRoll" = ${studentRoll} LIMIT 1;
  `;

  if (existing.length > 0) {
    await db.$executeRawUnsafe(`
      UPDATE "ProjectGrade"
      SET "internalFicMarks" = $1,
          "panelMarks" = $2,
          "totalMarks" = $3,
          "gradeLetter" = $4,
          "remarks" = $5,
          "evaluatedByFic" = CASE WHEN $6 = 'FIC' THEN $7 ELSE "evaluatedByFic" END,
          "evaluatedByPanel" = CASE WHEN $6 = 'PANEL' THEN $7 ELSE "evaluatedByPanel" END,
          "updatedAt" = NOW()
      WHERE "id" = $8;
    `, internalMarks, panelMarks, total, gradeLetter, evaluatorInfo.remarks || 'Evaluation finalized under autonomous norms.', evaluatorInfo.evaluatorRole, evaluatorInfo.evaluatorName, existing[0].id);
  } else {
    const gradeId = `grd-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    await db.$executeRawUnsafe(`
      INSERT INTO "ProjectGrade" (
        "id", "groupId", "studentRoll", "studentName", "internalFicMarks", "panelMarks",
        "totalMarks", "gradeLetter", "remarks", "evaluatedByFic", "evaluatedByPanel", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW());
    `, gradeId, groupId, studentRoll, studentName, internalMarks, panelMarks, total, gradeLetter, evaluatorInfo.remarks || 'Evaluation finalized under autonomous norms.', evaluatorInfo.evaluatorRole === 'FIC' ? evaluatorInfo.evaluatorName : null, evaluatorInfo.evaluatorRole === 'PANEL' ? evaluatorInfo.evaluatorName : null);
  }

  return { success: true, totalMarks: total, gradeLetter };
}

/**
 * Teammate Finder Recruitment Posts
 */
export async function getRecruitmentBoard() {
  await ensureProjectTables();
  return await db.$queryRaw<any[]>`
    SELECT p.*, g."projectType", g."semester", g."leaderName"
    FROM "ProjectRecruitmentPost" p
    JOIN "ProjectGroup" g ON p."groupId" = g."id"
    WHERE p."status" = 'OPEN' AND g."isLocked" = FALSE
    ORDER BY p."createdAt" DESC;
  `;
}

export async function createRecruitmentPost(groupId: string, data: { title: string; domain: string; skills: string[]; openSlots: number; contactEmail: string }) {
  await ensureProjectTables();
  const postId = `post-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

  await db.$executeRawUnsafe(`
    INSERT INTO "ProjectRecruitmentPost" (
      "id", "groupId", "title", "domain", "skills", "openSlots", "contactEmail", "status", "createdAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'OPEN', NOW());
  `, postId, groupId, data.title, data.domain, data.skills, data.openSlots, data.contactEmail);

  return { success: true, postId };
}
