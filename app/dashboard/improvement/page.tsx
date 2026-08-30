'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, AlertCircle, ArrowRight, ShieldCheck, AlertTriangle, Loader2, CalendarClock } from 'lucide-react';

// --- TYPES ---
interface GradeRecord {
  id: string;
  semester: number;
  subjectCode: string;
  subjectName: string;
  credits: number;
  grade: string;
}

interface ActionItem extends GradeRecord {
  type: 'BACKLOG' | 'IMPROVEMENT';
  reason: string;
  examTiming: string; // e.g. "Summer Term / Next Odd Sem"
  priority: number;
}

// --- KIIT RULES ENGINE (UPDATED) ---
const generateActionPlan = (history: GradeRecord[]): ActionItem[] => {
  const eligible = history.filter(g => ['F', 'C', 'D'].includes(g.grade));
  
  const mapped = eligible.map(item => {
    let priority = 0;
    let type: 'BACKLOG' | 'IMPROVEMENT' = 'IMPROVEMENT';
    let reason = "";
    let examTiming = "";

    // --- 1. DETERMINE TYPE & TIMING ---
    const isOddSemSubject = item.semester % 2 !== 0;

    if (item.grade === 'F') {
      // RULE: Backlogs are mandatory. Highest Priority.
      type = 'BACKLOG';
      priority = 1000 + (item.credits * 10); // Base 1000 ensures F always beats C/D
      reason = "Mandatory Clearance Required.";
      
      // Timing Rules (Sec 4.3 & 13.0)
      // Backlogs are cleared in corresponding semesters OR Summer Term
      examTiming = isOddSemSubject 
        ? "Next Odd Sem (Nov-Dec) OR Summer Term" 
        : "Next Even Sem (Apr-May) OR Summer Term";
        
    } else {
      // RULE: Improvements are optional. Lower Priority.
      type = 'IMPROVEMENT';
      priority = item.credits * 10;
      if (item.grade === 'D') priority += 5; // D is more urgent than C

      reason = item.grade === 'D' 
        ? "Fixing 'D' grade boosts SGPA significantly." 
        : "High-yield credit optimization.";

      // Timing Rules (Sec 12.0)
      // Immediate subsequent semester
      examTiming = isOddSemSubject 
        ? "Next Odd Semester Cycle" 
        : "Next Even Semester Cycle";
    }

    return { ...item, type, priority, reason, examTiming };
  });

  // Sort: Backlogs First, Then High Credits
  mapped.sort((a, b) => b.priority - a.priority);

  // Return top items (we show all backlogs + top improvements up to 5 total items)
  return mapped.slice(0, 5);
};

const MotionDiv = motion.div as any;

export default function ImprovementPage() {
  const [history, setHistory] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/grades/history');
        const data = await res.json();
        if (data.history) setHistory(data.history);
      } catch (e) {
        console.error("Failed to load history", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const plan = generateActionPlan(history);
  const backlogCount = plan.filter(i => i.type === 'BACKLOG').length;

  if (loading) {
     return (
        <div className="flex h-[50vh] items-center justify-center">
            <Loader2 className="text-primary animate-spin" size={40} />
        </div>
     );
  }

  if (history.length === 0) {
    return (
      <div className="max-w-4xl mx-auto pt-20 text-center px-4">
         <h2 className="text-3xl font-display font-medium mb-4 text-foreground">NO DATA <span className="text-accent-foreground">AVAILABLE</span></h2>
         <p className="text-muted-foreground mb-8">Please upload semester grades in the "Ingest" tab to generate an Action Plan.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pt-8 pb-20 px-4">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-display font-medium mb-4 text-foreground">ACTION <span className="text-primary">PLANNER</span></h2>
        <p className="text-muted-foreground">Automated analysis of Backlogs & Improvements based on KIIT Academic Regulations.</p>
      </div>

      {/* Status Banner */}
      <div className={`border p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden rounded-sm ${backlogCount > 0 ? 'bg-red-950/20 border-red-900/50' : 'bg-card border-border'}`}>
         {backlogCount > 0 && <div className="absolute top-0 left-0 w-1 h-full bg-red-500 animate-pulse" />}
         
         <div className="flex items-start gap-4 z-10">
            {backlogCount > 0 ? (
               <AlertTriangle size={24} className="text-red-500 shrink-0 mt-1" />
            ) : (
               <ShieldCheck size={24} className="text-primary shrink-0 mt-1" />
            )}
            <div>
              <h3 className={`font-display font-medium ${backlogCount > 0 ? 'text-red-400' : 'text-foreground'}`}>
                 {backlogCount > 0 ? "Critical Action Required" : "Optimization Mode"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-xl">
                {backlogCount > 0 
                  ? "You have active backlogs. Per Regulation 4.3, you must register for these subjects in their corresponding semesters or Summer Term."
                  : "You are eligible for grade improvements. Regulation 12.0 allows improving up to 3 papers without risk of grade reduction."}
              </p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Action Items Column */}
        <div>
          <h3 className="text-xs uppercase tracking-widest text-[#fff] mb-6 flex items-center gap-2">
            <Target size={14} /> Prioritized Actions
          </h3>
          <div className="space-y-4">
            {plan.length > 0 ? plan.map((item, idx) => (
              <MotionDiv 
                key={item.id + idx} // fallback key
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-5 border transition-all relative overflow-hidden rounded-sm ${
                    item.type === 'BACKLOG' 
                    ? 'bg-red-950/10 border-red-900/30 hover:border-red-500/50' 
                    : 'bg-card border-border hover:border-primary/50'
                }`}
              >
                {/* Badge */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-foreground">{item.subjectName}</h4>
                    <div className="text-[10px] font-mono text-muted-foreground mt-1">
                        {item.subjectCode} • SEM {item.semester} • {item.semester % 2 !== 0 ? 'ODD' : 'EVEN'}
                    </div>
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${
                      item.type === 'BACKLOG' 
                      ? 'bg-red-900 text-foreground border-red-700' 
                      : 'bg-muted text-primary border-input'
                  }`}>
                      {item.type}
                  </span>
                </div>
                
                {/* Grades */}
                <div className="flex items-center gap-4 text-sm mb-4 mt-4">
                  <div className="flex flex-col">
                      <span className="text-muted-foreground text-[10px] uppercase">Current</span>
                      <span className={`font-bold text-xl ${item.grade === 'F' ? 'text-red-500' : 'text-yellow-500'}`}>{item.grade}</span>
                  </div>
                  <ArrowRight size={16} className="text-accent-foreground" />
                  <div className="flex flex-col">
                      <span className="text-muted-foreground text-[10px] uppercase">Target</span>
                      <span className={`${item.type === 'BACKLOG' ? 'text-foreground' : 'text-primary'} font-bold text-xl`}>
                          {item.type === 'BACKLOG' ? 'P' : 'O'}
                      </span>
                  </div>
                </div>

                {/* Timing & Reason */}
                <div className="text-xs font-mono border-t border-input pt-3 flex flex-col gap-2">
                   <div className="flex items-center gap-2 text-muted-foreground">
                        <AlertCircle size={12} />
                        {item.reason}
                   </div>
                   <div className="flex items-center gap-2 text-[#ccc]">
                        <CalendarClock size={12} className={item.type === 'BACKLOG' ? 'text-red-400' : 'text-primary'} />
                        <span className="uppercase tracking-wide">Exam: {item.examTiming}</span>
                   </div>
                </div>
              </MotionDiv>
            )) : (
              <div className="text-muted-foreground text-sm p-8 border border-dashed border-border bg-muted text-center rounded-sm">
                <p className="mb-2 text-foreground font-medium">All Clear!</p>
                <p className="text-xs">No backlogs or eligible improvements found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Rules Sidebar */}
        <div>
          <h3 className="text-xs uppercase tracking-widest text-[#fff] mb-6 flex items-center gap-2">
            <TrendingUp size={14} /> Rules & Regulations
          </h3>
          
          <div className="p-6 bg-muted border border-border rounded-sm relative">
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none" />
            
            <ul className="space-y-6 text-sm text-muted-foreground relative z-10">
              <li className="flex gap-4">
                <div className="w-8 h-8 rounded bg-accent border border-input flex items-center justify-center text-red-500 font-bold shrink-0">!</div>
                <div>
                    <strong className="text-foreground block mb-1">Backlog (F Grade) Rules</strong>
                    <ul className="list-disc pl-4 mt-1 text-xs text-muted-foreground space-y-1">
                        <li><strong>Rule 4.3:</strong> Must register for backlog papers in the corresponding semester (Odd subjects in Odd Sem, Even in Even).</li>
                        <li><strong>Rule 13.0:</strong> You can also clear backlogs in the <strong>Summer Term</strong> (May-July) to avoid waiting a full year.</li>
                    </ul>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-8 h-8 rounded bg-accent border border-input flex items-center justify-center text-primary font-bold shrink-0">i</div>
                <div>
                    <strong className="text-foreground block mb-1">Improvement Rules (Sec 12.0)</strong>
                    <ul className="list-disc pl-4 mt-1 text-xs text-muted-foreground space-y-1">
                        <li>Only for 'C' or 'D' grades.</li>
                        <li>Max 3 papers allowed.</li>
                        <li><strong>No Risk:</strong> If your new marks are lower, the previous higher grade remains.</li>
                    </ul>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}