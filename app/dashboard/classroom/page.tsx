'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  BookOpen, Calendar, Clock, ChevronRight, Loader2, 
  ExternalLink, FileText, AlertCircle, ArrowLeft, EyeOff, Eye,
  Sparkles, CheckCircle2, AlertTriangle, Check, X, Filter,
  Layers, RefreshCw, GraduationCap, Edit3, Link2, Unlink
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
  maxPoints?: number | null;
  isSubmitted: boolean;
  submissionState: string;
  isLate: boolean;
  assignedGrade?: number | null;
  submissionLink?: string | null;
}

interface CourseClassification {
  category: 'CURRENT_SEMESTER' | 'PREVIOUS_SEMESTER' | 'AMBIGUOUS';
  recommendedActive: boolean;
  matchedSubjectCode: string | null;
  matchedSubjectName: string | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
  probability?: number;
  detectedProfessor?: string | null;
  detectedSection?: string | null;
  evidence?: string[];
}

interface CourseStats {
  total: number;
  submitted: number;
  pending: number;
}

export interface MappedSubjectInfo {
  code: string;
  name: string | null;
  isManual: boolean;
}

export interface SubjectPoolItem {
  code: string;
  name: string;
  type: 'CORE' | 'ELECTIVE' | 'MENTOR';
  isAllotted?: boolean;
  faculty?: string;
  room?: string;
  description?: string;
}

interface Course {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  alternateLink: string;
  ownerId?: string;
  detectedProfessor?: string | null;
  teacherEmail?: string | null;
  assignments: Assignment[];
  stats: CourseStats;
  classification: CourseClassification;
  mappedSubject?: MappedSubjectInfo | null;
  needsSubjectSelection?: boolean;
}

interface ClassroomSummary {
  totalCourses: number;
  activeCount: number;
  hiddenCount: number;
  recommendedActiveCount: number;
  recommendedHiddenCount: number;
  hasUnfilteredPastCourses: boolean;
  unfilteredPastCount: number;
  recommendedActiveIds: string[];
  recommendedHiddenIds: string[];
  unmappedActiveCount: number;
}

// --- ANIMATION WRAPPERS ---
const MotionDiv = motion.div as any;

// --- COMPONENTS ---

const CourseCard = ({ 
  course, 
  index, 
  isHidden, 
  onClick,
  onOpenMappingModal,
  semShort = 'Active'
}: { 
  course: Course; 
  index: number; 
  isHidden: boolean; 
  onClick: () => void;
  onOpenMappingModal: (course: Course) => void;
  semShort?: string;
}) => {
  const isCurrentSem = course.classification?.category === 'CURRENT_SEMESTER';
  const isAmbiguous = course.classification?.category === 'AMBIGUOUS';
  const stats = course.stats || { total: course.assignments.length, submitted: 0, pending: course.assignments.length };
  const mappedSub = course.mappedSubject;

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4) }}
      whileHover={{ y: -4, borderColor: isCurrentSem ? '#ccff00' : '#444' }}
      className={`bg-card border p-6 flex flex-col justify-between cursor-pointer group transition-all h-full rounded-xl relative overflow-hidden ${
        isHidden 
          ? 'opacity-50 border-border/40 grayscale' 
          : isCurrentSem 
            ? 'border-border hover:border-primary shadow-sm hover:shadow-primary/5' 
            : 'border-border/60 hover:border-border'
      }`}
      onClick={onClick}
    >
      {/* Top classification indicator bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        isCurrentSem ? 'bg-primary' : isAmbiguous ? 'bg-amber-500' : 'bg-muted-foreground/30'
      }`} />

      <div>
        {/* Header Badges: Subject Mapping & Section */}
        <div className="flex justify-between items-start gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {mappedSub ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenMappingModal(course);
                }}
                className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/30 flex items-center gap-1 hover:bg-primary/20 transition-colors"
                title="Click to view or change Subject Code mapping"
              >
                <span>[{mappedSub.code}]</span>
                <span className="truncate max-w-[100px]">{mappedSub.name || mappedSub.code}</span>
                <Edit3 size={9} className="opacity-70 ml-0.5" />
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenMappingModal(course);
                }}
                className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1 hover:bg-amber-500/20 transition-colors"
                title={`Click to map this classroom to an active ${semShort} subject`}
              >
                <AlertCircle size={10} />
                <span>Map Subject</span>
              </button>
            )}

            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded border border-border">
              {course.section || 'General'}
            </span>

            {course.classification?.probability && (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                {Math.round(course.classification.probability * 100)}% Match
              </span>
            )}
          </div>

          <div>
            {isCurrentSem ? (
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {semShort} Active
              </span>
            ) : isAmbiguous ? (
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Needs Review
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-muted text-muted-foreground border border-border">
                Previous Sem
              </span>
            )}
          </div>
        </div>

        {/* Course Title */}
        <h3 className="text-lg font-display font-bold text-foreground mb-1.5 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
          {course.name}
        </h3>

        {/* Detected Professor Badge */}
        {course.detectedProfessor && (
          <div className="flex items-center gap-1.5 text-xs font-mono text-primary/90 mb-2 font-medium">
            <GraduationCap size={13} className="shrink-0 text-primary" />
            <span className="truncate">{course.detectedProfessor}</span>
          </div>
        )}

        {/* Reason / Subtitle */}
        <p className="text-muted-foreground text-xs font-mono mb-4 line-clamp-2 leading-relaxed">
          {course.classification?.reason || course.descriptionHeading || 'KIIT Academic Coursework'}
        </p>
      </div>

      {/* Footer stats */}
      <div className="pt-3 border-t border-border flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2">
          {stats.total === 0 ? (
            <span className="text-[10px] text-muted-foreground font-mono">No Assignments</span>
          ) : stats.pending === 0 ? (
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle2 size={10} /> All {stats.total} Submitted
            </span>
          ) : (
            <div className="flex items-center gap-1.5 text-[10px] font-mono">
              <span className="text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                {stats.pending} Pending
              </span>
              <span className="text-muted-foreground">
                • {stats.submitted} Turned In
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-muted-foreground group-hover:text-primary text-xs font-mono transition-colors">
          <span>View</span>
          <ChevronRight size={14} />
        </div>
      </div>
    </MotionDiv>
  );
};

const AssignmentItem = ({ assignment, index }: { assignment: Assignment; index: number }) => {
  const formatDueDate = (due?: Assignment['dueDate'], time?: Assignment['dueTime']) => {
    if (!due) return 'No due date';
    const monthName = new Date(2000, due.month - 1).toLocaleString('default', { month: 'short' });
    const timeStr = time ? ` @ ${String(time.hours).padStart(2, '0')}:${String(time.minutes || 0).padStart(2, '0')}` : '';
    return `${due.day} ${monthName} ${due.year}${timeStr}`;
  };

  const isTurnedIn = assignment.isSubmitted;
  const isLate = assignment.isLate;

  return (
    <MotionDiv
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
      className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isTurnedIn 
          ? 'bg-emerald-950/10 border-emerald-500/20' 
          : isLate 
            ? 'bg-rose-950/10 border-rose-500/20' 
            : 'bg-card border-border hover:border-input'
      }`}
    >
      <div className="flex items-start gap-3.5">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
          isTurnedIn 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
            : isLate 
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' 
              : 'bg-muted text-muted-foreground border border-border'
        }`}>
          {isTurnedIn ? <Check size={18} strokeWidth={2.5} /> : isLate ? <AlertCircle size={18} /> : <FileText size={18} />}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-foreground line-clamp-1">
              {assignment.title}
            </h4>

            {/* Submission Status Badge */}
            {isTurnedIn ? (
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 size={10} />
                Turned In
                {assignment.assignedGrade !== null && assignment.assignedGrade !== undefined && (
                  <span className="text-foreground ml-1">({assignment.assignedGrade} pts)</span>
                )}
              </span>
            ) : isLate ? (
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                <AlertTriangle size={10} />
                Late / Missing
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Clock size={10} />
                Pending Submission
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {formatDueDate(assignment.dueDate, assignment.dueTime)}
            </span>
            {assignment.maxPoints !== null && assignment.maxPoints !== undefined && (
              <span>• Max Points: {assignment.maxPoints}</span>
            )}
          </div>
        </div>
      </div>

      <a 
        href={assignment.submissionLink || assignment.alternateLink} 
        target="_blank" 
        rel="noopener noreferrer"
        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all shrink-0 ${
          isTurnedIn 
            ? 'bg-muted hover:bg-card text-muted-foreground hover:text-foreground border border-border' 
            : 'bg-primary text-black hover:bg-primary/90 shadow-sm'
        }`}
      >
        <span>{isTurnedIn ? 'View Submission' : 'Submit on Classroom'}</span>
        <ExternalLink size={12} />
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
  const [summary, setSummary] = useState<ClassroomSummary | null>(null);
  const [filterTab, setFilterTab] = useState<'ALL_ACTIVE' | 'PENDING' | 'TURNED_IN'>('ALL_ACTIVE');
  const [subjectsPool, setSubjectsPool] = useState<SubjectPoolItem[]>([]);
  const [studentProfile, setStudentProfile] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dynamic Semester Calculation (Supports any semester 1 to 8 seamlessly)
  const semNum = studentProfile?.semester || 7;
  const semSuffix = semNum === 1 ? 'st' : semNum === 2 ? 'nd' : semNum === 3 ? 'rd' : 'th';
  const semLabel = `${semNum}${semSuffix} Semester`;
  const semShort = `${semNum}${semSuffix} Sem`;

  // Confirmation Modal State (Auto-Detect Current Sem)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedForActive, setSelectedForActive] = useState<Set<string>>(new Set());
  const [confirmSaving, setConfirmSaving] = useState(false);

  // Subject Mapping Modal State
  const [mappingModalCourse, setMappingModalCourse] = useState<Course | null>(null);
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>('');
  const [customCodeInput, setCustomCodeInput] = useState<string>('');
  const [savingSubjectMapping, setSavingSubjectMapping] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch Classroom Data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/classroom');
      const data = await res.json();
      
      if (res.ok) {
        setCourses(data.courses || []);
        const hiddenSet = new Set<string>(data.hiddenCourseIds || []);
        setHiddenCourseIds(hiddenSet);
        setSummary(data.summary || null);
        setSubjectsPool(data.currentSemesterSubjectsPool || []);
        setStudentProfile(data.studentProfile || null);

        // Pre-populate modal selection with recommended active courses
        const activeIds = (data.courses || [])
          .filter((c: Course) => !hiddenSet.has(c.id))
          .map((c: Course) => c.id);
        
        // If nothing is hidden yet, recommend active current semester courses
        if (hiddenSet.size === 0 && data.summary?.recommendedActiveIds) {
          setSelectedForActive(new Set(data.summary.recommendedActiveIds));
        } else {
          setSelectedForActive(new Set(activeIds));
        }
      } else {
        setError(data.error || 'Failed to fetch data');
      }
    } catch (err: any) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Open Auto-Detect Confirmation Modal
  const openConfirmModal = () => {
    if (summary?.recommendedActiveIds) {
      setSelectedForActive(new Set(summary.recommendedActiveIds));
    } else {
      const rec = courses
        .filter(c => c.classification?.recommendedActive)
        .map(c => c.id);
      setSelectedForActive(new Set(rec));
    }
    setIsConfirmModalOpen(true);
  };

  // Open Subject Mapping Modal for a Course
  const openSubjectMappingModal = (course: Course) => {
    setMappingModalCourse(course);
    const existingCode = course.mappedSubject?.code || course.classification?.matchedSubjectCode || '';
    setSelectedSubjectCode(existingCode);
    setCustomCodeInput('');
  };

  // Save Subject Mapping
  const handleSaveSubjectMapping = async () => {
    if (!mappingModalCourse) return;
    const finalCode = (customCodeInput.trim() || selectedSubjectCode).trim().toUpperCase();
    if (!finalCode) {
      alert('Please select or enter a subject code');
      return;
    }

    try {
      setSavingSubjectMapping(true);
      // Find subject name from pool if available
      const poolItem = subjectsPool.find(p => p.code.toUpperCase() === finalCode);
      const subjectName = poolItem?.name || finalCode;

      const res = await fetch('/api/classroom/map-subject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: mappingModalCourse.id,
          courseName: mappingModalCourse.name,
          subjectCode: finalCode,
          subjectName,
          professorName: mappingModalCourse.detectedProfessor || undefined,
          ownerId: mappingModalCourse.ownerId || undefined,
          sectionName: mappingModalCourse.section || undefined,
          calculatedProb: mappingModalCourse.classification?.probability || undefined,
        })
      });

      const data = await res.json();
      if (res.ok) {
        // Update local course state
        setCourses(prev => prev.map(c => {
          if (c.id === mappingModalCourse.id) {
            return {
              ...c,
              mappedSubject: {
                code: finalCode,
                name: subjectName,
                isManual: true,
              },
              needsSubjectSelection: false,
            };
          }
          return c;
        }));

        if (selectedCourse?.id === mappingModalCourse.id) {
          setSelectedCourse(prev => prev ? {
            ...prev,
            mappedSubject: {
              code: finalCode,
              name: subjectName,
              isManual: true,
            },
            needsSubjectSelection: false,
          } : null);
        }

        showToast(`Successfully mapped to [${finalCode}] ${subjectName}!`);
        setMappingModalCourse(null);
      } else {
        alert(data.error || 'Failed to map subject');
      }
    } catch (err: any) {
      alert('Error mapping subject: ' + err.message);
    } finally {
      setSavingSubjectMapping(false);
    }
  };

  // Remove Subject Mapping
  const handleRemoveSubjectMapping = async () => {
    if (!mappingModalCourse) return;
    try {
      setSavingSubjectMapping(true);
      const res = await fetch(`/api/classroom/map-subject?courseId=${mappingModalCourse.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCourses(prev => prev.map(c => {
          if (c.id === mappingModalCourse.id) {
            return {
              ...c,
              mappedSubject: null,
              needsSubjectSelection: true,
            };
          }
          return c;
        }));

        if (selectedCourse?.id === mappingModalCourse.id) {
          setSelectedCourse(prev => prev ? {
            ...prev,
            mappedSubject: null,
            needsSubjectSelection: true,
          } : null);
        }

        showToast('Subject mapping removed.');
        setMappingModalCourse(null);
      }
    } finally {
      setSavingSubjectMapping(false);
    }
  };

  // Toggle course in confirmation modal
  const toggleCourseInModal = (courseId: string) => {
    setSelectedForActive(prev => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  };

  // Save confirmed active classrooms
  const handleSaveActiveConfirmation = async () => {
    try {
      setConfirmSaving(true);
      const activeCourseIds = Array.from(selectedForActive);
      const hiddenCourseIdsToSave = courses
        .filter(c => !selectedForActive.has(c.id))
        .map(c => c.id);

      const res = await fetch('/api/classroom/confirm-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeCourseIds,
          hiddenCourseIds: hiddenCourseIdsToSave,
        })
      });

      const resData = await res.json();
      if (res.ok) {
        setHiddenCourseIds(new Set(resData.hiddenCourseIds || hiddenCourseIdsToSave));
        setIsConfirmModalOpen(false);
        showToast(`Active ${semLabel} classrooms updated & saved!`);
        await fetchData();
      } else {
        alert(resData.error || 'Failed to save configuration');
      }
    } catch (err: any) {
      alert('Error saving active classrooms: ' + err.message);
    } finally {
      setConfirmSaving(false);
    }
  };

  // Single course hide / unhide toggle
  const handleToggleHideCourse = async (courseId: string) => {
    if (actionLoading) return;
    setActionLoading(true);
    const isHidden = hiddenCourseIds.has(courseId);
    try {
      const res = await fetch(`/api/classroom/hide${isHidden ? `?courseId=${courseId}` : ''}`, {
        method: isHidden ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: isHidden ? undefined : JSON.stringify({ courseId })
      });
      if (res.ok) {
        const next = new Set(hiddenCourseIds);
        if (isHidden) next.delete(courseId);
        else next.add(courseId);
        setHiddenCourseIds(next);
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Filter courses for display
  const displayedCourses = useMemo(() => {
    return courses.filter(course => {
      const isHidden = hiddenCourseIds.has(course.id);
      if (!showHidden && isHidden) return false;
      return true;
    });
  }, [courses, hiddenCourseIds, showHidden]);

  // Count active vs hidden
  const activeCount = courses.filter(c => !hiddenCourseIds.has(c.id)).length;
  const hiddenCount = hiddenCourseIds.size;

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-muted-foreground font-mono p-6">
        <div className="relative w-16 h-16 mb-6">
          <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin" />
          <Loader2 className="absolute inset-0 m-auto text-primary/50 animate-pulse" size={24} />
        </div>
        <p className="text-xs uppercase tracking-[0.3em] animate-pulse">Syncing Google Classroom &amp; Subject Mappings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 border border-red-900/30 bg-red-900/5 text-center rounded-2xl">
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
            className="w-full bg-white text-black font-bold h-12 flex items-center justify-center gap-2 hover:bg-[#e0e0e0] transition-all uppercase tracking-widest text-xs rounded-xl"
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

  // Split courses for modal
  const recommendedActiveCourses = courses.filter(c => c.classification?.recommendedActive);
  const ambiguousCourses = courses.filter(c => c.classification?.category === 'AMBIGUOUS');
  const pastSemesterCourses = courses.filter(c => c.classification?.category === 'PREVIOUS_SEMESTER');

  return (
    <div className="max-w-7xl mx-auto pt-8 pb-32 px-4 relative">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-primary text-black font-mono text-xs font-bold shadow-2xl flex items-center gap-2"
          >
            <CheckCircle2 size={16} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => selectedCourse ? setSelectedCourse(null) : router.push('/dashboard')}
            className="p-2.5 border border-border bg-card hover:border-primary text-muted-foreground hover:text-primary transition-all rounded-xl"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl md:text-4xl font-display font-bold text-foreground uppercase tracking-tight">
                {selectedCourse ? selectedCourse.name : 'Google Classroom'}
              </h1>
              {!selectedCourse && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                  {semLabel}
                </span>
              )}
            </div>
            <p className="text-muted-foreground font-mono text-xs uppercase tracking-[0.2em] mt-1">
              {selectedCourse 
                ? (selectedCourse.section || 'Active Coursework') 
                : `${activeCount} Active ${semShort} Courses • ${hiddenCount} Hidden Past Courses`}
            </p>
          </div>
        </div>

        {!selectedCourse && (
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Auto-Detect Active Semester Classrooms Button */}
            <button
              onClick={openConfirmModal}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
            >
              <Sparkles size={14} />
              <span>Auto-Detect {semShort}</span>
            </button>

            {/* Toggle Show Hidden */}
            <button
              onClick={() => setShowHidden(!showHidden)}
              className={`flex items-center gap-2 px-3.5 py-2 border rounded-xl font-mono text-xs uppercase tracking-wider transition-all ${
                showHidden 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                  : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-input'
              }`}
            >
              {showHidden ? <Eye size={14} /> : <EyeOff size={14} />}
              <span>{showHidden ? 'Showing All' : `Hidden (${hiddenCount})`}</span>
            </button>

            {/* Refresh Sync */}
            <button
              onClick={fetchData}
              className="p-2 border border-border bg-card rounded-xl text-muted-foreground hover:text-primary hover:border-primary transition-all"
              title="Refresh Classroom Data"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Alert Banner: Prompt when past semester courses are still visible */}
      {!selectedCourse && summary?.hasUnfilteredPastCourses && !showHidden && (
        <MotionDiv
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 rounded-2xl bg-amber-500/[0.07] border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0 mt-0.5">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                {summary.unfilteredPastCount} Previous Semester Classrooms Detected
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                University professors rarely archive past courses. Auto-detect your active {semLabel} papers so completed previous semester assignments don&apos;t clutter your view.
              </p>
            </div>
          </div>

          <button
            onClick={openConfirmModal}
            className="px-4 py-2 rounded-xl bg-amber-400 text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-amber-300 transition-colors shrink-0 shadow-sm"
          >
            Review &amp; Auto-Filter
          </button>
        </MotionDiv>
      )}

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {!selectedCourse ? (
          <MotionDiv
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {displayedCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedCourses.map((course, idx) => (
                  <div key={course.id} className="relative h-full">
                    {hiddenCourseIds.has(course.id) && (
                      <div className="absolute top-2 right-2 z-10 bg-muted/90 backdrop-blur-sm text-muted-foreground text-[9px] px-2 py-0.5 font-mono uppercase tracking-widest rounded border border-border">
                        Hidden
                      </div>
                    )}
                    <CourseCard 
                      course={course} 
                      index={idx} 
                      isHidden={hiddenCourseIds.has(course.id)}
                      onClick={() => setSelectedCourse(course)}
                      onOpenMappingModal={openSubjectMappingModal}
                      semShort={semShort}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center border-2 border-dashed border-border rounded-2xl p-8">
                <GraduationCap className="text-muted-foreground/30 mx-auto mb-4" size={48} />
                <h3 className="text-lg font-display font-bold text-foreground uppercase tracking-tight mb-1">
                  No Active Courses Displayed
                </h3>
                <p className="text-xs font-mono text-muted-foreground max-w-md mx-auto mb-6">
                  All courses may currently be hidden. Click below to auto-detect your {semLabel} classrooms or toggle &quot;Showing All&quot;.
                </p>
                <button
                  onClick={openConfirmModal}
                  className="px-4 py-2 rounded-xl bg-primary text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all shadow-sm"
                >
                  Configure Active Classrooms
                </button>
              </div>
            )}
          </MotionDiv>
        ) : (
          <MotionDiv
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Sidebar / Info */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-card border border-border p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] text-primary font-mono uppercase tracking-[0.2em] font-bold">
                    Course Protocol
                  </span>
                  {selectedCourse.mappedSubject ? (
                    <button
                      onClick={() => openSubjectMappingModal(selectedCourse)}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 flex items-center gap-1 hover:bg-primary/20 transition-colors"
                      title="Click to edit subject mapping"
                    >
                      <span>[{selectedCourse.mappedSubject.code}]</span>
                      <Edit3 size={10} />
                    </button>
                  ) : (
                    <button
                      onClick={() => openSubjectMappingModal(selectedCourse)}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1 hover:bg-amber-500/20 transition-colors"
                    >
                      <AlertCircle size={10} />
                      <span>Map Subject</span>
                    </button>
                  )}
                </div>

                <h2 className="text-xl font-display font-bold text-foreground mb-1 leading-tight">
                  {selectedCourse.name}
                </h2>

                {selectedCourse.mappedSubject && (
                  <div className="text-xs font-mono text-primary font-bold mb-3 flex items-center gap-1.5">
                    <Link2 size={12} />
                    <span>Mapped to: {selectedCourse.mappedSubject.name || selectedCourse.mappedSubject.code}</span>
                  </div>
                )}

                <p className="text-xs font-mono text-muted-foreground mb-6 leading-relaxed">
                  {selectedCourse.classification?.reason || selectedCourse.descriptionHeading || 'Enrolled Academic Coursework'}
                </p>
                
                <div className="space-y-3 mb-6 p-4 rounded-xl bg-muted/30 border border-border text-xs font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground uppercase">Section</span>
                    <span className="text-foreground font-bold">{selectedCourse.section || 'General'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground uppercase">Subject Code</span>
                    <span className="text-primary font-bold">{selectedCourse.mappedSubject?.code || 'UNMAPPED'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground uppercase">Total Work</span>
                    <span className="text-foreground font-bold">{selectedCourse.assignments.length} Assignments</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground uppercase">Turned In</span>
                    <span className="text-emerald-400 font-bold">{selectedCourse.stats?.submitted || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground uppercase">Pending Submission</span>
                    <span className="text-amber-400 font-bold">{selectedCourse.stats?.pending || 0}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={() => openSubjectMappingModal(selectedCourse)}
                    className="w-full h-11 border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary font-mono font-bold flex items-center justify-center gap-2 transition-all uppercase tracking-wider text-xs rounded-xl"
                  >
                    <Link2 size={14} />
                    <span>{selectedCourse.mappedSubject ? 'Change Subject Mapping' : `Link to ${semShort} Subject`}</span>
                  </button>

                  <a 
                    href={selectedCourse.alternateLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-11 bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-[#e0e0e0] transition-all uppercase tracking-widest text-xs rounded-xl"
                  >
                    Open in Classroom <ExternalLink size={14} />
                  </a>

                  <button
                    onClick={() => handleToggleHideCourse(selectedCourse.id)}
                    disabled={actionLoading}
                    className={`w-full h-10 border font-bold flex items-center justify-center gap-2 transition-all uppercase tracking-widest text-[11px] rounded-xl ${
                      hiddenCourseIds.has(selectedCourse.id)
                        ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                        : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-input'
                    }`}
                  >
                    {actionLoading ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : hiddenCourseIds.has(selectedCourse.id) ? (
                      <Eye size={14} />
                    ) : (
                      <EyeOff size={14} />
                    )}
                    <span>{hiddenCourseIds.has(selectedCourse.id) ? 'Unhide Course' : `Hide from ${semShort} View`}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Assignments List */}
            <div className="lg:col-span-8">
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-sm uppercase tracking-wider text-foreground font-bold font-display leading-none">
                      Coursework &amp; Submissions
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-muted text-muted-foreground border border-border">
                      {selectedCourse.assignments.length} Total
                    </span>
                  </div>

                  {/* Submission Filter Tabs */}
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <button
                      onClick={() => setFilterTab('ALL_ACTIVE')}
                      className={`px-2.5 py-1 rounded-lg transition-colors ${
                        filterTab === 'ALL_ACTIVE' ? 'bg-primary text-black font-bold' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setFilterTab('PENDING')}
                      className={`px-2.5 py-1 rounded-lg transition-colors ${
                        filterTab === 'PENDING' ? 'bg-amber-400 text-black font-bold' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Pending ({selectedCourse.stats?.pending || 0})
                    </button>
                    <button
                      onClick={() => setFilterTab('TURNED_IN')}
                      className={`px-2.5 py-1 rounded-lg transition-colors ${
                        filterTab === 'TURNED_IN' ? 'bg-emerald-400 text-black font-bold' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Turned In ({selectedCourse.stats?.submitted || 0})
                    </button>
                  </div>
                </div>
                
                <div className="p-5 space-y-3 max-h-[72vh] overflow-y-auto custom-scrollbar">
                  {(() => {
                    const filteredWork = selectedCourse.assignments.filter(a => {
                      if (filterTab === 'PENDING') return !a.isSubmitted;
                      if (filterTab === 'TURNED_IN') return a.isSubmitted;
                      return true;
                    });

                    if (filteredWork.length === 0) {
                      return (
                        <div className="py-16 text-center text-muted-foreground font-mono text-xs">
                          <CheckCircle2 className="mx-auto mb-3 text-emerald-400/40" size={36} />
                          <p>
                            {filterTab === 'PENDING' 
                              ? 'All assignments in this course are submitted!' 
                              : filterTab === 'TURNED_IN' 
                                ? 'No submitted assignments in this filter.' 
                                : 'No assignments posted for this classroom.'}
                          </p>
                        </div>
                      );
                    }

                    return filteredWork.map((assignment, idx) => (
                      <AssignmentItem key={assignment.id} assignment={assignment} index={idx} />
                    ));
                  })()}
                </div>
              </div>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* ── INTERACTIVE SUBJECT MAPPING MODAL (POOL OF 7TH SEM SUBJECTS) ── */}
      <AnimatePresence>
        {mappingModalCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <MotionDiv
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-border flex items-start justify-between gap-4 bg-muted/20">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Link2 className="text-primary" size={18} />
                    <h2 className="text-xl font-display font-bold text-foreground">
                      Map Classroom to {semLabel} Subject
                    </h2>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                    Classroom: <span className="text-foreground font-bold">&quot;{mappingModalCourse.name}&quot;</span> ({mappingModalCourse.section || 'General'})
                  </p>
                </div>
                <button
                  onClick={() => setMappingModalCourse(null)}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-lg border border-border hover:border-input transition-colors shrink-0"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Pool of Subjects List */}
              <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                {/* Detected Professor & Bayesian Evidence */}
                {mappingModalCourse.detectedProfessor && (
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-mono text-primary">
                    <GraduationCap size={15} />
                    <span>Instructor: <strong className="text-foreground">{mappingModalCourse.detectedProfessor}</strong></span>
                  </div>
                )}

                {mappingModalCourse.classification?.probability && (
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs font-mono space-y-1.5">
                    <div className="flex items-center justify-between text-foreground font-bold">
                      <span className="flex items-center gap-1.5">
                        <Sparkles size={14} className="text-primary" />
                        Probabilistic Recommendation:
                      </span>
                      <span className="text-primary font-mono font-bold">{Math.round(mappingModalCourse.classification.probability * 100)}% Match</span>
                    </div>
                    {mappingModalCourse.classification.evidence?.map((ev, i) => (
                      <div key={i} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        <span>{ev}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider font-bold">
                  Select from Current {semLabel} Curriculum:
                </div>

                <div className="space-y-2.5">
                  {subjectsPool.map((subj) => {
                    const isSelected = selectedSubjectCode === subj.code.toUpperCase() && !customCodeInput.trim();
                    const isAllotted = subj.isAllotted;

                    return (
                      <div
                        key={subj.code}
                        onClick={() => {
                          setSelectedSubjectCode(subj.code.toUpperCase());
                          setCustomCodeInput('');
                        }}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-primary/10 border-primary shadow-sm text-foreground' 
                            : 'bg-card border-border hover:border-input text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                            isSelected ? 'bg-primary border-primary text-black' : 'border-border'
                          }`}>
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-primary">[{subj.code}]</span>
                              <span className="font-semibold text-sm text-foreground">{subj.name}</span>
                              {isAllotted && (
                                <span className="px-2 py-0.2 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                  Your Allotted Elective
                                </span>
                              )}
                              {subj.type === 'CORE' && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-muted text-muted-foreground border border-border">
                                  Core
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                              {subj.description} {subj.faculty ? `• ${subj.faculty}` : ''} {subj.room ? `(${subj.room})` : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Custom Subject Code Input */}
                <div className="pt-2 border-t border-border space-y-2">
                  <div className="text-xs font-mono text-muted-foreground">Or enter a custom Subject Code:</div>
                  <input
                    type="text"
                    value={customCodeInput}
                    onChange={(e) => setCustomCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g. CS40099"
                    className="w-full px-3.5 py-2 rounded-xl bg-card border border-border text-foreground text-xs font-mono uppercase focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs font-mono text-muted-foreground">
                  Selected Code: <span className="text-primary font-bold">{customCodeInput.trim() || selectedSubjectCode || 'None'}</span>
                </div>

                <div className="flex items-center gap-2.5">
                  {mappingModalCourse.mappedSubject && (
                    <button
                      onClick={handleRemoveSubjectMapping}
                      disabled={savingSubjectMapping}
                      className="px-3 py-2 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-mono transition-colors flex items-center gap-1.5"
                    >
                      <Unlink size={13} />
                      <span>Unlink</span>
                    </button>
                  )}
                  <button
                    onClick={() => setMappingModalCourse(null)}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSubjectMapping}
                    disabled={savingSubjectMapping || (!selectedSubjectCode && !customCodeInput.trim())}
                    className="px-5 py-2 rounded-xl bg-primary text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm shadow-primary/20 disabled:opacity-50"
                  >
                    {savingSubjectMapping ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        <span>Save Mapping</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>

      {/* ── INTERACTIVE 7TH SEMESTER CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {isConfirmModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <MotionDiv
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-card border border-border w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-border flex items-start justify-between gap-4 bg-muted/20">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="text-primary" size={18} />
                    <h2 className="text-xl font-display font-bold text-foreground">
                      Auto-Detect &amp; Confirm {semLabel} Classrooms
                    </h2>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                    Review and confirm which classrooms belong to your active {semLabel}. Historical and unselected courses will be hidden from your schedule and dashboard.
                  </p>
                </div>
                <button
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-lg border border-border hover:border-input transition-colors shrink-0"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body: Scrollable Course Categories */}
              <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                {/* 1. Recommended Active Classrooms */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-emerald-400">
                      Recommended {semLabel} Classrooms ({recommendedActiveCourses.length})
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {recommendedActiveCourses.map(course => {
                      const isSelected = selectedForActive.has(course.id);
                      return (
                        <div
                          key={course.id}
                          onClick={() => toggleCourseInModal(course.id)}
                          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-emerald-950/15 border-emerald-500/40 text-foreground' 
                              : 'bg-card border-border/70 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                              isSelected ? 'bg-primary border-primary text-black' : 'border-border'
                            }`}>
                              {isSelected && <Check size={13} strokeWidth={3} />}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-foreground">{course.name}</span>
                                {course.mappedSubject?.code && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                                    {course.mappedSubject.code}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                                {course.classification?.reason}
                              </p>
                            </div>
                          </div>

                          <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                            {course.assignments.length} assignments
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Ambiguous / Review Needed Classrooms */}
                {ambiguousCourses.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle size={16} className="text-amber-400" />
                      <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-amber-400">
                        Needs Confirmation / Ambiguous ({ambiguousCourses.length})
                      </h3>
                    </div>

                    <div className="space-y-2">
                      {ambiguousCourses.map(course => {
                        const isSelected = selectedForActive.has(course.id);
                        return (
                          <div
                            key={course.id}
                            onClick={() => toggleCourseInModal(course.id)}
                            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                              isSelected 
                                ? 'bg-amber-950/20 border-amber-500/40 text-foreground' 
                                : 'bg-card border-border/70 hover:border-border'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                                isSelected ? 'bg-amber-400 border-amber-400 text-black' : 'border-border'
                              }`}>
                                {isSelected && <Check size={13} strokeWidth={3} />}
                              </div>

                              <div>
                                <span className="font-semibold text-sm text-foreground">{course.name}</span>
                                <p className="text-[11px] font-mono text-amber-400/80 mt-0.5">
                                  {course.classification?.reason}
                                </p>
                              </div>
                            </div>

                            <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                              {course.assignments.length} assignments
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Previous Semester & Backlog Classrooms (Will be hidden) */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Layers size={16} className="text-muted-foreground" />
                    <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-muted-foreground">
                      Previous Semesters &amp; Inactive Classrooms ({pastSemesterCourses.length})
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {pastSemesterCourses.map(course => {
                      const isSelected = selectedForActive.has(course.id);
                      return (
                        <div
                          key={course.id}
                          onClick={() => toggleCourseInModal(course.id)}
                          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-card border-primary/30 text-foreground' 
                              : 'bg-muted/10 border-border/40 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                              isSelected ? 'bg-primary border-primary text-black' : 'border-border'
                            }`}>
                              {isSelected && <Check size={13} strokeWidth={3} />}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-foreground">{course.name}</span>
                                <span className="text-[9px] font-mono text-muted-foreground uppercase px-1.5 py-0.2 rounded bg-muted">
                                  {course.section || 'Past Sem'}
                                </span>
                              </div>
                              <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                                {course.classification?.reason}
                              </p>
                            </div>
                          </div>

                          <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                            {course.assignments.length} assignments
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs font-mono text-muted-foreground">
                  <span className="text-primary font-bold">{selectedForActive.size}</span> Active Classrooms Selected •{' '}
                  <span className="text-foreground">{courses.length - selectedForActive.size}</span> will be hidden
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setIsConfirmModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveActiveConfirmation}
                    disabled={confirmSaving}
                    className="px-5 py-2 rounded-xl bg-primary text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm shadow-primary/20"
                  >
                    {confirmSaving ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        <span>Confirm &amp; Sync Active Classrooms</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
