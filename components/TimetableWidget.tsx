'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, Calendar, ArrowRight, Layers } from 'lucide-react';

// Define types locally to avoid dependency issues
interface ClassSession {
  id: string;
  subject: string;
  code: string;
  room: string;
  startTime: string;
  endTime: string;
  type: 'Lecture' | 'Lab';
}

interface TimetableWidgetProps {
  rollNumber: string;
}

const TimetableWidget: React.FC<TimetableWidgetProps> = ({ rollNumber }) => {
  const [schedule, setSchedule] = useState<ClassSession[]>([]);
  const [nextClass, setNextClass] = useState<ClassSession | null>(null);
  const [currentClass, setCurrentClass] = useState<ClassSession | null>(null);
  
  // Deterministic Schedule Generator
  useEffect(() => {
    if (!rollNumber) return;
    
    // Logic: Use the last digit of roll number to assign a "Section" (0-9)
    const lastDigit = parseInt(rollNumber.slice(-1)) || 0;
    const sectionType = lastDigit % 2; // 0 = Set A, 1 = Set B
    
    const setASchedule: ClassSession[] = [
      { id: '1', subject: 'Data Structures', code: 'CS2001', room: 'C-201', startTime: '09:00', endTime: '10:00', type: 'Lecture' },
      { id: '2', subject: 'Discrete Math', code: 'MA2001', room: 'C-202', startTime: '10:15', endTime: '11:15', type: 'Lecture' },
      { id: '3', subject: 'DS Lab', code: 'CS2091', room: 'Lab-3', startTime: '14:00', endTime: '16:00', type: 'Lab' },
    ];

    const setBSchedule: ClassSession[] = [
      { id: '1', subject: 'Digital Logic', code: 'CS2002', room: 'C-305', startTime: '11:00', endTime: '12:00', type: 'Lecture' },
      { id: '2', subject: 'OOPS (Java)', code: 'CS2004', room: 'C-305', startTime: '12:15', endTime: '13:15', type: 'Lecture' },
      { id: '3', subject: 'Java Lab', code: 'CS2094', room: 'Lab-1', startTime: '15:00', endTime: '17:00', type: 'Lab' },
    ];

    const todaySchedule = sectionType === 0 ? setASchedule : setBSchedule;
    setSchedule(todaySchedule);

    // Find Next Class Logic
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    let foundNext = false;
    let foundCurrent = false;

    for (const session of todaySchedule) {
      const [startH, startM] = session.startTime.split(':').map(Number);
      const [endH, endM] = session.endTime.split(':').map(Number);
      const startTotal = startH * 60 + startM;
      const endTotal = endH * 60 + endM;

      if (currentTime >= startTotal && currentTime < endTotal) {
        setCurrentClass(session);
        foundCurrent = true;
      } else if (currentTime < startTotal && !foundNext) {
        setNextClass(session);
        foundNext = true;
      }
    }

    if (!foundNext && !foundCurrent) {
        setNextClass(null);
        setCurrentClass(null);
    }

  }, [rollNumber]);

  // Formatting helper
  const formatTime = (time: string) => {
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  return (
    <div className="bg-card border border-border p-0 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted flex justify-between items-center">
        <div>
          <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium font-display flex items-center gap-2">
            <Calendar size={14} className="text-primary" /> 
            Live Routine
          </h3>
          <p className="text-[10px] text-muted-foreground font-mono mt-1">ID: {rollNumber} • AUTOMATED</p>
        </div>
        <div className="flex items-center gap-1">
             <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
             <span className="text-[10px] text-green-500 font-bold uppercase">Active</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left: Next/Current Class Status */}
        <div className="p-6 md:w-5/12 border-b md:border-b-0 md:border-r border-border flex flex-col justify-center relative group">
           {/* Glow Effect */}
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#ccff00] to-transparent opacity-20 group-hover:opacity-50 transition-opacity" />

           {currentClass ? (
             <>
               <span className="text-primary text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                 <span className="w-2 h-2 bg-primary rounded-full animate-ping" /> In Progress
               </span>
               <h2 className="text-2xl font-display font-bold text-foreground leading-tight mb-1">{currentClass.subject}</h2>
               <p className="text-sm text-muted-foreground font-mono mb-4">{currentClass.code}</p>
               
               <div className="flex items-center gap-4 text-xs text-[#ccc]">
                  <div className="flex items-center gap-1"><Clock size={12} className="text-primary"/> {formatTime(currentClass.endTime)} ends</div>
                  <div className="flex items-center gap-1"><MapPin size={12} className="text-primary"/> {currentClass.room}</div>
               </div>
             </>
           ) : nextClass ? (
             <>
               <span className="text-[#00ccff] text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                 <ArrowRight size={12} /> Up Next
               </span>
               <h2 className="text-xl font-display font-bold text-foreground leading-tight mb-1">{nextClass.subject}</h2>
               <p className="text-xs text-muted-foreground font-mono mb-4">{nextClass.code}</p>
               
               <div className="flex items-center gap-4 text-xs text-[#ccc]">
                  <div className="flex items-center gap-1"><Clock size={12} className="text-[#00ccff]"/> {formatTime(nextClass.startTime)}</div>
                  <div className="flex items-center gap-1"><MapPin size={12} className="text-[#00ccff]"/> {nextClass.room}</div>
               </div>
             </>
           ) : (
             <div className="text-center py-4">
               <Layers size={24} className="mx-auto text-accent-foreground mb-2" />
               <p className="text-sm text-muted-foreground">No more classes today.</p>
               <p className="text-xs text-muted-foreground mt-1">Time to focus on self-study.</p>
             </div>
           )}
        </div>

        {/* Right: List View */}
        <div className="md:w-7/12 bg-[#050507]">
           {schedule.length > 0 ? (
             <div className="divide-y divide-[#222]">
                {schedule.map((session) => (
                  <div key={session.id} className={`p-3 flex items-center justify-between hover:bg-card transition-colors ${currentClass?.id === session.id ? 'bg-primary/5' : ''}`}>
                      <div className="flex items-center gap-3">
                         <div className="text-[10px] font-mono text-muted-foreground w-12 text-right">
                            <div>{session.startTime}</div>
                            <div>{session.endTime}</div>
                         </div>
                         <div className={`w-0.5 h-8 ${currentClass?.id === session.id ? 'bg-primary' : 'bg-[#333]'}`} />
                         <div>
                            <div className={`text-xs font-bold ${currentClass?.id === session.id ? 'text-primary' : 'text-foreground'}`}>{session.subject}</div>
                            <div className="text-[10px] text-muted-foreground">{session.type} • {session.room}</div>
                         </div>
                      </div>
                  </div>
                ))}
             </div>
           ) : (
             <div className="h-full flex items-center justify-center text-xs text-muted-foreground p-4">
               Schedule data unavailable for ID.
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default TimetableWidget;