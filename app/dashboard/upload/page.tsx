'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Upload, Check, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { parseGradeReport, ParsedPDFData } from '@/lib/pdfParser';

const MotionDiv = motion.div as any;

export default function GradeUploadPage() {
  const router = useRouter();
  const [step, setStep] = useState<'upload' | 'review'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // State for parsed data
  const [parsedData, setParsedData] = useState<ParsedPDFData | null>(null);
  
  // Local state for the editable table
  const [localGrades, setLocalGrades] = useState<any[]>([]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isUploading) return;
    setIsUploading(true);

    try {
      console.log("Initializing Parser...");
      const data = await parseGradeReport(file);
      console.log("Parsed Successfully:", data);

      if (!data.student.rollNumber || data.grades.length === 0) {
        throw new Error("Parsed data is incomplete. Found " + data.grades.length + " grades.");
      }
      
      setParsedData(data);
      
      const mappedGrades = data.grades.map((g, index) => ({
        id: index.toString(),
        semester: data.student.currentSemester,
        subjectCode: g.subjectCode,
        subjectName: g.subjectName,
        credits: g.credits,
        grade: g.grade
      }));

      setLocalGrades(mappedGrades);
      setStep('review');
    } catch (error: any) {
      console.error("Parsing Failed:", error);
      alert(`Parsing Failed: ${error.message}. \n\nCheck the browser console (F12) for details.`);
    } finally {
      setIsUploading(false);
    }
  };

  const updateGrade = (id: string, newGrade: any) => {
    setLocalGrades(prev => prev.map(g => g.id === id ? { ...g, grade: newGrade } : g));
  };

  // --- NEW: REAL SAVE LOGIC ---
  const handleConfirm = async () => {
    setIsSaving(true);
    
    try {
      // Send data to our new API route
      const response = await fetch('/api/grades/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           student: parsedData?.student,
           semesterPerformance: parsedData?.semesterPerformance,
           grades: localGrades
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save data");
      }

      console.log("Successfully Saved:", result);
      
      // Success Redirect
      router.push('/dashboard'); 
      
    } catch (error: any) {
      console.error("Save failed", error);
      alert(`Failed to save data to cloud: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (step === 'upload') {
    return (
      <div className="max-w-2xl mx-auto pt-12 text-center">
        <MotionDiv 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-display font-medium mb-2 text-foreground">INGEST <span className="text-primary">GRADES</span></h2>
          <p className="text-muted-foreground">Upload your Semester Grade Report (PDF) for parsing.</p>
        </MotionDiv>

        <MotionDiv 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.02, borderColor: "#ccff00", backgroundColor: "rgba(204, 255, 0, 0.02)" }}
          whileTap={{ scale: 0.98 }}
          className={`relative border-2 border-dashed bg-card p-8 md:p-12 flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden ${
            isUploading ? 'border-primary opacity-80' : 'border-input'
          }`}
        >
           {/* File Input */}
           <input 
             type="file" 
             accept=".pdf" 
             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
             onChange={handleUpload}
             disabled={isUploading}
           />

           {isUploading && (
             <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-20 pointer-events-none">
               <div className="flex flex-col items-center gap-3">
                 <Loader2 size={32} className="text-primary animate-spin" />
                 <span className="text-xs font-mono text-foreground uppercase tracking-widest animate-pulse">Parsing Document...</span>
               </div>
             </div>
           )}

           <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-6 text-muted-foreground group-hover:text-primary transition-colors z-10">
             <Upload size={32} />
           </div>
           <h3 className="text-foreground font-medium mb-2 z-10">Drop PDF here or click to upload</h3>
           <p className="text-xs text-muted-foreground z-10">Supports KIIT SAP Portal Exports</p>
        </MotionDiv>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pt-4 md:pt-8 pb-20">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <MotionDiv initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-2xl md:text-3xl font-display font-medium mb-2 text-foreground">VERIFY <span className="text-primary">DATA</span></h2>
          <div className="flex flex-wrap gap-3 text-xs font-mono text-muted-foreground">
             <span className="px-2 py-1 bg-muted rounded border border-input text-foreground">
                SEM: <span className="text-primary">{parsedData?.student.currentSemester || "N/A"}</span>
             </span>
             <span className="px-2 py-1 bg-muted rounded border border-input text-foreground">
                ROLL: <span className="text-primary">{parsedData?.student.rollNumber || "N/A"}</span>
             </span>
             <span className="px-2 py-1 bg-muted rounded border border-input text-foreground">
                SGPA: <span className="text-primary">{parsedData?.semesterPerformance.sgpa || "0.0"}</span>
             </span>
             <span className={`px-2 py-1 rounded border font-bold ${
                parsedData?.semesterPerformance.remarks === "FAIL" 
                ? "bg-red-900/20 border-red-900/50 text-red-500" 
                : "bg-green-900/20 border-green-900/50 text-green-500"
             }`}>
                {parsedData?.semesterPerformance.remarks || "PENDING"}
             </span>
          </div>
        </MotionDiv>
        
        <MotionDiv 
          onClick={handleConfirm}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05, backgroundColor: "#b3e600" }}
          whileTap={{ scale: 0.95 }}
          className="w-full md:w-auto px-6 py-3 bg-primary text-black font-bold uppercase tracking-widest text-xs cursor-pointer flex items-center justify-center gap-2 transition-colors rounded-sm"
        >
          {isSaving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Confirm & Save'}
        </MotionDiv>
      </div>

      {/* Review Table */}
      <MotionDiv 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border relative overflow-hidden rounded-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-border bg-[#151518] text-muted-foreground text-xs uppercase tracking-widest">
                <th className="p-4 font-medium w-32">Code</th>
                <th className="p-4 font-medium">Subject</th>
                <th className="p-4 font-medium w-24 text-center">Credits</th>
                <th className="p-4 font-medium w-24 text-center">Grade</th>
              </tr>
            </thead>
            <tbody>
              {localGrades.map((grade, i) => (
                <MotionDiv 
                  key={grade.id} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  as="tr"
                  className="border-b border-border text-sm hover:bg-[#151518] transition-colors group"
                >
                  <td className="p-4 font-mono text-muted-foreground group-hover:text-foreground transition-colors">{grade.subjectCode}</td>
                  <td className="p-4 text-foreground font-medium">{grade.subjectName}</td>
                  <td className="p-4 text-muted-foreground text-center">{grade.credits}</td>
                  <td className="p-4 text-center">
                    <div className="inline-block relative">
                        <select 
                        value={grade.grade}
                        disabled={isSaving}
                        className="appearance-none bg-accent border border-input text-foreground py-1 px-3 pr-8 text-xs outline-none focus:border-primary disabled:opacity-50 cursor-pointer transition-colors hover:border-input rounded-sm font-bold"
                        onChange={(e: any) => updateGrade(grade.id, e.target.value)}
                        >
                        {['O','E','A','B','C','D','F'].map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                            <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                  </td>
                </MotionDiv>
              ))}
            </tbody>
          </table>
        </div>
      </MotionDiv>
      
      <div className="mt-4 flex items-center gap-2 text-xs text-orange-400">
        <AlertCircle size={12} className="shrink-0" />
        <span>Parsing accuracy is high. Please verify grades manually before saving.</span>
      </div>
    </div>
  );
}