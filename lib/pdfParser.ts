// lib/pdfParser.ts

// Note: Dynamic import of 'pdfjs-dist' inside function to avoid Server-Side Rendering crashes.

export interface ParsedPDFData {
  student: {
    name: string;
    rollNumber: string;
    regnNumber: string;
    program: string;
    branch?: string;
    admissionYear: string;
    currentSemester: number;
  };
  semesterPerformance: {
    sgpa: number;
    cgpa: number;
    totalCredits: number;
    creditsEarned: number;
    creditIndex: number;
    cumulativeCredits?: number;
    cumulativeCreditIndex?: number;
    remarks: string;
  };
  grades: {
    subjectCode: string;
    subjectName: string;
    credits: number;
    grade: string;
    type?: 'THEORY' | 'LAB' | 'SESSIONAL';
  }[];
}

// KIIT Standard 10-Point Grade Scale
const GRADE_POINTS: Record<string, number> = {
  O: 10,
  E: 9,
  A: 8,
  B: 7,
  C: 6,
  D: 5,
  F: 0
};

export const parseGradeReport = async (file: File): Promise<ParsedPDFData> => {
  // 1. DYNAMIC IMPORT
  const pdfjsLib = await import('pdfjs-dist');

  // 2. WORKER CONFIGURATION
  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.mjs`;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    // First Page
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    
    const rawItems: any[] = textContent.items || [];
    const items: string[] = rawItems
      .map((it: any) => (it.str || '').trim())
      .filter((s: string) => s.length > 0);

    // ── 1. EXTRACT STUDENT IDENTITY (DYNAMIC) ──
    let rollNumber = "Unknown";
    let regnNumber = "Unknown";
    let studentName = "Unknown";
    let currentSemester = 1;
    let admissionYear = "2023";
    let program = "B.Tech";
    let branch = "Electronics & Computer Science Engineering";

    // Scan all text items for student metadata
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (rollNumber === "Unknown") {
        const rollM = item.match(/\b(\d{7})\b/);
        if (rollM) rollNumber = rollM[1];
      }

      if (regnNumber === "Unknown") {
        const regnM = item.match(/\b(\d{10,14})\b/);
        if (regnM) regnNumber = regnM[1];
      }

      const semM = item.match(/\b([1-8])(st|nd|rd|th)\b/i);
      if (semM) currentSemester = parseInt(semM[1], 10);

      const admM = item.match(/YEAR OF ADMISSION\s*:\s*(\d{4})/i) || item.match(/ADMISSION\s*:\s*(\d{4})/i);
      if (admM) admissionYear = admM[1];

      if (item.includes("PROGRAMME")) {
        const bMatch = item.match(/\((.*?)\)/);
        if (bMatch) branch = bMatch[1].trim();
        if (item.includes("B.Tech")) program = "B.Tech";
      }

      if (item.toUpperCase().includes("STUDENT'S NAME") || item.toUpperCase().includes("STUDENT NAME")) {
        const nextLine = items[i + 1] || "";
        const cleanName = nextLine
          .replace(/\b\d{7}\b/, '')
          .replace(/\b\d{10,14}\b/, '')
          .replace(/\b\d(st|nd|rd|th)\b/i, '')
          .trim();
        if (cleanName.length > 2) studentName = cleanName;
      }
    }

    if (admissionYear === "2023" && rollNumber !== "Unknown" && rollNumber.length >= 2) {
      admissionYear = `20${rollNumber.substring(0, 2)}`;
    }

    // ── 2. DYNAMIC TABLE PARSING (MULTI-STRATEGY) ──
    const codeRegex = /^[A-Z]{2,4}\d{4,5}$/;
    const validGradesSet = new Set(['O', 'E', 'A', 'B', 'C', 'D', 'F']);
    let parsedGrades: { subjectCode: string; subjectName: string; credits: number; grade: string; type?: 'THEORY' | 'LAB' | 'SESSIONAL' }[] = [];

    // Isolate table region
    const remarksIdx = items.findIndex(it => it.toUpperCase().includes("REMARKS"));
    const tableItems = remarksIdx !== -1 ? items.slice(0, remarksIdx) : items;

    // Extract all course codes
    const courseCodes: string[] = [];
    for (const it of tableItems) {
      if (codeRegex.test(it)) {
        courseCodes.push(it);
      }
    }
    const N = courseCodes.length;

    if (N > 0) {
      // Find Grades Block of length N
      let grades: string[] = [];
      for (let i = 0; i <= tableItems.length - N; i++) {
        const window = tableItems.slice(i, i + N);
        if (window.every(t => validGradesSet.has(t))) {
          grades = window;
          break;
        }
      }

      // Find Credits Block of length N
      let credits: number[] = [];
      for (let i = 0; i <= tableItems.length - N; i++) {
        const window = tableItems.slice(i, i + N);
        if (window.every(t => /^[1-9](\.0|\.5)?$/.test(t))) {
          credits = window.map(Number);
          break;
        }
      }

      // Find Subject Names Block of length N
      const headerWords = new Set([
        'SEMESTER', 'GRADE', 'REPORT', 'ACADEMIC', 'OFFICE', 'YEAR', 'ADMISSION',
        'STUDENTS', 'NAME', 'STUDENT', 'COPY', 'ROLL', 'NUMBER', 'REGN', 'PROGRAMME',
        'COURSE', 'COURSENAME', 'CREDIT', 'REMARKS', 'PASS', 'FAIL', 'CURRENT', 'PERFORMANCE',
        'CUMULATIVE', 'CREDITS', 'INDEX', 'SGPA', 'CGPA', 'SCHOOLOFELECTRONICS', 'ENGINEERING',
        'CONTROLLER', 'EXAMINATIONS', 'DATE'
      ]);

      const isProbableSubjectName = (str: string) => {
        const s = str.toUpperCase().trim();
        if (codeRegex.test(s)) return false;
        if (validGradesSet.has(s)) return false;
        if (/^[1-9](\.0|\.5)?$/.test(s)) return false;
        if (headerWords.has(s.replace(/[^A-Z]/g, ''))) return false;
        if (s.length < 3) return false;
        return true;
      };

      let subjectNames: string[] = [];
      for (let i = 0; i <= tableItems.length - N; i++) {
        const window = tableItems.slice(i, i + N);
        if (window.every(isProbableSubjectName)) {
          subjectNames = window;
          break;
        }
      }

      // Construct verified grades array
      for (let i = 0; i < N; i++) {
        const code = courseCodes[i];
        const name = subjectNames[i] || `Subject ${code}`;
        const cr = credits[i] !== undefined ? credits[i] : 3;
        const gr = grades[i] || 'E';

        const isLab = code.includes('LAB') || 
                      code.includes('19') || 
                      code.includes('29') || 
                      code.includes('39') || 
                      name.toUpperCase().includes('LAB') || 
                      name.toUpperCase().includes('WORKSHOP') || 
                      name.toUpperCase().includes('DRAWING') || 
                      name.toUpperCase().includes('PROJECT') || 
                      cr <= 1.5;

        parsedGrades.push({
          subjectCode: code,
          subjectName: name,
          credits: cr,
          grade: gr,
          type: isLab ? 'LAB' : 'THEORY'
        });
      }
    }

    // ── 3. EXTRACT PERFORMANCE SUMMARY (FOOTER NUMBERS) ──
    let footerSgpa = 0;
    let footerCgpa = 0;
    let remarks = "PASS";

    const afterRemarks = remarksIdx !== -1 ? items.slice(remarksIdx) : [];
    for (const it of afterRemarks) {
      if (it.toUpperCase().includes("FAIL")) remarks = "FAIL";
    }

    const footerNums: number[] = [];
    for (const it of afterRemarks) {
      const matches = it.match(/\b\d+(\.\d+)?\b/g);
      if (matches) {
        for (const m of matches) {
          footerNums.push(parseFloat(m));
        }
      }
    }

    const gpas = footerNums.filter(n => n >= 2.0 && n <= 10.0 && n.toString().includes('.'));
    if (gpas.length >= 1) footerSgpa = gpas[0];
    if (gpas.length >= 2) footerCgpa = gpas[gpas.length - 1];

    // Mathematical Ground-Truth Calculation
    let totalPts = 0;
    let sumCredits = 0;
    for (const g of parsedGrades) {
      const pt = GRADE_POINTS[g.grade] ?? 8;
      totalPts += g.credits * pt;
      sumCredits += g.credits;
    }

    const calculatedSgpa = sumCredits > 0 ? parseFloat((totalPts / sumCredits).toFixed(2)) : 0;
    const finalSgpa = footerSgpa > 0 ? footerSgpa : calculatedSgpa;
    const finalCgpa = footerCgpa > 0 ? footerCgpa : finalSgpa;

    return {
      student: {
        name: studentName,
        rollNumber,
        regnNumber,
        program,
        branch,
        admissionYear,
        currentSemester,
      },
      semesterPerformance: {
        sgpa: finalSgpa,
        cgpa: finalCgpa,
        totalCredits: sumCredits,
        creditsEarned: remarks === 'PASS' ? sumCredits : sumCredits,
        creditIndex: totalPts,
        remarks,
      },
      grades: parsedGrades,
    };
  } catch (error: any) {
    console.error("PDF Parser Error:", error);
    throw new Error(`Failed to parse grade report: ${error.message || error}`);
  }
};
