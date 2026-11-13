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
  GraduationCap, Check, ArrowUpRight, Zap, RefreshCw, BarChart3
} from 'lucide-react';

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
      subtitle: 'A single, self-updating neural layer bridging Student, Classroom, and University Infrastructure',
      ficNotes: {
        academicJustification: 'Unifies the student lifecycle: schedule, assignment tracking, attendance health, and examination intelligence into a single reactive interface.',
        technicalHighlights: [
          'Core Subject Engine anchored on canonical subject codes (CS40003, EX40003, TP40001)',
          'ChronoSync email parser extracting subject attendance percentages and deadline alerts',
          'Neural OCR pipeline converting physical paper exam sheets into structured LaTeX datasets'
        ],
        defensePoints: [
          'Not a passive dashboard — it actively resolves timetable conflicts, classifies current semester coursework, and calculates attendance debar danger zones.'
        ]
      }
    },
    {
      id: 3,
      category: 'SYSTEM ARCHITECTURE',
      tag: 'TOPOLOGY & INFRASTRUCTURE',
      title: 'Production System Topology',
      subtitle: 'Serverless Edge Frontend, Relational Data Layer, and Vision-Language AI Pipeline',
      ficNotes: {
        academicJustification: 'Enterprise-grade architecture following clean separation of concerns: Edge Client -> Stateless API Handlers -> Relational Neon Database -> Multi-Model AI Router.',
        technicalHighlights: [
          'Client: Next.js 16 App Router with React 19, Tailwind CSS, Framer Motion, and GSAP',
          'Database: Neon Serverless PostgreSQL with Prisma connection pooling and ACID guarantees',
          'Security: OAuth 2.0 with cryptographic refresh token rotation and session verification'
        ],
        defensePoints: [
          'Zero vendor lock-in: database queries use standard SQL and relational Prisma models.',
          'Model Router automatically falls back from local in-house quantized models to Gemini Flash for complex tasks.'
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
          '638 students from official PE-IV sheet mapped dynamically by roll number',
          '17 active Google Classrooms parsed with real student submission states',
          'Attendance extraction pipeline processing official KIIT email reports'
        ],
        defensePoints: [
          'Every module demonstrated in this presentation is fully functional and testable right now at localhost:3000.'
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
          'Zero hardcoding: all 638 students resolve their unique routine accurately'
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
          'Respects student autonomy: the system recommends 7th-sem courses and subjects but always asks the student for confirmation before finalizing.'
        ]
      }
    },
    {
      id: 7,
      category: 'EXAMINATION INTELLIGENCE',
      tag: 'OCR & PYQ REPOSITORY',
      title: 'Neural Vision OCR Pipeline',
      subtitle: 'Digitizing physical paper examination papers into structured LaTeX & AI fine-tuning datasets',
      ficNotes: {
        academicJustification: 'Preserves institutional memory: converts physical paper question papers into searchable, machine-readable LaTeX equations and diagrams.',
        technicalHighlights: [
          'PyMuPDF bounding-box segmentation isolating individual question blocks and marks',
          'Gemini 2.0 Flash Vision transcribing mathematical formulas, circuit diagrams, and sub-questions',
          'Human-in-the-loop OCR studio for student CR verification before database insertion'
        ],
        defensePoints: [
          'Enables automated generation of Alpaca-format JSONL datasets for local fine-tuning of engineering study companions.'
        ]
      }
    },
    {
      id: 8,
      category: 'CAMPUS AI ARCHITECTURE',
      tag: 'MULTI-MODEL ROUTER',
      title: 'Autonomous Model Router',
      subtitle: 'Cost-optimized hierarchy combining in-house quantized models and high-precision vision APIs',
      ficNotes: {
        academicJustification: 'Solves the API cost dilemma: routine queries run locally on quantized models at $0 cost, while heavy OCR and proof generation route to Gemini Vision.',
        technicalHighlights: [
          'Tier 1: In-house Qwen 2.5 3B / Llama 3.2 3B GGUF on EC2 t3.micro for autocomplete (200ms)',
          'Tier 2: Gemini 2.0 Flash Lite for comprehensive study plan generation and doubt answering',
          'Auto-sleep watchdog automatically terminates idle compute after 30 minutes ($0/month idle)'
        ],
        defensePoints: [
          'Guarantees system resilience: if external API quotas are exhausted, local models continue serving basic syllabus Q&A.'
        ]
      }
    },
    {
      id: 9,
      category: 'ATTENDANCE INTELLIGENCE',
      tag: 'CHRONOSYNC PARSER',
      title: 'Autonomous Attendance ChronoSync',
      subtitle: 'Parsing official academics@kiit.ac.in notifications and predicting debar risks',
      ficNotes: {
        academicJustification: 'Prevents sudden examination debarments: automatically ingests periodic email reports and alerts students when attendance dips below 75% or 60%.',
        technicalHighlights: [
          'High-precision regex and neural extraction for subject codes (EX40003, CS40003) and percentages',
          'Cross-references attendance records strictly against active 7th-sem enrolled papers',
          'Visual indicators: Normal (>75%), Warning (60-75%), and Critical (<60%)'
        ],
        defensePoints: [
          'Completely filters out completed 6th semester subjects that previously leaked into reports.'
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
                      <div className="font-bold text-foreground mt-0.5">7th Sem B.Tech</div>
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
                      Kaizen is actively running on the actual academic dataset for the 7th semester ECS cohort.
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                      <Calendar size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Dynamic Schedule Engine</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Eliminates hardcoded timetables. Queries student roll numbers, retrieves exact section and elective allotments (PE-IV), and dynamically injects precise classroom numbers and professors.
                    </p>
                    <div className="text-[11px] font-mono text-primary flex items-center gap-1 font-bold">
                      <span>Live for 638 Students</span>
                      <ArrowRight size={12} />
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                      <RefreshCw size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Classroom Neural Bridge</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Connects directly to Google Classroom REST API v1. Fetches real submission statuses (Turned In vs Pending) and algorithmically isolates 7th-semester coursework with user confirmation.
                    </p>
                    <div className="text-[11px] font-mono text-cyan-400 flex items-center gap-1 font-bold">
                      <span>Bi-Directional API Sync</span>
                      <ArrowRight size={12} />
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                      <Cpu size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Neural OCR &amp; Knowledge Engine</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Computer vision pipeline segmenting physical KIIT end-semester question papers, extracting LaTeX equations and diagrams, and building fine-tuning datasets for campus-specific AI tutors.
                    </p>
                    <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                      <span>Alpaca JSONL Dataset Generator</span>
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      System Topology
                    </span>
                    <h2 className="text-2xl sm:text-4xl font-display font-bold text-foreground tracking-tight mt-1">
                      Full-Stack Architecture Blueprint
                    </h2>
                  </div>
                  <button
                    onClick={() => setPreviewModalImage('/deck/architecture_diagram.png')}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-xs font-mono text-muted-foreground hover:text-foreground flex items-center gap-1.5 self-start"
                  >
                    <Maximize2 size={12} />
                    <span>Enlarge Diagram</span>
                  </button>
                </div>

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
                        Neon Serverless PostgreSQL with Prisma ORM. Strict relational schema with `StudentDirectory`, `CourseSchedule`, `Subject`, `HiddenCourse`, and `AttendanceRecord`.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                      <div className="text-emerald-400 font-bold uppercase text-[11px] flex items-center gap-2">
                        <Cpu size={14} />
                        <span>3. Multi-Model AI Router Layer</span>
                      </div>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        Automated priority cascade: Tier 1 (Quantized Qwen 2.5 3B GGUF for 200ms autocomplete) -&gt; Tier 2 (Gemini 2.0 Flash Lite) -&gt; Tier 3 (Gemini 2.0 Flash Vision for LaTeX OCR).
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
                      <span className="font-bold text-foreground">Dynamic Elective Engine</span>
                      <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">LIVE</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      All 638 students from official PE-IV allotment sheets mapped by roll number with zero hardcoding.
                    </p>
                    <div className="text-[10px] text-primary pt-1">
                      Tested across Roll 2330231, 2330002, 2330175
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">Classroom Submission Sync</span>
                      <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">LIVE</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Real-time submission state tracking (`TURNED_IN` vs `PENDING`) directly from Google Classroom API v1.
                    </p>
                    <div className="text-[10px] text-primary pt-1">
                      Tested on live courses (SAT, EPP, T&amp;P)
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">7th Sem Smart Classifier</span>
                      <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">LIVE</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Automatic isolation of current semester courses with interactive confirmation modal and NeonDB persistence.
                    </p>
                    <div className="text-[10px] text-primary pt-1">
                      Filters 14 past-semester courses reliably
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">Canonical Subject Registry</span>
                      <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">LIVE</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Subject code (`CS40003`, `EX40003`) serving as the central relational anchor binding Routine, PYQ, and Attendance.
                    </p>
                    <div className="text-[10px] text-primary pt-1">
                      Replaces fragmented string matching
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">Attendance ChronoSync</span>
                      <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">LIVE</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Autonomous parsing of official `academics@kiit.ac.in` automated emails with safety threshold calculations.
                    </p>
                    <div className="text-[10px] text-primary pt-1">
                      Debar warning triggered when &lt;75%
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">Type Safety &amp; CI/CD</span>
                      <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">PASSING</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Strict TypeScript compilation with 0 type errors across all 28 API routes and 14 frontend pages.
                    </p>
                    <div className="text-[10px] text-primary pt-1">
                      Verified via `pnpm exec tsc --noEmit`
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
                        <span>7th-Sem Smart Classifier</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Matches course titles against student&apos;s active 7th semester profile:
                      </p>
                    </div>
                    <ul className="space-y-1 text-[11px] pt-1 border-t border-white/5">
                      <li className="text-emerald-400">SAT -&gt; CS40003 (Allotted Elective)</li>
                      <li className="text-emerald-400">EPP -&gt; EX40003 / HS40001 (Core)</li>
                      <li className="text-emerald-400">T&amp;P -&gt; TP40001 (Batch 2027)</li>
                      <li className="text-muted-foreground">MES, SE, AD Lab -&gt; Past Sem</li>
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
                      <div>• Pre-selects recommended 7th sem</div>
                      <div>• Pre-unselects 14 historical classes</div>
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
                    Knowledge Engine
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-display font-bold text-foreground tracking-tight mt-1">
                    Neural OCR &amp; KIIT PYQ Ingestion Pipeline
                  </h2>
                  <p className="text-sm text-muted-foreground font-sans mt-1 max-w-2xl">
                    Converting decades of physical paper examination question papers into structured, fine-tunable knowledge datasets.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="text-primary font-bold">Step 1: Scan &amp; Render</div>
                    <p className="text-[11px] text-muted-foreground">
                      Physical paper exam sheets scanned to PDF. PyMuPDF renders high-resolution page bitmaps at 300 DPI for precision OCR.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="text-cyan-400 font-bold">Step 2: Vision Crop</div>
                    <p className="text-[11px] text-muted-foreground">
                      Computer vision bounding-box detection isolates question blocks, sub-parts (a, b, c), assigned marks, and circuit diagrams.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="text-amber-400 font-bold">Step 3: Gemini Vision OCR</div>
                    <p className="text-[11px] text-muted-foreground">
                      Gemini 2.0 Flash Vision transcribes complex mathematical equations to LaTeX and generates Markdown question schemas.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="text-emerald-400 font-bold">Step 4: Golden Dataset</div>
                    <p className="text-[11px] text-muted-foreground">
                      Student CR verifies OCR in the Ingestion Studio. Dataset is exported in Alpaca JSONL for local model fine-tuning.
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs">
                  <div>
                    <div className="text-foreground font-bold mb-1">Fine-Tuning Dataset Schema (Alpaca Format)</div>
                    <div className="text-muted-foreground text-[11px]">
                      `instruction`: KIIT Endsem Question · `input`: Subject Code &amp; Syllabus Context · `output`: Verified Model Solution
                    </div>
                  </div>
                  <button 
                    onClick={() => router.push('/dashboard/ocr-studio')}
                    className="px-4 py-2 rounded-xl bg-white/[0.05] border border-white/10 hover:border-primary text-xs text-foreground font-bold flex items-center gap-1.5 shrink-0"
                  >
                    <span>Open Ingestion Studio</span>
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
                    AI Engineering
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-display font-bold text-foreground tracking-tight mt-1">
                    Autonomous Multi-Model Router
                  </h2>
                  <p className="text-sm text-muted-foreground font-sans mt-1 max-w-2xl">
                    Zero-cost operating model: combining in-house quantized models on micro-instances with high-precision vision APIs.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-mono text-xs">
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-primary font-bold">Tier 1: In-House GGUF</span>
                      <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded">200ms</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Qwen 2.5 3B / Llama 3.2 3B Instruct quantized to Q4_K_M (1.8 GB). Runs via llama-cpp-python on EC2 t3.micro.
                    </p>
                    <div className="text-[10px] text-muted-foreground pt-2 border-t border-white/5">
                      Handles: Question autocomplete, subject tagging, syllabus Q&amp;A at $0 API cost.
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-cyan-400 font-bold">Tier 2: Gemini Flash Lite</span>
                      <span className="text-[9px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded">1-2s</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Free API tier. Handles medium-weight reasoning, multi-chapter study plan generation, and complex doubt explanation.
                    </p>
                    <div className="text-[10px] text-muted-foreground pt-2 border-t border-white/5">
                      Handles: Endsem preparation plans, topic summarization, mock exam generation.
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 font-bold">Tier 3: Gemini Flash Vision</span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">2-4s</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      High-precision multimodal vision for scanned mathematical equations, circuit diagrams, and handwritten answers.
                    </p>
                    <div className="text-[10px] text-muted-foreground pt-2 border-t border-white/5">
                      Handles: OCR document transcription and LaTeX formula conversion.
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                  <span className="text-muted-foreground">Auto-Sleep Watchdog Architecture:</span>
                  <span className="text-primary font-bold">EC2 auto-sleeps after 30 min idle -&gt; 0 hours billed when students are asleep.</span>
                </div>
              </div>
            )}

            {/* ── SLIDE 9: ATTENDANCE CHRONOSYNC ── */}
            {currentSlide === 9 && (
              <div className="space-y-6">
                <div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Proactive Governance
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-display font-bold text-foreground tracking-tight mt-1">
                    Attendance Intelligence &amp; Debar Prevention
                  </h2>
                  <p className="text-sm text-muted-foreground font-sans mt-1 max-w-2xl">
                    Autonomous parsing of official KIIT automated attendance emails with predictive threshold modeling.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                    <div className="text-muted-foreground uppercase text-[10px] font-bold">Raw Email Input</div>
                    <div className="p-3 rounded-lg bg-black/60 border border-white/5 text-[11px] text-muted-foreground font-mono space-y-1">
                      <div className="text-foreground">academics@kiit.ac.in</div>
                      <div className="text-primary">Attendance report:-( 2330231 )</div>
                      <div className="pt-1 text-[10px]">Your attendance till 28/09/26 -</div>
                      <div>EX40003 - 0.00 %</div>
                      <div>CS40003 - 0.00 %</div>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Raw unformatted notifications arrive with zero actionable guidance for students.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                    <div className="text-cyan-400 uppercase text-[10px] font-bold">ChronoSync Parser</div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Autonomous regex &amp; NLP pipeline extracts:
                    </p>
                    <ul className="space-y-1 text-[11px]">
                      <li>• Report cut-off date (`28/09/2026`)</li>
                      <li>• Verified Roll Number (`2330231`)</li>
                      <li>• Subject Code validation against active 7th sem papers</li>
                      <li>• Elimination of completed 6th sem subjects</li>
                    </ul>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                    <div className="text-emerald-400 uppercase text-[10px] font-bold">Safety Margin Cockpit</div>
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        &gt;= 75% : Normal (Examination Safe)
                      </div>
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        60% – 74% : Warning (Remedial Alert)
                      </div>
                      <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                        &lt; 60% : Critical (Debar Risk)
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs font-mono">
                  <span className="text-muted-foreground">Result:</span>
                  <span className="text-foreground font-bold">Zero surprise attendance debars; students know their exact attendance margin at all times.</span>
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
                        <span>Relational Subject Schema &amp; Neon DB Migration</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span>Dynamic PE-IV Routine Resolver (638 students)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span>Google Classroom Submissions API &amp; 7th-Sem Filter</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span>Attendance ChronoSync Email Parser</span>
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
                        <span>Ingestion of 500+ KIIT Endsem Question Papers</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                        <span>Fine-Tuning Kaizen-Tutor on Google Colab T4 GPU</span>
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

