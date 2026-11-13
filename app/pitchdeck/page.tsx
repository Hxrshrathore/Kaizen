'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ChevronLeft, ChevronRight, Maximize2, Minimize2, 
  Layers, BookOpen, Clock, Calendar, CheckCircle2, 
  Sparkles, ShieldCheck, ArrowRight, ExternalLink, 
  Cpu, Database, Terminal, AlertTriangle, FileText, 
  HelpCircle, Eye, EyeOff, Play, Pause, Grid, X, 
  GraduationCap, Check, ArrowUpRight, Zap, RefreshCw, BarChart3,
  Apple, HeartPulse, Activity, TrendingUp, GitBranch, ShieldAlert, Network, Download
} from 'lucide-react';
import { ArchitectureFlow } from '@/components/ui/architecture-flow';

// --- TYPES ---

interface SlideData {
  id: number;
  category: string;
  tag: string;
  title: string;
  subtitle: string;
  ficNotes: {
    academicJustification: string;
    technicalHighlights: string[];
    defensePoints: string[];
  };
}

export default function PitchDeckPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [showFicNotes, setShowFicNotes] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);
  const [topologyTab, setTopologyTab] = useState<'flow' | 'layers'>('flow');
  const [activeModelTab, setActiveModelTab] = useState<number>(2);

  const totalSlides = 12;

  // Slide definitions with FIC academic evaluation notes
  const slides: SlideData[] = useMemo(() => [
    {
      id: 0,
      category: 'EXECUTIVE OVERVIEW',
      tag: 'B.TECH CAPSTONE · 2026-2027',
      title: 'NEXUS KAIZEN',
      subtitle: 'The Autonomous Academic Operating System & Neural Knowledge Engine for Engineering Education',
      ficNotes: {
        academicJustification: 'Solves institutional workflow fragmentation where university routines, Google Classrooms, and attendance reports exist in disconnected, unsearchable silos.',
        technicalHighlights: [
          'Full-stack Next.js 16 + Neon Serverless PostgreSQL with Prisma ORM',
          'Bi-directional Google Classroom API v1 integration with automated token refresh',
          'Roll-based dynamic elective injection for 638+ students across 11 elective sections'
        ],
        defensePoints: [
          'Unlike generic calendar apps, Kaizen is purpose-built for KIIT academic regulations (75% debar rule, PE-IV multi-sectioning, and PYQ paper formats).',
          'Runs at $0/month using hybrid edge serverless computing and auto-sleeping micro-instances.'
        ]
      }
    },
    {
      id: 1,
      category: 'PROBLEM STATEMENT',
      tag: 'CAMPUS REALITY & PAIN POINTS',
      title: 'The Academic Entropy Crisis',
      subtitle: 'Why 600+ university engineering students struggle with fragmented information every semester',
      ficNotes: {
        academicJustification: 'Quantifies academic inefficiency: students lose an average of 3.2 hours per week tracking deadlines across unarchived classrooms and decoding routine section splits.',
        technicalHighlights: [
          'Audit revealed 17 active Google Classrooms per student with 0 archival by professors',
          '638 students split into 11 elective subgroups with conflicting physical room assignments',
          'Attendance notifications sent as raw unindexed emails with zero predictive warnings'
        ],
        defensePoints: [
          'Academic performance drops when students miss lab submission deadlines due to notification fatigue.',
          'Kaizen filters out previous semester noise while strictly preserving student agency via confirmation modals.'
        ]
      }
    },
    {
      id: 2,
      category: 'CORE SOLUTION',
      tag: 'THE KAIZEN ARCHITECTURE',
      title: 'Autonomous Academic OS',
      subtitle: 'A single, self-updating neural layer bridging Student, Classroom, Biometrics, and University Infrastructure',
      ficNotes: {
        academicJustification: 'Unifies the student lifecycle: schedule, assignment tracking, Apple Health circadian recovery, and examination intelligence into a single reactive interface.',
        technicalHighlights: [
          'Core Subject Engine anchored on canonical subject codes (CS40003, EX40003, TP40001) across Semesters 1–8',
          'One-Click Apple HealthKit sync calculating sleep debt, HRV recovery, and daily cognitive capacity',
          'NVIDIA Nemotron 30B reasoning engine synthesizing official KIIT question papers with Bloom\'s CO mappings'
        ],
        defensePoints: [
          'Not a passive dashboard — it actively resolves timetable conflicts, classifies current semester coursework, and calculates attendance debar danger zones.',
          'Bridges physical wellbeing with academic pacing by modeling sleep deficit against 8:00 AM lecture absences.'
        ]
      }
    },
    {
      id: 3,
      category: 'SYSTEM ARCHITECTURE',
      tag: 'TOPOLOGY & INFRASTRUCTURE',
      title: 'Production System Topology',
      subtitle: 'Serverless Edge Frontend, Relational Data Layer, and Multi-Modal Vision-Language AI Pipeline',
      ficNotes: {
        academicJustification: 'Enterprise-grade architecture following clean separation of concerns: Edge Client -> Stateless API Handlers -> Relational Neon Database -> Multi-Model AI Router.',
        technicalHighlights: [
          'Client: Next.js 16 App Router with React 19, Tailwind CSS, Framer Motion, and GSAP',
          'Database: Neon Serverless PostgreSQL with Prisma connection pooling and ACID guarantees',
          'Interactive Topology: Live Animated Beam Graph interconnecting Biometrics, Classroom, Vector DB, and LLMs'
        ],
        defensePoints: [
          'Zero vendor lock-in: database queries use standard SQL and relational Prisma models.',
          'Model Router automatically falls back from local in-house quantized models to NVIDIA Nemotron Reasoning NIM.'
        ]
      }
    },
    {
      id: 4,
      category: 'VERIFIED MILESTONES',
      tag: 'PRODUCTION STATUS TODAY',
      title: 'What Is Live & Operating',
      subtitle: 'Real university data, real active users, and 100% verified production endpoints',
      ficNotes: {
        academicJustification: 'Demonstrates tangible progress for Major Project Phase 1 evaluation: all core features are live and functioning on production data rather than conceptual mockups.',
        technicalHighlights: [
          'Dynamic multi-semester engine operating across Semesters 1–8 with 638 verified student profiles',
          'Live Google Classroom API v1 coursework sync with Bayesian self-healing pattern recognition',
          'One-Click Apple HealthKit (.shortcut) workflow persisting sleep & HRV to NeonDB HealthMetric table',
          'NVIDIA Nemotron 30B reasoning engine synthesizing full 60-mark End-Sem papers with zero truncation'
        ],
        defensePoints: [
          'Every module demonstrated in this presentation is fully functional and testable right now at localhost:3000.',
          'Question paper synthesis renders as an authentic physical white-paper sheet matching KIIT examination standards.'
        ]
      }
    },
    {
      id: 5,
      category: 'DYNAMIC ROUTINE ENGINE',
      tag: 'ZERO-HARDCODING TIMETABLE',
      title: 'Dynamic Elective Resolution',
      subtitle: 'Solving multi-section timetable conflicts for 638 students across 11 elective rooms',
      ficNotes: {
        academicJustification: 'University routines publish base sections (ECS 1-7) but distribute electives across 11 disjoint classrooms (CL-A-01 to CL-A-19). Kaizen solves this automatically.',
        technicalHighlights: [
          'Roll number query dynamically resolves Section and Allotted Elective section (e.g. STA_A_PM)',
          'SQL join automatically replaces generic PE-IV slot with exact faculty and room venue',
          'Zero hardcoding: all 638 students resolve their unique routine accurately across any semester'
        ],
        defensePoints: [
          'Verified with student 2330231 (Harsh Kumar) resolving ST&A with Prof. Proshikshya Mukherjee in CL-A-06, while student 2330002 resolves HCI in CL-A-19.'
        ]
      }
    },
    {
      id: 6,
      category: 'CLASSROOM NEURAL BRIDGE',
      tag: 'SUBMISSION TRACKING & SELF-HEALING',
      title: 'Google Classroom Bridge & Self-Healing Sync',
      subtitle: 'Live submission state sync, smart archival filter, and autonomous self-healing pattern feedback loop',
      ficNotes: {
        academicJustification: 'Eliminates assignment submission anxiety by showing real Google Classroom submission states (Turned In vs Pending) and auto-filtering older semester clutter with a continuous learning feedback loop.',
        technicalHighlights: [
          'Single-request batch query to studentSubmissions?userId=me for all coursework',
          'Self-Healing Pattern Bank (ClassroomHealingPattern in NeonDB) learns verified aliases',
          'Every user confirmation or manual subject mapping feeds telemetry back into institutional weights'
        ],
        defensePoints: [
          'Zero manual regex maintenance: if a professor creates an atypical course name (e.g. "SAT Group A" -> CS40003), the engine logs the user override and self-heals for the entire cohort.',
          'Respects student autonomy: the system dynamically recommends active-semester courses (Semesters 1 through 8) but always asks the student for confirmation before finalizing.'
        ]
      }
    },
    {
      id: 7,
      category: 'EXAMINATION INTELLIGENCE',
      tag: 'OCR & PYQ REPOSITORY',
      title: 'Neural Vision OCR & Exam Training Pipeline',
      subtitle: 'Digitizing physical PYQs and Google Classroom modules into fine-tuning datasets and authentic question papers',
      ficNotes: {
        academicJustification: 'Preserves institutional memory: converts physical paper question papers into searchable, machine-readable LaTeX equations and fine-tuning datasets.',
        technicalHighlights: [
          'PyMuPDF bounding-box segmentation isolating individual question blocks, marks, and diagrams',
          'Multimodal Vision OCR (PaliGemma / Omni-30B) transcribing formulas and schematics',
          'Upstash Vector & NeonDB OcrQuestion RAG grounding questions with Classroom Assignments 1–4',
          'Authentic physical question paper sheet rendering (white background, serif fonts, real tables)'
        ],
        defensePoints: [
          'Enables automated generation of Alpaca-format JSONL datasets for local fine-tuning of engineering study companions.',
          'Strictly conforms to KIIT examination patterns: 25 Marks Mid-Sem and 60 Marks End-Sem with CO mappings.'
        ]
      }
    },
    {
      id: 8,
      category: 'CAMPUS AI ARCHITECTURE',
      tag: 'MULTI-MODEL ROUTER',
      title: 'Autonomous Model Router & NVIDIA Reasoning',
      subtitle: 'Heterogeneous AI hierarchy: In-house quantized models on EC2 + NVIDIA Nemotron-30B Reasoning NIM',
      ficNotes: {
        academicJustification: 'Solves the API cost dilemma: routine queries run locally on quantized models at $0 cost, while complex examination synthesis routes to NVIDIA Nemotron 30B reasoning.',
        technicalHighlights: [
          'Tier 1: In-house Qwen 2.5 3B / Llama 3.2 3B GGUF on EC2 t3.micro for autocomplete (200ms, $0/mo)',
          'Tier 2: NVIDIA Nemotron-3-Nano-Omni-30B Reasoning Engine with 8,192 token window & 16,384 reasoning budget',
          'Tier 3: Multimodal Vision OCR (PaliGemma / Omni-30B) for handwritten notes and circuit schematics',
          'Auto-sleep watchdog automatically terminates idle compute after 30 minutes ($0/month idle)'
        ],
        defensePoints: [
          'Guarantees zero truncation: high token budget accommodates deep pedagogical reasoning before emitting full examination papers.',
          'Model Router automatically selects the optimal tier based on cognitive complexity and latency constraints.'
        ]
      }
    },
    {
      id: 9,
      category: 'ATTENDANCE INTELLIGENCE',
      tag: 'CHRONOSYNC & APPLE HEALTH',
      title: 'Attendance & Biometric Health Intelligence',
      subtitle: 'ChronoSync email parsing fused with Apple HealthKit sleep & autonomic recovery sync',
      ficNotes: {
        academicJustification: 'Prevents sudden examination debarments: automatically ingests periodic email reports and correlates overnight sleep deficit with morning lecture absences.',
        technicalHighlights: [
          'High-precision regex and neural extraction for subject codes and attendance percentages',
          'One-Click Apple Shortcuts (.shortcut) installation syncing sleep duration, deep sleep, and HRV to NeonDB',
          'Deterministic Burnout Engine computing daily cognitive capacity (0–100) and recovery recommendations',
          'Predictive attendance safety margin: alerts students before slipping below the 75% KIIT debar threshold'
        ],
        defensePoints: [
          'Completely filters out completed prior semester subjects that previously leaked into reports.',
          'Holistic student retention: identifies burnout-induced attendance drops days before students risk debarment.'
        ]
      }
    },
    {
      id: 10,
      category: 'PROJECT ROADMAP',
      tag: 'PHASES & MILESTONES',
      title: 'Major Project Implementation Plan',
      subtitle: 'Clear execution phases from Core Engine completion to campus-wide deployment',
      ficNotes: {
        academicJustification: 'Provides the review committee with a realistic, measurable project timeline spanning 7th semester development to 8th semester final defense.',
        technicalHighlights: [
          'Phase 1 (Completed): Relational Subject DB, Routine Resolver, Classroom Sync, Attendance Parser',
          'Phase 2 (Current): FIC Review 1, OCR Studio deployment, Fine-tuning Kaizen-Tutor 3B',
          'Phase 3 (Upcoming): Proctorial integration, Grade Simulator, Campus Pilot, Final Defense'
        ],
        defensePoints: [
          'Phase 1 objectives have been 100% met and verified ahead of schedule.'
        ]
      }
    },
    {
      id: 11,
      category: 'EVALUATION & CONCLUSION',
      tag: 'FIC REVIEW RUBRIC',
      title: 'Academic Rigor & Review Sign-Off',
      subtitle: 'Engineering complexity, real-world impact, and readiness for Phase 2 progression',
      ficNotes: {
        academicJustification: 'Summarizes evaluation criteria: engineering depth, code quality, zero-error type safety, and direct benefit to university students.',
        technicalHighlights: [
          '28 REST endpoints, 14 UI modules, multi-tenant relational schema',
          'Strict TypeScript type safety with 0 compilation errors across entire repository',
          'Continuous deployment pipeline with GitHub Actions integration'
        ],
        defensePoints: [
          'Ready for Phase 1 Major Project sign-off and progression to model training on the KIIT PYQ dataset.'
        ]
      }
    }
  ], []);

  // Keyboard navigation
  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => (prev < totalSlides - 1 ? prev + 1 : prev));
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide(prev => (prev > 0 ? prev - 1 : prev));
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (previewModalImage) {
        if (e.key === 'Escape') setPreviewModalImage(null);
        return;
      }
      if (showOverview) {
        if (e.key === 'Escape' || e.key === 'o' || e.key === 'O') setShowOverview(false);
        return;
      }
      if (showFicNotes) {
        if (e.key === 'Escape' || e.key === 'n' || e.key === 'N') setShowFicNotes(false);
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        setShowOverview(prev => !prev);
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setShowFicNotes(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, toggleFullscreen, showOverview, showFicNotes, previewModalImage]);

  // Autoplay timer
  useEffect(() => {
    let timer: any;
    if (isAutoPlaying) {
      timer = setInterval(() => {
        setCurrentSlide(prev => (prev < totalSlides - 1 ? prev + 1 : 0));
      }, 7000);
    }
    return () => clearInterval(timer);
  }, [isAutoPlaying, totalSlides]);

  const activeSlideData = slides[currentSlide];

  return (
    <div className="min-h-screen bg-[#08080a] text-foreground flex flex-col justify-between select-none overflow-hidden relative font-sans">
      
      {/* Background Ambient Glows (Apple Minimalist Neo-Lime & Cyan) */}
      <div className="absolute top-[-15%] left-[20%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[15%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* ── TOP HEADER / PROGRESS BAR ── */}
      <header className="z-30 px-6 py-4 flex items-center justify-between border-b border-white/[0.06] bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/dashboard')}>
            <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-xs font-mono">
              K
            </div>
            <span className="font-display font-bold tracking-tight text-sm text-foreground uppercase">
              Nexus Kaizen
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-muted-foreground border-l border-white/10 pl-4">
            <span className="text-primary font-bold">FIC REVIEW</span>
            <span>•</span>
            <span>MAJOR PROJECT 2026-2027</span>
          </div>
        </div>

        {/* Slide Counter & Action Pills */}
        <div className="flex items-center gap-2.5">
          {/* Slide Indicator */}
          <div className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono font-bold text-foreground">
            {String(currentSlide + 1).padStart(2, '0')} <span className="text-muted-foreground">/</span> {String(totalSlides).padStart(2, '0')}
          </div>

          {/* Overview Toggle (O) */}
          <button
            onClick={() => setShowOverview(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-muted-foreground hover:text-foreground hover:border-white/20 transition-all"
            title="Press 'O' for Slide Overview Grid"
          >
            <Grid size={13} />
            <span>Overview</span>
          </button>

          {/* FIC Notes Toggle (N) */}
          <button
            onClick={() => setShowFicNotes(true)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold transition-all ${
              showFicNotes 
                ? 'bg-primary text-black' 
                : 'bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20'
            }`}
            title="Press 'N' to open Faculty In-Charge Defense Notes"
          >
            <HelpCircle size={13} />
            <span>FIC Notes</span>
          </button>

          {/* Fullscreen Toggle (F) */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-full bg-white/[0.04] border border-white/10 text-muted-foreground hover:text-foreground transition-all"
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </header>

      {/* Top Thin Progress Line */}
      <div className="w-full h-0.5 bg-white/[0.05] relative z-30">
        <motion.div 
          className="h-full bg-gradient-to-r from-primary to-cyan-400"
          initial={false}
          animate={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* ── MAIN SLIDE VIEWPORT ── */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 md:p-12 relative z-10 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.99 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-6xl mx-auto h-full flex flex-col justify-center"
          >
            {/* ── SLIDE 0: TITLE SLIDE ── */}
            {currentSlide === 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-primary/10 text-primary border border-primary/30">
                      B.Tech Capstone Project · Phase 1
                    </span>
                    <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-white/[0.05] text-muted-foreground border border-white/10">
                      Academic Year 2026-2027
                    </span>
                  </div>

                  <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-extrabold text-foreground tracking-tight leading-[1.05]">
                    NEXUS <span className="text-primary">KAIZEN</span>
                  </h1>

                  <p className="text-lg sm:text-xl text-muted-foreground font-sans leading-relaxed max-w-xl">
                    The Autonomous Academic Operating System &amp; Neural Knowledge Engine for University Engineering Education.
                  </p>

                  <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                      <div className="text-[10px] text-muted-foreground uppercase">Author &amp; Lead</div>
                      <div className="font-bold text-foreground mt-0.5">Harsh Kumar</div>
                      <div className="text-[10px] text-primary">Roll No. 2330231</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                      <div className="text-[10px] text-muted-foreground uppercase">Target Cohort</div>
                      <div className="font-bold text-foreground mt-0.5">Dynamic Semesters (1–8)</div>
                      <div className="text-[10px] text-cyan-400">School of Comp / Electronics</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 col-span-2 sm:col-span-1">
                      <div className="text-[10px] text-muted-foreground uppercase">Evaluator</div>
                      <div className="font-bold text-foreground mt-0.5">Faculty-in-Charge</div>
                      <div className="text-[10px] text-emerald-400">Major Project Board</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-4">
                    <button
                      onClick={nextSlide}
                      className="px-5 py-2.5 rounded-xl bg-primary text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
                    >
                      <span>Begin Presentation</span>
                      <ArrowRight size={14} />
                    </button>
                    <button
                      onClick={() => setShowFicNotes(true)}
                      className="px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs font-mono text-muted-foreground hover:text-foreground transition-all"
                    >
                      View Evaluator Guide (N)
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5 relative">
                  <div className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-6 shadow-2xl backdrop-blur-xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-mono uppercase tracking-wider font-bold text-foreground">Live Telemetry</span>
                      </div>
                      <span className="text-[10px] font-mono text-primary font-bold">100% OPERATIONAL</span>
                    </div>

                    <div className="space-y-3 font-mono text-xs">
                      <div className="flex justify-between items-center p-2.5 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-muted-foreground">Enrolled Students Ingested</span>
                        <span className="text-cyan-400 font-bold">638 Verified (PE-IV)</span>
                      </div>
                      <div className="flex justify-between items-center p-2.5 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-muted-foreground">Classroom Submission Sync</span>
                        <span className="text-emerald-400 font-bold">Live API (Turned In / Pending)</span>
                      </div>
                      <div className="flex justify-between items-center p-2.5 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-muted-foreground">Schedule Latency</span>
                        <span className="text-primary font-bold">&lt;12ms Relational Join</span>
                      </div>
                      <div className="flex justify-between items-center p-2.5 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-muted-foreground">Current Infrastructure Cost</span>
                        <span className="text-foreground font-bold">$0.00 / month (Free Tier)</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-[11px] font-mono text-primary leading-relaxed">
                      Kaizen is actively running with dynamic multi-semester support across university batches (Semesters 1 through 8).
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── SLIDE 1: PROBLEM STATEMENT ── */}
            {currentSlide === 1 && (
              <div className="space-y-8">
                <div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30">
                    The Academic Entropy Crisis
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-display font-bold text-foreground tracking-tight mt-2">
                    University Academia Is Fractured into Information Silos
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground font-sans mt-2 max-w-2xl">
                    Engineering students operate across 4 disconnected systems, causing missed deadlines, timetable clashes, and attendance debarments.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col justify-between">
                    <div>
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-mono font-bold text-xs mb-3">
                        01
                      </div>
                      <h3 className="text-base font-bold text-foreground mb-1">Classroom Sprawl</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Professors rarely archive older classes. Students carry 15-20 active classrooms from Semesters 1–6, causing severe notification clutter.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/5 text-[10px] font-mono text-amber-400">
                      Average: 17 unarchived courses
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col justify-between">
                    <div>
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center font-mono font-bold text-xs mb-3">
                        02
                      </div>
                      <h3 className="text-base font-bold text-foreground mb-1">Elective Routine Clashes</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Master routines specify base groups, but Professional Electives (PE-IV) are split across 11 different rooms and faculties with no individual timetables.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/5 text-[10px] font-mono text-rose-400">
                      11 Disparate Elective Sections
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col justify-between">
                    <div>
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-mono font-bold text-xs mb-3">
                        03
                      </div>
                      <h3 className="text-base font-bold text-foreground mb-1">Dormant Attendance</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Official attendance notifications arrive as unformatted plain-text emails. Students get no real-time warning before breaching the 75% debar threshold.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/5 text-[10px] font-mono text-cyan-400">
                      75% Mandatory Debar Rule
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col justify-between">
                    <div>
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-mono font-bold text-xs mb-3">
                        04
                      </div>
                      <h3 className="text-base font-bold text-foreground mb-1">Lost Exam Intelligence</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Past Year Question papers (PYQs) exist exclusively as physical paper photocopies. Decades of institutional exam data remain unindexed and unsearchable.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/5 text-[10px] font-mono text-primary">
                      100% Unsearchable Paper Scans
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-4 text-xs font-mono text-muted-foreground">
                  <span>FIC Evaluation Point: What is the measurable cost?</span>
                  <span className="text-foreground font-bold">Students lose ~3.2 hours weekly managing academic logistics.</span>
                </div>
              </div>
            )}

            {/* ── SLIDE 2: THE KAIZEN SOLUTION ── */}
            {currentSlide === 2 && (
              <div className="space-y-8">
                <div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-primary/10 text-primary border border-primary/30">
                    The System Solution
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-display font-bold text-foreground tracking-tight mt-2">
                    An Autonomous Operating System for University Students
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground font-sans mt-2 max-w-2xl">
                    Kaizen is not a static web dashboard. It is an intelligent middleware layer that actively synchronizes schedules, coursework, attendance, and exam papers.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                        <Calendar size={18} />
                      </div>
                      <h3 className="text-base font-bold text-foreground">Dynamic Schedule Engine</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Eliminates hardcoded timetables across Semesters 1–8. Resolves student sections and elective allocations with room venues.
                      </p>
                    </div>
                    <div className="text-[11px] font-mono text-primary flex items-center gap-1 font-bold pt-2 border-t border-white/5">
                      <span>Live for 638 Students</span>
                      <ArrowRight size={12} />
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                        <RefreshCw size={18} />
                      </div>
                      <h3 className="text-base font-bold text-foreground">Classroom Neural Bridge</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Direct Google Classroom API v1 sync. Tracks real submission states with Bayesian self-healing course classification.
                      </p>
                    </div>
                    <div className="text-[11px] font-mono text-cyan-400 flex items-center gap-1 font-bold pt-2 border-t border-white/5">
                      <span>Bi-Directional Sync</span>
                      <ArrowRight size={12} />
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                        <Sparkles size={18} />
                      </div>
                      <h3 className="text-base font-bold text-foreground">NVIDIA Nemotron 30B Synthesizer</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Reasoning model synthesizing official KIIT Mid/End-Sem papers grounded in 80+ PYQs and Classroom modules with CO tags.
                      </p>
                    </div>
                    <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 font-bold pt-2 border-t border-white/5">
                      <span>Physical Sheet Output</span>
                      <ArrowRight size={12} />
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
                        <Apple size={18} />
                      </div>
                      <h3 className="text-base font-bold text-foreground">Apple HealthKit Circadian Sync</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        One-click iOS Shortcut syncing sleep &amp; HRV. Models daily burnout and predicts 8:00 AM absences to protect the 75% limit.
                      </p>
                    </div>
                    <div className="text-[11px] font-mono text-rose-400 flex items-center gap-1 font-bold pt-2 border-t border-white/5">
                      <span>1-Click Shortcut Sync</span>
                      <ArrowRight size={12} />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-primary/[0.03] border border-primary/20 flex items-center justify-between text-xs font-mono">
                  <span className="text-muted-foreground">Architectural Anchor:</span>
                  <span className="text-primary font-bold">Canonical Subject Code (`CS40003`, `EX40003`) links all system modules together.</span>
                </div>
              </div>
            )}

            {/* ── SLIDE 3: SYSTEM TOPOLOGY & ARCHITECTURE ── */}
            {currentSlide === 3 && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      System Topology
                    </span>
                    <h2 className="text-2xl sm:text-4xl font-display font-bold text-foreground tracking-tight mt-1">
                      Full-Stack Architecture &amp; Connected Network Flow
                    </h2>
                  </div>

                  {/* Topology Mode Switcher */}
                  <div className="flex items-center gap-2">
                    <div className="inline-flex rounded-xl bg-white/5 p-1 border border-white/10 text-xs font-mono">
                      <button
                        onClick={() => setTopologyTab('flow')}
                        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                          topologyTab === 'flow'
                            ? 'bg-[#bbf246] text-black font-bold shadow-sm'
                            : 'text-muted-foreground hover:text-white'
                        }`}
                      >
                        <Network size={13} />
                        <span>Interactive Network Flow</span>
                      </button>
                      <button
                        onClick={() => setTopologyTab('layers')}
                        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                          topologyTab === 'layers'
                            ? 'bg-[#bbf246] text-black font-bold shadow-sm'
                            : 'text-muted-foreground hover:text-white'
                        }`}
                      >
                        <Layers size={13} />
                        <span>Cloud Layers &amp; Schemas</span>
                      </button>
                    </div>

                    <button
                      onClick={() => setPreviewModalImage('/deck/architecture_diagram.png')}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-xs font-mono text-muted-foreground hover:text-foreground flex items-center gap-1.5"
                    >
                      <Maximize2 size={12} />
                      <span className="hidden sm:inline">Enlarge Blueprint</span>
                    </button>
                  </div>
                </div>

                {topologyTab === 'flow' ? (
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-2 sm:p-4 backdrop-blur-xl shadow-2xl">
                    <ArchitectureFlow />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-7 space-y-3 font-mono text-xs">
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                        <div className="text-primary font-bold uppercase text-[11px] flex items-center gap-2">
                          <Terminal size={14} />
                          <span>1. Client &amp; Edge Layer</span>
                        </div>
                        <p className="text-muted-foreground text-[11px] leading-relaxed">
                          Next.js 16 App Router on Edge Runtime. Progressive Web App (PWA) with service workers, Lenis smooth scrolling, GSAP timelines, and Framer Motion layout animations.
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                        <div className="text-cyan-400 font-bold uppercase text-[11px] flex items-center gap-2">
                          <Database size={14} />
                          <span>2. Relational Database Layer</span>
                        </div>
                        <p className="text-muted-foreground text-[11px] leading-relaxed">
                          Neon Serverless PostgreSQL with Prisma ORM. Strict relational schema with `StudentDirectory`, `CourseSchedule`, `Subject`, `HiddenCourse`, `AttendanceRecord`, and `HealthMetric`.
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                        <div className="text-emerald-400 font-bold uppercase text-[11px] flex items-center gap-2">
                          <Cpu size={14} />
                          <span>3. Multi-Model AI Router Layer</span>
                        </div>
                        <p className="text-muted-foreground text-[11px] leading-relaxed">
                          Automated priority cascade: Tier 1 (Quantized Qwen 2.5 3B GGUF for 200ms autocomplete) -&gt; Tier 2 (NVIDIA Nemotron 30B Reasoning Engine) -&gt; Tier 3 (Multimodal Vision OCR for LaTeX).
                        </p>
                      </div>
                    </div>

                    <div className="md:col-span-5">
                      <div 
                        onClick={() => setPreviewModalImage('/deck/architecture_diagram.png')}
                        className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/60 group cursor-pointer aspect-video flex items-center justify-center p-2"
                      >
                        <Image 
                          src="/deck/architecture_diagram.png" 
                          alt="Kaizen System Architecture" 
                          width={600} 
                          height={350} 
                          className="object-contain rounded-xl group-hover:scale-105 transition-transform duration-300" 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-xs font-mono text-white">
                          <Maximize2 size={16} />
                          <span>Click to Zoom</span>
                        </div>
                      </div>
                      <div className="text-center text-[10px] font-mono text-muted-foreground mt-2">
                        Figure 1: Full-stack Cloud Topology &amp; Model Routing Matrix
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── SLIDE 4: VERIFIED PRODUCTION MILESTONES ── */}
            {currentSlide === 4 && (
              <div className="space-y-6">
                <div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Phase 1 Verified Milestones
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-display font-bold text-foreground tracking-tight mt-2">
                    Live Production Status on University Data
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground font-sans mt-1 max-w-2xl">
                    Every feature below is implemented, tested, and actively operating on real KIIT data right now.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">Dynamic Multi-Semester Engine</span>
                      <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">LIVE</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Dynamic detection for Semesters 1 through 8. Resolves section-based professors (Prof. P. Dutta, Prof. Proshikshya Mukherjee) with zero hardcoding.
                    </p>
                    <div className="text-[10px] text-primary pt-1">
                      Tested across Roll 2330231, 2330002, 2330175
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">Classroom Submission Sync</span>
                      <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">LIVE</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Real-time submission tracking (`TURNED_IN` vs `PENDING`) directly from Google Classroom REST API v1 with Bayesian self-healing alias learning.
                    </p>
                    <div className="text-[10px] text-primary pt-1">
                      Tested on live courses (SAT, EPP, T&amp;P)
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">One-Click Apple HealthKit Sync</span>
                      <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">LIVE</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Native iOS `.shortcut` download. Syncs sleep duration, deep sleep, and HRV via 365-day Bearer token into NeonDB `HealthMetric`.
                    </p>
                    <div className="text-[10px] text-rose-400 pt-1">
                      Live sync verified (7.8h sleep, 68ms HRV, 9,420 steps)
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">NVIDIA Nemotron 30B Synthesizer</span>
                      <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">LIVE</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      NVIDIA NIM reasoning model with 8,192 token window &amp; 16,384 reasoning budget. Generates full 60-mark End-Sem papers with zero truncation.
                    </p>
                    <div className="text-[10px] text-cyan-400 pt-1">
                      775 prompt + 2,499 reasoning + 1,890 content tokens
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">Authentic Physical Paper Sheet</span>
                      <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">LIVE</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Photorealistic A4 paper sheet renderer. Pristine white canvas, official double-rule headers, serif typography, formatted tables, and code syntax boxes.
                    </p>
                    <div className="text-[10px] text-emerald-400 pt-1">
                      Direct A4 print and export enabled
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">Attendance ChronoSync &amp; Debar Guard</span>
                      <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">LIVE</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Parses `academics@kiit.ac.in` emails, computes attendance margins, and correlates overnight sleep deficit with morning lecture absences.
                    </p>
                    <div className="text-[10px] text-amber-400 pt-1">
                      Warns before breaching the 75% cutoff
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/20 flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-400 font-bold">Phase 1 Major Project Sign-Off Criterion:</span>
                  <span className="text-foreground">All core data synchronization bridges are complete, deployed, and verified.</span>
                </div>
              </div>
            )}

            {/* ── SLIDE 5: DYNAMIC SCHEDULE DEEP DIVE ── */}
            {currentSlide === 5 && (
              <div className="space-y-6">
                <div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-primary/10 text-primary border border-primary/30">
                    Engine Deep Dive
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-display font-bold text-foreground tracking-tight mt-1">
                    Dynamic Elective Routine Allocation
                  </h2>
                  <p className="text-sm text-muted-foreground font-sans mt-1 max-w-2xl">
                    How Kaizen maps 638 engineering students to their exact physical elective classrooms without manual routine inspection.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-6 space-y-3 font-mono text-xs">
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                      <div className="text-primary font-bold">1. Master Routine Input</div>
                      <p className="text-muted-foreground text-[11px]">
                        University PDF routines only state &quot;PE-IV&quot; for Friday 09:00–10:00 and Saturday 11:00–13:00, leaving students guessing their assigned room.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                      <div className="text-cyan-400 font-bold">2. Relational Student Resolution</div>
                      <p className="text-muted-foreground text-[11px]">
                        System queries student roll `2330231` -&gt; resolves section `ECS GROUP-03`, elective `STA_A_PM` -&gt; maps `CS40003: Software Testing &amp; Automation`, `Prof. Proshikshya Mukherjee`, `CL-A-06`.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                      <div className="text-emerald-400 font-bold">3. Real-Time Dynamic Timetable</div>
                      <p className="text-muted-foreground text-[11px]">
                        The scheduler automatically replaces the generic PE-IV slot with the student&apos;s exact classroom venue, eliminating timetable confusion across the cohort.
                      </p>
                    </div>
                  </div>

                  <div className="lg:col-span-6 space-y-3">
                    <div 
                      onClick={() => setPreviewModalImage('/deck/schedule_preview.png')}
                      className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/60 group cursor-pointer aspect-[16/10] flex items-center justify-center p-2"
                    >
                      <Image 
                        src="/deck/schedule_preview.png" 
                        alt="Kaizen Dynamic Scheduler" 
                        width={600} 
                        height={380} 
                        className="object-contain rounded-xl group-hover:scale-105 transition-transform duration-300" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-xs font-mono text-white">
                        <Maximize2 size={16} />
                        <span>View Live Schedule Preview</span>
                      </div>
                    </div>
                    <div className="text-center text-[10px] font-mono text-muted-foreground">
                      Figure 2: Dynamic Timetable showing individualized PE-IV room &amp; faculty allocation
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── SLIDE 6: CLASSROOM SUBMISSION ENGINE DEEP DIVE ── */}
            {currentSlide === 6 && (
              <div className="space-y-6">
                <div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    Classroom Deep Dive
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-display font-bold text-foreground tracking-tight mt-1">
                    Google Classroom Neural Bridge &amp; Submissions
                  </h2>
                  <p className="text-sm text-muted-foreground font-sans mt-1 max-w-2xl">
                    Live submission status tracking and intelligent disambiguation of 17 active Google Classrooms.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2.5 font-mono text-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-primary font-bold mb-1">
                        <CheckCircle2 size={16} />
                        <span>Live Submission State</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Single batch query to `studentSubmissions?userId=me`. Real-time tracking of:
                      </p>
                    </div>
                    <ul className="space-y-1 text-[11px] pt-1 border-t border-white/5">
                      <li className="flex items-center gap-1.5 text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>`TURNED_IN` / `RETURNED`</span>
                      </li>
                      <li className="flex items-center gap-1.5 text-amber-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span>`CREATED` / `PENDING`</span>
                      </li>
                      <li className="flex items-center gap-1.5 text-rose-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        <span>`LATE: true` / Missing</span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2.5 font-mono text-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1">
                        <Sparkles size={16} />
                        <span>Active-Semester Smart Classifier</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Matches course titles against student&apos;s active semester profile (Semesters 1–8):
                      </p>
                    </div>
                    <ul className="space-y-1 text-[11px] pt-1 border-t border-white/5">
                      <li className="text-emerald-400">STA / SAT -&gt; CS40003 (Allotted Elective)</li>
                      <li className="text-emerald-400">EPP -&gt; EX40003 / HS40001 (Core)</li>
                      <li className="text-emerald-400">T&amp;P -&gt; TP40001 (Batch Routine)</li>
                      <li className="text-muted-foreground">Prior Sem Labs &amp; Courses -&gt; Filtered</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2.5 font-mono text-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
                        <ShieldCheck size={16} />
                        <span>Confirmation Modal</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Guarantees student autonomy before applying filters:
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1 text-[10px]">
                      <div>• Pre-selects active semester courses</div>
                      <div>• Pre-unselects historical classes</div>
                      <div>• Requires explicit student confirm</div>
                      <div>• Persists to `HiddenCourse` in DB</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-primary/[0.04] border border-primary/30 space-y-2.5 font-mono text-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-primary font-bold mb-1">
                        <RefreshCw size={16} />
                        <span>Self-Healing Engine</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Continuous reinforcement learning from user feedback:
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/40 border border-primary/20 space-y-1 text-[10px] text-primary">
                      <div>• Logs every manual override</div>
                      <div>• Ingests into `ClassroomHealingPattern`</div>
                      <div>• Auto-boosts pattern confidence</div>
                      <div>• Benefits all 638 students in cohort</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs font-mono">
                  <span className="text-muted-foreground">Scheduler Integration:</span>
                  <span className="text-foreground font-bold">Turned-in assignments are automatically marked as completed in the unified timetable feed.</span>
                </div>
              </div>
            )}

            {/* ── SLIDE 7: NEURAL OCR & PYQ PIPELINE ── */}
            {currentSlide === 7 && (
              <div className="space-y-6">
                <div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Knowledge Engine &amp; Training
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-display font-bold text-foreground tracking-tight mt-1">
                    Neural OCR &amp; Grounded Question Paper Training
                  </h2>
                  <p className="text-sm text-muted-foreground font-sans mt-1 max-w-2xl">
                    Converting physical paper exam archives and Google Classroom coursework into structured datasets and authentic university examination sheets.
                  </p>
                </div>

                {/* 4-Step Pipeline */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 font-mono text-xs">
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="text-primary font-bold">Step 1: Scan &amp; Render</div>
                    <p className="text-[11px] text-muted-foreground">
                      80+ physical exam sheets in `data/pyqs/raw`. PyMuPDF renders 300 DPI bitmaps for sub-millimeter bounding box segmentation.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="text-cyan-400 font-bold">Step 2: Multimodal OCR</div>
                    <p className="text-[11px] text-muted-foreground">
                      PaliGemma &amp; Omni-30B vision models transcribe mathematical formulas, logic circuits, and tabular schemas directly to LaTeX.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="text-amber-400 font-bold">Step 3: Vector RAG Grounding</div>
                    <p className="text-[11px] text-muted-foreground">
                      1536-D embeddings in Upstash Vector fused with Google Classroom Assignments (1–4) &amp; Model Questions into NeonDB `OcrQuestion`.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="text-emerald-400 font-bold">Step 4: LoRA Fine-Tuning</div>
                    <p className="text-[11px] text-muted-foreground">
                      Exports Alpaca-format JSONL datasets for parameter-efficient fine-tuning (PEFT/LoRA) on KIIT examination Bloom&apos;s patterns.
                    </p>
                  </div>
                </div>

                {/* Visual Exploration: Recurrence Graph vs Authentic Paper Sheet */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 font-mono text-xs">
                  {/* Left: Statistical Recurrence Graph (6 cols) */}
                  <div className="lg:col-span-6 p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart3 size={15} className="text-emerald-400" />
                        <span className="font-bold text-foreground uppercase tracking-wider text-xs">
                          PYQ Topic Recurrence &amp; Bloom&apos;s CO Distribution
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        91% Pattern Match
                      </span>
                    </div>

                    <div className="space-y-3 pt-1">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-foreground">Boundary Value Analysis &amp; Robustness [CO1]</span>
                          <span className="text-emerald-400 font-bold">95% Recurrence</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full" style={{ width: '95%' }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-foreground">Cyclomatic Complexity V(G) &amp; CFG [CO2]</span>
                          <span className="text-emerald-400 font-bold">92% Recurrence</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full" style={{ width: '92%' }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-foreground">Equivalence Partitioning &amp; Decision Tables [CO2]</span>
                          <span className="text-cyan-400 font-bold">86% Recurrence</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full bg-cyan-400 rounded-full" style={{ width: '86%' }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-foreground">State Transition Diagrams &amp; FSM [CO4]</span>
                          <span className="text-primary font-bold">84% Recurrence</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: '84%' }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-foreground">Integration Test Suites &amp; Automation ROI [CO3]</span>
                          <span className="text-amber-400 font-bold">80% Recurrence</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: '80%' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Authentic White-Paper Canvas Preview (6 cols) */}
                  <div className="lg:col-span-6 p-4 rounded-2xl bg-white text-slate-900 border border-slate-300 shadow-2xl space-y-2.5 font-serif select-none overflow-hidden">
                    <div className="text-center space-y-0.5 border-b-2 border-slate-900 pb-2">
                      <div className="text-xs uppercase tracking-widest font-bold text-slate-900">
                        KALINGA INSTITUTE OF INDUSTRIAL TECHNOLOGY
                      </div>
                      <div className="text-[10px] italic text-slate-600">
                        (Deemed to be University U/S 3 of the UGC Act, 1956) · SCHOOL OF ELECTRONICS &amp; COMPUTER SCIENCE
                      </div>
                    </div>

                    <div className="flex justify-between text-[11px] font-sans border-b border-slate-300 pb-1.5 font-medium">
                      <span><strong>Course:</strong> Software Testing and Automation (CS40003)</span>
                      <span><strong>Time:</strong> 3.0 Hours · <strong>Full Marks:</strong> 60</span>
                    </div>

                    <div className="p-2 rounded bg-slate-100 border border-slate-200 text-[10px] font-sans italic text-center">
                      Answer ALL questions from SECTION A and any THREE questions from SECTION B.
                    </div>

                    <div className="space-y-1.5 text-[11px] leading-relaxed pt-1">
                      <div className="font-bold font-sans text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5">
                        SECTION A (Compulsory - Short Answer / 10 Marks)
                      </div>
                      <div className="text-[10px] text-slate-700">
                        <strong>1. (a)</strong> Explain test case prioritization referencing Classroom Assignment-1 exercise. <span className="float-right font-mono font-bold">[2M]</span>
                      </div>
                      <div className="text-[10px] text-slate-700">
                        <strong>(b)</strong> Define Boundary Value Analysis for age integer range [0, 120]. <span className="float-right font-mono font-bold">[2M]</span>
                      </div>
                      <div className="font-bold font-sans text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 pt-1">
                        SECTION B (Analytical &amp; Problem Solving / 50 Marks)
                      </div>
                      <div className="text-[10px] text-slate-700">
                        <strong>2. (a)</strong> Compute Cyclomatic Complexity V(G) of control-flow graph. <span className="float-right font-mono font-bold">[6M] [CO1]</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Bar */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs">
                  <div className="text-muted-foreground text-[11px]">
                    Curricular Grounding: Ingested Google Classroom Modules (Assignments 1–4, Model Questions) into active generation context.
                  </div>
                  <button 
                    onClick={() => router.push('/dashboard/generator')}
                    className="px-4 py-2 rounded-xl bg-primary text-black hover:bg-primary/90 text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all shadow-md shadow-primary/20"
                  >
                    <span>Open AI Question Generator</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* ── SLIDE 8: CAMPUS AI & MODEL ROUTER ── */}
            {currentSlide === 8 && (
              <div className="space-y-6">
                <div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    AI Engineering &amp; Reasoning Architecture
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-display font-bold text-foreground tracking-tight mt-1">
                    Autonomous Model Router &amp; NVIDIA Reasoning Engine
                  </h2>
                  <p className="text-sm text-muted-foreground font-sans mt-1 max-w-2xl">
                    Heterogeneous AI hierarchy combining in-house quantized models on EC2 with NVIDIA Nemotron-30B Reasoning NIM and Multimodal Vision OCR.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                  <div 
                    onClick={() => setActiveModelTab(1)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                      activeModelTab === 1 
                        ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10' 
                        : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-primary font-bold text-xs uppercase">Tier 1: In-House GGUF</span>
                      <span className="text-[9px] bg-primary/20 text-primary px-2 py-0.5 rounded font-bold">200ms · $0/mo</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Qwen 2.5 3B / Llama 3.2 3B Instruct quantized to Q4_K_M (1.8 GB). Hosted on EC2 t3.micro with llama-cpp-python.
                    </p>
                    <div className="text-[10px] text-zinc-400 pt-2 border-t border-white/5 space-y-0.5">
                      <div>• Question autocomplete &amp; quick tag extraction</div>
                      <div>• Zero external API costs ($0.00/month)</div>
                    </div>
                  </div>

                  <div 
                    onClick={() => setActiveModelTab(2)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                      activeModelTab === 2 
                        ? 'bg-cyan-500/10 border-cyan-400 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/40' 
                        : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-cyan-400 font-bold text-xs uppercase">Tier 2: NVIDIA Nemotron 30B</span>
                      <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-bold">Reasoning NIM</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning` with 8,192 token output &amp; 16,384 reasoning budget.
                    </p>
                    <div className="text-[10px] text-zinc-400 pt-2 border-t border-white/5 space-y-0.5">
                      <div>• Multi-step pedagogical reasoning before emission</div>
                      <div>• Bloom&apos;s CO1–CO5 alignment with zero truncation</div>
                    </div>
                  </div>

                  <div 
                    onClick={() => setActiveModelTab(3)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                      activeModelTab === 3 
                        ? 'bg-emerald-500/10 border-emerald-400 shadow-lg shadow-emerald-500/10' 
                        : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 font-bold text-xs uppercase">Tier 3: Multimodal Vision OCR</span>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">PaliGemma / Omni</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      High-precision vision transcription for complex mathematical proofs, logic circuits, and handwritten faculty notes.
                    </p>
                    <div className="text-[10px] text-zinc-400 pt-2 border-t border-white/5 space-y-0.5">
                      <div>• 300 DPI LaTeX equation &amp; table conversion</div>
                      <div>• Direct ingestion into NeonDB `OcrQuestion`</div>
                    </div>
                  </div>
                </div>

                {/* Live Telemetry: Nemotron 30B Token Consumption & Reasoning Breakdown */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4 font-mono text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <Sparkles size={15} className="text-cyan-400" />
                      <span className="font-bold text-foreground uppercase tracking-wider text-xs">
                        NVIDIA Nemotron 30B Live Generation Telemetry Benchmark
                      </span>
                    </div>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                      Finish Reason: STOP (Zero Truncation)
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400">Total Tokens Allocated: <strong>8,192 Max Tokens</strong></span>
                      <span className="text-emerald-400 font-bold">4,389 Tokens Consumed (53.6% of Window)</span>
                    </div>

                    {/* Stacked Token Progress Bar */}
                    <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden flex">
                      <div className="h-full bg-primary/80 transition-all" style={{ width: '9.5%' }} title="Prompt Tokens: 775" />
                      <div className="h-full bg-cyan-400 transition-all" style={{ width: '30.5%' }} title="Reasoning Tokens: 2,499" />
                      <div className="h-full bg-emerald-400 transition-all" style={{ width: '23.1%' }} title="Question Content Tokens: 1,890" />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] pt-1">
                      <div className="p-2 rounded-lg bg-black/40 border border-white/5 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        <span>Prompt: <strong>775 tokens</strong></span>
                      </div>
                      <div className="p-2 rounded-lg bg-black/40 border border-white/5 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                        <span>Reasoning: <strong>2,499 tokens</strong></span>
                      </div>
                      <div className="p-2 rounded-lg bg-black/40 border border-white/5 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        <span>Output: <strong>1,890 tokens</strong></span>
                      </div>
                      <div className="p-2 rounded-lg bg-black/40 border border-white/5 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-zinc-600 shrink-0" />
                        <span>Headroom: <strong>3,803 tokens</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                  <span className="text-muted-foreground">Auto-Sleep Watchdog Architecture:</span>
                  <span className="text-primary font-bold">EC2 auto-sleeps after 30 min idle -&gt; 0 hours billed when students are asleep.</span>
                </div>
              </div>
            )}

            {/* ── SLIDE 9: ATTENDANCE & BIOMETRIC HEALTH ── */}
            {currentSlide === 9 && (
              <div className="space-y-6">
                <div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Proactive Governance &amp; Biometrics
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-display font-bold text-foreground tracking-tight mt-1">
                    Attendance Intelligence &amp; Apple HealthKit Circadian Sync
                  </h2>
                  <p className="text-sm text-muted-foreground font-sans mt-1 max-w-2xl">
                    Autonomous parsing of official `academics@kiit.ac.in` emails fused with Apple HealthKit sleep &amp; autonomic recovery to prevent examination debarment.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-mono text-xs">
                  {/* Card 1: ChronoSync Parser */}
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-cyan-400 uppercase text-[10px] font-bold">ChronoSync Email Parser</span>
                      <span className="text-[9px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded font-bold">REGEX + NLP</span>
                    </div>

                    <div className="p-3 rounded-lg bg-black/60 border border-white/5 text-[11px] text-muted-foreground space-y-1">
                      <div className="text-foreground">academics@kiit.ac.in</div>
                      <div className="text-primary font-bold">Attendance report:-( 2330231 )</div>
                      <div className="pt-1 text-[10px]">Your attendance till 28/09/26 -</div>
                      <div className="text-emerald-400">CS40003 - 88.50 % (Safe)</div>
                      <div className="text-amber-400">EX40003 - 76.00 % (Warning)</div>
                    </div>

                    <ul className="space-y-1 text-[11px] text-zinc-400 pt-1 border-t border-white/5">
                      <li>• Report cut-off date extracted (`28/09/2026`)</li>
                      <li>• Verified Roll Number (`2330231`)</li>
                      <li>• Validated against active semester enrolled papers</li>
                      <li>• Filters out completed past-semester records</li>
                    </ul>
                  </div>

                  {/* Card 2: One-Click Apple HealthKit Ingestion */}
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-rose-400 uppercase text-[10px] font-bold flex items-center gap-1.5">
                        <Apple size={14} /> Apple HealthKit Sync
                      </span>
                      <span className="text-[9px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded font-bold">1-Click Shortcut</span>
                    </div>

                    <div className="p-3 rounded-lg bg-black/60 border border-white/5 text-[11px] space-y-2">
                      <div className="flex justify-between items-center text-zinc-400">
                        <span>Workflow:</span>
                        <span className="text-white font-bold">`Sync_Kaizen_Health.shortcut`</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-white/10">
                        <div>Sleep: <strong className="text-white">7.8 hrs</strong></div>
                        <div>Deep Sleep: <strong className="text-[#bbf246]">85 min</strong></div>
                        <div>Resting HR: <strong className="text-cyan-400">61 bpm</strong></div>
                        <div>HRV SDNN: <strong className="text-emerald-400">68 ms</strong></div>
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Zero manual setup: student downloads pre-configured iOS shortcut with 365-day signed Bearer JWT, syncing vitals directly to NeonDB `HealthMetric`.
                    </p>
                  </div>

                  {/* Card 3: Deterministic Burnout & Debar Cockpit */}
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 uppercase text-[10px] font-bold">Debar Prevention Cockpit</span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold">PREDICTIVE</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex justify-between">
                        <span>&gt;= 75% : Normal (Examination Safe)</span>
                        <span className="font-bold">SAFE</span>
                      </div>
                      <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex justify-between">
                        <span>60% – 74% : Remedial Alert</span>
                        <span className="font-bold">ALERT</span>
                      </div>
                      <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex justify-between">
                        <span>&lt; 60% : Critical Debar Risk</span>
                        <span className="font-bold">DEBAR</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-[10px] text-primary leading-relaxed">
                      <strong>Circadian Pacing:</strong> When rolling 3-day sleep drops &lt; 5.0h, absence probability for 8:00 AM lectures spikes to 84% — Kaizen triggers early warnings before debarment.
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs font-mono">
                  <span className="text-muted-foreground">Result:</span>
                  <span className="text-foreground font-bold">Zero surprise attendance debars; students optimize both cognitive health and institutional attendance margin.</span>
                </div>
              </div>
            )}

            {/* ── SLIDE 10: MAJOR PROJECT ROADMAP ── */}
            {currentSlide === 10 && (
              <div className="space-y-6">
                <div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-primary/10 text-primary border border-primary/30">
                    Execution Timeline
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-display font-bold text-foreground tracking-tight mt-1">
                    Major Project Roadmap (2026–2027)
                  </h2>
                  <p className="text-sm text-muted-foreground font-sans mt-1 max-w-2xl">
                    Structured 3-phase delivery schedule from Core Engine stabilization to campus-wide deployment.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
                  {/* Phase 1 */}
                  <div className="p-5 rounded-2xl bg-emerald-950/15 border border-emerald-500/30 space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 font-bold uppercase text-[11px]">Phase 1: Foundation</span>
                      <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 font-bold">COMPLETED</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">Q3 – Q4 2026</div>
                    <ul className="space-y-2 text-[11px] text-foreground">
                      <li className="flex items-start gap-2">
                        <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span>Relational Subject Schema (Sem 1–8) &amp; Neon DB Migration</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span>Dynamic PE-IV Routine Resolver (638 students)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span>Google Classroom Submissions API &amp; Multi-Sem Filter</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span>One-Click Apple HealthKit (.shortcut) Sync &amp; Burnout Engine</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span>NVIDIA Nemotron 30B Question Paper Synthesizer &amp; Sheet Canvas</span>
                      </li>
                    </ul>
                  </div>

                  {/* Phase 2 */}
                  <div className="p-5 rounded-2xl bg-primary/10 border border-primary/40 space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-primary font-bold uppercase text-[11px]">Phase 2: Neural Ingestion</span>
                      <span className="px-2 py-0.5 rounded text-[9px] bg-primary text-black font-bold animate-pulse">CURRENT REVIEW</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">Q4 2026 – Q1 2027</div>
                    <ul className="space-y-2 text-[11px] text-foreground">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                        <span>FIC Major Project Evaluation &amp; Review 1</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                        <span>Deployment of Human-in-the-Loop OCR Studio</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                        <span>Grounded Classroom Module RAG &amp; Upstash Vector Index</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                        <span>Fine-Tuning Kaizen-Tutor on Google Colab T4 GPU (Unsloth QLoRA)</span>
                      </li>
                    </ul>
                  </div>

                  {/* Phase 3 */}
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-cyan-400 font-bold uppercase text-[11px]">Phase 3: Campus Pilot</span>
                      <span className="px-2 py-0.5 rounded text-[9px] bg-white/[0.05] text-muted-foreground">UPCOMING</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">Q1 – Q2 2027</div>
                    <ul className="space-y-2 text-[11px] text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground shrink-0 mt-1.5" />
                        <span>Campus-wide Pilot across 638 ECS Students</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground shrink-0 mt-1.5" />
                        <span>Proctorial / Tutor-Mentor Portal Integration</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground shrink-0 mt-1.5" />
                        <span>Predictive Endsem SGPA Simulation Engine</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground shrink-0 mt-1.5" />
                        <span>Final B.Tech Major Project Defense &amp; Publication</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs font-mono">
                  <span className="text-muted-foreground">Milestone Status:</span>
                  <span className="text-emerald-400 font-bold">Phase 1 is 100% complete; ready for committee review sign-off.</span>
                </div>
              </div>
            )}

            {/* ── SLIDE 11: ACADEMIC RIGOR & REVIEW SIGN-OFF ── */}
            {currentSlide === 11 && (
              <div className="space-y-6">
                <div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-primary/10 text-primary border border-primary/30">
                    FIC Review Rubric
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-display font-bold text-foreground tracking-tight mt-1">
                    Academic Rigor &amp; Defense Summary
                  </h2>
                  <p className="text-sm text-muted-foreground font-sans mt-1 max-w-2xl">
                    Summary of engineering complexity, institutional novelty, and evaluation benchmarks.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                    <h3 className="text-sm font-bold text-primary uppercase tracking-wider">
                      Technical Complexity &amp; Architecture
                    </h3>
                    <ul className="space-y-2.5 text-[11px] text-muted-foreground leading-relaxed">
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold">✓</span>
                        <span><strong className="text-foreground">Full-Stack Scope:</strong> 28 REST endpoints, 14 UI modules, multi-tenant relational schema.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold">✓</span>
                        <span><strong className="text-foreground">Type Safety:</strong> 100% strict TypeScript typing with 0 errors across entire repository.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold">✓</span>
                        <span><strong className="text-foreground">Security &amp; Auth:</strong> OAuth 2.0 with cryptographic refresh token rotation and session cookies.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold">✓</span>
                        <span><strong className="text-foreground">Zero Cloud Overhead:</strong> Optimized $0/month architecture utilizing free-tier edge serverless.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                    <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">
                      Measurable Institutional Impact
                    </h3>
                    <ul className="space-y-2.5 text-[11px] text-muted-foreground leading-relaxed">
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">✓</span>
                        <span><strong className="text-foreground">Timetable Clarity:</strong> 100% elimination of PE-IV elective room confusion for 638 students.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">✓</span>
                        <span><strong className="text-foreground">Submission Visibility:</strong> Instant feedback on Turned-In vs Pending coursework across Google Classrooms.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">✓</span>
                        <span><strong className="text-foreground">Debar Prevention:</strong> Real-time alerts before students breach the 75% attendance rule.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">✓</span>
                        <span><strong className="text-foreground">Exam Preservation:</strong> Direct conversion of paper exam sheets into accessible digital datasets.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-cyan-500/10 to-transparent border border-primary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-base font-display font-bold text-foreground">
                      Ready for Live Demonstration &amp; Phase 1 Sign-Off
                    </h4>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">
                      Explore the live operational system on real academic data.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => router.push('/dashboard/scheduler')}
                      className="px-4 py-2.5 rounded-xl bg-primary text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center gap-1.5"
                    >
                      <span>Open Scheduler Demo</span>
                      <ArrowRight size={13} />
                    </button>
                    <button
                      onClick={() => router.push('/dashboard/classroom')}
                      className="px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs font-mono text-foreground hover:bg-white/[0.08] transition-all flex items-center gap-1.5"
                    >
                      <span>Classroom Demo</span>
                      <ExternalLink size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── BOTTOM DYNAMIC FLOATING CONTROL BAR ── */}
      <footer className="z-30 px-6 py-4 flex items-center justify-between border-t border-white/[0.06] bg-black/40 backdrop-blur-xl">
        {/* Left: Slide Category Tag */}
        <div className="flex items-center gap-3">
          <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            <span className="text-primary font-bold">{activeSlideData.category}</span>
            <span className="mx-2 text-white/20">|</span>
            <span className="hidden sm:inline">{activeSlideData.tag}</span>
          </div>
        </div>

        {/* Center: Slide Dots / Jump Pill */}
        <div className="flex items-center gap-1.5">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all ${
                currentSlide === idx 
                  ? 'w-8 bg-primary shadow-sm shadow-primary/50' 
                  : 'w-2 bg-white/20 hover:bg-white/40'
              }`}
              title={`Slide ${idx + 1}: ${s.title}`}
            />
          ))}
        </div>

        {/* Right: Next / Prev Navigation */}
        <div className="flex items-center gap-2">
          {/* Autoplay Toggle */}
          <button
            onClick={() => setIsAutoPlaying(prev => !prev)}
            className={`p-2 rounded-xl border text-xs font-mono transition-all ${
              isAutoPlaying 
                ? 'bg-primary/20 border-primary/40 text-primary' 
                : 'bg-white/[0.04] border-white/10 text-muted-foreground hover:text-foreground'
            }`}
            title={isAutoPlaying ? 'Pause Autoplay' : 'Autoplay Presentation (7s per slide)'}
          >
            {isAutoPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>

          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className={`p-2 rounded-xl border transition-all ${
              currentSlide === 0 
                ? 'opacity-30 border-white/5 text-muted-foreground cursor-not-allowed' 
                : 'bg-white/[0.04] border-white/10 text-foreground hover:bg-white/[0.08] hover:border-white/20'
            }`}
            title="Previous Slide (Left Arrow)"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            onClick={nextSlide}
            disabled={currentSlide === totalSlides - 1}
            className={`p-2 rounded-xl border transition-all ${
              currentSlide === totalSlides - 1 
                ? 'opacity-30 border-white/5 text-muted-foreground cursor-not-allowed' 
                : 'bg-primary text-black font-bold hover:bg-primary/90 shadow-sm shadow-primary/20'
            }`}
            title="Next Slide (Right Arrow / Space)"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </footer>

      {/* ── OVERVIEW GRID MODAL (PRESS 'O') ── */}
      <AnimatePresence>
        {showOverview && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md p-6 sm:p-12 flex flex-col justify-between overflow-y-auto">
            <div className="flex items-center justify-between pb-6 border-b border-white/10 max-w-6xl w-full mx-auto">
              <div>
                <h3 className="text-xl font-display font-bold text-foreground">Slide Overview</h3>
                <p className="text-xs font-mono text-muted-foreground">Click any slide card to jump directly</p>
              </div>
              <button
                onClick={() => setShowOverview(false)}
                className="p-2 rounded-xl border border-white/10 hover:border-white/20 text-muted-foreground hover:text-foreground transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-6xl w-full mx-auto my-8">
              {slides.map((s, idx) => (
                <div
                  key={s.id}
                  onClick={() => {
                    setCurrentSlide(idx);
                    setShowOverview(false);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between aspect-video ${
                    currentSlide === idx 
                      ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10 text-foreground' 
                      : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.05] text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-primary font-bold">
                      SLIDE {String(idx + 1).padStart(2, '0')}
                    </span>
                    {currentSlide === idx && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground line-clamp-1">{s.title}</h4>
                    <p className="text-[10px] font-mono text-muted-foreground line-clamp-1 mt-0.5">{s.category}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center text-xs font-mono text-muted-foreground max-w-6xl w-full mx-auto pt-4 border-t border-white/10">
              Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-foreground">ESC</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-foreground">O</kbd> to return to active slide.
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── FIC PRESENTER NOTES DRAWER (PRESS 'N') ── */}
      <AnimatePresence>
        {showFicNotes && (
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#0d0d12]/95 border-l border-white/10 backdrop-blur-2xl shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <HelpCircle className="text-primary" size={18} />
                  <h3 className="text-sm font-display font-bold uppercase tracking-wider text-foreground">
                    FIC Defense Notes
                  </h3>
                </div>
                <button
                  onClick={() => setShowFicNotes(false)}
                  className="p-1.5 rounded-lg border border-white/10 hover:border-white/20 text-muted-foreground hover:text-foreground transition-all"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-[11px] font-mono text-primary">
                Slide {currentSlide + 1}: {activeSlideData.title}
              </div>

              {/* Academic Justification */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold text-foreground uppercase tracking-wider">
                  Academic Justification
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {activeSlideData.ficNotes.academicJustification}
                </p>
              </div>

              {/* Technical Highlights */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  Technical Architecture Highlights
                </h4>
                <ul className="space-y-1.5 text-xs text-muted-foreground font-mono">
                  {activeSlideData.ficNotes.technicalHighlights.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-0.5">•</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Defense Points */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  Evaluation Defense Points
                </h4>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  {activeSlideData.ficNotes.defensePoints.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 text-[11px] font-mono text-muted-foreground flex justify-between items-center">
              <span>Press <kbd className="px-1 py-0.5 rounded bg-white/10 text-foreground">N</kbd> to toggle</span>
              <button
                onClick={() => setShowFicNotes(false)}
                className="px-3 py-1 rounded-lg bg-white/[0.05] border border-white/10 hover:bg-white/10 text-foreground"
              >
                Close Drawer
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── FULL IMAGE ZOOM MODAL ── */}
      <AnimatePresence>
        {previewModalImage && (
          <div 
            onClick={() => setPreviewModalImage(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl p-4 sm:p-12 flex items-center justify-center cursor-zoom-out"
          >
            <div className="relative max-w-5xl w-full max-h-[85vh] flex items-center justify-center">
              <Image 
                src={previewModalImage} 
                alt="Enlarged Diagram" 
                width={1200} 
                height={800} 
                className="object-contain max-h-[80vh] rounded-2xl border border-white/20 shadow-2xl" 
              />
              <button
                onClick={() => setPreviewModalImage(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/80 border border-white/20 text-white"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

