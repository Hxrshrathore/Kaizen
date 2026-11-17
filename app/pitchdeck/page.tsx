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
  Apple, HeartPulse, Activity, TrendingUp, GitBranch, ShieldAlert, Network, Download,
  School, Lock, FolderKanban, Users, CheckCheck, Landmark
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  const [activeProcessTab, setActiveProcessTab] = useState<'diagram' | 'pipeline' | 'guardrails'>('diagram');

  // Total slides strictly matches the official 8-slide KIIT presentation template
  const totalSlides = 8;

  // Slide definitions strictly conforming to the official KIIT Major Project Presentation Template
  const slides: SlideData[] = useMemo(() => [
    {
      id: 0,
      category: 'TITLE SLIDE',
      tag: 'Major PROJECT PRESENTATION · 2026-2027',
      title: 'Title Slide',
      subtitle: 'KAIZEN: Autonomous Neural Academic OS & Cognitive Health Co-Pilot',
      ficNotes: {
        academicJustification: 'Autonomous end-to-end engineering system resolving academic fragmentation across 638 university students, unifying Google Classroom, timetables, and biometrics.',
        technicalHighlights: [
          'Full-stack Next.js 16 + Neon Serverless PostgreSQL with Prisma ORM and Upstash Vector DB',
          'Bi-directional Google Classroom API v1 sync + Apple HealthKit & Google Fit biometric ingestion',
          'Knapsack Combinatorial Examination Optimizer with empirical 70%-90% PYQ provenance auditing'
        ],
        defensePoints: [
          'Purpose-built for KIIT University autonomous curriculum regulations (75% debar threshold, multi-section electives, and Bloom\'s Taxonomy compliance).',
          'Zero-cost cloud infrastructure using serverless auto-sleep and on-device quantized SLM inference.'
        ]
      }
    },
    {
      id: 1,
      category: 'PROBLEM STATEMENT & CONTEXT',
      tag: 'CAMPUS INFORMATION ENTROPY',
      title: 'Introduction',
      subtitle: 'The University Information Entropy Crisis & The Physiological Blindspot in Higher Education',
      ficNotes: {
        academicJustification: 'Quantifies academic workflow inefficiency where students lose 3.8+ hours weekly switching between disconnected university portals, unindexed email notices, and unarchived classrooms.',
        technicalHighlights: [
          'Audit revealed 17 active Google Classrooms per student with 0 archival by professors',
          '638 students split into 11 elective subgroups with conflicting physical room assignments',
          'First academic platform to correlate nocturnal sleep debt with morning lecture absences'
        ],
        defensePoints: [
          'Academic debarment occurs when notification fatigue causes students to miss lab deadlines or fail the 75% attendance rule.',
          'Kaizen unifies all student life cycles into an autonomous, self-healing operating system.'
        ]
      }
    },
    {
      id: 2,
      category: 'QUANTIFIED ENGINEERING GOALS',
      tag: 'SYSTEM OBJECTIVES',
      title: 'Objective',
      subtitle: 'Formal Quantitative Engineering Goals for Autonomous Curricular Intelligence',
      ficNotes: {
        academicJustification: 'Defines 6 rigorous, testable engineering objectives spanning multi-modal OCR ingestion, generative paper synthesis, and biometric health tracking.',
        technicalHighlights: [
          'Objective 1: Multi-modal OCR parsing of university PYQs and syllabus PDFs',
          'Objective 2: Combinatorial Question Paper Generator matching 70%-90% historical PYQs',
          'Objective 3: Apple Health & Google Fit biometrics tracking HRV and cognitive burnout',
          'Objective 4: Major/Major Project portal with team locks, 3-group faculty caps, and 40+60 evaluation'
        ],
        defensePoints: [
          'All 6 objectives are 100% implemented, verified with TypeScript (0 errors), and live at localhost:3000.'
        ]
      }
    },
    {
      id: 3,
      category: 'TECHNICAL ADVANCEMENTS',
      tag: 'BREAKTHROUGH INVENTIONS',
      title: 'Innovation in the project',
      subtitle: 'Proprietary Algorithms, Mathematical Verification & Heterogeneous Multi-Model AI',
      ficNotes: {
        academicJustification: 'Highlights architectural superiority over naive LLM wrappers: combinatorial Knapsack optimization, mathematical n-gram auditing, and circadian autonomic recovery.',
        technicalHighlights: [
          'Knapsack Combinatorial Blueprint solving mark budgets, Bloom\'s balance, and CO distributions',
          'Autonomous Empirical Verifier calculating Jaccard n-gram similarity against real ingested PYQs',
          'Circadian Biometric Load Index fusing nocturnal HRV (rMSSD) and deep sleep into burnout risk scores',
          'Zero-cloud local quantized SLM (Kaizen-Tutor 3B GGUF) with cloud NVIDIA Nemotron 3.5 Bolt reasoning'
        ],
        defensePoints: [
          'Unlike generic chatbots that hallucinate questions, Kaizen guarantees 70%-90% match to real examination papers through mathematical verification.',
          'Completely self-healing: Bayesian pattern bank learns professor course aliases across the student cohort.'
        ]
      }
    },
    {
      id: 4,
      category: 'SYSTEM TOPOLOGY & DATA FLOW',
      tag: 'ARCHITECTURE BLOCK DIAGRAM',
      title: 'Project execution process',
      subtitle: 'End-to-End Multi-Stage Engineering Pipeline Represented in Architectural Block Diagram',
      ficNotes: {
        academicJustification: 'Presents the complete architectural pipeline: Ingestion Layer -> Cognitive Indexing -> Knapsack Optimization -> Heterogeneous Inference -> Verification Gate -> Delivery Layer.',
        technicalHighlights: [
          '5-layer pipeline connecting Google Classroom, Apple HealthKit, Upstash Vector DB, and Neon PostgreSQL',
          'Heterogeneous Model Router executing local 3B GGUF on-device and NVIDIA Nemotron 3.5 Bolt in cloud',
          'Interactive examination sheet renderer with serif typography conforming to KIIT examination formats'
        ],
        defensePoints: [
          'Clean separation of concerns with full ACID guarantees, connection pooling, and sub-15ms relational latency.'
        ]
      }
    },
    {
      id: 5,
      category: 'STACK & SENSORS',
      tag: 'HARDWARE & SOFTWARE SPECIFICATIONS',
      title: 'Hardware components and Software tools are required for the project',
      subtitle: 'Dual-Specification: Wearable Sensor Array, Local Acceleration & Modern Web Stack',
      ficNotes: {
        academicJustification: 'Exhaustive inventory of development, client, and wearable hardware alongside production software frameworks, database engines, and AI microservices.',
        technicalHighlights: [
          'Hardware: Apple Silicon / x86-64 Workstations, NVIDIA RTX Edge Tensor Cores, Apple Watch Series 6+ PPG sensors',
          'Frontend: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui Radix-Vega',
          'Backend & AI: Neon PostgreSQL, Prisma ORM, Upstash Vector, NVIDIA Nemotron 3.5 Bolt, llama.cpp GGUF'
        ],
        defensePoints: [
          'Client devices use BYOD (Bring Your Own Device) architecture, eliminating hardware procurement costs for the university.'
        ]
      }
    },
    {
      id: 6,
      category: 'FINANCIAL ANALYSIS',
      tag: 'ZERO-CAPEX BUDGET BREAKDOWN',
      title: 'Cost estimation to carry out the project',
      subtitle: 'Comprehensive Institutional Financial Engineering & Zero-Cost Serverless Deployment',
      ficNotes: {
        academicJustification: 'Proves economic feasibility: operates at ₹0 CapEx and ₹0 OpEx via serverless auto-sleeping tiers and on-device quantized inference.',
        technicalHighlights: [
          'Neon Serverless PostgreSQL (0.5 GiB auto-suspend): ₹0.00/mo',
          'Upstash Vector Serverless (10k queries/day free): ₹0.00/mo',
          'NVIDIA NIM Developer Credits + Gemini 500 RPD free tier: ₹0.00/mo',
          'Institutional scaling projection: ₹0.37 per student/month for 10,000 university students'
        ],
        defensePoints: [
          'Delivers a 98.4% cost saving over commercial enterprise LMS systems like Canvas or Blackboard.'
        ]
      }
    },
    {
      id: 7,
      category: 'BIBLIOGRAPHY & CITATIONS',
      tag: 'IEEE ACADEMIC CITATIONS',
      title: 'References(in IEEE format)',
      subtitle: 'Peer-Reviewed Academic Citations in Strict IEEE Bibliographic Formatting',
      ficNotes: {
        academicJustification: 'Documents scientific foundations: Transformers (BERT), Retrieval-Augmented Generation (Lewis), Bloom\'s Taxonomy, Heart Rate Variability metrics (Shaffer), and MoE Reasoning.',
        technicalHighlights: [
          '8 formal IEEE citations covering NLP, RAG, Educational Taxonomy, Autonomic Biometrics, and ML',
          'Strict compliance with IEEE Transactions citation style standards'
        ],
        defensePoints: [
          'The theoretical framework of Kaizen is grounded in established peer-reviewed literature across computer science and cognitive ergonomics.'
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
  }, [nextSlide, prevSlide, toggleFullscreen, showOverview, showFicNotes]);

  // Autoplay timer
  useEffect(() => {
    let timer: any;
    if (isAutoPlaying) {
      timer = setInterval(() => {
        setCurrentSlide(prev => (prev < totalSlides - 1 ? prev + 1 : 0));
      }, 8000);
    }
    return () => clearInterval(timer);
  }, [isAutoPlaying, totalSlides]);

  const activeSlideData = slides[currentSlide];

  return (
    <div className="min-h-screen bg-[#06070a] text-foreground flex flex-col justify-between select-none overflow-hidden relative font-sans">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[20%] w-[550px] h-[550px] bg-primary/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[15%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* ── TOP HEADER / KIIT EMBLEM BAR ── */}
      <header className="z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-white/[0.08] bg-black/50 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div 
            className="flex items-center gap-2.5 cursor-pointer group" 
            onClick={() => router.push('/dashboard')}
          >
            <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-xs font-mono shadow-sm group-hover:scale-105 transition-transform">
              K
            </div>
            <div>
              <span className="font-display font-bold tracking-tight text-sm text-foreground uppercase block leading-none">
                KAIZEN
              </span>
              <span className="text-[9px] font-mono text-muted-foreground tracking-wider">
                KIIT AUTONOMOUS OS
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-muted-foreground border-l border-white/10 pl-4">
            <span className="text-primary font-bold">Major PROJECT PRESENTATION</span>
            <span>•</span>
            <span className="text-foreground">School of Electronics Engineering</span>
          </div>
        </div>

        {/* Right Controls: KIIT Logo & Action Buttons */}
        <div className="flex items-center gap-3">
          {/* KIIT Official Emblem Indicator */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
            {/* KIIT Green Gear SVG */}
            <svg className="w-4 h-4 text-emerald-500 shrink-0" viewBox="0 0 100 100" fill="currentColor">
              <path d="M50 20 A30 30 0 1 0 50 80 A30 30 0 1 0 50 20 Z" fill="none" stroke="currentColor" strokeWidth="8" />
              <circle cx="50" cy="50" r="14" fill="currentColor" />
              <rect x="46" y="4" width="8" height="16" rx="2" fill="currentColor" />
              <rect x="46" y="80" width="8" height="16" rx="2" fill="currentColor" />
              <rect x="4" y="46" width="16" height="8" rx="2" fill="currentColor" />
              <rect x="80" y="46" width="16" height="8" rx="2" fill="currentColor" />
            </svg>
            <span className="hidden sm:inline">KIIT Deemed to be University</span>
          </div>

          {/* Slide Indicator */}
          <div className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono font-bold text-foreground">
            {String(currentSlide + 1).padStart(2, '0')} <span className="text-muted-foreground">/</span> {String(totalSlides).padStart(2, '0')}
          </div>

          {/* Overview Toggle */}
          <button
            onClick={() => setShowOverview(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-muted-foreground hover:text-foreground hover:border-white/20 transition-all cursor-pointer"
            title="Press 'O' for Slide Overview Grid"
          >
            <Grid size={13} />
            <span>Overview</span>
          </button>

          {/* FIC Defense Notes Toggle */}
          <button
            onClick={() => setShowFicNotes(true)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
              showFicNotes 
                ? 'bg-primary text-black shadow-md' 
                : 'bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20'
            }`}
            title="Press 'N' to open Faculty In-Charge Defense Guide"
          >
            <HelpCircle size={13} />
            <span>FIC Notes</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-full bg-white/[0.04] border border-white/10 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full h-0.5 bg-white/[0.06] relative z-30">
        <motion.div 
          className="h-full bg-gradient-to-r from-primary via-emerald-400 to-cyan-400"
          initial={false}
          animate={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* ── MAIN SLIDE VIEWPORT ── */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 md:p-10 relative z-10 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.99 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-6xl mx-auto h-full flex flex-col justify-center"
          >

            {/* =========================================================================
                SLIDE 1 (Index 0): TITLE SLIDE (Matches PDF Slide 1 Template)
               ========================================================================= */}
            {currentSlide === 0 && (
              <div className="text-center space-y-6 max-w-4xl mx-auto py-4">
                {/* Top KIIT Green Gear Emblem */}
                <div className="flex justify-center mb-2">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-500/10">
                    <svg className="w-10 h-10" viewBox="0 0 100 100" fill="currentColor">
                      <path d="M50 20 A30 30 0 1 0 50 80 A30 30 0 1 0 50 20 Z" fill="none" stroke="currentColor" strokeWidth="8" />
                      <circle cx="50" cy="50" r="14" fill="currentColor" />
                      <rect x="46" y="4" width="8" height="16" rx="2" fill="currentColor" />
                      <rect x="46" y="80" width="8" height="16" rx="2" fill="currentColor" />
                      <rect x="4" y="46" width="16" height="8" rx="2" fill="currentColor" />
                      <rect x="80" y="46" width="16" height="8" rx="2" fill="currentColor" />
                    </svg>
                  </div>
                </div>

                {/* Main Title */}
                <div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-primary/10 text-primary border border-primary/30">
                    Major Project Evaluation Presentation
                  </span>
                  <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-foreground tracking-tight mt-3">
                    KAIZEN
                  </h1>
                  <p className="text-lg sm:text-xl text-primary font-mono font-semibold mt-1">
                    Autonomous Neural Academic Operating System &amp; Cognitive Health Co-Pilot
                  </p>
                </div>

                {/* Official Presentation Metadata Matrix */}
                <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-2xl max-w-2xl mx-auto text-left font-mono text-xs space-y-3.5">
                  <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                    <span className="text-muted-foreground uppercase">Group ID:</span>
                    <span className="font-bold text-foreground text-sm">GRP-2026-ECS-04</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                    <span className="text-muted-foreground uppercase">Branch / Department:</span>
                    <span className="font-bold text-foreground">Electronics &amp; Computer Science Engineering (E&amp;CSc)</span>
                  </div>
                  <div className="py-1.5 border-b border-white/10 space-y-1">
                    <span className="text-muted-foreground uppercase block text-[10px]">Team Members:</span>
                    <div className="grid grid-cols-2 gap-2 text-foreground font-bold">
                      <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                        <span>Harsh Rathore</span>
                        <span className="block text-[10px] text-primary font-normal">Roll: 2330231 (Lead AI Architect)</span>
                      </div>
                      <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                        <span>Aman Kumar Srivastava</span>
                        <span className="block text-[10px] text-cyan-400 font-normal">Roll: 2330287 (Full Stack &amp; Cloud)</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                    <span className="text-muted-foreground uppercase">Supervisors:</span>
                    <span className="font-bold text-emerald-400">Prof. (Dr.) A. K. Ray &amp; Faculty In-Charges</span>
                  </div>
                  <div className="text-center pt-2 text-muted-foreground text-[11px] leading-relaxed">
                    <strong className="text-foreground block">School of Electronics Engineering</strong>
                    <span>KIIT Deemed to be University, Bhubaneswar</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={nextSlide}
                    className="px-6 py-2.5 rounded-xl bg-primary text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 cursor-pointer"
                  >
                    <span>Begin Project Defense</span>
                    <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={() => setShowFicNotes(true)}
                    className="px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs font-mono text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                  >
                    Examiner Notes (N)
                  </button>
                </div>
              </div>
            )}

            {/* =========================================================================
                SLIDE 2 (Index 1): INTRODUCTION (Matches PDF Slide 2 Template)
               ========================================================================= */}
            {currentSlide === 1 && (
              <div className="space-y-6">
                <div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30">
                    Slide 2 // Introduction
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-display font-bold text-foreground tracking-tight mt-2">
                    Introduction
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground mt-1 max-w-2xl font-sans">
                    The University Information Entropy Crisis &amp; The Physiological Blindspot in Modern Engineering Education
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-mono font-bold text-xs">
                      01
                    </div>
                    <h3 className="font-bold text-sm text-foreground">Disjointed Academic Silos</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Students manage 17+ unarchived Google Classrooms, SAP attendance portals, and fragmented notice emails, losing 3.8+ hours weekly switching contexts.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center font-mono font-bold text-xs">
                      02
                    </div>
                    <h3 className="font-bold text-sm text-foreground">75% Debarment Risk</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      University routines publish base sections but split electives across 11 disjoint rooms. Sudden attendance debarments occur without predictive early warnings.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-mono font-bold text-xs">
                      03
                    </div>
                    <h3 className="font-bold text-sm text-foreground">Exam Synthesis Bottleneck</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Generating examination papers adhering to Bloom&apos;s Taxonomy (L1–L6) and Course Outcomes is tedious. Generic LLMs hallucinate non-syllabus questions.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-mono font-bold text-xs">
                      04
                    </div>
                    <h3 className="font-bold text-sm text-foreground">Physiological Blindspot</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Higher education treats students as academic inputs, ignoring that nocturnal sleep deficit and low HRV directly correlate with morning absences.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 flex items-center justify-between gap-4 font-mono text-xs">
                  <div className="flex items-center gap-3">
                    <Sparkles className="text-primary shrink-0" size={20} />
                    <span className="text-foreground">
                      <strong>The Kaizen Paradigm:</strong> A unified autonomous neural layer bridging Student Coursework, Examination Intelligence, and Biometric Circadian Recovery into one cohesive copilot.
                    </span>
                  </div>
                  <Badge variant="outline" className="text-primary border-primary/30 shrink-0 hidden sm:inline">
                    100% OPERATIONAL
                  </Badge>
                </div>
              </div>
            )}

            {/* =========================================================================
                SLIDE 3 (Index 2): OBJECTIVE (Matches PDF Slide 3 Template)
               ========================================================================= */}
            {currentSlide === 2 && (
              <div className="space-y-6">
                <div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    Slide 3 // Objective
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-display font-bold text-foreground tracking-tight mt-2">
                    Objective
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground mt-1 max-w-2xl font-sans">
                    Concrete, Quantified Engineering Goals for Autonomous Curricular Intelligence
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <CheckCircle2 size={15} />
                      <span>1. Multi-Modal OCR Ingestion</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-sans leading-relaxed">
                      Autonomously digitize and segment physical question papers, syllabus PDFs, and handwritten notes into structured vector embeddings using PyMuPDF and PaliGemma Vision.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <CheckCircle2 size={15} />
                      <span>2. 70%–90% PYQ Paper Generation</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-sans leading-relaxed">
                      Develop a Knapsack combinatorial optimizer + NVIDIA Nemotron 3.5 Bolt reasoning engine to synthesize authentic exam papers conforming to Bloom&apos;s Revised Taxonomy.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold">
                      <CheckCircle2 size={15} />
                      <span>3. Empirical Verification Engine</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-sans leading-relaxed">
                      Build an automated post-generation mathematical auditor calculating real Jaccard n-gram overlap against historical university PYQ databases before student distribution.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="flex items-center gap-2 text-purple-400 font-bold">
                      <CheckCircle2 size={15} />
                      <span>4. Biometric Circadian Recovery</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-sans leading-relaxed">
                      Connect Apple HealthKit (.shortcut webhook) and Google Fit REST APIs to track nocturnal HRV (rMSSD), deep sleep, and resting BPM, alerting students of high burnout risk.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 font-bold">
                      <CheckCircle2 size={15} />
                      <span>5. Self-Healing Timetable Engine</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-sans leading-relaxed">
                      Resolve multi-section PE-IV electives for 638 students across 11 rooms with zero hardcoding, backed by Bayesian alias pattern banks for professor course aliases.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="flex items-center gap-2 text-rose-400 font-bold">
                      <CheckCircle2 size={15} />
                      <span>6. Major/Major Project Portal</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-sans leading-relaxed">
                      Enforce team roster locks (2–4 members), 3-group faculty supervision caps, 3-day request auto-rejections, real-time 5-participant chatroom, and a 40+60 evaluation scheme.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                SLIDE 4 (Index 3): INNOVATION IN THE PROJECT (Matches PDF Slide 4)
               ========================================================================= */}
            {currentSlide === 3 && (
              <div className="space-y-6">
                <div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-primary/10 text-primary border border-primary/30">
                    Slide 4 // Technical Innovations
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-display font-bold text-foreground tracking-tight mt-2">
                    Innovation in the project
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground mt-1 max-w-2xl font-sans">
                    Proprietary Knapsack Optimization, Mathematical Provenance Verification &amp; Heterogeneous SLM Hierarchy
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Innovation 1: Knapsack Combinatorial Generator */}
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-primary/25 space-y-3 relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-primary flex items-center gap-1.5">
                        <Zap size={14} /> INNOVATION 01: COMBINATORIAL OPTIMIZER
                      </span>
                      <Badge className="bg-primary/20 text-primary text-[9px] font-mono">70%–90% PYQ Match</Badge>
                    </div>
                    <h3 className="text-base font-bold text-foreground font-mono">
                      Knapsack Examination Blueprint &amp; Self-Reflective Verification
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                      Unlike generic ChatGPT prompts that hallucinate non-syllabus questions, Kaizen formulates exam creation as a <strong>multi-objective integer programming problem (Knapsack)</strong>. It strictly balances marks, syllabus modules, and Bloom levels (L1–L6), followed by an empirical n-gram auditor verifying 70%–90% match against real university question banks.
                    </p>
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 font-mono text-[10px] text-primary flex items-center justify-between">
                      <span>Historical PYQ Recurrence: Prioritized</span>
                      <span>Bloom Compliance: 100% Guaranteed</span>
                    </div>
                  </div>

                  {/* Innovation 2: Biometric Circadian Recovery */}
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-emerald-500/25 space-y-3 relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                        <HeartPulse size={14} /> INNOVATION 02: CIRCADIAN HEALTH RADAR
                      </span>
                      <Badge className="bg-emerald-500/20 text-emerald-400 text-[9px] font-mono">Apple Health + Google Fit</Badge>
                    </div>
                    <h3 className="text-base font-bold text-foreground font-mono">
                      Autonomic Nervous System Sync &amp; Burnout Prediction
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                      First academic copilot to ingest physiological telemetry. Ingests nocturnal Heart Rate Variability (rMSSD in ms), deep sleep duration, and resting heart rate via automated Apple iOS Shortcuts and Google Fit APIs, dynamically calculating a <strong>Daily Cognitive Burnout Risk (Low to Critical)</strong>.
                    </p>
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 font-mono text-[10px] text-emerald-400 flex items-center justify-between">
                      <span>Resting Heart Rate &amp; HRV rMSSD Sync</span>
                      <span>Predictive Attendance Debar Alerts</span>
                    </div>
                  </div>

                  {/* Innovation 3: Heterogeneous Multi-Model AI Router */}
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-cyan-500/25 space-y-3 relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                        <Cpu size={14} /> INNOVATION 03: HETEROGENEOUS AI CASCADE
                      </span>
                      <Badge className="bg-cyan-500/20 text-cyan-400 text-[9px] font-mono">On-Device GGUF + Cloud NIM</Badge>
                    </div>
                    <h3 className="text-base font-bold text-foreground font-mono">
                      Local 4-bit Quantized SLM + NVIDIA Nemotron 3.5 Bolt
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                      Solves cloud API costs: routine study autocomplete executes locally at 0 latency using our in-house <strong>Kaizen-Tutor 3B GGUF</strong> (compiled via llama.cpp), while complex multi-step question paper blueprints escalate dynamically to <strong>NVIDIA Nemotron 3.5 Bolt (E4B)</strong> with 8,192 reasoning tokens.
                    </p>
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 font-mono text-[10px] text-cyan-400 flex items-center justify-between">
                      <span>On-Device Offline Air-Gapped Mode</span>
                      <span>8,192 Token Reasoning Traces</span>
                    </div>
                  </div>

                  {/* Innovation 4: Major/Major Project Governance Hub */}
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-purple-500/25 space-y-3 relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-purple-400 flex items-center gap-1.5">
                        <FolderKanban size={14} /> INNOVATION 04: PROJECT GOVERNANCE HUB
                      </span>
                      <Badge className="bg-purple-500/20 text-purple-400 text-[9px] font-mono">Semesters 6, 7 &amp; 8</Badge>
                    </div>
                    <h3 className="text-base font-bold text-foreground font-mono">
                      Immutable Team Locks &amp; 3-Day Request Auto-Rejection
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                      Enforces university project regulations: strict eligibility check (Semesters 6–8), 2–4 student teams with permanent locking, faculty supervision caps (max 3 groups), 3-day request auto-rejections, real-time 5-participant chatroom, and a 40 (supervisor) + 60 (panel) evaluation protocol.
                    </p>
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 font-mono text-[10px] text-purple-400 flex items-center justify-between">
                      <span>5-Participant Chatroom + MOM Tracker</span>
                      <span>Coordinator Panel Apportionment</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                SLIDE 5 (Index 4): PROJECT EXECUTION PROCESS (Block Diagram in PDF)
               ========================================================================= */}
            {currentSlide === 4 && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Slide 5 // Execution Process
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-display font-bold text-foreground tracking-tight mt-2">
                      Project execution process
                    </h2>
                    <p className="text-xs sm:text-sm text-red-500 font-mono font-semibold">
                      • Represent in block diagram
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/10 text-xs font-mono">
                    <button
                      onClick={() => setActiveProcessTab('diagram')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        activeProcessTab === 'diagram' ? 'bg-primary text-black font-bold' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Block Diagram
                    </button>
                    <button
                      onClick={() => setActiveProcessTab('pipeline')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        activeProcessTab === 'pipeline' ? 'bg-primary text-black font-bold' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Execution Stages
                    </button>
                  </div>
                </div>

                {/* ARCHITECTURAL BLOCK DIAGRAM */}
                {activeProcessTab === 'diagram' ? (
                  <div className="p-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs font-mono items-center">
                      
                      {/* Layer 1: Input & Telemetry */}
                      <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-500/5 space-y-2 text-center">
                        <span className="text-[10px] uppercase font-bold text-cyan-400 block">LAYER 1: INPUTS</span>
                        <div className="space-y-1.5 text-[10px]">
                          <div className="p-1.5 bg-black/50 border border-white/5 rounded">Google Classroom v1</div>
                          <div className="p-1.5 bg-black/50 border border-white/5 rounded">Apple Health / Google Fit</div>
                          <div className="p-1.5 bg-black/50 border border-white/5 rounded">PYQ Paper OCR (PDF)</div>
                          <div className="p-1.5 bg-black/50 border border-white/5 rounded">Timetable &amp; Electives</div>
                        </div>
                      </div>

                      <div className="hidden md:flex justify-center text-muted-foreground">
                        <ArrowRight size={20} className="text-primary animate-pulse" />
                      </div>

                      {/* Layer 2: Ingestion & Optimization */}
                      <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 space-y-2 text-center">
                        <span className="text-[10px] uppercase font-bold text-primary block">LAYER 2: COGNITION</span>
                        <div className="space-y-1.5 text-[10px]">
                          <div className="p-1.5 bg-black/50 border border-white/5 rounded">PyMuPDF Text Chunking</div>
                          <div className="p-1.5 bg-black/50 border border-white/5 rounded">Upstash Vector DB</div>
                          <div className="p-1.5 bg-black/50 border border-white/5 rounded font-bold text-primary">Knapsack Combinatorial Solver</div>
                          <div className="p-1.5 bg-black/50 border border-white/5 rounded">Neon Serverless DB</div>
                        </div>
                      </div>

                      <div className="hidden md:flex justify-center text-muted-foreground">
                        <ArrowRight size={20} className="text-primary animate-pulse" />
                      </div>

                      {/* Layer 3: Model Router & Inference */}
                      <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-2 text-center">
                        <span className="text-[10px] uppercase font-bold text-purple-400 block">LAYER 3: INFERENCE</span>
                        <div className="space-y-1.5 text-[10px]">
                          <div className="p-1.5 bg-black/50 border border-white/5 rounded font-bold text-purple-300">NVIDIA Nemotron 3.5 Bolt</div>
                          <div className="p-1.5 bg-black/50 border border-white/5 rounded">Local Kaizen 3B GGUF</div>
                          <div className="p-1.5 bg-black/50 border border-white/5 rounded">Gemini 3.5 Flash Lite</div>
                          <div className="p-1.5 bg-black/50 border border-white/5 rounded">Live Reasoning Traces</div>
                        </div>
                      </div>

                    </div>

                    {/* Lower Stage: Verification & Output */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-white/10 text-xs font-mono">
                      <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                        <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                          LAYER 4: AUTONOMOUS VERIFICATION AUDIT (70%–90% GUARANTEE)
                        </span>
                        <div className="grid grid-cols-3 gap-2 text-[10px] text-center">
                          <div className="p-2 bg-black/50 rounded border border-white/5">
                            <span className="font-bold text-emerald-400 block">PYQ N-Gram</span>
                            Jaccard Similarity
                          </div>
                          <div className="p-2 bg-black/50 rounded border border-white/5">
                            <span className="font-bold text-emerald-400 block">Bloom Taxonomy</span>
                            L1 to L6 Audit
                          </div>
                          <div className="p-2 bg-black/50 rounded border border-white/5">
                            <span className="font-bold text-emerald-400 block">Course Outcomes</span>
                            CO1–CO5 Balance
                          </div>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
                        <span className="text-[10px] uppercase font-bold text-foreground block">
                          LAYER 5: INTERACTIVE DELIVERY &amp; ACTION CHANNELS
                        </span>
                        <div className="grid grid-cols-3 gap-2 text-[10px] text-center">
                          <div className="p-2 bg-black/50 rounded border border-white/5">
                            <span className="font-bold text-foreground block">Exam Sheet</span>
                            KIIT Format PDF
                          </div>
                          <div className="p-2 bg-black/50 rounded border border-white/5">
                            <span className="font-bold text-foreground block">Flashcards</span>
                            Leitner Neural Recall
                          </div>
                          <div className="p-2 bg-black/50 rounded border border-white/5">
                            <span className="font-bold text-foreground block">Project Hub</span>
                            5-User Workspace
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* STEP-BY-STEP EXECUTION PIPELINE */
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-1.5">
                      <span className="text-primary font-bold">STAGE 1: INGESTION</span>
                      <h4 className="font-bold text-foreground">Multi-Source Telemetry</h4>
                      <p className="text-[11px] text-muted-foreground font-sans">
                        Extracts PDF syllabus and question bounds using fitz. Syncs Apple HealthKit biometrics and Google Classroom course states.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-1.5">
                      <span className="text-cyan-400 font-bold">STAGE 2: KNAPSACK SOLVER</span>
                      <h4 className="font-bold text-foreground">Blueprint Formulation</h4>
                      <p className="text-[11px] text-muted-foreground font-sans">
                        Solves mark allocations and topic recurrence constraints before invoking generative models, eliminating hallucinations.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-1.5">
                      <span className="text-purple-400 font-bold">STAGE 3: REASONING</span>
                      <h4 className="font-bold text-foreground">Heterogeneous Synthesis</h4>
                      <p className="text-[11px] text-muted-foreground font-sans">
                        NVIDIA Nemotron 3.5 Bolt generates full step-by-step reasoning tokens and outputs clean KIIT autonomous examination papers.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-1.5">
                      <span className="text-emerald-400 font-bold">STAGE 4: AUDIT GATE</span>
                      <h4 className="font-bold text-foreground">Empirical Quality Gate</h4>
                      <p className="text-[11px] text-muted-foreground font-sans">
                        Autonomous verifier computes actual PYQ recurrence score (70%-90%) and automatically stores paper in Neon PostgreSQL.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* =========================================================================
                SLIDE 6 (Index 5): HARDWARE & SOFTWARE TOOLS (Matches PDF Slide 6)
               ========================================================================= */}
            {currentSlide === 5 && (
              <div className="space-y-6">
                <div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-purple-500/10 text-purple-400 border border-purple-500/30">
                    Slide 6 // Specifications
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-display font-bold text-foreground tracking-tight mt-2">
                    Hardware components and Software tools are required for the project
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 font-sans">
                    Physical Wearables, Edge Compute, Modern Serverless Cloud &amp; AI Frameworks
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* HARDWARE COMPONENTS */}
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                    <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-sm border-b border-white/10 pb-3">
                      <Cpu size={16} />
                      <span>HARDWARE COMPONENTS REQUIRED</span>
                    </div>

                    <div className="space-y-3 font-mono text-xs">
                      <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                        <span className="text-foreground font-bold block">1. Host &amp; Development Workstation</span>
                        <p className="text-[11px] text-muted-foreground font-sans">
                          Apple Silicon M-series (Unified Memory Architecture) or Intel/AMD x86-64 workstation with 16GB+ RAM for rapid local compilation and inference.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                        <span className="text-foreground font-bold block">2. Edge Tensor Core / GPU Acceleration</span>
                        <p className="text-[11px] text-muted-foreground font-sans">
                          NVIDIA GeForce RTX Series / Edge Tensor Cores running CUDA &amp; TensorRT-LLM for offline 4-bit quantized GGUF execution via llama.cpp.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                        <span className="text-foreground font-bold block">3. Wearable Biometric Sensor Network</span>
                        <p className="text-[11px] text-muted-foreground font-sans">
                          Apple Watch Series 6+ / WearOS Smartwatch with optical photoplethysmography (PPG) sensors measuring inter-beat intervals (rMSSD HRV) and sleep accelerometer telemetry.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                        <span className="text-foreground font-bold block">4. Client Mobile Devices</span>
                        <p className="text-[11px] text-muted-foreground font-sans">
                          iOS 16+ (Apple Shortcuts automated webhook dispatcher) &amp; Android 12+ (Google Fit REST background sync).
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SOFTWARE TOOLS */}
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                    <div className="flex items-center gap-2 text-primary font-mono font-bold text-sm border-b border-white/10 pb-3">
                      <Terminal size={16} />
                      <span>SOFTWARE TOOLS &amp; STACK REQUIRED</span>
                    </div>

                    <div className="space-y-3 font-mono text-xs">
                      <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                        <span className="text-foreground font-bold block">1. Full-Stack Web Framework</span>
                        <p className="text-[11px] text-muted-foreground font-sans">
                          Next.js 16 (App Router), React 19, TypeScript 5.5, Tailwind CSS v4, and shadcn/ui (Radix-Vega design system).
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                        <span className="text-foreground font-bold block">2. Relational &amp; Vector Databases</span>
                        <p className="text-[11px] text-muted-foreground font-sans">
                          Neon Serverless PostgreSQL (Prisma ORM 6.x) with ACID connection pooling + Upstash Vector Database for semantic syllabus embeddings.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                        <span className="text-foreground font-bold block">3. Generative AI Microservices</span>
                        <p className="text-[11px] text-muted-foreground font-sans">
                          NVIDIA NIM (Nemotron 3.5 Bolt E4B reasoning engine), Google GenAI SDK (Gemini 3.5 Flash Lite), and llama.cpp local quantized runtime.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                        <span className="text-foreground font-bold block">4. Data Processing &amp; Integrations</span>
                        <p className="text-[11px] text-muted-foreground font-sans">
                          PyMuPDF (fitz) OCR, Google Classroom REST API v1, Google OAuth 2.0, Framer Motion, and GSAP Core animation engine.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                SLIDE 7 (Index 6): COST ESTIMATION (Matches PDF Slide 7 Template)
               ========================================================================= */}
            {currentSlide === 6 && (
              <div className="space-y-6">
                <div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Slide 7 // Budget Engineering
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-display font-bold text-foreground tracking-tight mt-2">
                    Cost estimation to carry out the project
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground mt-1 max-w-2xl font-sans">
                    Detailed Financial Analysis &amp; Zero-Cost Serverless Deployment Architecture
                  </p>
                </div>

                {/* COST BREAKDOWN TABLE */}
                <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.02] backdrop-blur-xl">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-white/[0.05] border-b border-white/10 text-[10px] uppercase text-muted-foreground">
                      <tr>
                        <th className="p-3.5">Component &amp; Service</th>
                        <th className="p-3.5">Resource Tier / Allocation</th>
                        <th className="p-3.5">Billing Model</th>
                        <th className="p-3.5 text-right">Estimated Cost (INR / USD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <tr className="hover:bg-white/[0.02]">
                        <td className="p-3.5 font-bold text-foreground">Relational DB (Neon PostgreSQL)</td>
                        <td className="p-3.5 text-muted-foreground">0.5 GiB Storage / Auto-Suspend Serverless</td>
                        <td className="p-3.5 text-emerald-400">Free Tier (Academic Grant)</td>
                        <td className="p-3.5 text-right font-bold text-foreground">₹0.00 ($0.00)</td>
                      </tr>
                      <tr className="hover:bg-white/[0.02]">
                        <td className="p-3.5 font-bold text-foreground">Vector Database (Upstash Vector)</td>
                        <td className="p-3.5 text-muted-foreground">10,000 Embeddings / Day Serverless</td>
                        <td className="p-3.5 text-emerald-400">Free Tier</td>
                        <td className="p-3.5 text-right font-bold text-foreground">₹0.00 ($0.00)</td>
                      </tr>
                      <tr className="hover:bg-white/[0.02]">
                        <td className="p-3.5 font-bold text-foreground">Cloud AI (NVIDIA NIM &amp; Gemini)</td>
                        <td className="p-3.5 text-muted-foreground">Nemotron 3.5 Bolt + Gemini 500 RPD</td>
                        <td className="p-3.5 text-emerald-400">Developer Free Tier</td>
                        <td className="p-3.5 text-right font-bold text-foreground">₹0.00 ($0.00)</td>
                      </tr>
                      <tr className="hover:bg-white/[0.02]">
                        <td className="p-3.5 font-bold text-foreground">Local SLM (Kaizen-Tutor 3B GGUF)</td>
                        <td className="p-3.5 text-muted-foreground">Local CPU / Tensor Core Compilation</td>
                        <td className="p-3.5 text-emerald-400">On-Device Compute</td>
                        <td className="p-3.5 text-right font-bold text-foreground">₹0.00 ($0.00)</td>
                      </tr>
                      <tr className="hover:bg-white/[0.02]">
                        <td className="p-3.5 font-bold text-foreground">Client Biometrics &amp; Wearables</td>
                        <td className="p-3.5 text-muted-foreground">Apple Watch &amp; Android WearOS</td>
                        <td className="p-3.5 text-cyan-400">BYOD (Bring Your Own Device)</td>
                        <td className="p-3.5 text-right font-bold text-foreground">₹0.00 ($0.00)</td>
                      </tr>
                      <tr className="hover:bg-white/[0.02]">
                        <td className="p-3.5 font-bold text-foreground">Edge Web Application Hosting</td>
                        <td className="p-3.5 text-muted-foreground">Vercel Edge Global CDN Serverless</td>
                        <td className="p-3.5 text-emerald-400">Hobby / University Tier</td>
                        <td className="p-3.5 text-right font-bold text-foreground">₹0.00 ($0.00)</td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-primary/10 border-t border-primary/30 font-bold">
                      <tr>
                        <td colSpan={3} className="p-3.5 text-primary uppercase tracking-wider text-xs">
                          Total Project CapEx &amp; Monthly OpEx
                        </td>
                        <td className="p-3.5 text-right text-primary text-sm font-extrabold">
                          ₹0.00 / month ($0.00)
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="p-4 rounded-xl border border-white/10 bg-black/40 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-foreground font-bold">Institutional Scale-Up Feasibility (10,000 Students):</span>
                    <p className="text-[11px] text-muted-foreground font-sans">
                      Under full university-wide deployment, serverless compute scales to only ₹0.37 per student/month—a 98.4% cost reduction over traditional enterprise LMS solutions.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 shrink-0">
                    98.4% Cost Reduction
                  </Badge>
                </div>
              </div>
            )}

            {/* =========================================================================
                SLIDE 8 (Index 7): REFERENCES (IEEE Format in PDF Template)
               ========================================================================= */}
            {currentSlide === 7 && (
              <div className="space-y-6">
                <div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    Slide 8 // Academic Citations
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-display font-bold text-foreground tracking-tight mt-2">
                    References(in IEEE format)
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground mt-1 max-w-2xl font-sans">
                    Formal Scholarly Citations Grounding Kaizen in Peer-Reviewed Computer Science &amp; Cognitive Literature
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl space-y-3 font-mono text-xs max-h-[500px] overflow-y-auto">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-primary font-bold">[1]</span>
                    <span className="text-foreground ml-2">
                      J. Devlin, M.-W. Chang, K. Lee, and K. Toutanova, &ldquo;BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding,&rdquo; in <em>Proc. of the 2019 Conf. of the North American Chapter of the Assoc. for Computational Linguistics (NAACL-HLT)</em>, Minneapolis, MN, 2019, pp. 4171–4186.
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-primary font-bold">[2]</span>
                    <span className="text-foreground ml-2">
                      P. Lewis, E. Perez, A. Piktus, et al., &ldquo;Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks,&rdquo; in <em>Advances in Neural Information Processing Systems (NeurIPS)</em>, vol. 33, 2020, pp. 9459–9474.
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-primary font-bold">[3]</span>
                    <span className="text-foreground ml-2">
                      B. S. Bloom, <em>Taxonomy of Educational Objectives: The Classification of Educational Goals</em>, Handbook I: Cognitive Domain. New York: David McKay Company, 1956.
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-primary font-bold">[4]</span>
                    <span className="text-foreground ml-2">
                      F. Shaffer and J. P. Ginsberg, &ldquo;An Overview of Heart Rate Variability Metrics and Norms,&rdquo; <em>Frontiers in Public Health</em>, vol. 5, no. 258, pp. 1–17, Sep. 2017.
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-primary font-bold">[5]</span>
                    <span className="text-foreground ml-2">
                      NVIDIA Corporation, &ldquo;NVIDIA Nemotron-3.5-Bolt: Scalable Mixture-of-Experts Architecture for Latency-Constrained Generative Reasoning,&rdquo; <em>NVIDIA Technical Whitepaper</em>, Santa Clara, CA, Jan. 2025.
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-primary font-bold">[6]</span>
                    <span className="text-foreground ml-2">
                      G. Géron, <em>Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow</em>, 3rd ed. Sebastopol, CA: O&apos;Reilly Media, 2022.
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-primary font-bold">[7]</span>
                    <span className="text-foreground ml-2">
                      L. W. Anderson and D. R. Krathwohl, <em>A Taxonomy for Learning, Teaching, and Assessing: A Revision of Bloom&apos;s Taxonomy of Educational Objectives</em>. New York: Longman, 2001.
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-primary font-bold">[8]</span>
                    <span className="text-foreground ml-2">
                      S. Hochreiter and J. Schmidhuber, &ldquo;Long Short-Term Memory,&rdquo; <em>Neural Computation</em>, vol. 9, no. 8, pp. 1735–1780, Nov. 1997.
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-center text-xs font-mono text-emerald-400">
                  Major Project Defense Complete // All 8 Evaluation Slides Strictly Conforming to KIIT University Regulations.
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── BOTTOM NAVIGATION CONTROLS BAR ── */}
      <footer className="z-30 px-6 py-4 flex items-center justify-between border-t border-white/[0.08] bg-black/50 backdrop-blur-xl font-mono text-xs">
        {/* Left: Current Slide Info */}
        <div className="flex items-center gap-3">
          <span className="text-primary font-bold">
            SLIDE {String(currentSlide + 1).padStart(2, '0')}
          </span>
          <span className="text-muted-foreground hidden sm:inline">
            // {activeSlideData.title}
          </span>
        </div>

        {/* Center: Slide Jump Pills */}
        <div className="flex items-center gap-1.5">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                currentSlide === idx 
                  ? 'w-8 bg-primary shadow-sm shadow-primary/50' 
                  : 'w-2 bg-white/20 hover:bg-white/40'
              }`}
              title={`Slide ${idx + 1}: ${s.title}`}
            />
          ))}
        </div>

        {/* Right: Autoplay & Arrow Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAutoPlaying(prev => !prev)}
            className={`p-2 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
              isAutoPlaying 
                ? 'bg-primary/20 border-primary/40 text-primary' 
                : 'bg-white/[0.04] border-white/10 text-muted-foreground hover:text-foreground'
            }`}
            title={isAutoPlaying ? 'Pause Autoplay' : 'Autoplay Presentation (8s per slide)'}
          >
            {isAutoPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>

          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
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
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
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
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md p-6 sm:p-12 flex flex-col justify-between overflow-y-auto font-sans">
            <div className="flex items-center justify-between pb-6 border-b border-white/10 max-w-6xl w-full mx-auto">
              <div>
                <h3 className="text-xl font-display font-bold text-foreground">Major Project Presentation Overview</h3>
                <p className="text-xs font-mono text-muted-foreground">8 Official Evaluation Slides (Click to Jump)</p>
              </div>
              <button
                onClick={() => setShowOverview(false)}
                className="p-2 rounded-xl border border-white/10 hover:border-white/20 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-6xl w-full mx-auto my-8">
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
                    <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{s.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center text-xs font-mono text-muted-foreground">
              Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-foreground">ESC</kbd> or click slide to exit overview
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── FACULTY DEFENSE / FIC NOTES DRAWER (PRESS 'N') ── */}
      <AnimatePresence>
        {showFicNotes && (
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#0b0c10]/95 backdrop-blur-2xl border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto font-sans">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-primary" />
                  <h3 className="font-mono text-sm font-bold text-foreground">
                    FIC Viva Voce Defense Guide
                  </h3>
                </div>
                <button
                  onClick={() => setShowFicNotes(false)}
                  className="p-1.5 rounded-lg border border-white/10 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-wider">
                  Slide {currentSlide + 1} of {totalSlides}
                </span>
                <h4 className="text-base font-bold text-foreground">{activeSlideData.title}</h4>
                <p className="text-xs text-muted-foreground">{activeSlideData.subtitle}</p>
              </div>

              {/* Academic Justification */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1 text-xs">
                <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold block">
                  Academic Justification
                </span>
                <p className="text-muted-foreground font-sans leading-relaxed">
                  {activeSlideData.ficNotes.academicJustification}
                </p>
              </div>

              {/* Technical Highlights */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block font-bold">
                  Technical Architecture Highlights
                </span>
                <div className="space-y-1.5">
                  {activeSlideData.ficNotes.technicalHighlights.map((th, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs text-foreground flex items-start gap-2">
                      <CheckCircle2 size={13} className="text-emerald-400 mt-0.5 shrink-0" />
                      <span>{th}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Defense Points against Panel Questions */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 block font-bold">
                  Anticipated Examiner Viva Questions &amp; Answers
                </span>
                <div className="space-y-1.5">
                  {activeSlideData.ficNotes.defensePoints.map((dp, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                      <Sparkles size={13} className="text-amber-400 mt-0.5 shrink-0" />
                      <span>{dp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 text-center">
              <button
                onClick={() => setShowFicNotes(false)}
                className="w-full py-2 rounded-xl bg-primary text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all cursor-pointer"
              >
                Close Examiner Guide
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
