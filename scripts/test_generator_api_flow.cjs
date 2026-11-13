const fs = require('fs');

async function testGeneratorApiFlow() {
  const startTime = Date.now();
  console.log('Testing AI Question Paper Generation with NVIDIA Nemotron 30B...');

  const promptText = `
You are the official Senior Examination Paper Setter: Prof. P. Dutta (School of Electronics and Computer Science Engineering, ECS GROUP-03).
Target Exam: KIIT Autumn End Semester Examination 2026-2027
Subject: Engineering Professional Practice (EX40003)
Full Marks: 60 | Duration: 3.0 Hours

Grounding Data from Google Classroom Assignments & Modules:
1. [ASSIGNMENT] Assignment-I: Module 1 Professional Ethics, NSPE Code of Conduct & Integrity
2. [ASSIGNMENT] Assignment-II: Module 2 Engineering Economics, Discounted Cash Flow & Project Appraisal
3. [ASSIGNMENT] Assignment-3: Module 3 Intellectual Property Rights (IPR), Patent Filing & Infringement
4. [ASSIGNMENT] Assignment-IV: Module 4 Environmental Impact Assessment, Sustainable Engineering & Liability
5. [MODEL_QUESTIONS] Model Questions (Till Mid Semester): Short Answer & Conceptual Questions

Historical PYQ Pattern Analysis:
- High recurrence topics: Professional Ethics & Code of Conduct (NSPE/IEEE), Engineering Economics & Depreciation, Intellectual Property Rights (IPR) & Patent Claims, Contracts & Arbitration
- Recurrence confidence rate: 89%

Format strictly as follows:
================================================================================
                    KALINGA INSTITUTE OF INDUSTRIAL TECHNOLOGY
                 (Deemed to be University U/S 3 of the UGC Act, 1956)
                    SCHOOL OF ELECTRONICS & COMPUTER SCIENCE
================================================================================
AUTUMN END SEMESTER EXAMINATION - 2026-2027
Course: Engineering Professional Practice
Course Code: EX40003
Faculty Examiner: Prof. P. Dutta (ECS GROUP-03)
Full Marks: 60                                                    Time: 3.0 Hours
--------------------------------------------------------------------------------
Answer ALL questions from SECTION A and any THREE questions from SECTION B.
--------------------------------------------------------------------------------

SECTION A (Compulsory - Short Answer / Conceptual)
[Answer all questions. Each question carries 2 marks]
1. (a) [Question covering core concept grounded in Classroom Assignment 1]
   (b) [Question covering principle from Classroom Module 2]
   (c) [Question covering edge cases / definitions from Module 3]
   (d) [Question covering design trade-offs / ethical compliance]
   (e) [Question testing analytical understanding]

SECTION B (Analytical & Problem Solving)
[Answer any 3 questions. Each question carries 10 marks with CO mappings]
2. (a) [Numerical / Problem solving with specific parameters] (6 marks) [CO1]
   (b) [Theoretical comparison or block diagram explanation] (4 marks) [CO2]

3. (a) [Detailed scenario-based case study question from Classroom Homework] (6 marks) [CO3]
   (b) [Evaluation or derivation question] (4 marks) [CO2]

4. (a) [Algorithmic / Graph / Design calculation] (6 marks) [CO4]
   (b) [State machine or verification analysis] (4 marks) [CO4]

5. (a) [Comprehensive synthesis problem] (6 marks) [CO5]
   (b) [Practical industry application or failure mode analysis] (4 marks) [CO5]
================================================================================
`.trim();

  const apiKey = "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";
  const resp = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
      messages: [{ role: "user", content: promptText }],
      temperature: 0.6,
      top_p: 0.95,
      max_tokens: 8192,
    }),
  });

  console.log('HTTP Status:', resp.status);
  const data = await resp.json();
  const choice = data.choices?.[0];
  console.log('Model:', data.model);
  console.log('Finish reason:', choice?.finish_reason);
  console.log('Usage:', JSON.stringify(data.usage));
  console.log('Reasoning length (chars):', choice?.message?.reasoning_content?.length);
  console.log('Content length (chars):', choice?.message?.content?.length);
  console.log('Elapsed sec:', ((Date.now() - startTime) / 1000).toFixed(1));

  console.log('\n--- FIRST 600 CHARS OF PAPER ---');
  console.log(choice?.message?.content?.slice(0, 600));
  console.log('\n--- LAST 400 CHARS OF PAPER ---');
  console.log(choice?.message?.content?.slice(-400));
}

testGeneratorApiFlow().catch(console.error);

