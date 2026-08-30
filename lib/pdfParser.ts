// lib/pdfParser.ts

// Note: No top-level import of 'pdfjs-dist' to avoid Server-Side Rendering crashes.

export interface ParsedPDFData {
  student: {
    name: string;
    rollNumber: string;
    regnNumber: string;
    program: string;
    admissionYear: string;
    currentSemester: number;
  };
  semesterPerformance: {
    sgpa: number;
    cgpa: number;
    totalCredits: number;
    creditIndex: number;
    remarks: string;
  };
  grades: {
    subjectCode: string;
    subjectName: string;
    credits: number;
    grade: string;
  }[];
}

export const parseGradeReport = async (file: File): Promise<ParsedPDFData> => {
  // 1. DYNAMIC IMPORT (Crucial for Next.js)
  // We import inside the function so it only runs in the browser.
  const pdfjsLib = await import('pdfjs-dist');

  // 2. WORKER CONFIGURATION
  // using the Legacy build as requested for stability
  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.mjs`;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Load Document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    // Get First Page
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    
    // Clean and Extract Items
    const items = textContent.items
      .map((item: any) => item.str.trim())
      .filter((str: string) => str.length > 0);

    // --- 1. EXTRACT STUDENT IDENTITY ---
    const rollMatch = items.find(s => /^\d{7}$/.test(s));
    const rollNumber = rollMatch || "Unknown";

    const regnMatch = items.find(s => /^\d{10,}$/.test(s));
    const regnNumber = regnMatch || "Unknown";

    const semMatch = items.find(s => /^\d{1,2}(st|nd|rd|th)$/i.test(s));
    const currentSemester = semMatch ? parseInt(semMatch) : 0;

    const yearIndex = items.findIndex(s => s.includes("YEAR OF ADMISSION"));
    let admissionYear = "2023";
    if (yearIndex !== -1) {
      const yearStr = items[yearIndex].match(/\d{4}/);
      if (yearStr) admissionYear = yearStr[0];
      else if (items[yearIndex + 1]?.match(/\d{4}/)) admissionYear = items[yearIndex + 1];
    }

    const nameIndex = items.findIndex(s => s.includes("STUDENT'S NAME"));
    let studentName = "Unknown";
    if (nameIndex !== -1) {
      const candidates = items.slice(nameIndex + 1, nameIndex + 15);
      const ignoreList = ["ROLL NUMBER", "REGN", "SEMESTER", "NUMBER", ":", "PROGRAMME", "OF", "ADMISSION"];
      studentName = candidates.find(s => 
        !ignoreList.some(ignore => s.includes(ignore)) && 
        !/^\d/.test(s) && 
        s.length > 2
      ) || "Unknown";
    }

    const progIndex = items.findIndex(s => s.includes("PROGRAMME"));
    const program = progIndex !== -1 ? items[progIndex + 1]?.replace(/[^a-zA-Z\s&]/g, "").trim() : "B.Tech";

    // --- 2. EXTRACT GRADES ---
    const grades: any[] = [];
    const codeRegex = /^[A-Z]{2}\d{5}$/; // e.g. CS20002
    const validGrades = ['O', 'E', 'A', 'B', 'C', 'D', 'F'];

    for (let i = 0; i < items.length; i++) {
      if (codeRegex.test(items[i])) {
        const subjectCode = items[i];
        let gradeIndex = -1;
        
        // Look ahead for the grade (up to 15 steps)
        for (let k = 1; k <= 15; k++) {
          const potentialGrade = items[i + k];
          if (validGrades.includes(potentialGrade)) {
             // The item before the grade should be the credits (1-9)
             if (/^[1-9]$/.test(items[i + k - 1])) {
                gradeIndex = i + k;
                break;
             }
          }
        }

        if (gradeIndex !== -1) {
          const grade = items[gradeIndex];
          const credits = parseInt(items[gradeIndex - 1]);
          const rawNameParts = items.slice(i + 1, gradeIndex - 1);
          const subjectName = rawNameParts
            .filter(part => !part.includes("COURSE") && !part.includes("CREDIT"))
            .join(" ");

          grades.push({ subjectCode, subjectName, credits, grade });
        }
      }
    }

    // --- 3. EXTRACT SUMMARY ---
    
    // REMARKS
    const remarksIndex = items.findIndex(s => s.startsWith("REMARKS"));
    let remarks = "Unknown";
    
    if (remarksIndex !== -1) {
        const rawRemark = items[remarksIndex];
        if (rawRemark.includes("PASS")) remarks = "PASS";
        else if (rawRemark.includes("FAIL")) remarks = "FAIL";
        else {
            const nextItem = items[remarksIndex + 1];
            if (nextItem && (nextItem.includes("PASS") || nextItem.includes("FAIL"))) {
                remarks = nextItem.includes("PASS") ? "PASS" : "FAIL";
            }
        }
    }

    // SGPA/CGPA Extraction
    const cgpaHeaderIndex = items.lastIndexOf("CGPA");
    
    const footerNumbers = items.slice(cgpaHeaderIndex + 1)
        .map(s => parseFloat(s))
        .filter(n => !isNaN(n));

    let sgpa = 0.0;
    let cgpa = 0.0;
    let totalCredits = 0;
    let creditIndex = 0;

    if (footerNumbers.length >= 6) {
        totalCredits = footerNumbers[0];
        creditIndex = footerNumbers[1];
        sgpa = footerNumbers[2];
        cgpa = footerNumbers[5];
    } else {
        const gpas = footerNumbers.filter(n => n > 0 && n <= 10 && n % 1 !== 0);
        if (gpas.length > 0) sgpa = gpas[0];
        if (gpas.length > 1) cgpa = gpas[gpas.length - 1];
    }

    return {
      student: { name: studentName, rollNumber, regnNumber, program, admissionYear, currentSemester },
      semesterPerformance: { sgpa, cgpa, totalCredits, creditIndex, remarks },
      grades
    };

  } catch (error: any) {
    console.error("PDF.js Error:", error);
    throw new Error(error.message || "Worker initialization failed");
  }
};