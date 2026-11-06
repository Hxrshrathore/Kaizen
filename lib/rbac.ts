/**
 * KAIZEN ROLE-BASED ACCESS CONTROL (RBAC) & OFFICIAL TAGS ENGINE
 *
 * User Types:
 *   - ROOT    : Full System Architect / Superadmin with AAA (All Area Access)
 *   - STUDENT : Enrolled student; when tagged with TEAMMATE, gains selected Root/Admin access
 *   - FACULTY : Professors & instructors with specialized tags (DEAN, HOD, FIC, AOE, MENTOR)
 *
 * Official Tags:
 *   - AAA                 : All Area Access (Bypasses all security checks)
 *   - TEAMMATE            : Student Core Team Member with selected root/admin access
 *   - STUDENT_COORDINATOR : Class Representative / Academic Coordinator
 *   - GENERAL_STUDENT     : Standard Student Portal User
 *   - DEAN                : Dean of School / Academics (School-wide oversight)
 *   - HOD                 : Head of Department (Department-level audits)
 *   - FIC                 : Faculty-in-Charge (Exams, Laboratories, Societies, Curriculum)
 *   - AOE                 : Area of Expertise / Academic Officer (Syllabus & Paper Evaluation)
 *   - MENTOR              : Faculty Proctor / Academic Mentor (Cohort oversight)
 *   - PROFESSOR           : Course Instructor (Grade entries & classroom tasks)
 */

export type UserType = "STUDENT" | "FACULTY" | "ROOT";

export type OfficialTag =
  | "AAA"
  | "TEAMMATE"
  | "STUDENT_COORDINATOR"
  | "GENERAL_STUDENT"
  | "DEAN"
  | "HOD"
  | "FIC"
  | "AOE"
  | "MENTOR"
  | "PROFESSOR";

export interface UserLike {
  id?: string;
  email: string;
  userType?: UserType | string | null;
  officialTag?: OfficialTag | string | null;
  officialTags?: Array<OfficialTag | string> | null;
  permissions?: string[] | null;
}

// ── THE SOLE ROOT / AAA ADMINISTRATOR ─────────────────────────────────────────
export const SOLE_ROOT_EMAIL = "2330231@kiit.ac.in";

export function isRootEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === SOLE_ROOT_EMAIL.toLowerCase();
}

// ── CORE ACCESS LEVEL CHECKERS ────────────────────────────────────────────────
export function hasAAA(user?: UserLike | null): boolean {
  if (!user || !user.email) return false;
  // 2330231@kiit.ac.in is the ONLY user with ROOT / AAA access
  return isRootEmail(user.email);
}

export function isTeammate(user?: UserLike | null): boolean {
  if (!user) return false;
  if (hasAAA(user)) return true;
  if (user.officialTag === "TEAMMATE") return true;
  if (Array.isArray(user.officialTags) && user.officialTags.includes("TEAMMATE")) return true;
  return false;
}

export function isFaculty(user?: UserLike | null): boolean {
  if (!user) return false;
  if (hasAAA(user)) return true;
  return user.userType === "FACULTY";
}

export function isDeanOrHOD(user?: UserLike | null): boolean {
  if (!user) return false;
  if (hasAAA(user)) return true;
  const tags = [user.officialTag, ...(user.officialTags || [])];
  return tags.includes("DEAN") || tags.includes("HOD");
}

export function isFIC(user?: UserLike | null): boolean {
  if (!user) return false;
  if (hasAAA(user)) return true;
  const tags = [user.officialTag, ...(user.officialTags || [])];
  return tags.includes("FIC");
}

export function isMentor(user?: UserLike | null): boolean {
  if (!user) return false;
  if (hasAAA(user)) return true;
  const tags = [user.officialTag, ...(user.officialTags || [])];
  return tags.includes("MENTOR");
}

// ── FEATURE-SPECIFIC PERMISSION CHECKERS ──────────────────────────────────────
export function canAccessDataIngestion(user?: UserLike | null): boolean {
  if (!user) return false;
  // 1. Root AAA
  if (hasAAA(user)) return true;
  // 2. Student Teammates (Selected root access for data curation & OCR)
  if (isTeammate(user)) return true;
  // 3. Faculty in-Charge (FIC), AOE, and Deans
  const tags = [user.officialTag, ...(user.officialTags || [])];
  if (tags.includes("FIC") || tags.includes("AOE") || tags.includes("DEAN") || tags.includes("HOD")) {
    return true;
  }
  // 4. Explicit granular permission
  if (Array.isArray(user.permissions) && user.permissions.includes("ACCESS_DATA_INGESTION")) {
    return true;
  }
  return false;
}

export function canExportFineTuneDataset(user?: UserLike | null): boolean {
  if (!user) return false;
  if (hasAAA(user)) return true;
  if (isTeammate(user)) return true;
  const tags = [user.officialTag, ...(user.officialTags || [])];
  if (tags.includes("DEAN") || tags.includes("HOD") || tags.includes("FIC")) return true;
  if (Array.isArray(user.permissions) && user.permissions.includes("EXPORT_FINETUNE")) return true;
  return false;
}

export function canManageAcademicCurriculum(user?: UserLike | null): boolean {
  if (!user) return false;
  if (hasAAA(user)) return true;
  const tags = [user.officialTag, ...(user.officialTags || [])];
  return tags.includes("DEAN") || tags.includes("HOD") || tags.includes("FIC") || tags.includes("AOE");
}

// ── ROUTE AUTHORIZATION CHECKER ──────────────────────────────────────────────
export function hasRouteAccess(user: UserLike | null | undefined, pathname: string): boolean {
  if (!user) return false;
  // Root AAA has access to ALL areas unconditionally
  if (hasAAA(user)) return true;

  // Data Ingestion Studio & Crop Tools (Allowed for ROOT, TEAMMATES, and designated Faculty)
  if (pathname.startsWith("/dashboard/data-ingestion")) {
    return canAccessDataIngestion(user);
  }

  // Admin or Root System Settings
  if (pathname.startsWith("/dashboard/admin") || pathname.startsWith("/admin")) {
    return hasAAA(user);
  }

  // Faculty Specific Portals
  if (pathname.startsWith("/dashboard/faculty") || pathname.startsWith("/faculty")) {
    return isFaculty(user);
  }

  // General Academic Student & Faculty Routes (Always accessible to all authenticated users)
  const openRoutes = [
    "/dashboard",
    "/dashboard/profile",
    "/dashboard/advisor",
    "/dashboard/simulator",
    "/dashboard/archives",
    "/dashboard/focus",
    "/dashboard/insights",
    "/dashboard/mock-exams",
    "/dashboard/checkin",
    "/dashboard/mail-sync",
    "/dashboard/scheduler",
    "/attendance",
    "/classroom",
  ];

  if (openRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return true;
  }

  return true;
}

// ── BADGE DISPLAY METADATA ────────────────────────────────────────────────────
export interface BadgeInfo {
  label: string;
  tier: "ROOT" | "STUDENT_TEAMMATE" | "STUDENT" | "FACULTY";
  description: string;
  badgeClasses: string;
}

export function getOfficialBadge(user?: UserLike | null): BadgeInfo {
  if (!user) {
    return {
      label: "Guest",
      tier: "STUDENT",
      description: "Standard Access",
      badgeClasses: "bg-zinc-800 text-zinc-400 border-zinc-700",
    };
  }

  if (hasAAA(user)) {
    return {
      label: "ROOT · AAA",
      tier: "ROOT",
      description: "All Area Access (System Architect & Superadmin)",
      badgeClasses:
        "bg-gradient-to-r from-red-600/20 to-amber-600/20 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]",
    };
  }

  const tag = (user.officialTag || "GENERAL_STUDENT") as OfficialTag;

  switch (tag) {
    case "TEAMMATE":
      return {
        label: "TEAMMATE",
        tier: "STUDENT_TEAMMATE",
        description: "Student Core Team · Selected Root & Ingestion Access",
        badgeClasses:
          "bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]",
      };
    case "DEAN":
      return {
        label: "DEAN",
        tier: "FACULTY",
        description: "Dean of School / Academics · School-wide Oversight",
        badgeClasses: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      };
    case "HOD":
      return {
        label: "HOD",
        tier: "FACULTY",
        description: "Head of Department · Department Audit & Governance",
        badgeClasses: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      };
    case "FIC":
      return {
        label: "FIC",
        tier: "FACULTY",
        description: "Faculty-in-Charge · Exams, Labs & Curriculum",
        badgeClasses: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
      };
    case "AOE":
      return {
        label: "AOE",
        tier: "FACULTY",
        description: "Area of Expertise · Subject Evaluation Officer",
        badgeClasses: "bg-blue-500/20 text-blue-300 border-blue-500/40",
      };
    case "MENTOR":
      return {
        label: "MENTOR",
        tier: "FACULTY",
        description: "Faculty Mentor / Proctor · Student Cohort Advisor",
        badgeClasses: "bg-teal-500/20 text-teal-300 border-teal-500/40",
      };
    case "PROFESSOR":
      return {
        label: "FACULTY",
        tier: "FACULTY",
        description: "Course Instructor & Teaching Faculty",
        badgeClasses: "bg-blue-500/20 text-blue-300 border-blue-500/40",
      };
    case "STUDENT_COORDINATOR":
      return {
        label: "COORDINATOR",
        tier: "STUDENT",
        description: "Class Representative / Academic Coordinator",
        badgeClasses: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      };
    default:
      return {
        label: "STUDENT",
        tier: "STUDENT",
        description: "Standard Academic Portal Access",
        badgeClasses: "bg-zinc-800 text-zinc-300 border-zinc-700",
      };
  }
}

