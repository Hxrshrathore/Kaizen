const fs = require('fs');

async function testPaper() {
  const startTime = Date.now();
  const prompt = `You are an official Senior Examination Paper Setter for Kalinga Institute of Industrial Technology (KIIT Deemed to be University).
Generate a complete, official End Semester Examination Question Paper for:
Subject: Engineering Professional Practice (EX40003)
Program: B.Tech (Electronics & Computer Science Engineering) - 7th Semester
Time: 3 Hours | Full Marks: 100

Format Requirement:
- Header: KIIT DEEMED TO BE UNIVERSITY, BHUBANESWAR - 24, End Semester Examination 2026-2027
- Instructions: Answer any 5 questions including Question No. 1 which is compulsory.
- Part A: Compulsory Question (10 short questions of 2 marks each = 20 marks)
- Part B: 5 Long Descriptive Questions (Answer any 4 out of 6 questions, 20 marks each with sub-divisions [a], [b], [c] matching Bloom's taxonomy: [CO1, CO2, etc.]).
Include realistic scenarios on Engineering Ethics, NSPE Code of Conduct, IPR & Patents, Environmental Impact, and Professional Liability.
Output the full text of the question paper cleanly formatted with markdown.`;

  const resp = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer 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',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 8192,
      temperature: 0.6,
      top_p: 0.95
    })
  });

  const data = await resp.json();
  const choice = data.choices?.[0];
  console.log('Finish reason:', choice?.finish_reason);
  console.log('Usage:', JSON.stringify(data.usage));
  console.log('Reasoning length:', choice?.message?.reasoning_content?.length);
  console.log('Content length:', choice?.message?.content?.length);
  console.log('Elapsed sec:', ((Date.now() - startTime)/1000).toFixed(1));
  console.log('--- PREVIEW (First 500 chars) ---');
  console.log(choice?.message?.content?.slice(0, 500));
  console.log('--- PREVIEW (Last 500 chars) ---');
  console.log(choice?.message?.content?.slice(-500));
}

testPaper().catch(console.error);
