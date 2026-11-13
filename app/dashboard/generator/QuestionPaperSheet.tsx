'use client';

import React from 'react';

interface QuestionPaperSheetProps {
  content: string;
  subjectCode?: string;
  subjectName?: string;
  facultyName?: string;
  examType?: string;
  fullMarks?: number;
  duration?: string;
}

export function QuestionPaperSheet({
  content,
  subjectCode,
  subjectName,
  facultyName,
  examType,
  fullMarks = 60,
  duration = '3.0 Hours',
}: QuestionPaperSheetProps) {
  // Parse lines to detect sections, code blocks, tables, and headers
  const renderFormattedPaper = () => {
    const lines = content.replace(/\r\n/g, '\n').split('\n');
    const elements: React.ReactNode[] = [];

    let inCodeBlock = false;
    let codeBuffer: string[] = [];
    let codeLang = '';

    let inTable = false;
    let tableBuffer: string[] = [];

    // Helper to flush code buffer
    const flushCode = (key: string) => {
      if (codeBuffer.length > 0) {
        elements.push(
          <div key={key} className="my-3 rounded border border-slate-300 bg-slate-50 p-3 shadow-inner">
            <div className="mb-1 text-[10px] font-mono uppercase tracking-wider text-slate-500">
              {codeLang || 'Code Snippet'}
            </div>
            <pre className="overflow-x-auto font-mono text-xs text-slate-800 leading-relaxed">
              {codeBuffer.join('\n')}
            </pre>
          </div>
        );
        codeBuffer = [];
        inCodeBlock = false;
      }
    };

    // Helper to flush table buffer
    const flushTable = (key: string) => {
      if (tableBuffer.length > 0) {
        const rows = tableBuffer
          .map(r => r.trim())
          .filter(r => r.startsWith('|') && r.endsWith('|'))
          .map(r => r.slice(1, -1).split('|').map(c => c.trim()));

        if (rows.length >= 2) {
          const headerRow = rows[0];
          // Skip row[1] if it's separator like |---|---|
          const bodyRows = rows.slice(1).filter(r => !r.every(c => /^[-:]+$/.test(c)));

          elements.push(
            <div key={key} className="my-3 overflow-x-auto">
              <table className="w-full max-w-lg border-collapse border border-slate-800 font-sans text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-800">
                    {headerRow.map((h, i) => (
                      <th key={i} className="border border-slate-700 px-3 py-1.5 text-left font-bold text-slate-900">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bodyRows.map((row, ri) => (
                    <tr key={ri} className="border-b border-slate-300">
                      {row.map((cell, ci) => (
                        <td key={ci} className="border border-slate-400 px-3 py-1.5 text-slate-800">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        tableBuffer = [];
        inTable = false;
      }
    };

    // Helper to format inline markdown (bolding, tags, marks)
    const formatInline = (text: string) => {
      // Replace **bold** with <strong>
      const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\([^)]*marks?[^)]*\)|\[CO[1-5]\]|\[\d+\s*marks?\])/gi);
      return parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={idx} className="font-bold text-slate-950">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={idx} className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px] border border-slate-300 text-slate-800">{part.slice(1, -1)}</code>;
        }
        if (/^\s*\[CO[1-5]\]\s*$/i.test(part)) {
          return <span key={idx} className="ml-1 inline-block rounded bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 font-mono text-[10px] font-bold text-indigo-700">{part}</span>;
        }
        if (/^\s*(\([^)]*marks?[^)]*\)|\[\d+\s*marks?\])\s*$/i.test(part)) {
          return <span key={idx} className="ml-1 inline-block rounded bg-slate-100 border border-slate-300 px-1.5 py-0.2 font-mono text-[10px] font-bold text-slate-700">{part}</span>;
        }
        return part;
      });
    };

    // Main line by line iteration
    let skipHeaderUntilSeparatorCount = 0;
    let headerSeparatorCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Check code blocks
      if (trimmed.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLang = trimmed.slice(3).trim();
          codeBuffer = [];
        } else {
          flushCode(`code-${i}`);
        }
        continue;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        continue;
      }

      // Check table rows
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        inTable = true;
        tableBuffer.push(trimmed);
        continue;
      } else if (inTable) {
        flushTable(`table-${i}`);
      }

      // Skip duplicated University Header lines from LLM since we render the official embossed university header
      if (/^=+\s*$/.test(trimmed)) {
        headerSeparatorCount++;
        continue;
      }
      if (/^-+\s*$/.test(trimmed)) {
        continue;
      }
      if (
        /KALINGA INSTITUTE OF INDUSTRIAL TECHNOLOGY/i.test(trimmed) ||
        /Deemed to be University/i.test(trimmed) ||
        /SCHOOL OF ELECTRONICS/i.test(trimmed) ||
        /AUTUMN.*EXAMINATION/i.test(trimmed) ||
        /Course:\s*/i.test(trimmed) ||
        /Course Code:\s*/i.test(trimmed) ||
        /Faculty Examiner:\s*/i.test(trimmed) ||
        /Full Marks:\s*\d+/i.test(trimmed) ||
        /Answer ALL questions from SECTION A/i.test(trimmed)
      ) {
        // Skip header lines as they are presented in the top canvas banner
        continue;
      }

      // Detect Section Headers (SECTION A, SECTION B)
      if (/^SECTION\s+[A-Z]\b/i.test(trimmed)) {
        elements.push(
          <div key={`sec-${i}`} className="mt-6 mb-2 border-b-2 border-slate-900 pb-1">
            <h3 className="font-serif text-sm sm:text-base font-bold uppercase tracking-wider text-slate-950 flex items-center justify-between">
              <span>{trimmed}</span>
            </h3>
          </div>
        );
        continue;
      }

      // Detect sub-instructions like [Answer all questions. Each question carries 2 marks]
      if (/^\[Answer\s+.*\]$/i.test(trimmed)) {
        elements.push(
          <div key={`inst-${i}`} className="mb-3 font-serif text-xs italic text-slate-700">
            {trimmed}
          </div>
        );
        continue;
      }

      // Question start lines like "1. (a)", "2. (a)", "(b)", etc.
      if (/^(\d+\.\s*\([a-z]\)|\([a-z]\))\s+/i.test(trimmed)) {
        elements.push(
          <div key={`q-${i}`} className="my-2.5 text-xs sm:text-sm font-serif leading-relaxed text-slate-900">
            {formatInline(trimmed)}
          </div>
        );
        continue;
      }

      // Bullet points
      if (/^[-*•]\s+/i.test(trimmed)) {
        elements.push(
          <div key={`b-${i}`} className="ml-5 my-1 text-xs sm:text-sm font-serif leading-relaxed text-slate-800 list-item list-disc">
            {formatInline(trimmed.replace(/^[-*•]\s+/, ''))}
          </div>
        );
        continue;
      }

      // General text line
      if (trimmed.length > 0) {
        elements.push(
          <p key={`p-${i}`} className="my-1.5 text-xs sm:text-sm font-serif leading-relaxed text-slate-900">
            {formatInline(trimmed)}
          </p>
        );
      }
    }

    // Flush any pending buffers
    if (inCodeBlock) flushCode('code-end');
    if (inTable) flushTable('table-end');

    return elements;
  };

  return (
    <div className="relative mx-auto w-full max-w-4xl bg-white text-slate-900 border border-slate-300 shadow-2xl rounded-sm p-6 sm:p-12 font-serif min-h-[900px] select-text">
      
      {/* Background Watermark */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03] select-none">
        <div className="text-center font-serif text-6xl sm:text-8xl font-black uppercase tracking-widest text-black rotate-[-25deg]">
          KIIT UNIVERSITY
        </div>
      </div>

      {/* University Official Header */}
      <div className="relative z-10 text-center space-y-1 pb-2">
        <h1 className="font-serif text-base sm:text-xl font-bold uppercase tracking-widest text-slate-950">
          KALINGA INSTITUTE OF INDUSTRIAL TECHNOLOGY
        </h1>
        <div className="font-serif text-[11px] sm:text-xs italic text-slate-600">
          (Deemed to be University U/S 3 of the UGC Act, 1956)
        </div>
        <div className="font-serif text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-800 pt-0.5">
          SCHOOL OF ELECTRONICS &amp; COMPUTER SCIENCE
        </div>
        <div className="font-serif text-[11px] text-slate-500 uppercase tracking-widest">
          BHUBANESWAR, ODISHA · PIN-751024
        </div>
      </div>

      {/* Double Border Rules */}
      <div className="relative z-10 my-3 border-t-2 border-b border-slate-900 py-1" />

      {/* Examination Session & Metadata Box */}
      <div className="relative z-10 space-y-2 font-serif text-xs sm:text-sm">
        <div className="text-center font-bold uppercase tracking-wider text-slate-900 text-xs sm:text-sm">
          AUTUMN {examType === 'mid_sem' ? 'MID SEMESTER' : 'END SEMESTER'} EXAMINATION — 2026–2027
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 pt-1 border-t border-slate-300 pb-2">
          <div>
            <span className="font-bold">Course:</span> {subjectName || 'Software Testing and Automation'}
          </div>
          <div className="sm:text-right">
            <span className="font-bold">Course Code:</span> <span className="font-mono">{subjectCode || 'CS40003'}</span>
          </div>
          <div>
            <span className="font-bold">Faculty Examiner:</span> {facultyName || 'Faculty In-Charge'}
          </div>
          <div className="sm:text-right font-bold">
            Full Marks: {fullMarks} &nbsp;&nbsp;|&nbsp;&nbsp; Time: {duration}
          </div>
        </div>
      </div>

      {/* Compulsory Instruction Banner */}
      <div className="relative z-10 my-2 border-y border-slate-800 bg-slate-50 py-1.5 px-3 text-center font-serif text-xs sm:text-sm font-semibold italic text-slate-800">
        Answer ALL questions from SECTION A and any THREE questions from SECTION B.
      </div>

      {/* Formatted Examination Body */}
      <div className="relative z-10 pt-2 space-y-3">
        {renderFormattedPaper()}
      </div>

      {/* Paper Footer */}
      <div className="relative z-10 mt-12 pt-4 border-t border-slate-400 text-center text-xs font-serif italic text-slate-500">
        — END OF QUESTION PAPER —
      </div>

    </div>
  );
}
