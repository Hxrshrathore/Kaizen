const samplePaper = `================================================================================
                    KALINGA INSTITUTE OF INDUSTRIAL TECHNOLOGY
                 (Deemed to be University U/S 3 of the UGC Act, 1956)
                    SCHOOL OF ELECTRONICS & COMPUTER SCIENCE
================================================================================
AUTUMN END SEMESTER EXAMINATION - 2026-2027
Course: Software Testing and Automation
Course Code: CS40003
Faculty Examiner: Prof. Proshikshya Mukherjee (ECS GROUP-03)
Full Marks: 60                                                    Time: 3.0 Hours
--------------------------------------------------------------------------------
Answer ALL questions from SECTION A and any THREE questions from SECTION B.
--------------------------------------------------------------------------------

SECTION A (Compulsory - Short Answer / Conceptual)
[Answer all questions. Each question carries 2 marks]
1. (a) Explain the importance of test case prioritization in a regression testing suite, referencing the prioritization exercise you performed in Assignment‑1.
   (b) State and explain the principle of “Test Independence” as presented in Classroom Module 2, and provide a brief example of its application in a testing scenario.
   (c) Define “Boundary Value Analysis”. Give an example of a boundary value for a function that accepts an integer age ranging from 0 to 120.
   (d) Discuss the trade‑off between test automation coverage and maintenance cost, and illustrate how ethical considerations (e.g., data privacy) influence test design decisions.
   (e) Given a decision table with three conditions (C1, C2, C3) and two actions (A1, A2), determine the minimum number of test cases required to achieve statement coverage and justify your answer.

SECTION B (Analytical & Problem Solving)
[Answer any THREE questions. Each question carries 10 marks with CO mappings]

2. (a) [Numerical / Problem solving with specific parameters] (6 marks) [CO1]  
   Consider the following fragment of C code:  

   \`\`\`c
   int foo(int x) {
       if (x > 0) return 1;
       else if (x == 0) return 0;
       else return -1;
   }
   \`\`\`  

   Compute the cyclomatic complexity V(G) of the control‑flow graph of \`foo\`. Show all steps (e.g., number of predicate nodes, edges, and the formula V(G) = E – N + 2P).  

   (b) [Theoretical comparison or block diagram explanation] (4 marks) [CO2]  
   Compare Equivalence Partitioning and Boundary Value Analysis. Illustrate your answer with a block diagram or a concise textual comparison that highlights their objectives, strengths, and limitations.

3. (a) [Detailed scenario‑based case study from Classroom Homework] (6 marks) [CO3]  
   A banking application must validate user login through three subsystems: (i) User Credential Check, (ii) Account Lockout Engine, and (iii) Session Management.  
   - Design at least four integration test cases that exercise different combinations of success and failure in these subsystems.  
   - Specify the test level (e.g., component, integration, system) for each case and justify your choice.  

   (b) [Evaluation or derivation question] (4 marks) [CO2]  
   Evaluate the effectiveness of a given test automation framework (e.g., Selenium with TestNG) in terms of Return on Investment (ROI). Consider factors such as initial setup cost, maintenance effort, and coverage achieved.

4. (a) [Algorithmic / Graph / Design calculation] (6 marks) [CO4]  
   Draw the state‑transition diagram for a simple vending‑machine controller that has the states: **Idle**, **CoinInserted**, **SelectionMade**, **Dispense**, and **ReturnChange**.  
   - Include all valid transitions based on inputs: “Insert Coin”, “Select Item”, “Cancel”, and “Dispense”.  
   - Determine the total number of distinct test paths that exercise each state at least once.

   (b) [State machine or verification analysis] (4 marks) [CO4]  
   A finite state machine (FSM) is specified with the following transition table:  

   | Current \\ Input | 0 | 1 |
   |-----------------|---|---|
   | **A**           | B | C |
   | **B**           | A | B |
   | **C**           | C | D |

   Verify whether this FSM satisfies the property “If the machine ever reaches state D, it must have previously been in state A”. Provide a brief justification using the concept of reachability.

5. (a) [Comprehensive synthesis problem] (6 marks) [CO5]  
   Draft a high‑level test plan for a newly developed mobile e‑commerce application. Your plan should include:  
   - The test levels to be employed (e.g., unit, integration, system, acceptance).  
   - The types of testing to be performed (e.g., functional, performance, security, usability).  
   - A brief description of the automation strategy (tools, scope, and frequency).  

   (b) [Practical industry application or failure mode analysis] (4 marks) [CO5]  
   Discuss a real‑world software failure (e.g., the 2010 Flash Crash of a major airline’s reservation system) that resulted from insufficient testing. Explain how the failure could have been prevented through better testing practices.
================================================================================`;

function parseQuestionPaper(rawText) {
  // Clean raw input
  const text = rawText.replace(/\r\n/g, '\n');

  // Find Section A start
  const sectionAMatch = text.match(/SECTION\s+A\b/i);
  let headerPart = '';
  let bodyPart = text;

  if (sectionAMatch && sectionAMatch.index !== undefined) {
    headerPart = text.slice(0, sectionAMatch.index);
    bodyPart = text.slice(sectionAMatch.index);
  }

  // Parse Header Information
  const university = "KALINGA INSTITUTE OF INDUSTRIAL TECHNOLOGY";
  const universitySub = "(Deemed to be University U/S 3 of the UGC Act, 1956)";
  
  let school = "SCHOOL OF ELECTRONICS & COMPUTER SCIENCE";
  const schoolMatch = headerPart.match(/SCHOOL\s+OF\s+[^\n=]+/i);
  if (schoolMatch) school = schoolMatch[0].trim();

  let examSession = "AUTUMN END SEMESTER EXAMINATION - 2026-2027";
  const sessionMatch = headerPart.match(/(AUTUMN|SPRING)[^\n]+/i);
  if (sessionMatch) examSession = sessionMatch[0].trim();

  let course = "Software Testing and Automation";
  const courseMatch = headerPart.match(/Course:\s*([^\n]+)/i);
  if (courseMatch) course = courseMatch[1].trim();

  let courseCode = "CS40003";
  const codeMatch = headerPart.match(/Course Code:\s*([^\n]+)/i);
  if (codeMatch) courseCode = codeMatch[1].trim();

  let faculty = "Prof. Proshikshya Mukherjee (ECS GROUP-03)";
  const facultyMatch = headerPart.match(/Faculty Examiner:\s*([^\n]+)/i);
  if (facultyMatch) faculty = facultyMatch[1].trim();

  let fullMarks = "60";
  const marksMatch = headerPart.match(/Full Marks:\s*(\d+)/i);
  if (marksMatch) fullMarks = marksMatch[1];

  let time = "3.0 Hours";
  const timeMatch = headerPart.match(/Time:\s*([^\n-]+)/i);
  if (timeMatch) time = timeMatch[1].trim();

  let instructions = "Answer ALL questions from SECTION A and any THREE questions from SECTION B.";
  const instMatch = headerPart.match(/Answer ALL[^\n-]+/i);
  if (instMatch) instructions = instMatch[0].trim();

  // Parse Sections from bodyPart
  const sectionSplits = bodyPart.split(/(?=SECTION\s+[A-Z]\b)/i);
  const sections = [];

  for (const rawSec of sectionSplits) {
    const trimmed = rawSec.trim();
    if (!trimmed) continue;

    const lines = trimmed.split('\n');
    const titleLine = lines[0].replace(/^=+\s*/, '').replace(/\s*=+\s*$/, '').trim();
    
    // Check if second line is an instruction block like [Answer all questions...]
    let subInstruction = '';
    let startIdx = 1;
    if (lines.length > 1 && /^\s*\[.*\]\s*$/.test(lines[1])) {
      subInstruction = lines[1].trim();
      startIdx = 2;
    }

    const contentLines = lines.slice(startIdx);
    sections.push({
      title: titleLine,
      subInstruction,
      content: contentLines.join('\n').trim()
    });
  }

  return {
    header: {
      university,
      universitySub,
      school,
      examSession,
      course,
      courseCode,
      faculty,
      fullMarks,
      time,
      instructions
    },
    sections
  };
}

const parsed = parseQuestionPaper(samplePaper);
console.log('Parsed Header:', JSON.stringify(parsed.header, null, 2));
console.log('Sections Count:', parsed.sections.length);
parsed.sections.forEach((s, i) => {
  console.log(`Section ${i+1}: ${s.title} (${s.content.length} chars)`);
});
