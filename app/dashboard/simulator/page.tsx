'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, CheckCircle2, XCircle, Target, Loader2, Calculator, ChevronDown } from 'lucide-react';

// --- TYPES ---
interface SimulatorSubject {
  id: string;
  name: string;
  credits: number;
  internal: number; // Max 50
  external: number; // Max 50
  projectedGrade: string; 
  projectedPoint: number;
}

interface SimulationResult {
  sgpa: string;
  totalCredits: number;
  creditIndex: number;
  breakdown: { label: string; count: number; color: string }[];
}

interface StrategyItem {
  subjectName: string;
  currentGrade: string;
  targetGrade: string;
  pointsNeeded: number;
  message: string;
}

interface TargetAnalysis {
  isPossible: boolean;
  gap: number;
  maxPossibleSGPA: string;
  strategy: StrategyItem[];
}

// --- KIIT GRADING UTILS ---
const getGradePoint = (marks: number) => {
  if (marks >= 90) return 10;
  if (marks >= 80) return 9;
  if (marks >= 70) return 8;
  if (marks >= 60) return 7;
  if (marks >= 50) return 6;
  if (marks >= 40) return 5;
  return 2;
};

const getGradeLetter = (marks: number) => {
  if (marks >= 90) return 'O';
  if (marks >= 80) return 'E';
  if (marks >= 70) return 'A';
  if (marks >= 60) return 'B';
  if (marks >= 50) return 'C';
  if (marks >= 40) return 'D';
  return 'F';
};

// Helper: Estimate marks from a Grade Letter (since DB doesn't have raw marks)
const getEstimatedMarksFromGrade = (grade: string) => {
  switch (grade) {
    case 'O': return { int: 48, ext: 47 }; // Total 95
    case 'E': return { int: 43, ext: 42 }; // Total 85
    case 'A': return { int: 38, ext: 37 }; // Total 75
    case 'B': return { int: 33, ext: 32 }; // Total 65
    case 'C': return { int: 28, ext: 27 }; // Total 55
    case 'D': return { int: 23, ext: 22 }; // Total 45
    case 'F': return { int: 15, ext: 15 }; // Total 30
    default: return { int: 0, ext: 0 };
  }
};

const getGradeColor = (grade: string) => {
  switch (grade) {
    case 'O': return 'text-primary';
    case 'E': return 'text-green-400';
    case 'A': return 'text-blue-400';
    case 'B': return 'text-cyan-400';
    case 'C': return 'text-yellow-400';
    case 'D': return 'text-orange-400';
    default: return 'text-red-500';
  }
};

const MotionDiv = motion.div as any;

export default function SimulatorPage() {
  const [subjects, setSubjects] = useState<SimulatorSubject[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [fullHistory, setFullHistory] = useState<any[]>([]);
  const [availableSemesters, setAvailableSemesters] = useState<number[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);

  const [targetSGPA, setTargetSGPA] = useState<string>("9.0");
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [targetAnalysis, setTargetAnalysis] = useState<TargetAnalysis | null>(null);

  // --- 1. INITIAL FETCH ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch('/api/grades/history');
        const data = await res.json();
        
        if (data.history?.length > 0) {
          setFullHistory(data.history);
          
          // Extract unique semesters and sort descending (latest first)
          const semesters = Array.from(new Set(data.history.map((h: any) => h.semester))).sort((a: any, b: any) => b - a) as number[];
          
          setAvailableSemesters(semesters);
          if (semesters.length > 0) {
            setSelectedSemester(semesters[0]); // Default to latest
          }
        }
      } catch (e) {
        console.error("Failed to fetch history", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // --- 2. LOAD SUBJECTS WHEN SEMESTER CHANGES ---
  useEffect(() => {
    if (selectedSemester !== null) {
      const semSubjects = fullHistory.filter((h: any) => h.semester === selectedSemester);

      const mapped: SimulatorSubject[] = semSubjects.map((s: any) => {
        // Reverse engineer the grade to set initial marks
        const { int, ext } = getEstimatedMarksFromGrade(s.grade);
        const total = int + ext;

        return {
          id: s.subjectCode,
          name: s.subjectName,
          credits: s.credits,
          internal: int,
          external: ext,
          projectedGrade: getGradeLetter(total),
          projectedPoint: getGradePoint(total)
        };
      });

      setSubjects(mapped);
      setResult(null); // Reset previous simulation results
      setTargetAnalysis(null);
    }
  }, [selectedSemester, fullHistory]);

  // --- 3. UPDATE MARKS ---
  const updateMarks = (id: string, type: 'internal' | 'external', value: string) => {
    const numVal = Math.min(Math.max(parseInt(value) || 0, 0), 50);
    setSubjects(prev => prev.map(sub => {
      if (sub.id !== id) return sub;
      const newInternal = type === 'internal' ? numVal : sub.internal;
      const newExternal = type === 'external' ? numVal : sub.external;
      const total = newInternal + newExternal;
      return {
        ...sub,
        internal: newInternal,
        external: newExternal,
        projectedGrade: getGradeLetter(total),
        projectedPoint: getGradePoint(total)
      };
    }));
  };

  // --- 4. SIMULATION & STRATEGY ---
  const analyzeTarget = (currentCreditIndex: number, totalCredits: number) => {
    const target = parseFloat(targetSGPA) || 0;
    const requiredIndex = target * totalCredits;
    const gap = requiredIndex - currentCreditIndex;
    const maxPossibleIndex = subjects.reduce((sum, s) => sum + (s.credits * 10), 0);
    const maxSGPA = (maxPossibleIndex / totalCredits).toFixed(2);

    if (requiredIndex > maxPossibleIndex) {
      return { isPossible: false, gap, maxPossibleSGPA: maxSGPA, strategy: [] };
    }

    const potentialImprovements = subjects
      .map(s => ({
        ...s,
        potentialGain: (10 - s.projectedPoint) * s.credits,
      }))
      .filter(s => s.potentialGain > 0)
      .sort((a, b) => b.potentialGain - a.potentialGain);

    let pointsCovered = 0;
    const strategy: StrategyItem[] = [];

    for (const sub of potentialImprovements) {
      if (pointsCovered >= gap) break;
      strategy.push({
        subjectName: sub.name,
        currentGrade: sub.projectedGrade,
        targetGrade: 'O',
        pointsNeeded: sub.potentialGain,
        message: `Convert '${sub.projectedGrade}' to 'O' for +${sub.potentialGain} pts`
      });
      pointsCovered += sub.potentialGain;
    }

    return { isPossible: true, gap, maxPossibleSGPA: maxSGPA, strategy };
  };

  const runSimulation = () => {
    let totalCredits = 0;
    let creditIndex = 0;
    const gradeCounts: Record<string, number> = { O:0, E:0, A:0, B:0, C:0, D:0, F:0 };

    subjects.forEach(sub => {
      totalCredits += sub.credits;
      creditIndex += (sub.credits * sub.projectedPoint);
      gradeCounts[sub.projectedGrade]++;
    });

    const sgpa = totalCredits > 0 ? (creditIndex / totalCredits).toFixed(2) : "0.00";

    setResult({
      sgpa,
      totalCredits,
      creditIndex,
      breakdown: Object.entries(gradeCounts)
        .filter(([_, count]) => count > 0)
        .map(([label, count]) => ({ label, count, color: getGradeColor(label) }))
    });

    setTargetAnalysis(analyzeTarget(creditIndex, totalCredits));
  };

  if (loading) return <div className="flex h-[50vh] justify-center items-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="max-w-6xl mx-auto pt-4 pb-20 px-4">
      {/* Header & Selector */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-3xl font-display font-medium mb-2 text-foreground">
            SGPA <span className="text-primary">TARGETER</span>
          </h2>
          <div className="flex items-center gap-3">
             <p className="text-muted-foreground text-sm">Simulating for:</p>
             <div className="relative">
                <select 
                   value={selectedSemester || ""} 
                   onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
                   className="appearance-none bg-accent border border-input text-foreground px-4 py-1 pr-8 rounded-sm text-sm focus:border-primary outline-none cursor-pointer font-mono"
                >
                   {availableSemesters.map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                   ))}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1.5 text-muted-foreground pointer-events-none" />
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- LEFT: SUBJECT INPUTS --- */}
        <div className="lg:col-span-2 space-y-4">
           {/* Table Header */}
           <div className="grid grid-cols-12 gap-2 text-[10px] uppercase tracking-widest text-muted-foreground px-4">
              <div className="col-span-4 md:col-span-5">Subject</div>
              <div className="col-span-2 text-center">Credit</div>
              <div className="col-span-2 text-center">Int (50)</div>
              <div className="col-span-2 text-center">Ext (50)</div>
              <div className="col-span-2 md:col-span-1 text-center">Grade</div>
           </div>

           <div className="space-y-3">
             <AnimatePresence mode='wait'>
               {subjects.map((sub, idx) => (
                 <MotionDiv 
                   key={sub.id}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: idx * 0.05 }}
                   className="p-4 bg-card border border-border rounded-sm grid grid-cols-12 gap-2 items-center hover:border-input transition-colors"
                 >
                    <div className="col-span-4 md:col-span-5">
                       <div className="text-foreground font-medium text-sm truncate" title={sub.name}>{sub.name}</div>
                       <div className="text-[10px] text-muted-foreground font-mono">{sub.id}</div>
                    </div>
                    <div className="col-span-2 text-center">
                       <span className="text-xs font-mono text-muted-foreground bg-accent px-2 py-1 rounded border border-input">{sub.credits}</span>
                    </div>
                    <div className="col-span-2">
                       <input 
                         type="number" 
                         value={sub.internal}
                         max={50}
                         onChange={(e) => updateMarks(sub.id, 'internal', e.target.value)}
                         className="w-full bg-[#050505] text-foreground text-center text-sm border border-input py-2 focus:border-primary outline-none rounded-sm" 
                       />
                    </div>
                    <div className="col-span-2">
                       <input 
                         type="number" 
                         value={sub.external}
                         max={50}
                         onChange={(e) => updateMarks(sub.id, 'external', e.target.value)}
                         className="w-full bg-[#050505] text-foreground text-center text-sm border border-input py-2 focus:border-primary outline-none rounded-sm" 
                       />
                    </div>
                    <div className="col-span-2 md:col-span-1 text-center">
                       <div className={`text-xl font-bold font-display ${getGradeColor(sub.projectedGrade)}`}>
                         {sub.projectedGrade}
                       </div>
                    </div>
                 </MotionDiv>
               ))}
             </AnimatePresence>
           </div>
        </div>

        {/* --- RIGHT: CONTROLS & ANALYSIS --- */}
        <div className="lg:col-span-1 space-y-6">
           
           {/* Target Input */}
           <div className="bg-accent p-4 border border-border rounded-sm">
             <label className="text-xs uppercase text-muted-foreground mb-2 block flex items-center gap-2">
               <Target size={12} /> Set Target SGPA
             </label>
             <div className="flex gap-2">
               <input 
                 type="number" 
                 value={targetSGPA}
                 onChange={(e) => setTargetSGPA(e.target.value)}
                 step="0.1"
                 className="bg-[#000] text-foreground text-lg font-bold p-2 border border-input w-24 text-center outline-none focus:border-primary"
               />
               <motion.button 
                 onClick={runSimulation}
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 className="flex-1 bg-primary text-black font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2"
               >
                  Simulate
               </motion.button>
             </div>
           </div>

           {/* Results Display */}
           <AnimatePresence>
             {result && (
               <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                 
                 <div className="bg-muted border border-border p-6 rounded-sm text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none" />
                    <div className="text-sm text-muted-foreground mb-1">Projected SGPA</div>
                    <div className={`text-6xl font-display font-bold mb-2 ${parseFloat(result.sgpa) >= parseFloat(targetSGPA) ? 'text-primary' : 'text-foreground'}`}>
                       {result.sgpa}
                    </div>
                    <div className="flex justify-center gap-4 text-xs font-mono text-muted-foreground mt-4 pt-4 border-t border-border">
                       <span>Credits: {result.totalCredits}</span>
                       <span>Points: {result.creditIndex}</span>
                    </div>
                 </div>

                 {targetAnalysis && (
                   <div className={`p-5 border rounded-sm ${targetAnalysis.isPossible ? 'bg-blue-950/10 border-blue-900/30' : 'bg-red-950/10 border-red-900/30'}`}>
                      <div className="flex items-start gap-3 mb-4">
                        {targetAnalysis.isPossible ? <CheckCircle2 className="text-blue-400 shrink-0" /> : <XCircle className="text-red-500 shrink-0" />}
                        <div>
                          <h4 className={`font-bold ${targetAnalysis.isPossible ? 'text-blue-400' : 'text-red-400'}`}>
                            {targetAnalysis.isPossible ? "Target Achievable" : "Impossible"}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {targetAnalysis.isPossible 
                              ? `Gap: ${targetAnalysis.gap <= 0 ? '0' : targetAnalysis.gap.toFixed(0)} pts.` 
                              : `Max Possible: ${targetAnalysis.maxPossibleSGPA}`}
                          </p>
                        </div>
                      </div>

                      {targetAnalysis.isPossible && targetAnalysis.gap > 0 && (
                        <div className="space-y-2 mt-4">
                           <div className="text-[10px] uppercase text-muted-foreground mb-2">Strategy</div>
                           {targetAnalysis.strategy.map((item, i) => (
                             <div key={i} className="bg-[#000]/50 p-2 rounded border border-border flex justify-between items-center text-xs">
                                <div>
                                  <div className="text-foreground font-medium">{item.subjectName}</div>
                                  <div className="text-muted-foreground text-[10px]">{item.message}</div>
                                </div>
                                <div className="text-right">
                                   <div className="text-muted-foreground line-through">{item.currentGrade}</div>
                                   <div className="text-primary font-bold">{item.targetGrade}</div>
                                </div>
                             </div>
                           ))}
                        </div>
                      )}
                   </div>
                 )}

               </MotionDiv>
             )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}