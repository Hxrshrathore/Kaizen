'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  BookOpen, Calendar, Clock, ChevronRight, Loader2, 
  ExternalLink, FileText, AlertCircle, ArrowLeft, EyeOff, Eye
} from 'lucide-react';

// --- TYPES ---

interface Assignment {
  id: string;
  title: string;
  description?: string;
  alternateLink: string;
  dueDate?: {
    year: number;
    month: number;
    day: number;
  };
  dueTime?: {
    hours: number;
    minutes: number;
  };
}

interface Course {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  alternateLink: string;
  assignments: Assignment[];
}

// --- ANIMATION WRAPPERS ---
const MotionDiv = motion.div as any;

// --- COMPONENTS ---

const CourseCard = ({ course, index, onClick }: { course: Course; index: number; onClick: () => void }) => (
  <MotionDiv
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    whileHover={{ y: -5, borderColor: '#ccff00' }}
    className="bg-card border border-border p-6 flex flex-col justify-between cursor-pointer group transition-all h-full"
    onClick={onClick}
  >
    <div>
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-primary/10 border border-primary/20 rounded-sm">
          <BookOpen className="text-primary" size={20} />
        </div>
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{course.section || 'General'}</span>
      </div>
      <h3 className="text-xl font-display font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">{course.name}</h3>
      <p className="text-muted-foreground text-xs font-mono mb-4 line-clamp-1">{course.descriptionHeading || 'No description'}</p>
    </div>
    
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
        {course.assignments.length} {course.assignments.length === 1 ? 'Assignment' : 'Assignments'}
      </span>
      <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
    </div>
  </MotionDiv>
);

const AssignmentItem = ({ assignment, index }: { assignment: Assignment; index: number }) => {
  const formatDueDate = (due?: Assignment['dueDate']) => {
    if (!due) return 'No due date';
    const monthName = new Date(2000, due.month - 1).toLocaleString('default', { month: 'short' });
    return `${due.day} ${monthName} ${due.year}`;
  };

  return (
    <MotionDiv
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center justify-between p-4 bg-[#151518] border border-border hover:border-input transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-accent flex items-center justify-center shrink-0">
          <FileText size={18} className="text-muted-foreground" />
        </div>
        <div>
          <h4 className="text-sm font-medium text-foreground line-clamp-1">{assignment.title}</h4>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono mt-1 uppercase tracking-wider">
            <Calendar size={10} /> {formatDueDate(assignment.dueDate)}
          </div>
        </div>
      </div>
      <a 
        href={assignment.alternateLink} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-primary hover:text-foreground p-2 transition-colors"
      >
        <ExternalLink size={16} />
      </a>
    </MotionDiv>
  );
};

// --- MAIN PAGE ---

export default function ClassroomPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [hiddenCourseIds, setHiddenCourseIds] = useState<Set<string>>(new Set());
  const [showHidden, setShowHidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/classroom');
        const data = await res.json();
        
        if (res.ok) {
          setCourses(data.courses);
          setHiddenCourseIds(new Set(data.hiddenCourseIds || []));
        } else {
          setError(data.error || 'Failed to fetch data');
        }
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-muted-foreground font-mono p-6">
        <div className="relative w-16 h-16 mb-6">
          <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin" />
          <Loader2 className="absolute inset-0 m-auto text-primary/50 animate-pulse" size={24} />
        </div>
        <p className="text-xs uppercase tracking-[0.3em] animate-pulse">Syncing Neural Link to Google Classroom...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 border border-red-900/30 bg-red-900/5 text-center">
        <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
        <h2 className="text-xl font-display font-bold text-foreground mb-2 tracking-tight uppercase">Connection Error</h2>
        <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
          {error === 'User not authenticated with Google or tokens missing' 
            ? "Your Google session has expired or permissions are missing. Please re-authenticate to sync your classroom."
            : error}
        </p>
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => router.push('/login')}
            className="w-full bg-white text-black font-bold h-12 flex items-center justify-center gap-2 hover:bg-[#e0e0e0] transition-all uppercase tracking-widest text-xs"
          >
            Re-Authenticate
          </button>
          <button 
            onClick={() => router.push('/dashboard')}
            className="text-muted-foreground hover:text-foreground transition-colors text-xs uppercase tracking-widest font-mono py-2"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pt-8 pb-32 px-4">
      
      {/* Navigation Header */}
      <div className="mb-12 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => selectedCourse ? setSelectedCourse(null) : router.push('/dashboard')}
            className="p-2 border border-border bg-card hover:border-primary text-muted-foreground hover:text-primary transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl md:text-5xl font-display font-bold text-foreground uppercase tracking-tight">
              {selectedCourse ? 'Course' : 'Google'} <span className="text-primary">{selectedCourse ? 'Details' : 'Classroom'}</span>
            </h1>
            <p className="text-muted-foreground font-mono text-xs uppercase tracking-[0.2em] mt-1">
              {selectedCourse ? selectedCourse.name : `${courses.length} Total Courses Connected`}
            </p>
          </div>
        </div>

        {!selectedCourse && (
          <button
            onClick={() => setShowHidden(!showHidden)}
            className={`flex items-center gap-2 px-4 py-2 border font-mono text-xs uppercase tracking-widest transition-all ${
              showHidden 
                ? 'bg-primary/10 border-primary/30 text-primary' 
                : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-input'
            }`}
          >
            {showHidden ? <Eye size={14} /> : <EyeOff size={14} />}
            {showHidden ? 'Hide Hidden' : 'Show Hidden'}
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!selectedCourse ? (() => {
          const visibleCourses = courses.filter(c => showHidden || !hiddenCourseIds.has(c.id));
          return (
          <MotionDiv
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {visibleCourses.length > 0 ? (
              visibleCourses.map((course, idx) => (
                <div key={course.id} className="relative h-full">
                  {hiddenCourseIds.has(course.id) && (
                    <div className="absolute -top-2 -right-2 z-10 bg-red-900 text-foreground text-[9px] px-2 py-1 font-mono uppercase tracking-widest border border-red-500/30">
                      Hidden
                    </div>
                  )}
                  <div className={hiddenCourseIds.has(course.id) ? 'opacity-50 grayscale h-full' : 'h-full'}>
                    <CourseCard 
                      course={course} 
                      index={idx} 
                      onClick={() => setSelectedCourse(course)} 
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-32 text-center border border-dashed border-border">
                <BookOpen className="text-[#222] mx-auto mb-4" size={64} />
                <p className="text-muted-foreground font-mono uppercase tracking-[0.2em]">No Courses Displayed</p>
              </div>
            )}
          </MotionDiv>
        );})() : (
          <MotionDiv
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Sidebar / Info */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-card border border-border p-8">
                <div className="text-[10px] text-primary font-mono uppercase tracking-[0.3em] mb-4">Course Protocol</div>
                <h2 className="text-2xl font-display font-bold text-foreground mb-6 uppercase leading-tight">{selectedCourse.name}</h2>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-mono uppercase">Section</span>
                    <span className="text-foreground font-mono">{selectedCourse.section || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-mono uppercase">Assignments</span>
                    <span className="text-foreground font-mono">{selectedCourse.assignments.length}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <a 
                    href={selectedCourse.alternateLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-12 bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-[#e0e0e0] transition-all uppercase tracking-widest text-[10px]"
                  >
                    Open in Classroom <ExternalLink size={14} />
                  </a>

                  <button
                    onClick={async () => {
                      if (actionLoading) return;
                      setActionLoading(true);
                      const isHidden = hiddenCourseIds.has(selectedCourse.id);
                      try {
                        const res = await fetch(`/api/classroom/hide${isHidden ? `?courseId=${selectedCourse.id}` : ''}`, {
                          method: isHidden ? 'DELETE' : 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: isHidden ? undefined : JSON.stringify({ courseId: selectedCourse.id })
                        });
                        if (res.ok) {
                          const newHidden = new Set(hiddenCourseIds);
                          if (isHidden) newHidden.delete(selectedCourse.id);
                          else newHidden.add(selectedCourse.id);
                          setHiddenCourseIds(newHidden);
                        }
                      } finally {
                        setActionLoading(false);
                      }
                    }}
                    disabled={actionLoading}
                    className={`w-full h-10 border font-bold flex items-center justify-center gap-2 transition-all uppercase tracking-widest text-[10px] ${
                      hiddenCourseIds.has(selectedCourse.id)
                        ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                        : 'bg-[#151518] border-input text-muted-foreground hover:text-foreground hover:border-[#555]'
                    }`}
                  >
                    {actionLoading ? <Loader2 className="animate-spin" size={14} /> : (hiddenCourseIds.has(selectedCourse.id) ? <Eye size={14} /> : <EyeOff size={14} />)}
                    {hiddenCourseIds.has(selectedCourse.id) ? 'Unhide Course' : 'Hide from Dashboard'}
                  </button>
                </div>
              </div>
            </div>

            {/* Assignments List */}
            <div className="lg:col-span-8">
              <div className="bg-card border border-border overflow-hidden">
                <div className="p-6 border-b border-border flex items-center justify-between bg-muted">
                  <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium font-display leading-none">CourseWork Assignments</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                    <span className="text-[10px] text-muted-foreground font-mono font-bold uppercase tracking-widest leading-none">Live Feed</span>
                  </div>
                </div>
                
                <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  {selectedCourse.assignments.length > 0 ? (
                    selectedCourse.assignments.map((assignment, idx) => (
                      <AssignmentItem key={assignment.id} assignment={assignment} index={idx} />
                    ))
                  ) : (
                    <div className="py-12 text-center opacity-30">
                      <FileText className="mx-auto mb-4" size={48} />
                      <p className="text-sm font-mono uppercase tracking-widest">No assignments posted</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
}
