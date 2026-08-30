'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { ArrowUpRight, TrendingUp, BookOpen, Loader2, AlertCircle } from 'lucide-react';

// --- TYPES ---
interface GradeRecord {
  id: string;
  subject: string; // Mapped from subjectName
  grade: string;
  credits: number;
  semester: number;
}

// --- ANIMATION WRAPPER ---
const MotionDiv = motion.div as any;

export default function InsightsPage() {
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 1. FETCH REAL DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/grades/history');
        const data = await res.json();
        
        if (data.history) {
          // Map API response to the format this component expects
          const mappedData = data.history.map((item: any) => ({
             id: item.id,
             subject: item.subjectName,
             grade: item.grade,
             credits: item.credits,
             semester: item.semester
          }));
          setGrades(mappedData);
        }
      } catch (error) {
        console.error("Failed to load insights data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- 2. MEMOIZED DATA PROCESSING ---

  // A. SGPA Trend Logic
  const trendData = useMemo(() => {
    const semesterMap = new Map<number, { totalPoints: number, totalCredits: number }>();
    
    grades.forEach(g => {
      // Filter out backlogs/F grades for SGPA trend usually, but standard SGPA includes F as 2 points
      if (!semesterMap.has(g.semester)) {
        semesterMap.set(g.semester, { totalPoints: 0, totalCredits: 0 });
      }
      
      const points = { 'O': 10, 'E': 9, 'A': 8, 'B': 7, 'C': 6, 'D': 5, 'F': 2 }[g.grade] || 0;
      const current = semesterMap.get(g.semester)!;
      
      current.totalPoints += points * g.credits;
      current.totalCredits += g.credits;
    });

    return Array.from(semesterMap.entries())
      .map(([sem, data]) => ({
        semester: `Sem ${sem}`,
        sgpa: parseFloat((data.totalPoints / data.totalCredits).toFixed(2))
      }))
      .sort((a, b) => parseInt(a.semester.split(' ')[1]) - parseInt(b.semester.split(' ')[1]));
  }, [grades]);

  // B. Grade Distribution Logic
  const distributionData = useMemo(() => {
    const gradeCounts = grades.reduce((acc, curr) => {
      acc[curr.grade] = (acc[curr.grade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const order = ['O', 'E', 'A', 'B', 'C', 'D', 'F'];
    return order.map(grade => ({
      grade,
      count: gradeCounts[grade] || 0
    }));
  }, [grades]);

  // C. Subject Type Performance (Heuristic based on Credits)
  const radarData = useMemo(() => {
    const typePerf: Record<string, { points: number, credits: number }> = {
      'Core (4Cr)': { points: 0, credits: 0 },
      'Theory (3Cr)': { points: 0, credits: 0 },
      'Labs (1-2Cr)': { points: 0, credits: 0 }
    };

    grades.forEach(g => {
      const points = { 'O': 10, 'E': 9, 'A': 8, 'B': 7, 'C': 6, 'D': 5, 'F': 2 }[g.grade] || 0;
      
      if (g.credits >= 4) { 
         typePerf['Core (4Cr)'].points += points * g.credits; 
         typePerf['Core (4Cr)'].credits += g.credits; 
      }
      else if (g.credits === 3) { 
         typePerf['Theory (3Cr)'].points += points * g.credits; 
         typePerf['Theory (3Cr)'].credits += g.credits; 
      }
      else { 
         typePerf['Labs (1-2Cr)'].points += points * g.credits; 
         typePerf['Labs (1-2Cr)'].credits += g.credits; 
      }
    });

    return Object.entries(typePerf).map(([type, data]) => ({
      subject: type,
      A: data.credits ? parseFloat((data.points / data.credits).toFixed(2)) : 0,
      fullMark: 10,
    }));
  }, [grades]);

  // --- CUSTOM TOOLTIP ---
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-input p-3 shadow-xl rounded-sm">
          <p className="text-primary font-mono text-xs mb-1 uppercase">{label}</p>
          <p className="text-foreground font-bold text-sm">
             {payload[0].name === 'Performance' ? `${payload[0].value} / 10` : payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
       <div className="flex h-[50vh] items-center justify-center">
           <Loader2 className="text-primary animate-spin" size={40} />
       </div>
    );
  }

  if (grades.length === 0) {
     return (
        <div className="max-w-7xl mx-auto pt-20 text-center">
           <h2 className="text-3xl font-display font-medium mb-4 text-foreground">NO DATA <span className="text-accent-foreground">FOUND</span></h2>
           <p className="text-muted-foreground mb-8">Upload grade reports to unlock insights.</p>
        </div>
     );
  }

  return (
    <div className="max-w-7xl mx-auto pt-4 md:pt-8 pb-20 px-4">
      
      {/* Header */}
      <div className="mb-12">
        <h2 className="text-3xl font-display font-medium mb-2 text-foreground">ACADEMIC <span className="text-primary">INSIGHTS</span></h2>
        <p className="text-muted-foreground">Visualizing performance patterns across your academic timeline.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* SGPA Trend Chart */}
        <MotionDiv 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-card border border-border rounded-sm"
        >
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xs uppercase tracking-widest text-[#fff] flex items-center gap-2">
              <TrendingUp size={14} className="text-primary" /> SGPA Progression
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono">
               {trendData.length > 1 ? (
                  trendData[trendData.length-1].sgpa >= trendData[trendData.length-2].sgpa ? "TREND: POSITIVE" : "TREND: DECLINING"
               ) : "TREND: STABLE"}
            </span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="semester" stroke="#444" tick={{fontSize: 12}} />
                <YAxis domain={[0, 10]} stroke="#444" tick={{fontSize: 12}} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="sgpa" 
                  stroke="#ccff00" 
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#000', stroke: '#ccff00', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#ccff00' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </MotionDiv>

        {/* Domain Performance Radar */}
        <MotionDiv 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 bg-card border border-border rounded-sm"
        >
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xs uppercase tracking-widest text-[#fff] flex items-center gap-2">
              <BookOpen size={14} className="text-primary" /> Subject Proficiency
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono">CREDIT WEIGHTED</span>
          </div>
          <div className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#222" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                <Radar
                  name="Performance"
                  dataKey="A"
                  stroke="#ccff00"
                  fill="#ccff00"
                  fillOpacity={0.2}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </MotionDiv>
      </div>

      {/* Grade Distribution Bar */}
      <MotionDiv 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="p-6 bg-card border border-border rounded-sm"
      >
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs uppercase tracking-widest text-[#fff] flex items-center gap-2">
              <ArrowUpRight size={14} className="text-primary" /> Grade Distribution
            </h3>
        </div>
        
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distributionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="grade" stroke="#444" tick={{fontSize: 12}} />
              <YAxis stroke="#444" tick={{fontSize: 12}} allowDecimals={false} />
              <Tooltip cursor={{fill: '#1a1a1a'}} content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#333" radius={[2, 2, 0, 0]} activeBar={{ fill: '#ccff00' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </MotionDiv>
      
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground p-2 border border-border bg-muted">
         <AlertCircle size={12} />
         <span>Analysis is generated from ingested grade reports. 'Core' subjects are identified as those with ≥4 credits.</span>
      </div>
    </div>
  );
}