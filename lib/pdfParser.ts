// lib/pdfParser.ts

// Note: No top-level import of 'pdfjs-dist' to avoid Server-Side Rendering crashes.

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
    totalCredits: number;      // Exact semester credits (e.g. 25.0)
    creditsEarned: number;     // Exact semester earned credits (e.g. 25.0)
    creditIndex: number;       // Credit index (e.g. 175.0 or sum(cr*pt))
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

    // ── 1. EXTRACT STUDENT IDENTITY ──
    let rollNumber = "Unknown";
    let regnNumber = "Unknown";
    let studentName = "Unknown";
    let currentSemester = 1;
    let admissionYear = "2023";
    let program = "B.Tech";
    let branch = "Computer Science and Engineering";

    // Scan all text items for identifiers
    for (const item of items) {
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
    }

    // Name Extraction: look after "STUDENT'S NAME"
    for (let i = 0; i < items.length; i++) {
      if (items[i].toUpperCase().includes("STUDENT'S NAME") || items[i].toUpperCase().includes("STUDENT NAME")) {
        const nextLine = items[i + 1] || "";
        const cleanName = nextLine
          .replace(/\b\d{7}\b/, '')
          .replace(/\b\d{10,14}\b/, '')
          .replace(/\b\d(st|nd|rd|th)\b/i, '')
          .trim();
        if (cleanName.length > 2) studentName = cleanName;
        break;
      }
    }

    // Fallback: If roll was found, calculate admission year
    if (admissionYear === "2023" && rollNumber !== "Unknown" && rollNumber.length >= 2) {
      admissionYear = `20${rollNumber.substring(0, 2)}`;
    }

    // ── 2. EXTRACT GRADES (MULTI-STRATEGY) ──
    const codeRegex = /^[A-Z]{2}\d{4,5}$/;
    const validGradesSet = new Set(['O', 'E', 'A', 'B', 'C', 'D', 'F']);
    let parsedGrades: { subjectCode: string; subjectName: string; credits: number; grade: string; type?: 'THEORY' | 'LAB' | 'SESSIONAL' }[] = [];

    // --- STRATEGY 1: Spatial 2D Row Clustering (When PDF.js has transform matrix) ---
    try {
      const itemsWithCoords = rawItems
        .filter((it: any) => it.str && it.str.trim().length > 0 && it.transform && it.transform.length >= 6)
        .map((it: any) => ({
          str: it.str.trim(),
          x: it.transform[4] as number,
          y: it.transform[5] as number
        }));

      if (itemsWithCoords.length > 10) {
        // Sort items by Y descending (top-to-bottom) then X ascending (left-to-right)
        // Group items within 4px vertical distance
        const rows: { y: number; items: { str: string; x: number }[] }[] = [];
        const sorted = [...itemsWithCoords].sort((a, b) => b.y - a.y || a.x - b.x);

        for (const item of sorted) {
          const matchRow = rows.find(r => Math.abs(r.y - item.y) <= 4);
          if (matchRow) {
            matchRow.items.push({ str: item.str, x: item.x });
          } else {
            rows.push({ y: item.y, items: [{ str: item.str, x: item.x }] });
          }
        }

        // Check if any row contains a course code
        for (const row of rows) {
          row.items.sort((a, b) => a.x - b.x);
          const rowStrings = row.items.map(it => it.str);
          const codeIdx = rowStrings.findIndex(s => codeRegex.test(s));

          if (codeIdx !== -1) {
            const subjectCode = rowStrings[codeIdx];
            const gradeIdx = rowStrings.findIndex(s => validGradesSet.has(s));
            const creditIdx = rowStrings.findIndex(s => /^[1-9](\.0|\.5)?$/.test(s));

            if (gradeIdx !== -1 && creditIdx !== -1) {
              const grade = rowStrings[gradeIdx];
              const credits = parseFloat(rowStrings[creditIdx]);
              // Name is the remaining tokens
              const nameParts = rowStrings.filter((_, idx) => idx !== codeIdx && idx !== gradeIdx && idx !== creditIdx);
              const subjectName = nameParts.join(' ').replace(/COURSE|CREDIT|GRADE/gi, '').trim();

              if (!parsedGrades.some(g => g.subjectCode === subjectCode)) {
                parsedGrades.push({
                  subjectCode,
                  subjectName: subjectName || subjectCode,
                  credits: credits || 3,
                  grade,
                  type: (subjectCode.includes('LAB') || (subjectName || '').toUpperCase().includes('LAB') || credits <= 1.5) ? 'LAB' : 'THEORY'
                });
              }
            }
          }
        }
      }
    } catch (spatialErr) {
      console.warn("Spatial parsing fallback triggered:", spatialErr);
    }

    // --- STRATEGY 2: Column-Block Stream Alignment (KIIT Column-Stream Format) ---
    // Triggered when PDF.js outputs columns in parallel blocks (as in KIIT SAP SGR PDFs)
    if (parsedGrades.length === 0) {
      const courseCodesWithIdx: { code: string; index: number }[] = [];
      for (let i = 0; i < items.length; i++) {
        if (codeRegex.test(items[i])) {
          courseCodesWithIdx.push({ code: items[i], index: i });
        }
      }

      const N = courseCodesWithIdx.length;
      if (N > 0) {
        // Collect grades
        const gradeTokens: { grade: string; index: number }[] = [];
        for (let i = 0; i < items.length; i++) {
          if (validGradesSet.has(items[i])) {
            gradeTokens.push({ grade: items[i], index: i });
          }
        }

        // In KIIT SGR format:
        // Course names immediately follow the last course code
        const lastCodeIdx = courseCodesWithIdx[N - 1].index;
        const subjectNames: string[] = [];
        for (let i = lastCodeIdx + 1; i <= lastCodeIdx + N && i < items.length; i++) {
          subjectNames.push(items[i]);
        }

        // Credits immediately follow the course names
        const lastNameIdx = lastCodeIdx + N;
        const credits: number[] = [];
        for (let i = lastNameIdx + 1; i < items.length && credits.length < N; i++) {
          if (/^[1-9](\.0|\.5)?$/.test(items[i])) {
            credits.push(parseFloat(items[i]));
          }
        }

        // Align grades (take the first N grades)
        const alignedGrades = gradeTokens.slice(0, N).map(g => g.grade);

        for (let idx = 0; idx < N; idx++) {
          const sCode = courseCodesWithIdx[idx].code;
          const sName = subjectNames[idx] || "Subject " + (idx + 1);
          const sCred = credits[idx] !== undefined ? credits[idx] : 3;
          const isLab = sCode.includes('LAB') || sName.toUpperCase().includes('LAB') || sCred <= 1.5;

          parsedGrades.push({
            subjectCode: sCode,
            subjectName: sName,
            credits: sCred,
            grade: alignedGrades[idx] || "E",
            type: isLab ? 'LAB' : 'THEORY'
          });
        }
      }
    }

    // --- STRATEGY 3: Inline Look-ahead (Horizontal Sequential) ---
    if (parsedGrades.length === 0) {
      for (let i = 0; i < items.length; i++) {
        if (codeRegex.test(items[i])) {
          const subjectCode = items[i];
          let gradeIndex = -1;
          for (let k = 1; k <= 12; k++) {
            if (validGradesSet.has(items[i + k])) {
              if (/^[1-9](\.0|\.5)?$/.test(items[i + k - 1])) {
                gradeIndex = i + k;
                break;
              }
            }
          }
          if (gradeIndex !== -1) {
            const grade = items[gradeIndex];
            const credits = parseFloat(items[gradeIndex - 1]);
            const rawName = items.slice(i + 1, gradeIndex - 1).join(' ').trim();
            const isLab = subjectCode.includes('LAB') || rawName.toUpperCase().includes('LAB') || credits <= 1.5;
            parsedGrades.push({ 
              subjectCode, 
              subjectName: rawName || subjectCode, 
              credits, 
              grade,
              type: isLab ? 'LAB' : 'THEORY'
            });
          }
        }
      }
    }

    // ── 3. EXTRACT PERFORMANCE SUMMARY (FOOTER NUMBERS) ──
    let totalCredits = 0;
    let creditIndex = 0;
    let sgpa = 0;
    let cgpa = 0;
    let cumulativeCredits = 0;
    let cumulativeCreditIndex = 0;
    let remarks = "PASS";

    // Check remarks
    for (const item of items) {
      if (item.toUpperCase().includes("REMARKS")) {
        if (item.toUpperCase().includes("FAIL")) remarks = "FAIL";
        else if (item.toUpperCase().includes("PASS")) remarks = "PASS";
      }
    }

    // Look for footer summary line: e.g. "25 175 8.49 135 875 8.50"
    for (const item of items) {
      const nums = item.match(/\b\d+(\.\d+)?\b/g)?.map(Number) || [];
      if (nums.length >= 4 && nums.some(n => n >= 1 && n <= 10 && n.toString().includes('.'))) {
        if (nums.length >= 6) {
          totalCredits = nums[0];
          creditIndex = nums[1];
          sgpa = nums[2];
          cumulativeCredits = nums[3];
          cumulativeCreditIndex = nums[4];
          cgpa = nums[5];
          break;
        } else if (nums.length >= 3) {
          totalCredits = nums[0];
          creditIndex = nums[1];
          sgpa = nums[2];
        }
      }
    }

    // ── 4. GROUND TRUTH CALCULATION FALLBACK ──
    // If footer values weren't on a single line, calculate ground truth from parsed grades
    let sumCredits = 0;
    let sumEarnedCredits = 0;
    let sumPoints = 0;
    let hasFail = false;

    for (const g of parsedGrades) {
      const c = g.credits || 0;
      const pt = GRADE_POINTS[g.grade.trim().toUpperCase()] ?? 0;
      sumCredits += c;
      if (g.grade.trim().toUpperCase() !== 'F') {
        sumEarnedCredits += c;
      } else {
        hasFail = true;
      }
      sumPoints += c * pt;
    }

    const calculatedSGPA = sumCredits > 0 ? parseFloat((sumPoints / sumCredits).toFixed(2)) : 0.0;
    
    // Final assignment
    const finalTotalCredits = totalCredits > 0 ? totalCredits : (sumCredits > 0 ? sumCredits : 21.0);
    const finalEarnedCredits = hasFail ? sumEarnedCredits : finalTotalCredits;
    const finalSGPA = sgpa > 0 ? sgpa : calculatedSGPA;
    const finalCGPA = cgpa > 0 ? cgpa : finalSGPA;
    const finalCreditIndex = creditIndex > 0 ? creditIndex : sumPoints;
    const finalRemarks = hasFail ? "FAIL" : remarks;

    return {
      student: {
        name: studentName,
        rollNumber,
        regnNumber,
        program,
        branch,
        admissionYear,
        currentSemester: currentSemester || 1
      },
      semesterPerformance: {
        sgpa: finalSGPA,
        cgpa: finalCGPA,
        totalCredits: finalTotalCredits,
        creditsEarned: finalEarnedCredits,
        creditIndex: finalCreditIndex,
        cumulativeCredits: cumulativeCredits || undefined,
        cumulativeCreditIndex: cumulativeCreditIndex || undefined,
        remarks: finalRemarks
      },
      grades: parsedGrades
    };

  } catch (error: any) {
    console.error("PDF Parsing Error:", error);
    throw new Error(error.message || "Failed to parse grade report PDF");
  }
};
