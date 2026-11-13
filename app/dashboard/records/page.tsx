'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, Plus, Trash2, Edit3, Save, RefreshCw, Loader2, 
  GraduationCap, Award, BookOpen, AlertCircle, CheckCircle2, 
  Upload, X, ChevronRight, Layers, ArrowUpRight
} from 'lucide-react';

interface GradeEntry {
  id: string;
  subjectCode: string;
  subjectName: string;
  credits: number;
  grade: string;
}

interface SemesterRecord {
  id: string;
  semesterNumber: number;
  sgpa: number;
  creditsRegistered: number;
  creditsEarned: number;
  remarks: string | null;
  grades: GradeEntry[];
  updatedAt: string;
}

interface AcademicProfile {
  id: string;
  rollNumber: string | null;
  program: string | null;
  branch: string | null;
  section: string | null;
  cgpa: number;
}

interface AcademicStats {
  semestersCount: number;
  totalCreditsRegistered: number;
  totalCreditsEarned: number;
  totalSubjectsCount: number;
  overallCGPA: number;
}

const MotionDiv = motion.div as any;

// KIIT Standard Grade Scale
const GRADE_POINTS: Record<string, number> = {
  O: 10,
  E: 9,
  A: 8,
  B: 7,
  C: 6,
  D: 5,
  F: 0
};

const GRADE_COLORS: Record<string, string> = {
  O: 'text-primary border-primary/40 bg-primary/10',
  E: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
  A: 'text-blue-400 border-blue-500/40 bg-blue-500/10',
  B: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
  C: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10',
  D: 'text-orange-400 border-orange-500/40 bg-orange-500/10',
  F: 'text-red-500 border-red-500/40 bg-red-500/10'
};

export default function AcademicRecordsPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AcademicProfile | null>(null);
  const [stats, setStats] = useState<AcademicStats | null>(null);
  const [semesters, setSemesters] = useState<SemesterRecord[]>([]);
  const [activeSemIndex, setActiveSemIndex] = useState(0);

  // Status & Feedback
  const [savingAction, setSavingAction] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals / Forms
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [isAddSemesterOpen, setIsAddSemesterOpen] = useState(false);
  const [editingGradeId, setEditingGradeId] = useState<string | null>(null);

  // Add Subject Form State
  const [newSubject, setNewSubject] = useState({
    subjectCode: '',
    subjectName: '',
    credits: '4',
    grade: 'O'
  });

  // Add Semester Form State
  const [newSemesterNum, setNewSemesterNum] = useState<string>('1');

  // Inline Subject Edit State
  const [editSubjectData, setEditSubjectData] = useState({
    subjectCode: '',
    subjectName: '',
    credits: '4',
    grade: 'O'
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  // 1. Fetch All Academic Records from Neon DB
  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/academic/records');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch academic records');
      }

      setProfile(data.profile);
      setStats(data.stats);
      setSemesters(data.semesters || []);

      // If next semester available, keep index in range
      if (data.semesters && data.semesters.length > 0) {
        setActiveSemIndex((prev) => (prev >= data.semesters.length ? data.semesters.length - 1 : prev));
        // Suggest next semester number for add form
        const maxSem = Math.max(...data.semesters.map((s: SemesterRecord) => s.semesterNumber));
        setNewSemesterNum(String(maxSem + 1));
      } else {
        setNewSemesterNum('1');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      showError(err.message || 'Database connection error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const activeSemester = semesters[activeSemIndex] || null;

  // 2. Direct NeonDB Grade Update (Dropdown inline change)
  const handleQuickGradeChange = async (gradeId: string, newGrade: string) => {
    try {
      setSavingAction(`grade-${gradeId}`);
      const res = await fetch('/api/academic/records', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateSubject',
          gradeId,
          grade: newGrade
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update grade');

      showToast(`NeonDB: Grade updated to '${newGrade}'. SGPA & CGPA recalculated!`);
      await fetchRecords();
    } catch (err: any) {
      showError(err.message || 'Update failed');
    } finally {
      setSavingAction(null);
    }
  };

  // 3. Save Full Subject Edit
  const handleSaveSubjectEdit = async (gradeId: string) => {
    try {
      setSavingAction(`save-${gradeId}`);
      const res = await fetch('/api/academic/records', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateSubject',
          gradeId,
          subjectCode: editSubjectData.subjectCode,
          subjectName: editSubjectData.subjectName,
          credits: parseFloat(editSubjectData.credits),
          grade: editSubjectData.grade
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update subject');

      showToast(`NeonDB: Subject ${editSubjectData.subjectCode} updated!`);
      setEditingGradeId(null);
      await fetchRecords();
    } catch (err: any) {
      showError(err.message || 'Update failed');
    } finally {
      setSavingAction(null);
    }
  };

  // 4. Add New Subject to Current Semester
  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSemester) return;

    try {
      setSavingAction('addSubject');
      const res = await fetch('/api/academic/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addSubject',
          semesterId: activeSemester.id,
          subjectCode: newSubject.subjectCode,
          subjectName: newSubject.subjectName,
          credits: parseFloat(newSubject.credits),
          grade: newSubject.grade
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to add subject');

      showToast(`NeonDB: Added ${newSubject.subjectCode.toUpperCase()} to Semester ${activeSemester.semesterNumber}!`);
      setIsAddSubjectOpen(false);
      setNewSubject({ subjectCode: '', subjectName: '', credits: '4', grade: 'O' });
      await fetchRecords();
    } catch (err: any) {
      showError(err.message || 'Failed to save subject');
    } finally {
      setSavingAction(null);
    }
  };

  // 5. Add New Semester
  const handleAddSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingAction('addSemester');
      const res = await fetch('/api/academic/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addSemester',
          semesterNumber: parseInt(newSemesterNum, 10),
          sgpa: 0.0,
          remarks: 'PASS'
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to add semester');

      showToast(`NeonDB: Semester ${newSemesterNum} initialized!`);
      setIsAddSemesterOpen(false);
      await fetchRecords();
      // Select the newly added semester
      setActiveSemIndex(semesters.length);
    } catch (err: any) {
      showError(err.message || 'Failed to add semester');
    } finally {
      setSavingAction(null);
    }
  };

  // 6. Delete Subject
  const handleDeleteSubject = async (gradeId: string, subjectCode: string) => {
    if (!confirm(`Are you sure you want to permanently delete ${subjectCode} from NeonDB?`)) return;

    try {
      setSavingAction(`delete-${gradeId}`);
      const res = await fetch(`/api/academic/records?gradeId=${gradeId}`, {
        method: 'DELETE'
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to delete subject');

      showToast(`NeonDB: Removed ${subjectCode}. Recalculated CGPA.`);
      await fetchRecords();
    } catch (err: any) {
      showError(err.message || 'Deletion failed');
    } finally {
      setSavingAction(null);
    }
  };

  // 7. Delete Entire Semester
  const handleDeleteSemester = async (semesterId: string, semNum: number) => {
    if (!confirm(`CAUTION: Delete Semester ${semNum} and all its course grades from NeonDB? This cannot be undone.`)) return;

    try {
      setSavingAction(`delete-sem-${semesterId}`);
      const res = await fetch(`/api/academic/records?semesterId=${semesterId}`, {
        method: 'DELETE'
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to delete semester');

      showToast(`NeonDB: Semester ${semNum} purged.`);
      setActiveSemIndex(0);
      await fetchRecords();
    } catch (err: any) {
      showError(err.message || 'Failed to delete semester');
    } finally {
      setSavingAction(null);
    }
  };

  // 8. Recompute All
  const handleRecalculateAll = async () => {
    try {
      setSavingAction('recalculateAll');
      const res = await fetch('/api/academic/records', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'recalculate' })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Recalculation failed');

      showToast('NeonDB: All SGPA and CGPA weighted averages refreshed successfully!');
      await fetchRecords();
    } catch (err: any) {
      showError(err.message || 'Failed to recalculate');
    } finally {
      setSavingAction(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[75vh] items-center justify-center gap-3">
        <Loader2 className="text-primary animate-spin" size={38} />
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground animate-pulse">
          Syncing Academic Ledger with NeonDB...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pt-6 pb-24 px-4 md:px-8">
      
      {/* Toast Feedback Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 text-xs font-mono"
          >
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 bg-red-950/90 border border-red-500/40 text-red-200 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 text-xs font-mono"
          >
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5">
              <Database size={11} />
              Neon Serverless PostgreSQL
            </span>
            <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Persistent
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-foreground">
            ACADEMIC <span className="text-primary">LEDGER</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            View, audit, and edit stored semester grades directly in the NeonDB cloud database.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRecalculateAll}
            disabled={savingAction === 'recalculateAll'}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-muted/40 hover:bg-muted text-xs font-mono font-bold text-foreground transition-all disabled:opacity-50"
            title="Recalculate weighted SGPA and CGPA from course credits"
          >
            <RefreshCw size={13} className={savingAction === 'recalculateAll' ? 'animate-spin' : ''} />
            <span>Sync & Recalculate</span>
          </button>

          <button
            onClick={() => setIsAddSemesterOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-muted/40 hover:bg-muted text-xs font-mono font-bold text-foreground transition-all"
          >
            <Plus size={13} className="text-primary" />
            <span>Add Semester</span>
          </button>

          <Link
            href="/dashboard/upload"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-black text-xs font-bold font-mono uppercase tracking-wider hover:bg-primary/90 transition-all shadow-sm"
          >
            <Upload size={13} />
            <span>Upload SGR PDF</span>
          </Link>
        </div>
      </div>

      {/* Top Aggregated Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-8">
        <div className="p-4 rounded-2xl bg-card border border-border/80 relative overflow-hidden">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Overall CGPA</div>
          <div className="text-3xl font-display font-bold text-primary">
            {stats?.overallCGPA !== undefined ? stats.overallCGPA.toFixed(2) : '0.00'}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">Weighted Cumulative</div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/80 relative overflow-hidden">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Credits Earned</div>
          <div className="text-3xl font-display font-bold text-foreground">
            {stats?.totalCreditsEarned || 0}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">Across all semesters</div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/80 relative overflow-hidden">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Semesters Logged</div>
          <div className="text-3xl font-display font-bold text-foreground">
            {stats?.semestersCount || 0}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">In Neon Postgres</div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/80 relative overflow-hidden">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Total Courses</div>
          <div className="text-3xl font-display font-bold text-foreground">
            {stats?.totalSubjectsCount || 0}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">Subject grade records</div>
        </div>
      </div>

      {/* Zero State if Database Has No Semesters */}
      {semesters.length === 0 ? (
        <div className="p-12 border-2 border-dashed border-border rounded-3xl text-center bg-card/40 my-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} />
          </div>
          <h3 className="text-xl font-display font-bold text-foreground mb-2">No Stored Academic Records Found</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
            Your Neon database is clean and ready. You can ingest your official KIIT Semester Grade Report (PDF) or initialize semesters manually.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard/upload"
              className="px-5 py-2.5 rounded-xl bg-primary text-black font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-primary/90 transition-all shadow-md"
            >
              <Upload size={14} />
              <span>Ingest SGR PDF Report</span>
            </Link>
            <button
              onClick={() => setIsAddSemesterOpen(true)}
              className="px-5 py-2.5 rounded-xl border border-border bg-muted/60 text-foreground font-mono text-xs font-bold hover:bg-muted transition-all"
            >
              + Create Semester 1 Manually
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Semester Tabs Navigation */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 custom-scrollbar">
            {semesters.map((sem, idx) => {
              const isActive = idx === activeSemIndex;
              return (
                <button
                  key={sem.id}
                  onClick={() => setActiveSemIndex(idx)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider shrink-0 transition-all border flex items-center gap-2.5 ${
                    isActive
                      ? 'bg-primary text-black border-primary shadow-sm'
                      : 'bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  <span>Semester {sem.semesterNumber}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] ${
                      isActive ? 'bg-black/20 text-black' : 'bg-muted text-primary'
                    }`}
                  >
                    SGPA {sem.sgpa.toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Semester Inspector Card */}
          {activeSemester && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mb-12">
              
              {/* Semester Summary Bar */}
              <div className="p-5 md:p-6 bg-muted/30 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <h2 className="text-2xl font-display font-bold text-foreground">
                      SEMESTER {activeSemester.semesterNumber}
                    </h2>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        activeSemester.remarks === 'FAIL'
                          ? 'bg-red-500/10 text-red-400 border-red-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {activeSemester.remarks || 'PASS'}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-muted-foreground flex items-center gap-3">
                    <span>Registered: <strong className="text-foreground">{activeSemester.creditsRegistered}</strong> cr</span>
                    <span>•</span>
                    <span>Earned: <strong className="text-foreground">{activeSemester.creditsEarned}</strong> cr</span>
                    <span>•</span>
                    <span>Last synced: {new Date(activeSemester.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-right mr-2 hidden sm:block">
                    <div className="text-[10px] uppercase font-mono text-muted-foreground">Semester SGPA</div>
                    <div className="text-2xl font-display font-bold text-primary">
                      {activeSemester.sgpa.toFixed(2)}
                    </div>
                  </div>

                  <button
                    onClick={() => setIsAddSubjectOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-black text-xs font-mono font-bold hover:bg-primary/90 transition-all shadow-sm"
                  >
                    <Plus size={14} />
                    <span>Add Course</span>
                  </button>

                  <button
                    onClick={() => handleDeleteSemester(activeSemester.id, activeSemester.semesterNumber)}
                    className="p-2 rounded-lg border border-border text-muted-foreground hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 transition-colors"
                    title={`Delete Semester ${activeSemester.semesterNumber}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Course Grades Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-muted-foreground text-[11px] font-mono uppercase tracking-widest">
                      <th className="py-3 px-5 w-32">Course Code</th>
                      <th className="py-3 px-5">Subject Title</th>
                      <th className="py-3 px-5 w-24 text-center">Credits</th>
                      <th className="py-3 px-5 w-32 text-center">Grade (O - F)</th>
                      <th className="py-3 px-5 w-28 text-center">Points</th>
                      <th className="py-3 px-5 w-28 text-center">Credit Index</th>
                      <th className="py-3 px-5 w-28 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {activeSemester.grades.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-muted-foreground text-xs font-mono">
                          No subjects recorded in Semester {activeSemester.semesterNumber}. Click &quot;Add Course&quot; above to log subjects.
                        </td>
                      </tr>
                    ) : (
                      activeSemester.grades.map((grade) => {
                        const isEditing = editingGradeId === grade.id;
                        const pt = GRADE_POINTS[grade.grade.trim().toUpperCase()] ?? 0;
                        const creditIndex = (pt * grade.credits).toFixed(1);
                        const isSavingThis = savingAction === `grade-${grade.id}` || savingAction === `save-${grade.id}`;

                        if (isEditing) {
                          return (
                            <tr key={grade.id} className="bg-primary/5">
                              <td className="py-3 px-5">
                                <input
                                  type="text"
                                  value={editSubjectData.subjectCode}
                                  onChange={(e) => setEditSubjectData({ ...editSubjectData, subjectCode: e.target.value })}
                                  className="w-full px-2 py-1 bg-card border border-primary text-xs font-mono text-foreground uppercase rounded"
                                />
                              </td>
                              <td className="py-3 px-5">
                                <input
                                  type="text"
                                  value={editSubjectData.subjectName}
                                  onChange={(e) => setEditSubjectData({ ...editSubjectData, subjectName: e.target.value })}
                                  className="w-full px-2 py-1 bg-card border border-primary text-xs font-medium text-foreground rounded"
                                />
                              </td>
                              <td className="py-3 px-5 text-center">
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0.5"
                                  max="10"
                                  value={editSubjectData.credits}
                                  onChange={(e) => setEditSubjectData({ ...editSubjectData, credits: e.target.value })}
                                  className="w-16 px-2 py-1 bg-card border border-primary text-xs font-mono text-center text-foreground rounded mx-auto"
                                />
                              </td>
                              <td className="py-3 px-5 text-center">
                                <select
                                  value={editSubjectData.grade}
                                  onChange={(e) => setEditSubjectData({ ...editSubjectData, grade: e.target.value })}
                                  className="px-2 py-1 bg-card border border-primary text-xs font-bold text-foreground rounded"
                                >
                                  {Object.keys(GRADE_POINTS).map((g) => (
                                    <option key={g} value={g}>{g} ({GRADE_POINTS[g]} pts)</option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-3 px-5 text-center font-mono text-xs text-muted-foreground">
                                {GRADE_POINTS[editSubjectData.grade] ?? 0}
                              </td>
                              <td className="py-3 px-5 text-center font-mono text-xs text-muted-foreground">
                                {((GRADE_POINTS[editSubjectData.grade] ?? 0) * (parseFloat(editSubjectData.credits) || 0)).toFixed(1)}
                              </td>
                              <td className="py-3 px-5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleSaveSubjectEdit(grade.id)}
                                    disabled={isSavingThis}
                                    className="p-1.5 bg-primary text-black rounded hover:bg-primary/90 transition-all text-xs"
                                    title="Save to NeonDB"
                                  >
                                    {isSavingThis ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                                  </button>
                                  <button
                                    onClick={() => setEditingGradeId(null)}
                                    className="p-1.5 bg-muted text-muted-foreground rounded hover:text-foreground transition-all text-xs"
                                    title="Cancel"
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={grade.id} className="hover:bg-muted/30 transition-colors group">
                            <td className="py-3.5 px-5 font-mono text-xs font-semibold text-foreground">
                              {grade.subjectCode}
                            </td>
                            <td className="py-3.5 px-5 text-xs text-foreground font-medium">
                              {grade.subjectName}
                            </td>
                            <td className="py-3.5 px-5 text-xs font-mono text-center text-muted-foreground">
                              {grade.credits}
                            </td>
                            <td className="py-3.5 px-5 text-center">
                              {/* Direct NeonDB Dropdown Select */}
                              <div className="inline-block relative">
                                <select
                                  value={grade.grade}
                                  disabled={isSavingThis}
                                  onChange={(e) => handleQuickGradeChange(grade.id, e.target.value)}
                                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold border cursor-pointer outline-none transition-all ${
                                    GRADE_COLORS[grade.grade.trim().toUpperCase()] || 'text-foreground border-border bg-card'
                                  }`}
                                  title="Change grade to immediately save to NeonDB"
                                >
                                  {Object.keys(GRADE_POINTS).map((g) => (
                                    <option key={g} value={g} className="bg-card text-foreground">
                                      {g}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </td>
                            <td className="py-3.5 px-5 text-xs font-mono text-center text-muted-foreground">
                              {pt}
                            </td>
                            <td className="py-3.5 px-5 text-xs font-mono text-center font-semibold text-foreground">
                              {creditIndex}
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setEditingGradeId(grade.id);
                                    setEditSubjectData({
                                      subjectCode: grade.subjectCode,
                                      subjectName: grade.subjectName,
                                      credits: String(grade.credits),
                                      grade: grade.grade
                                    });
                                  }}
                                  className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                  title="Edit Course Details"
                                >
                                  <Edit3 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteSubject(grade.id, grade.subjectCode)}
                                  className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                                  title="Delete Course from NeonDB"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── MODAL: ADD SUBJECT ── */}
      <AnimatePresence>
        {isAddSubjectOpen && activeSemester && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <MotionDiv
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-primary" />
                  <h3 className="font-display font-bold text-lg text-foreground">
                    Add Subject to Semester {activeSemester.semesterNumber}
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddSubjectOpen(false)}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddSubject} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                    Course Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS2001 or IT3002"
                    value={newSubject.subjectCode}
                    onChange={(e) => setNewSubject({ ...newSubject, subjectCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-muted border border-input rounded-xl text-xs font-mono uppercase text-foreground focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                    Subject Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Operating Systems"
                    value={newSubject.subjectName}
                    onChange={(e) => setNewSubject({ ...newSubject, subjectName: e.target.value })}
                    className="w-full px-3 py-2 bg-muted border border-input rounded-xl text-xs text-foreground focus:border-primary outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                      Credits *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="10"
                      required
                      value={newSubject.credits}
                      onChange={(e) => setNewSubject({ ...newSubject, credits: e.target.value })}
                      className="w-full px-3 py-2 bg-muted border border-input rounded-xl text-xs font-mono text-foreground focus:border-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                      Grade *
                    </label>
                    <select
                      value={newSubject.grade}
                      onChange={(e) => setNewSubject({ ...newSubject, grade: e.target.value })}
                      className="w-full px-3 py-2 bg-muted border border-input rounded-xl text-xs font-mono font-bold text-foreground focus:border-primary outline-none"
                    >
                      {Object.keys(GRADE_POINTS).map((g) => (
                        <option key={g} value={g}>{g} ({GRADE_POINTS[g]} pts)</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddSubjectOpen(false)}
                    className="px-4 py-2 border border-border rounded-xl text-xs font-mono text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingAction === 'addSubject'}
                    className="px-4 py-2 bg-primary text-black rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-primary/90 transition-all shadow-sm"
                  >
                    {savingAction === 'addSubject' ? (
                      <><Loader2 size={13} className="animate-spin" /> Saving to NeonDB...</>
                    ) : (
                      <><Database size={13} /> Save to NeonDB</>
                    )}
                  </button>
                </div>
              </form>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: ADD SEMESTER ── */}
      <AnimatePresence>
        {isAddSemesterOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <MotionDiv
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-primary" />
                  <h3 className="font-display font-bold text-lg text-foreground">
                    Initialize Semester
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddSemesterOpen(false)}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddSemester} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                    Semester Number (1 to 10) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={newSemesterNum}
                    onChange={(e) => setNewSemesterNum(e.target.value)}
                    className="w-full px-3 py-2 bg-muted border border-input rounded-xl text-xs font-mono text-foreground focus:border-primary outline-none"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Initializes a new semester record in your Neon Postgres database.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddSemesterOpen(false)}
                    className="px-4 py-2 border border-border rounded-xl text-xs font-mono text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingAction === 'addSemester'}
                    className="px-4 py-2 bg-primary text-black rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-primary/90 transition-all shadow-sm"
                  >
                    {savingAction === 'addSemester' ? (
                      <><Loader2 size={13} className="animate-spin" /> Initializing...</>
                    ) : (
                      <><Database size={13} /> Create in NeonDB</>
                    )}
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

