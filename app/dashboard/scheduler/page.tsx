'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, MapPin, User, Sparkles, Download, Layers, 
  CheckCircle2, AlertTriangle, ArrowRight, BookOpen, Plus, Trash2, 
  ChevronLeft, ChevronRight, Filter, Moon, Activity, Check, X, 
  Loader2, ExternalLink, RefreshCw, FileText, GraduationCap, 
  ShieldCheck, Info, Search, Tag, Inbox, BellRing, Database
} from 'lucide-react';

interface ClassSlot {
  id: string;
  group: string;
  day: string; // 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'
  startTime: string; // e.g. "08:00"
  endTime: string;   // e.g. "09:00"
  subject: string;   // e.g. "Minor", "ENPP", "T&P", "PE-IV"
  room?: string | null;
  faculty?: string | null;
  isElective?: boolean;
  electiveSection?: string;
  subjectId?: string | null;
  subjectCode?: string;
}

interface AcademicItem {
  id: string;
  title: string;
  category: 'DEADLINE' | 'CLASSROOM' | 'EXAM' | 'CAREER' | 'GENERAL';
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  courseCode?: string;
  deadline?: string;
  takeaway?: string;
  actionItems?: string[];
  sender?: string;
  source: string;
  day?: string;
  isCompleted?: boolean;
  isSubmitted?: boolean;
  submissionState?: string;
  isLate?: boolean;
  assignedGrade?: number | null;
  maxPoints?: number | null;
  alternateLink?: string | null;
  attendanceData?: {
    reportDate: string;
    rollNumber?: string;
    records: Array<{
      courseCode: string;
      percentage: number;
      subjectName?: string;
      lastReportDate?: string;
    }>;
  };
}

interface SubjectItem {
  id: string;
  code: string;
  name: string;
  shortName: string | null;
  semester: number;
  type: string;
  branch: string | null;
  credits: number | null;
  faculty: string | null;
  classroom: string | null;
  description: string | null;
}

const PE_IV_ELECTIVES = [
  { id: 'STA_A_PM', code: 'CS40003', shortName: 'ST&A (Gr-A PM)', name: 'Software Testing & Automation (Group A)', faculty: 'Prof. Proshikshya Mukherjee', room: 'CL-A-06', branch: 'ECSc' },
  { id: 'STA_A_SMH', code: 'CS40003', shortName: 'ST&A (Gr-A SM)', name: 'Software Testing & Automation (Group A)', faculty: 'Prof. Subhashree Mishra', room: 'CL-A-05', branch: 'ECSc' },
  { id: 'STA_B_SMH', code: 'CS40003', shortName: 'ST&A (Gr-B)', name: 'Software Testing & Automation (Group B)', faculty: 'Prof. Subhashree Mishra', room: 'CL-A-05', branch: 'ECSc' },
  { id: 'HCI_A_SBB', code: 'CS40005', shortName: 'HCI (Gr-A SBB)', name: 'Human Computer Interaction (Group A)', faculty: 'Prof. Seshadri Binay Behera', room: 'CL-A-19', branch: 'ECSc' },
  { id: 'HCI_A_SSM', code: 'CS40005', shortName: 'HCI (Gr-A SSM)', name: 'Human Computer Interaction (Group A)', faculty: 'Prof. Sadhana Subhadarshini Mohanty', room: 'CL-14', branch: 'ECSc' },
  { id: 'CNS_A_SMR', code: 'CS40015', shortName: 'C&NS', name: 'Cryptography & Network Security', faculty: 'Prof. Suman Roy', room: 'CL-A-01', branch: 'ETC, ECSc' },
  { id: 'SDN_A_ADATTA', code: 'CS30023', shortName: 'SDN', name: 'Software Defined Networking', faculty: 'Prof. Amlan Datta', room: 'CL-A-03', branch: 'ETC' },
  { id: 'LPVD-A_MRT', code: 'EC40007', shortName: 'LP_VLSID', name: 'Low Power VLSI Design', faculty: 'Prof. Manas Ranjan Tripathy', room: 'CL-A-02', branch: 'ETC' },
  { id: 'WBE_A_SB', code: 'EE40013', shortName: 'Wind & Biomass', name: 'Wind & Biomass Energy', faculty: 'Prof. Subrat Behera', room: 'CL-A-04', branch: 'EEE' },
  { id: 'MLLP_A_SUP', code: 'EM40001', shortName: 'ML_LP (Gr-A)', name: 'ML for Language Processing (Group A)', faculty: 'Prof. Suprava Patnaik', room: 'CL-A-10', branch: 'ETC, ECSc' },
  { id: 'MLLP_B_SUP', code: 'EM40001', shortName: 'ML_LP (Gr-B)', name: 'ML for Language Processing (Group B)', faculty: 'Prof. Suprava Patnaik', room: 'CL-A-10', branch: 'ETC, ECSc' }
];

const DAYS = [
  { short: 'MON', long: 'Monday' },
  { short: 'TUE', long: 'Tuesday' },
  { short: 'WED', long: 'Wednesday' },
  { short: 'THU', long: 'Thursday' },
  { short: 'FRI', long: 'Friday' },
  { short: 'SAT', long: 'Saturday' },
];

const MotionDiv = motion.div as any;

export default function SchedulerPage() {
  const [schedule, setSchedule] = useState<ClassSlot[]>([]);
  const [academicItems, setAcademicItems] = useState<AcademicItem[]>([]);
  const [subjectsList, setSubjectsList] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Student Context
  const [activeGroup, setActiveGroup] = useState<string>('ECS GROUP-03');
  const [allottedElective, setAllottedElective] = useState<{
    electiveSection?: string;
    electiveSubject?: string;
    electiveFaculty?: string;
    electiveRoom?: string;
    electiveCode?: string;
  } | null>(null);

  // Automated Attendance Report State from academics@kiit.ac.in
  const [attendanceReport, setAttendanceReport] = useState<{
    reportDate: string;
    rollNumber?: string;
    records: Array<{
      courseCode: string;
      percentage: number;
      subjectName?: string;
      lastReportDate?: string;
    }>;
  }>({
    reportDate: '28/09/2026',
    rollNumber: '2330231',
    records: [
      { courseCode: 'EX40003', percentage: 0.00, subjectName: 'Embedded Systems & IoT Lab' },
      { courseCode: 'CS40003', percentage: 0.00, subjectName: 'Software Testing and Automation' }
    ]
  });

  // Views & Filter Controls
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'agenda'>('day');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'CLASSES' | 'ASSIGNMENTS' | 'EXAMS'>('ALL');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => {
    const today = new Date().getDay();
    return today >= 1 && today <= 6 ? today - 1 : 0;
  });

  // Modals
  const [isElectivesModalOpen, setIsElectivesModalOpen] = useState(false);
  const [electivesSearch, setElectivesSearch] = useState('');
  const [isSubjectsModalOpen, setIsSubjectsModalOpen] = useState(false);
  const [subjectsSearch, setSubjectsSearch] = useState('');
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string | null>(null);
  const [subjectDossier, setSubjectDossier] = useState<any | null>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '23:59',
    type: 'assignment' as 'assignment' | 'exam' | 'lab' | 'meeting'
  });

  // Persistence
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastSyncedText, setLastSyncedText] = useState('Just now');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenSubjectDossier = async (code: string) => {
    try {
      setSelectedSubjectCode(code);
      setLoadingDossier(true);
      const res = await fetch(`/api/subjects/${encodeURIComponent(code)}`);
      if (res.ok) {
        const data = await res.json();
        setSubjectDossier(data);
      } else {
        showToast(`Could not load details for ${code}`);
      }
    } catch (e) {
      console.error('Failed to load subject dossier:', e);
    } finally {
      setLoadingDossier(false);
    }
  };

  // 1. Fetch Complete Schedule, Attendance & Subjects from DB
  const fetchData = async (forceSync = false) => {
    try {
      if (forceSync) setIsSyncing(true);
      else setLoading(true);

      const [schedRes, mailRes, subjRes, attRes] = await Promise.allSettled([
        fetch('/api/schedule'),
        fetch(`/api/mail/sync${forceSync ? '?refresh=true' : ''}`, {
          method: forceSync ? 'POST' : 'GET'
        }),
        fetch('/api/subjects'),
        fetch('/api/attendance')
      ]);

      let allAcademicItems: AcademicItem[] = [];

      if (schedRes.status === 'fulfilled' && schedRes.value.ok) {
        const sdata = await schedRes.value.json();
        if (sdata.schedule) setSchedule(sdata.schedule);
        if (sdata.normalizedGroup) setActiveGroup(sdata.normalizedGroup);
        if (sdata.allottedElective) setAllottedElective(sdata.allottedElective);
        if (sdata.lastAttendanceReport) setAttendanceReport(sdata.lastAttendanceReport);
        if (sdata.academicItems && sdata.academicItems.length > 0) {
          allAcademicItems = [...sdata.academicItems];
        }
      }

      if (subjRes.status === 'fulfilled' && subjRes.value.ok) {
        const subData = await subjRes.value.json();
        if (subData.subjects) setSubjectsList(subData.subjects);
      }

      if (attRes.status === 'fulfilled' && attRes.value.ok) {
        const aData = await attRes.value.json();
        if (aData.records && aData.records.length > 0) {
          setAttendanceReport(prev => ({
            ...prev,
            reportDate: aData.lastReportDate || prev.reportDate,
            records: aData.records
          }));
        }
      }

      let emailItems: AcademicItem[] = [];
      if (mailRes.status === 'fulfilled' && mailRes.value.ok) {
        const mdata = await mailRes.value.json();
        if (mdata.emails && mdata.emails.length > 0) {
          emailItems = mdata.emails.map((e: any) => ({
            id: e.id,
            title: e.subject,
            category: e.category,
            urgency: e.urgency,
            courseCode: e.neuralSummary?.relatedCourseCode || (e.category === 'EXAM' ? 'EXAM CELL' : 'ACADEMIC'),
            deadline: e.neuralSummary?.detectedDeadline || e.date,
            takeaway: e.neuralSummary?.takeaway,
            actionItems: e.neuralSummary?.actionItems || [],
            sender: e.sender?.name || 'Faculty Notice',
            source: (e.sender?.email || '').includes('classroom.google.com') 
              ? 'Google Classroom' 
              : e.category === 'EXAM' 
                ? 'Examination Cell' 
                : e.category === 'CAREER' 
                  ? 'Placement Cell' 
                  : 'Faculty @kiit.ac.in',
            attendanceData: e.attendanceData
          }));
        }
      }

      // Merge email items avoiding duplicate titles with live classroom assignments
      const existingTitles = new Set(allAcademicItems.map(i => i.title.toLowerCase().trim()));
      for (const item of emailItems) {
        if (!existingTitles.has(item.title.toLowerCase().trim())) {
          allAcademicItems.push(item);
        }
      }

      setAcademicItems(allAcademicItems);

      // Auto initialize completed state for turned in assignments
      const autoCompleted: Record<string, boolean> = {};
      for (const item of allAcademicItems) {
        if (item.isSubmitted) {
          autoCompleted[item.id] = true;
        }
      }
      setCompletedItems(prev => ({ ...autoCompleted, ...prev }));
      setLastSyncedText('Just now');
      if (forceSync) {
        showToast('Schedule & attendance synchronized with Google Classroom & @kiit.ac.in!');
      }
    } catch (err) {
      console.error('Failed to load schedule data:', err);
      showToast('Error syncing schedule');
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();

    try {
      const saved = localStorage.getItem('kaizen_completed_schedule_items');
      if (saved) setCompletedItems(JSON.parse(saved));
    } catch {}
  }, []);

  const handleToggleComplete = (id: string) => {
    setCompletedItems(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem('kaizen_completed_schedule_items', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Resolve PE-IV elective dynamically in slots
  const resolvedSchedule = useMemo(() => {
    return schedule.map(slot => {
      if (slot.subject === 'PE-IV' || slot.subject.startsWith('PE-IV')) {
        const elec = allottedElective || {
          electiveSection: 'STA_A_PM',
          electiveSubject: 'CS40003 Software Testing and Automation',
          electiveFaculty: 'Prof. Proshikshya Mukherjee',
          electiveRoom: 'CL-A-06'
        };
        return {
          ...slot,
          subject: `PE-IV: ${elec.electiveSubject || 'Software Testing & Automation'}`,
          room: elec.electiveRoom || 'CL-A-06',
          faculty: elec.electiveFaculty || 'Prof. Proshikshya Mukherjee',
          isElective: true,
          electiveSection: elec.electiveSection || 'STA_A_PM'
        };
      }
      return slot;
    });
  }, [schedule, allottedElective]);

  const activeDay = DAYS[selectedDayIndex];
  
  const dayClasses = useMemo(() => {
    return resolvedSchedule
      .filter(s => s.day === activeDay.short)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [resolvedSchedule, activeDay]);

  const hasEightAMClass = useMemo(() => {
    return dayClasses.some(s => s.startTime === '08:00');
  }, [dayClasses]);

  const totalDayDuration = useMemo(() => {
    return dayClasses.reduce((acc, c) => {
      const [sh] = c.startTime.split(':').map(Number);
      const [eh] = c.endTime.split(':').map(Number);
      return acc + (eh - sh);
    }, 0);
  }, [dayClasses]);

  const filteredDayClasses = useMemo(() => {
    if (filterCategory === 'ASSIGNMENTS' || filterCategory === 'EXAMS') {
      return [];
    }
    return dayClasses;
  }, [dayClasses, filterCategory]);

  const filteredAcademicItems = useMemo(() => {
    return academicItems.filter(item => {
      if (filterCategory === 'CLASSES') return false;
      if (filterCategory === 'ASSIGNMENTS') return item.category === 'CLASSROOM' || item.category === 'DEADLINE';
      if (filterCategory === 'EXAMS') return item.category === 'EXAM' || item.category === 'CAREER';
      return true;
    });
  }, [academicItems, filterCategory]);

  // Export .ICS
  const handleExportICS = () => {
    if (resolvedSchedule.length === 0) {
      showToast('No classes to export');
      return;
    }

    const dayToByDay: Record<string, string> = {
      MON: 'MO', TUE: 'TU', WED: 'WE', THU: 'TH', FRI: 'FR', SAT: 'SA'
    };

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Kaizen//KIIT 7th Sem Routine//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:KIIT 7th Sem - ' + activeGroup,
      'X-WR-TIMEZONE:Asia/Kolkata',
    ];

    const baseDate = new Date();
    const dayOfWeek = baseDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const baseMonday = new Date(baseDate);
    baseMonday.setDate(baseDate.getDate() + mondayOffset);

    const dayOffsets: Record<string, number> = { MON: 0, TUE: 1, WED: 2, THU: 3, FRI: 4, SAT: 5 };

    resolvedSchedule.forEach((slot, idx) => {
      const offset = dayOffsets[slot.day] ?? 0;
      const slotDate = new Date(baseMonday);
      slotDate.setDate(baseMonday.getDate() + offset);

      const [startHour, startMin] = slot.startTime.split(':');
      const [endHour, endMin] = slot.endTime.split(':');

      slotDate.setHours(parseInt(startHour, 10), parseInt(startMin, 10), 0);
      const startIso = slotDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

      slotDate.setHours(parseInt(endHour, 10), parseInt(endMin, 10), 0);
      const endIso = slotDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

      const byDay = dayToByDay[slot.day] || 'MO';

      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`UID:kaizen-7sem-${slot.id || idx}@kiit.ac.in`);
      icsContent.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
      icsContent.push(`DTSTART:${startIso}`);
      icsContent.push(`DTEND:${endIso}`);
      icsContent.push(`RRULE:FREQ=WEEKLY;BYDAY=${byDay};UNTIL=20261231T235959Z`);
      icsContent.push(`SUMMARY:${slot.subject} (${slot.room || 'Campus 15'})`);
      icsContent.push(`LOCATION:${slot.room || 'Campus 15, KIIT'}`);
      icsContent.push(`DESCRIPTION:Instructor: ${slot.faculty || 'KIIT Faculty'} | Group: ${slot.group}`);
      icsContent.push('STATUS:CONFIRMED');
      icsContent.push('END:VEVENT');
    });

    icsContent.push('END:VCALENDAR');

    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kiit_routine_${activeGroup.toLowerCase().replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Downloaded .ICS file!');
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title.trim()) return;

    const item: AcademicItem = {
      id: Date.now().toString(),
      title: newEvent.title.trim(),
      category: newEvent.type === 'exam' ? 'EXAM' : 'DEADLINE',
      urgency: 'MEDIUM',
      deadline: `${newEvent.date}T${newEvent.time}:00.000Z`,
      source: 'Faculty @kiit.ac.in',
      sender: 'Personal Task'
    };

    setAcademicItems(prev => [item, ...prev]);
    showToast('Event added to schedule!');
    setIsAddEventOpen(false);
    setNewEvent({
      title: '',
      date: new Date().toISOString().split('T')[0],
      time: '23:59',
      type: 'assignment'
    });
  };

  const getSubjectType = (sub: string) => {
    const s = sub.toUpperCase();
    if (s.includes('T&P')) return { label: 'PLACEMENT', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
    if (s.includes('ENPP')) return { label: 'MANAGEMENT', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
    if (s.includes('PROJECT')) return { label: 'CAPSTONE', bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30' };
    if (s.includes('MINOR')) return { label: 'SPECIALIZATION', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
    if (s.includes('PE-') || s.includes('ELECTIVE') || s.includes('ST&A') || s.includes('HCI') || s.includes('C&NS')) {
      return { label: 'PE-IV ELECTIVE', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
    }
    if (s.includes('LAB') || s.includes('PRACTICAL')) return { label: 'LAB', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' };
    return { label: 'LECTURE', bg: 'bg-primary/10 text-primary border-primary/30' };
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[75vh] items-center justify-center gap-3">
        <Loader2 className="text-primary animate-spin" size={38} />
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground animate-pulse">
          Loading Official KIIT Academic Schedule...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pt-6 pb-20 px-4 md:px-8">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 bg-card border border-primary/40 text-foreground px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 text-xs font-mono"
          >
            <Sparkles size={16} className="text-primary shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER: SUPER CLEAN & REFINED (NO CLUTTER) ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-foreground">
            CHRONO-<span className="text-primary">SYNC</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
            Live schedule for School of Electronics Engineering (7th Sem). Synced with official faculty deadlines, exam cell notices, and timetable lectures.
          </p>

          {/* Clean Student Roster Badges */}
          <div className="mt-3 flex flex-wrap items-center gap-2.5 text-xs font-mono">
            {/* Core Section Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-foreground shadow-xs">
              <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Group:</span>
              <span className="font-bold text-primary">{activeGroup}</span>
            </div>

            {/* Allotted PE-IV Elective Badge */}
            {allottedElective && allottedElective.electiveSection && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 shadow-xs">
                <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400">PE-IV Elective:</span>
                <span className="font-semibold text-foreground truncate max-w-[280px]">
                  {allottedElective.electiveSubject?.replace(/^[A-Z]{2,4}\d{4,5}\s*/i, '') || 'Elective Course'}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-rose-500/20 text-rose-300 font-bold uppercase">
                  {allottedElective.electiveSection}
                </span>
                {allottedElective.electiveRoom && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-primary font-bold">{allottedElective.electiveRoom}</span>
                  </>
                )}
                {allottedElective.electiveFaculty && (
                  <span className="text-muted-foreground font-light hidden sm:inline">({allottedElective.electiveFaculty})</span>
                )}
              </div>
            )}

            {/* DB Subjects Directory Trigger */}
            <button
              onClick={() => setIsSubjectsModalOpen(true)}
              className="text-xs font-mono text-muted-foreground hover:text-foreground flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-dashed border-border hover:border-primary/40 transition-colors"
              title="View all subjects from NeonDB Subject table"
            >
              <Database size={12} className="text-primary" />
              <span>Course Subjects DB</span>
            </button>

            {/* All 11 Electives Table Trigger */}
            <button
              onClick={() => setIsElectivesModalOpen(true)}
              className="text-xs font-mono text-muted-foreground hover:text-foreground flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-dashed border-border hover:border-primary/40 transition-colors"
              title="View all 11 elective section classrooms"
            >
              <Info size={12} className="text-rose-400" />
              <span>All 11 Elective Rooms</span>
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-end">
          <button
            onClick={() => fetchData(true)}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-mono font-bold text-foreground transition-all shadow-xs"
            title="Refresh schedule &amp; fetch latest notices from @kiit.ac.in"
          >
            <RefreshCw size={13} className={`text-primary ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>

          <button
            onClick={handleExportICS}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-mono font-bold text-foreground transition-all shadow-xs"
            title="Download iCalendar file to sync with phone calendar"
          >
            <Download size={13} className="text-primary" />
            <span>Export .ICS</span>
          </button>

          <button
            onClick={() => setIsAddEventOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-black text-xs font-bold font-mono uppercase tracking-wider hover:bg-primary/90 transition-all shadow-sm"
          >
            <Plus size={13} />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* ── METRICS RIBBON ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
        <div className="p-4 rounded-2xl bg-card border border-border/80">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Today&apos;s Lectures</div>
          <div className="text-3xl font-display font-bold text-primary">
            {dayClasses.length}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">{totalDayDuration} hours scheduled</div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/80">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Faculty Deadlines</div>
          <div className="text-3xl font-display font-bold text-cyan-400">
            {academicItems.filter(i => i.category === 'CLASSROOM' || i.category === 'DEADLINE').length}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">Assignment submissions</div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/80">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Upcoming Exams</div>
          <div className="text-3xl font-display font-bold text-amber-400">
            {academicItems.filter(i => i.category === 'EXAM' || i.category === 'CAREER').length}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">Endsem commencing Nov 24</div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/80">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Attendance Guard</div>
          <div className={`text-xl font-display font-bold mt-1 ${hasEightAMClass ? 'text-amber-400' : 'text-emerald-400'}`}>
            {hasEightAMClass ? '08:00 AM Class' : 'No Early Class'}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
            {hasEightAMClass ? 'Target bedtime: 11:30 PM' : 'Circadian rhythm balanced'}
          </div>
        </div>
      </div>

      {/* ── VIEW SWITCHER & FILTER TABS ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 mb-6">
        
        {/* Left: View Mode Switches */}
        <div className="flex items-center gap-1 p-1 bg-card border border-border rounded-xl self-start">
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
              viewMode === 'day' ? 'bg-primary text-black font-bold shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Day Timeline
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
              viewMode === 'week' ? 'bg-primary text-black font-bold shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Week Matrix
          </button>
          <button
            onClick={() => setViewMode('agenda')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
              viewMode === 'agenda' ? 'bg-primary text-black font-bold shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Agenda &amp; Deadlines
          </button>
        </div>

        {/* Right: Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'ALL', label: 'All Items' },
            { id: 'CLASSES', label: 'Classes' },
            { id: 'ASSIGNMENTS', label: 'Faculty Deadlines' },
            { id: 'EXAMS', label: 'Exams & Vivas' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterCategory(tab.id as any)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all border ${
                filterCategory === tab.id
                  ? 'bg-muted border-primary/50 text-foreground font-bold'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── VIEW 1: DAY TIMELINE ── */}
      {viewMode === 'day' && (
        <div className="space-y-6">
          {/* Day Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {DAYS.map((day, idx) => {
              const isActive = idx === selectedDayIndex;
              const countForDay = schedule.filter(s => s.day === day.short).length;
              return (
                <button
                  key={day.short}
                  onClick={() => setSelectedDayIndex(idx)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-mono font-medium transition-all shrink-0 border ${
                    isActive 
                      ? 'bg-primary text-black border-primary font-bold shadow-sm'
                      : 'bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  <span className="font-display text-sm">{day.long}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    isActive ? 'bg-black/20 text-black' : 'bg-muted text-muted-foreground'
                  }`}>
                    {countForDay} Classes
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Main Daily Timeline (8 Cols) */}
            <div className="lg:col-span-8 space-y-3.5">
              
              {/* Daily Classes */}
              {filteredDayClasses.length === 0 && filterCategory === 'CLASSES' ? (
                <div className="p-12 border-2 border-dashed border-border rounded-2xl text-center bg-card/40">
                  <Moon size={32} className="text-muted-foreground/40 mx-auto mb-3" />
                  <h3 className="text-lg font-display font-bold text-foreground">No Classes Scheduled</h3>
                  <p className="text-xs font-mono text-muted-foreground mt-1">
                    Free window on {activeDay.long}. Ideal for capstone development and PYQ revisions.
                  </p>
                </div>
              ) : (
                filteredDayClasses.map((slot, i) => {
                  const subType = getSubjectType(slot.subject);
                  const isPE = slot.isElective || slot.subject.includes('PE-IV');

                  return (
                    <MotionDiv
                      key={slot.id || i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`p-4 rounded-2xl bg-card border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                        isPE 
                          ? 'border-rose-500/40 bg-rose-500/[0.02] hover:border-rose-500/70 shadow-xs' 
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-4">
                        {/* Time Pill */}
                        <div className="p-3 bg-muted/60 border border-border/80 rounded-xl text-center min-w-[90px] shrink-0">
                          <div className="text-xs font-mono font-bold text-foreground">
                            {slot.startTime}
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground">
                            to {slot.endTime}
                          </div>
                        </div>

                        {/* Subject & Classroom Details */}
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className={`text-base font-display font-bold transition-colors ${
                              isPE ? 'text-foreground group-hover:text-rose-400' : 'text-foreground group-hover:text-primary'
                            }`}>
                              {slot.subject}
                            </h3>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border uppercase tracking-wider ${subType.bg}`}>
                              {subType.label}
                            </span>
                            {slot.electiveSection && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                                {slot.electiveSection}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs font-mono text-muted-foreground">
                            {slot.subjectCode && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenSubjectDossier(slot.subjectCode!);
                                }}
                                className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:border-primary/50 transition-all flex items-center gap-1 cursor-pointer"
                                title="Click to view full Subject Dossier & PYQs"
                              >
                                <span>Code: {slot.subjectCode}</span>
                              </button>
                            )}
                            <div className="flex items-center gap-1">
                              <MapPin size={12} className={isPE ? 'text-rose-400' : 'text-primary'} />
                              <span className="font-semibold text-foreground/90">{slot.room || 'Campus 15, KIIT'}</span>
                            </div>
                            {slot.faculty && (
                              <div className="flex items-center gap-1">
                                <User size={12} className={isPE ? 'text-rose-400' : 'text-primary'} />
                                <span>{slot.faculty}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Tag / Elective Reference */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {isPE ? (
                          <button
                            onClick={() => setIsElectivesModalOpen(true)}
                            className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-colors"
                          >
                            All 11 Rooms
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-muted/60 text-muted-foreground border border-border">
                            {activeGroup}
                          </span>
                        )}
                      </div>
                    </MotionDiv>
                  );
                })
              )}

              {/* Integrated Faculty Deadlines & Official Exam Notices */}
              {filteredAcademicItems.length > 0 && filterCategory !== 'CLASSES' && (
                <div className="pt-2 space-y-3">
                  {filteredAcademicItems.map(item => {
                    const isDone = completedItems[item.id] || false;
                    const isExam = item.category === 'EXAM' || item.category === 'CAREER';

                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-2xl bg-card border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isDone 
                            ? 'opacity-60 border-border bg-muted/20' 
                            : isExam 
                              ? 'border-amber-500/30 bg-amber-500/[0.02]' 
                              : 'border-cyan-500/30 bg-cyan-500/[0.02]'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => handleToggleComplete(item.id)}
                            className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                              isDone 
                                ? 'bg-primary border-primary text-black' 
                                : 'border-border hover:border-primary/60 text-transparent'
                            }`}
                            title={isDone ? 'Mark as Pending' : 'Mark as Done'}
                          >
                            <Check size={12} strokeWidth={3} />
                          </button>

                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h4 className={`text-sm font-semibold text-foreground ${isDone ? 'line-through text-muted-foreground' : ''}`}>
                                {item.title}
                              </h4>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${
                                isExam 
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                                  : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                              }`}>
                                {isExam ? 'EXAMINATION' : 'ASSIGNMENT'}
                              </span>
                              {item.isSubmitted ? (
                                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                                  ✓ Turned In
                                </span>
                              ) : item.category === 'CLASSROOM' ? (
                                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border bg-amber-500/10 text-amber-400 border-amber-500/30">
                                  Pending Submission
                                </span>
                              ) : null}
                              {item.courseCode && (
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  {item.courseCode}
                                </span>
                              )}
                            </div>

                            {item.takeaway && (
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                {item.takeaway}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-muted-foreground">
                              <span className="text-primary flex items-center gap-1 font-semibold">
                                <Clock size={11} />
                                {item.deadline ? new Date(item.deadline).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Due soon'}
                              </span>
                              <span>•</span>
                              <span>{item.sender}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {item.alternateLink && (
                            <a
                              href={item.alternateLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 rounded-lg text-xs font-mono border border-border hover:border-input text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                              title="Open in Google Classroom"
                            >
                              <span>Classroom</span>
                              <ExternalLink size={11} />
                            </a>
                          )}
                          <button
                            onClick={() => handleToggleComplete(item.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors font-bold ${
                              isDone 
                                ? 'bg-muted text-muted-foreground' 
                                : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20'
                            }`}
                          >
                            {isDone ? 'Completed' : 'Mark Done'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>

            {/* Right Rail: Attendance Report & Focus Optimizer (4 Cols) */}
            <div className="lg:col-span-4 space-y-5">
              
              {/* ── AUTOMATED ATTENDANCE REPORT (academics@kiit.ac.in) ── */}
              <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
                <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-border/80">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-400" />
                    <div>
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                        Official Attendance Report
                      </h3>
                      <div className="text-[10px] font-mono text-muted-foreground">
                        Auto-fetched from academics@kiit.ac.in
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                    Till {attendanceReport.reportDate}
                  </span>
                </div>

                <div className="space-y-2 mb-3">
                  {attendanceReport.records.map((rec, idx) => (
                    <div 
                      key={idx}
                      onClick={() => handleOpenSubjectDossier(rec.courseCode)}
                      className="p-3 rounded-xl bg-muted/40 border border-border/60 hover:border-primary/40 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                      title="Click to view subject dossier & PYQs"
                    >
                      <div className="min-w-0 flex-1">
                        {/* Title: Subject Name */}
                        <div className="text-xs font-bold text-foreground truncate font-display group-hover:text-primary transition-colors">
                          {rec.subjectName || (rec.courseCode === 'EX40003' ? 'Embedded Systems & IoT Laboratory' : 'Software Testing and Automation')}
                        </div>
                        {/* Subtitle: Course Code */}
                        <div className="text-[10px] font-mono text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          <span className="font-bold text-primary px-1.5 py-0.2 rounded bg-primary/10 border border-primary/20">
                            {rec.courseCode}
                          </span>
                          <span>•</span>
                          <span>Till {rec.lastReportDate || attendanceReport.reportDate}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-xs font-bold font-mono ${rec.percentage < 75 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {rec.percentage.toFixed(2)} %
                        </div>
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase ${
                          rec.percentage < 75 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {rec.percentage < 75 ? 'Shortage Warning' : 'Safe'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] font-mono text-muted-foreground bg-muted/20 p-2 rounded-lg flex items-center justify-between">
                  <span>Student Roll: <strong>{attendanceReport.rollNumber || '2330231'}</strong></span>
                  <span className="text-primary font-semibold">Min 75% required</span>
                </div>
              </div>

              {/* Focus Optimizer */}
              <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} className="text-primary" />
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
                    Focus Target
                  </h3>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed mb-4">
                  Based on your {activeDay.long} schedule ({dayClasses.length} lectures), your prime uninterrupted focus window is between <strong>11:00 AM and 01:00 PM</strong>.
                </p>
                <div className="space-y-2 text-xs font-mono">
                  <div className="p-2.5 bg-background/80 rounded-xl border border-border flex items-center justify-between">
                    <span className="text-muted-foreground">Study Target</span>
                    <span className="text-foreground font-bold">PE-IV Lab &amp; Selenium Suite</span>
                  </div>
                </div>
              </div>

              {/* Sync Timestamp */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border text-[11px] font-mono text-muted-foreground flex items-center justify-between">
                <span>Last Updated: {lastSyncedText}</span>
                <button
                  onClick={() => fetchData(true)}
                  className="text-primary hover:underline font-bold flex items-center gap-1"
                >
                  <RefreshCw size={11} className={isSyncing ? 'animate-spin' : ''} />
                  <span>Sync Now</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ── VIEW 2: WEEK MATRIX ── */}
      {viewMode === 'week' && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground text-[11px] font-mono uppercase tracking-widest">
                  <th className="py-3 px-4 w-28">Day</th>
                  <th className="py-3 px-4">Daily Classes Schedule ({activeGroup})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {DAYS.map(day => {
                  const daySlots = resolvedSchedule
                    .filter(s => s.day === day.short)
                    .sort((a, b) => a.startTime.localeCompare(b.startTime));

                  return (
                    <tr key={day.short} className="hover:bg-muted/20 transition-colors">
                      <td className="py-4 px-4 font-mono text-xs font-bold text-foreground bg-muted/20 align-top">
                        <div className="text-sm font-display">{day.long}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{daySlots.length} Classes</div>
                      </td>
                      <td className="py-3 px-4">
                        {daySlots.length === 0 ? (
                          <span className="text-xs font-mono text-muted-foreground/60 italic">No classes scheduled</span>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                            {daySlots.map(slot => {
                              const subType = getSubjectType(slot.subject);
                              const isPE = slot.isElective || slot.subject.includes('PE-IV');

                              return (
                                <div
                                  key={slot.id}
                                  className={`p-2.5 rounded-xl border transition-colors shadow-xs ${
                                    isPE 
                                      ? 'bg-rose-500/[0.04] border-rose-500/40 hover:border-rose-500/70' 
                                      : 'bg-card border-border/80 hover:border-primary/40'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <span className={`font-bold text-xs truncate ${isPE ? 'text-rose-300' : 'text-foreground'}`} title={slot.subject}>
                                      {slot.subject}
                                    </span>
                                    <span className={`px-1.5 py-0.2 rounded text-[8px] font-mono font-bold uppercase shrink-0 ${subType.bg}`}>
                                      {subType.label}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between gap-1 text-[10px] font-mono mb-1">
                                    <span className="text-primary font-bold">
                                      {slot.startTime} - {slot.endTime}
                                    </span>
                                    {slot.subjectCode && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenSubjectDossier(slot.subjectCode!);
                                        }}
                                        className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-primary/10 text-primary hover:bg-primary/20 font-bold shrink-0 cursor-pointer"
                                        title="View Subject Details & PYQs"
                                      >
                                        {slot.subjectCode}
                                      </button>
                                    )}
                                  </div>
                                  <div className="text-[10px] font-mono text-muted-foreground truncate mt-0.5 flex items-center justify-between">
                                    <span>{slot.room || 'Campus 15'}</span>
                                    {slot.faculty && <span className="opacity-70 truncate max-w-[90px]">{slot.faculty}</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── VIEW 3: AGENDA & DEADLINES FEED ── */}
      {viewMode === 'agenda' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-display font-bold text-foreground">Official Faculty Submissions &amp; Exams</h2>
              <p className="text-xs font-mono text-muted-foreground">Classroom submissions, endsem examination dates, and mock evaluations.</p>
            </div>
            <button
              onClick={() => setIsAddEventOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-black text-xs font-mono font-bold hover:bg-primary/90 transition-all shadow-sm"
            >
              <Plus size={13} />
              <span>Add Event</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAcademicItems.length === 0 ? (
              <div className="col-span-2 p-12 border-2 border-dashed border-border rounded-2xl text-center text-muted-foreground text-xs font-mono">
                No active faculty deadlines recorded.
              </div>
            ) : (
              filteredAcademicItems.map(item => {
                const isDone = completedItems[item.id] || false;
                const isExam = item.category === 'EXAM' || item.category === 'CAREER';

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl bg-card border flex items-start justify-between gap-4 transition-all ${
                      isDone 
                        ? 'opacity-60 border-border' 
                        : isExam 
                          ? 'border-amber-500/40 bg-amber-500/[0.02]' 
                          : 'border-cyan-500/40 bg-cyan-500/[0.02]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${
                          isExam 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                            : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                        }`}>
                          {item.category}
                        </span>
                        {item.isSubmitted ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                            ✓ Turned In
                          </span>
                        ) : item.category === 'CLASSROOM' ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border bg-amber-500/10 text-amber-400 border-amber-500/30">
                            Pending
                          </span>
                        ) : null}
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {item.sender}
                        </span>
                      </div>

                      <h3 className={`text-sm font-semibold text-foreground mb-1.5 ${isDone ? 'line-through text-muted-foreground' : ''}`}>
                        {item.title}
                      </h3>

                      {item.takeaway && (
                        <p className="text-xs text-muted-foreground mb-2">
                          {item.takeaway}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                        <div className="flex items-center gap-1 text-primary">
                          <Calendar size={12} />
                          <span>{item.deadline ? new Date(item.deadline).toLocaleDateString() : 'Active'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>{item.deadline ? new Date(item.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '23:59'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.alternateLink && (
                        <a
                          href={item.alternateLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg border border-border hover:border-input text-muted-foreground hover:text-foreground transition-colors"
                          title="Open in Google Classroom"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                      <button
                        onClick={() => handleToggleComplete(item.id)}
                        className={`p-2 rounded-lg border transition-colors ${
                          isDone 
                            ? 'bg-primary border-primary text-black' 
                            : 'border-border hover:border-primary/60 text-muted-foreground hover:text-foreground'
                        }`}
                        title={isDone ? 'Mark Pending' : 'Mark Completed'}
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── MODAL 1: NEONDB SUBJECTS & MODULES DIRECTORY ── */}
      <AnimatePresence>
        {isSubjectsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <MotionDiv
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-4xl shadow-2xl relative max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <div>
                  <div className="flex items-center gap-2">
                    <Database size={16} className="text-primary" />
                    <h3 className="font-display font-bold text-lg text-foreground">
                      Course Subjects &amp; Curriculum Directory
                    </h3>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">
                    Official relational subjects stored in NeonDB with mapped syllabus modules, PYQs, and faculty in-charge.
                  </p>
                </div>
                <button
                  onClick={() => setIsSubjectsModalOpen(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search filter */}
              <div className="mb-4">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by subject code (e.g. CS40003, EX40003), name, faculty, or type (CORE, ELECTIVE)..."
                    value={subjectsSearch}
                    onChange={(e) => setSubjectsSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-muted border border-input rounded-xl text-xs font-mono text-foreground focus:border-primary outline-none"
                  />
                </div>
              </div>

              {/* Subjects Table */}
              <div className="overflow-y-auto custom-scrollbar flex-1 pr-1">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-[10px] uppercase">
                      <th className="py-2.5 px-3">Subject Code</th>
                      <th className="py-2.5 px-3">Subject Name</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Credits</th>
                      <th className="py-2.5 px-3">Classroom</th>
                      <th className="py-2.5 px-3">Faculty In-Charge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {subjectsList.filter(s => {
                      const q = subjectsSearch.toLowerCase();
                      return !q || 
                        s.code.toLowerCase().includes(q) || 
                        s.name.toLowerCase().includes(q) || 
                        (s.shortName && s.shortName.toLowerCase().includes(q)) ||
                        (s.faculty && s.faculty.toLowerCase().includes(q)) ||
                        s.type.toLowerCase().includes(q);
                    }).map(s => {
                      const isAllotted = allottedElective && (
                        (allottedElective as any).electiveCode === s.code || 
                        allottedElective.electiveSubject?.includes(s.code)
                      );

                      return (
                        <tr 
                          key={s.id} 
                          onClick={() => {
                            setIsSubjectsModalOpen(false);
                            handleOpenSubjectDossier(s.code);
                          }}
                          className={`transition-colors cursor-pointer ${
                            isAllotted 
                              ? 'bg-rose-500/10 border-l-2 border-l-rose-500 hover:bg-rose-500/20' 
                              : 'hover:bg-muted/50'
                          }`}
                          title="Click to view full Subject Dossier & PYQs"
                        >
                          <td className="py-3 px-3 font-bold">
                            <span className="px-2 py-0.5 rounded bg-muted text-foreground">
                              {s.code}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-foreground">{s.name}</div>
                            {s.description && (
                              <div className="text-[10px] text-muted-foreground line-clamp-1">{s.description}</div>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                              s.type === 'ELECTIVE' ? 'bg-rose-500/20 text-rose-300' :
                              s.type === 'CORE' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                            }`}>
                              {s.type}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-semibold text-foreground">
                            {s.credits ? `${s.credits.toFixed(1)} CR` : '3.0 CR'}
                          </td>
                          <td className="py-3 px-3 text-muted-foreground">
                            {s.classroom || 'Campus 15'}
                          </td>
                          <td className="py-3 px-3 text-muted-foreground truncate max-w-[200px]">
                            {s.faculty || 'School Faculty'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-mono text-muted-foreground">
                <span>{subjectsList.length} Official Subjects Stored in NeonDB</span>
                <button
                  onClick={() => setIsSubjectsModalOpen(false)}
                  className="px-4 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-bold"
                >
                  Close
                </button>
              </div>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: SUBJECT DOSSIER & PYQS ── */}
      <AnimatePresence>
        {selectedSubjectCode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <MotionDiv
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-4xl shadow-2xl relative max-h-[88vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-muted text-foreground">
                        {selectedSubjectCode}
                      </span>
                      <h3 className="font-display font-bold text-lg text-foreground">
                        {subjectDossier?.subject?.name || selectedSubjectCode}
                      </h3>
                      {subjectDossier?.subject?.type && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-primary/20 text-primary uppercase">
                          {subjectDossier.subject.type}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">
                      Subject Intelligence Dossier • KIIT School of Electronics Engineering
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedSubjectCode(null);
                    setSubjectDossier(null);
                  }}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              {loadingDossier ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 size={32} className="animate-spin text-primary" />
                  <span className="text-xs font-mono text-muted-foreground">Loading subject dossier and PYQs...</span>
                </div>
              ) : subjectDossier ? (
                <div className="overflow-y-auto custom-scrollbar flex-1 space-y-5 pr-1">
                  {/* Subject Summary Card */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                      <span className="text-[10px] font-mono uppercase text-muted-foreground block mb-1">Faculty In-Charge</span>
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <User size={13} className="text-primary shrink-0" />
                        <span className="truncate">{subjectDossier.subject?.faculty || 'School Faculty'}</span>
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                      <span className="text-[10px] font-mono uppercase text-muted-foreground block mb-1">Assigned Classroom</span>
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <MapPin size={13} className="text-primary shrink-0" />
                        <span>{subjectDossier.subject?.classroom || 'Campus 15'}</span>
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                      <span className="text-[10px] font-mono uppercase text-muted-foreground block mb-1">Credits & Branch</span>
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Tag size={13} className="text-primary shrink-0" />
                        <span>{subjectDossier.subject?.credits || 3.0} CR • {subjectDossier.subject?.branch || 'ECSc'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Description / Syllabus */}
                  {subjectDossier.subject?.description && (
                    <div className="p-4 rounded-xl bg-muted/20 border border-border">
                      <h4 className="text-xs font-mono uppercase font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                        <BookOpen size={13} className="text-primary" />
                        <span>Curriculum &amp; Course Scope</span>
                      </h4>
                      <p className="text-xs text-foreground/90 leading-relaxed font-sans">
                        {subjectDossier.subject.description}
                      </p>
                    </div>
                  )}

                  {/* Attendance Card */}
                  {subjectDossier.attendance && (
                    <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      subjectDossier.attendance.percentage < 75 
                        ? 'bg-rose-500/10 border-rose-500/30' 
                        : 'bg-emerald-500/10 border-emerald-500/30'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${
                          subjectDossier.attendance.percentage < 75 
                            ? 'bg-rose-500/20 text-rose-400' 
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          <Activity size={20} />
                        </div>
                        <div>
                          <div className="text-xs font-mono font-bold uppercase text-foreground">
                            Official Attendance (academics@kiit.ac.in)
                          </div>
                          <div className="text-[11px] font-mono text-muted-foreground">
                            Reported till {subjectDossier.attendance.lastReportDate || '28/09/2026'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className={`text-2xl font-mono font-extrabold ${
                          subjectDossier.attendance.percentage < 75 ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          {Number(subjectDossier.attendance.percentage).toFixed(2)}%
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          subjectDossier.attendance.percentage < 75 
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}>
                          {subjectDossier.attendance.percentage < 75 ? 'Shortage Alert' : 'Normal'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Routine Slots */}
                  <div>
                    <h4 className="text-xs font-mono uppercase font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Clock size={13} className="text-primary" />
                      <span>Weekly Routine Slots ({subjectDossier.scheduleSlots?.length || 0})</span>
                    </h4>
                    {subjectDossier.scheduleSlots?.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {subjectDossier.scheduleSlots.map((slot: any, idx: number) => (
                          <div key={idx} className="p-3 rounded-xl bg-card border border-border flex items-center justify-between">
                            <div>
                              <div className="text-xs font-mono font-bold text-primary">
                                {slot.day} • {slot.startTime} - {slot.endTime}
                              </div>
                              <div className="text-[10px] font-mono text-muted-foreground">
                                {slot.room || 'Campus 15'}
                              </div>
                            </div>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-foreground">
                              {slot.group}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-muted/20 border border-border text-xs font-mono text-muted-foreground text-center">
                        No scheduled timetable slots for this subject in the active routine.
                      </div>
                    )}
                  </div>

                  {/* PYQs & Examination Vault */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-mono uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                        <FileText size={13} className="text-primary" />
                        <span>Examination PYQ Vault ({subjectDossier.pyqs?.length || 0} Questions)</span>
                      </h4>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Ready for RAG &amp; Model Fine-Tuning
                      </span>
                    </div>

                    {subjectDossier.pyqs?.length > 0 ? (
                      <div className="space-y-2.5">
                        {subjectDossier.pyqs.map((q: any) => (
                          <div key={q.id} className="p-3.5 rounded-xl bg-muted/30 border border-border hover:border-primary/40 transition-colors">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/20 text-primary">
                                  {q.year || '2024'}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-muted text-foreground uppercase">
                                  {q.examType || 'End-Semester'}
                                </span>
                              </div>
                              <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase">
                                {q.status || 'APPROVED'}
                              </span>
                            </div>
                            <p className="text-xs font-mono text-foreground/90 whitespace-pre-wrap line-clamp-3">
                              {q.correctedText || q.rawOcrText || 'Question text extracted via OCR.'}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 rounded-xl bg-muted/20 border border-border text-center">
                        <FileText size={24} className="mx-auto text-muted-foreground mb-2 opacity-50" />
                        <div className="text-xs font-mono text-foreground font-semibold">
                          No past exam questions indexed yet for {selectedSubjectCode}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                          Questions uploaded to Data Ingestion Studio will automatically map to this subject code.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-mono text-muted-foreground">
                <span>Relational Subject Code: {selectedSubjectCode}</span>
                <button
                  onClick={() => {
                    setSelectedSubjectCode(null);
                    setSubjectDossier(null);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-bold"
                >
                  Close
                </button>
              </div>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 2: ALL 11 PE-IV ELECTIVES CLASSROOMS DIRECTORY ── */}
      <AnimatePresence>
        {isElectivesModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <MotionDiv
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-3xl shadow-2xl relative max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <div>
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} className="text-rose-400" />
                    <h3 className="font-display font-bold text-lg text-foreground">
                      PE-IV Electives Classroom Directory
                    </h3>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">
                    Official 7th Semester School of Electronics Engineering elective sections &amp; room allotment table.
                  </p>
                </div>
                <button
                  onClick={() => setIsElectivesModalOpen(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search filter */}
              <div className="mb-4">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by subject, code (e.g. CS40003), professor, or room (CL-A-06)..."
                    value={electivesSearch}
                    onChange={(e) => setElectivesSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-muted border border-input rounded-xl text-xs font-mono text-foreground focus:border-primary outline-none"
                  />
                </div>
              </div>

              {/* Table of 11 electives */}
              <div className="overflow-y-auto custom-scrollbar flex-1 pr-1">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-[10px] uppercase">
                      <th className="py-2.5 px-3">Section Code</th>
                      <th className="py-2.5 px-3">Subject &amp; Paper</th>
                      <th className="py-2.5 px-3">Classroom</th>
                      <th className="py-2.5 px-3">Faculty In-charge</th>
                      <th className="py-2.5 px-3">Branch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {PE_IV_ELECTIVES.filter(ele => {
                      const q = electivesSearch.toLowerCase();
                      return !q || 
                        ele.name.toLowerCase().includes(q) || 
                        ele.code.toLowerCase().includes(q) || 
                        ele.faculty.toLowerCase().includes(q) || 
                        ele.room.toLowerCase().includes(q) ||
                        ele.id.toLowerCase().includes(q);
                    }).map(ele => {
                      const isUserElective = allottedElective?.electiveSection === ele.id;

                      return (
                        <tr 
                          key={ele.id} 
                          className={`transition-colors ${
                            isUserElective 
                              ? 'bg-rose-500/10 border-l-2 border-l-rose-500' 
                              : 'hover:bg-muted/30'
                          }`}
                        >
                          <td className="py-3 px-3 font-bold">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${
                              isUserElective ? 'bg-rose-500/20 text-rose-300 font-extrabold' : 'bg-muted text-foreground'
                            }`}>
                              {ele.id}
                            </span>
                            {isUserElective && (
                              <div className="text-[9px] text-rose-400 font-bold mt-1 uppercase tracking-wider">
                                YOUR ALLOTTED
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-foreground">{ele.name}</div>
                            <div className="text-[10px] text-muted-foreground">{ele.code}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                              {ele.room}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-muted-foreground">
                            {ele.faculty}
                          </td>
                          <td className="py-3 px-3 text-[10px] text-muted-foreground">
                            {ele.branch}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-mono text-muted-foreground">
                <span>Total 11 Official Elective Classrooms Allocated</span>
                <button
                  onClick={() => setIsElectivesModalOpen(false)}
                  className="px-4 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-bold"
                >
                  Close
                </button>
              </div>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 3: ADD EVENT ── */}
      <AnimatePresence>
        {isAddEventOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <MotionDiv
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-primary" />
                  <h3 className="font-display font-bold text-lg text-foreground">
                    Add Schedule Item
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddEventOpen(false)}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddEvent} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Operating Systems Lab Review"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="w-full px-3 py-2 bg-muted border border-input rounded-xl text-xs text-foreground focus:border-primary outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                      className="w-full px-3 py-2 bg-muted border border-input rounded-xl text-xs font-mono text-foreground focus:border-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                      Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                      className="w-full px-3 py-2 bg-muted border border-input rounded-xl text-xs font-mono text-foreground focus:border-primary outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                    Category *
                  </label>
                  <select
                    value={newEvent.type}
                    onChange={(e: any) => setNewEvent({ ...newEvent, type: e.target.value })}
                    className="w-full px-3 py-2 bg-muted border border-input rounded-xl text-xs font-mono font-bold text-foreground focus:border-primary outline-none"
                  >
                    <option value="assignment">Faculty Assignment</option>
                    <option value="exam">Midsem / Endsem Exam</option>
                    <option value="lab">Lab Viva / Review</option>
                    <option value="meeting">Proctor Meeting</option>
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddEventOpen(false)}
                    className="px-4 py-2 border border-border rounded-xl text-xs font-mono text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-black rounded-xl text-xs font-mono font-bold uppercase tracking-wider hover:bg-primary/90 transition-all shadow-sm"
                  >
                    Save to Schedule
                  </button>
                </div>
              </form>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
