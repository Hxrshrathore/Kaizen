"use client";

import React, { forwardRef, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { 
  HeartPulse, 
  FileText, 
  ScanLine, 
  GraduationCap,
  Database, 
  Network, 
  Cpu, 
  Sparkles, 
  Sliders, 
  TrendingUp, 
  Brain, 
  Zap, 
  Target,
  AlarmClock,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Info
} from "lucide-react";

// Interactive Node Component
interface NodeProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeColor?: string;
  isActive?: boolean;
}

const ArchitectureNode = forwardRef<HTMLDivElement, NodeProps>(
  ({ className, icon, label, sublabel, badge, badgeColor = "#bbf246", isActive, ...props }, ref) => {
    return (
      <div className="flex flex-col items-center group relative">
        <div
          ref={ref}
          className={cn(
            "relative z-10 flex size-12 sm:size-14 md:size-16 items-center justify-center rounded-2xl md:rounded-3xl border bg-card/90 dark:bg-[#121624]/90 backdrop-blur-xl p-2.5 sm:p-3 shadow-lg transition-all duration-300 group-hover:scale-110 cursor-pointer",
            isActive 
              ? "border-primary dark:border-[#bbf246] shadow-[0_0_25px_rgba(187,242,70,0.4)] ring-2 ring-primary/30 dark:ring-[#bbf246]/30 scale-105" 
              : "border-border dark:border-white/10 hover:border-primary/60 dark:hover:border-[#bbf246]/60 hover:shadow-xl",
            className
          )}
          {...props}
        >
          {icon}
          {badge && (
            <span 
              className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-mono font-bold tracking-tight shadow-sm uppercase border"
              style={{
                backgroundColor: `${badgeColor}22`,
                borderColor: `${badgeColor}66`,
                color: badgeColor
              }}
            >
              {badge}
            </span>
          )}
        </div>
        <div className="mt-2 text-center pointer-events-none max-w-[85px] sm:max-w-[100px]">
          <span className="block text-[11px] sm:text-xs font-semibold text-foreground dark:text-white leading-tight">
            {label}
          </span>
          {sublabel && (
            <span className="block text-[9px] sm:text-[10px] font-mono text-muted-foreground dark:text-zinc-400 leading-tight mt-0.5 truncate">
              {sublabel}
            </span>
          )}
        </div>
      </div>
    );
  }
);
ArchitectureNode.displayName = "ArchitectureNode";

// Detailed node explanations for student click inspection
const NODE_DETAILS: Record<string, { title: string; category: string; desc: string; badge: string; color: string; metrics: string[] }> = {
  health: {
    title: "Apple Health & Sleep Sync",
    category: "Biometric Ingestion",
    desc: "Ingests sleep duration, deep sleep stages, and heart rate variability (HRV). Correlates sleep debt with morning cognitive load to predict class attendance drop.",
    badge: "HealthKit / Terra",
    color: "#f43f5e",
    metrics: ["Circadian Pacing", "Sleep Debt Metric", "HRV Stress Tracking"]
  },
  classroom: {
    title: "Google Classroom Integration",
    category: "Academic Ingestion",
    desc: "Automatically syncs coursework streams, active assignment deadlines, professor announcements, and lecture slides directly into your personalized study calendar.",
    badge: "Google Workspace API",
    color: "#3b82f6",
    metrics: ["Assignment Due Alerts", "Lecture Slides Sync", "Syllabus Matching"]
  },
  grades: {
    title: "KIIT SAP Portal & Grade Reports",
    category: "Academic Records",
    desc: "High-speed local parsing of KIIT semester grade sheets via PyMuPDF. Extracts credit weightages, backlogs, SGPA/CGPA history, and official attendance records.",
    badge: "PyMuPDF Local Parser",
    color: "#38bdf8",
    metrics: ["100% Client-Side", "Relative Curve Matched", "Zero Server Uploads"]
  },
  ocr: {
    title: "KIIT PYQ Digitizer & OCR",
    category: "Exam Intelligence",
    desc: "Extracts questions, formulas, diagrams, and marks allocation from past semester exam papers. Formats questions for semantic search and AI practice drills.",
    badge: "Gemini Vision + PyMuPDF",
    color: "#bbf246",
    metrics: ["Diagram Extraction", "Mark Weight Parsing", "Sub-2s Processing"]
  },
  redis: {
    title: "Upstash Redis Live Staging",
    category: "Persistence Buffer",
    desc: "Sub-millisecond REST buffer managing active OCR review queues (kaizen:staging:item:*), temporary student study sessions, and rate-limiting counters.",
    badge: "Sub-ms In-Memory",
    color: "#ef4444",
    metrics: ["<15ms Global Latency", "Automated Expiry", "Zero Cold Starts"]
  },
  neon: {
    title: "Neon Serverless PostgreSQL",
    category: "Golden Database",
    desc: "Prisma ORM-backed relational database housing verified academic profiles, semester courses, attendance logs, and verified golden PYQ questions.",
    badge: "Postgres Serverless",
    color: "#22c55e",
    metrics: ["Scale-to-Zero", "Prisma Type-Safe", "Branching Engine"]
  },
  vector: {
    title: "Upstash Vector & Notes RAG",
    category: "Semantic Memory",
    desc: "1536-dimensional embeddings storing KIIT course notes, syllabi, and past solutions. Enables context-aware retrieval-augmented answers tailored to course codes.",
    badge: "1536-D Semantic Index",
    color: "#06b6d4",
    metrics: ["Cosine Similarity", "Course Code Filtering", "Sub-50ms RAG"]
  },
  colab: {
    title: "Per-Subject Fine-Tuning Pipeline",
    category: "Custom Intelligence",
    desc: "Exports KIIT PYQ training datasets via /api/dataset/export into Alpaca format. Trains per-subject QLoRA adapters on Google Colab T4 GPUs using Unsloth.",
    badge: "Unsloth QLoRA",
    color: "#f59e0b",
    metrics: ["Subject-Specific Adapters", "16-Bit Quantized", "HuggingFace Hub Sync"]
  },
  hub: {
    title: "Kaizen Multi-Agent Router",
    category: "Central Core",
    desc: "Classifies each academic request into Light (3B local), Medium (Flash-Lite), Heavy (Flash), or Vision tasks. Dispatches work seamlessly with zero quota wastage.",
    badge: "Deterministic Orchestrator",
    color: "#bbf246",
    metrics: ["Cascade Fallbacks", "Cost: $0/dev", "Sub-300ms Autocomplete"]
  },
  gguf: {
    title: "In-House Kaizen-Tutor 3B",
    category: "Local LLM",
    desc: "Custom Qwen 2.5 3B / Llama 3.2 3B GGUF running on EC2 t3.micro. Specializes in instant tag extraction, weak topic categorization, and offline question solving.",
    badge: "Q4_K_M GGUF",
    color: "#a3e635",
    metrics: ["1.8 GB Memory Footprint", "Zero API Cost", "No External Dependency"]
  },
  gemini: {
    title: "Gemini 3 Flash & Flash-Lite",
    category: "Cloud Reasoning",
    desc: "Processes multimodal PDF question papers, complex mathematical proofs, step-by-step solution derivations, and deep syllabus explanations.",
    badge: "Gemini Multimodal",
    color: "#818cf8",
    metrics: ["1M Token Context", "Vision Diagram Analysis", "Sub-1s Streaming"]
  },
  practice: {
    title: "PYQ Practice & Weak Topic Engine",
    category: "Adaptive Testing",
    desc: "Identifies weak academic topics based on past exam mistakes and internal marks. Dynamically generates targeted PYQ-based practice quizzes with instant AI grading.",
    badge: "AI Weakness Hunter",
    color: "#bbf246",
    metrics: ["Adaptive Difficulty", "Step-by-Step Scoring", "Mistake Pattern Analysis"]
  },
  absence: {
    title: "Class Absence & 75% Risk Predictor",
    category: "Predictive Analytics",
    desc: "Combines sleep schedule, circadian fatigue, and current attendance to calculate the probability of missing tomorrow's 8:00 AM class, guarding KIIT's 75% cutoff.",
    badge: "Attendance Guard",
    color: "#f43f5e",
    metrics: ["75% Rule Enforced", "Morning Lecture Alerts", "Safe Bunk Calculator"]
  },
  sim: {
    title: "SGPA Simulator & Optimizer",
    category: "Grade Simulation",
    desc: "Runs 'what-if' deterministic simulations across internal marks, mid-sems, and end-sems. Highlights the exact subjects yielding the highest SGPA boost with the least effort.",
    badge: "Deterministic Math",
    color: "#22c55e",
    metrics: ["Target CGPA Solver", "Improvement Exam Planner", "Relative Curve Model"]
  },
  advisor: {
    title: "Neural Advisor & Assignment Coach",
    category: "Personalized Mentor",
    desc: "Context-aware AI tutor answering course code questions, reminding you of pending Google Classroom submissions, and creating biological study schedules.",
    badge: "24/7 Academic Mentor",
    color: "#38bdf8",
    metrics: ["Course Code Grounded", "Deadline Countdown", "Focus Integration"]
  }
};

export function ArchitectureFlow() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<string>("practice");

  // Column 1: Multi-Source Inputs
  const healthRef = useRef<HTMLDivElement>(null);
  const classroomRef = useRef<HTMLDivElement>(null);
  const gradesRef = useRef<HTMLDivElement>(null);
  const ocrRef = useRef<HTMLDivElement>(null);

  // Column 2: Data & Staging Layer
  const redisRef = useRef<HTMLDivElement>(null);
  const neonRef = useRef<HTMLDivElement>(null);
  const vectorRef = useRef<HTMLDivElement>(null);

  // Column 3: Central Nexus Orchestrator / Model Hub
  const colabRef = useRef<HTMLDivElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);
  const ggufRef = useRef<HTMLDivElement>(null);
  const geminiRef = useRef<HTMLDivElement>(null);

  // Column 4: Outputs, Prediction & Student Action
  const practiceRef = useRef<HTMLDivElement>(null);
  const absenceRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<HTMLDivElement>(null);
  const advisorRef = useRef<HTMLDivElement>(null);

  const activeDetail = NODE_DETAILS[selectedNode] || NODE_DETAILS.practice;

  return (
    <div className="w-full relative">
      {/* Scrollable Container on Mobile */}
      <div className="w-full relative overflow-x-auto pb-4 no-scrollbar">
        {/* Background radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(187,242,70,0.06),transparent_80%)] pointer-events-none" />

        {/* Main Flow Container */}
        <div
          ref={containerRef}
          className="relative flex w-full min-w-[760px] md:min-w-0 max-w-6xl mx-auto min-h-[620px] sm:min-h-[660px] items-center justify-between p-4 sm:p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-border dark:border-white/10 bg-card/60 dark:bg-[#0c0f17]/80 backdrop-blur-2xl shadow-2xl overflow-hidden transition-colors duration-300"
        >
          {/* Subtle grid pattern */}
          <div 
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
              backgroundSize: "28px 28px"
            }} 
          />

          {/* ========================================================================= */}
          {/* COLUMN 1: MULTI-MODAL DATA INPUTS (APPLE HEALTH, CLASSROOM, SAP, OCR)     */}
          {/* ========================================================================= */}
          <div className="flex flex-col justify-around h-full z-10 gap-4 sm:gap-6">
            <div className="text-left mb-1 pl-1">
              <span className="text-[10px] font-mono tracking-widest text-primary dark:text-[#bbf246] uppercase font-bold">
                01 • Ingestion
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-foreground dark:text-white">
                Data Streams
              </h4>
            </div>

            {/* Apple Health & Wearables */}
            <ArchitectureNode
              ref={healthRef}
              label="Apple Health"
              sublabel="Sleep & HRV"
              badge="HealthKit"
              badgeColor="#f43f5e"
              isActive={selectedNode === "health"}
              onClick={() => setSelectedNode("health")}
              icon={
                <div className="relative">
                  <HeartPulse className="size-5 sm:size-6 text-rose-500 animate-pulse" />
                  <span className="absolute -bottom-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                </div>
              }
            />

            {/* Google Classroom Integration */}
            <ArchitectureNode
              ref={classroomRef}
              label="Classroom"
              sublabel="Assignments & Notes"
              badge="Google"
              badgeColor="#3b82f6"
              isActive={selectedNode === "classroom"}
              onClick={() => setSelectedNode("classroom")}
              icon={<GraduationCap className="size-5 sm:size-6 text-blue-500" />}
            />

            {/* Academic Grade Ingestion (PyMuPDF) */}
            <ArchitectureNode
              ref={gradesRef}
              label="SAP Portal"
              sublabel="Grade Reports"
              badge="PDF"
              badgeColor="#38bdf8"
              isActive={selectedNode === "grades"}
              onClick={() => setSelectedNode("grades")}
              icon={<FileText className="size-5 sm:size-6 text-sky-400" />}
            />

            {/* PYQ Digitization & Cropping */}
            <ArchitectureNode
              ref={ocrRef}
              label="KIIT PYQs"
              sublabel="Exam Crops"
              badge="OCR"
              badgeColor="#bbf246"
              isActive={selectedNode === "ocr"}
              onClick={() => setSelectedNode("ocr")}
              icon={<ScanLine className="size-5 sm:size-6 text-[#bbf246]" />}
            />
          </div>

          {/* ========================================================================= */}
          {/* COLUMN 2: PERSISTENCE & VECTOR BUFFER (REDIS, NEON, VECTOR)             */}
          {/* ========================================================================= */}
          <div className="flex flex-col justify-around h-full z-10 gap-6 sm:gap-9">
            <div className="text-left mb-1 pl-1">
              <span className="text-[10px] font-mono tracking-widest text-primary dark:text-[#bbf246] uppercase font-bold">
                02 • Storage
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-foreground dark:text-white">
                Data Plane
              </h4>
            </div>

            {/* Upstash Redis Buffer */}
            <ArchitectureNode
              ref={redisRef}
              label="Upstash Redis"
              sublabel="Staging Buffer"
              badge="Sub-ms"
              badgeColor="#ef4444"
              isActive={selectedNode === "redis"}
              onClick={() => setSelectedNode("redis")}
              icon={<Zap className="size-5 sm:size-6 text-red-500" />}
            />

            {/* Neon Postgres Golden DB */}
            <ArchitectureNode
              ref={neonRef}
              label="Neon Postgres"
              sublabel="Prisma ORM"
              badge="Golden"
              badgeColor="#22c55e"
              isActive={selectedNode === "neon"}
              onClick={() => setSelectedNode("neon")}
              icon={<Database className="size-5 sm:size-6 text-emerald-400" />}
            />

            {/* Upstash Vector KIIT RAG & Notes */}
            <ArchitectureNode
              ref={vectorRef}
              label="Vector Notes"
              sublabel="Syllabus Index"
              badge="1536-D"
              badgeColor="#06b6d4"
              isActive={selectedNode === "vector"}
              onClick={() => setSelectedNode("vector")}
              icon={<Network className="size-5 sm:size-6 text-cyan-400" />}
            />
          </div>

          {/* ========================================================================= */}
          {/* COLUMN 3: CENTRAL BRAIN, MODEL ROUTER & FINE-TUNING PIPELINE             */}
          {/* ========================================================================= */}
          <div className="flex flex-col justify-around h-full z-10 gap-4 sm:gap-6 items-center">
            <div className="text-center mb-1">
              <span className="text-[10px] font-mono tracking-widest text-primary dark:text-[#bbf246] uppercase font-bold">
                03 • AI Engine
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-foreground dark:text-white">
                Model Router
              </h4>
            </div>

            {/* Colab / Subject Fine-Tuning Pipeline */}
            <ArchitectureNode
              ref={colabRef}
              label="Fine-Tuning"
              sublabel="Per-Course QLoRA"
              badge="Unsloth"
              badgeColor="#f59e0b"
              isActive={selectedNode === "colab"}
              onClick={() => setSelectedNode("colab")}
              icon={<Sliders className="size-5 sm:size-6 text-amber-400" />}
            />

            {/* CENTRAL NEXUS / KAIZEN HUB */}
            <div className="relative group">
              <div
                ref={hubRef}
                className={cn(
                  "relative z-20 flex size-14 sm:size-18 md:size-20 items-center justify-center rounded-2xl md:rounded-[1.75rem] border-2 bg-background dark:bg-[#070913] p-2.5 shadow-2xl transition-all duration-500 group-hover:scale-105 cursor-pointer",
                  selectedNode === "hub"
                    ? "border-primary dark:border-[#bbf246] shadow-[0_0_35px_rgba(187,242,70,0.4)] ring-2 ring-primary/30"
                    : "border-primary/80 dark:border-[#bbf246]/80 shadow-[0_0_25px_rgba(187,242,70,0.25)]"
                )}
                onClick={() => setSelectedNode("hub")}
              >
                <div className="absolute inset-0 rounded-2xl md:rounded-[1.75rem] bg-gradient-to-tr from-primary/20 via-transparent to-[#bbf246]/20 animate-pulse" />
                <div className="relative flex flex-col items-center">
                  <div className="relative size-8 sm:size-10 md:size-11 overflow-hidden rounded-xl border border-white/20 shadow-md mb-1 bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/logo/kaizen-logo.png"
                      alt="Kaizen Core"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[8px] sm:text-[9px] font-mono font-bold text-primary dark:text-[#bbf246] tracking-tighter">
                    KAIZEN CORE
                  </span>
                </div>
              </div>
              <div className="mt-1.5 text-center pointer-events-none">
                <span className="block text-xs sm:text-sm font-extrabold text-foreground dark:text-white leading-tight">
                  Model Router
                </span>
                <span className="block text-[8px] sm:text-[9px] font-mono text-muted-foreground dark:text-zinc-400">
                  Light • Med • Heavy
                </span>
              </div>
            </div>

            {/* In-House GGUF (Kaizen-Tutor 3B) */}
            <ArchitectureNode
              ref={ggufRef}
              label="In-House 3B"
              sublabel="Q4_K_M GGUF"
              badge="Local"
              badgeColor="#bbf246"
              isActive={selectedNode === "gguf"}
              onClick={() => setSelectedNode("gguf")}
              icon={<Cpu className="size-5 sm:size-6 text-[#bbf246]" />}
            />

            {/* Google Gemini 3 Flash */}
            <ArchitectureNode
              ref={geminiRef}
              label="Gemini 3 Flash"
              sublabel="Vision & Math"
              badge="Cloud"
              badgeColor="#818cf8"
              isActive={selectedNode === "gemini"}
              onClick={() => setSelectedNode("gemini")}
              icon={<Sparkles className="size-5 sm:size-6 text-indigo-400" />}
            />
          </div>

          {/* ========================================================================= */}
          {/* COLUMN 4: STUDENT IMPACT, ADAPTIVE TESTING & PREDICTIONS                  */}
          {/* ========================================================================= */}
          <div className="flex flex-col justify-around h-full z-10 gap-4 sm:gap-6">
            <div className="text-right mb-1 pr-1">
              <span className="text-[10px] font-mono tracking-widest text-primary dark:text-[#bbf246] uppercase font-bold">
                04 • Output
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-foreground dark:text-white">
                Student Actions
              </h4>
            </div>

            {/* PYQ Practice & Weak Topic Identification */}
            <ArchitectureNode
              ref={practiceRef}
              label="PYQ Practice"
              sublabel="Weak Topic Drills"
              badge="Adaptive"
              badgeColor="#bbf246"
              isActive={selectedNode === "practice"}
              onClick={() => setSelectedNode("practice")}
              icon={<Target className="size-5 sm:size-6 text-[#bbf246]" />}
            />

            {/* Sleep Schedule & Class Absence Predictor */}
            <ArchitectureNode
              ref={absenceRef}
              label="Absence Guard"
              sublabel="Sleep Debt Risk"
              badge="75% Rule"
              badgeColor="#f43f5e"
              isActive={selectedNode === "absence"}
              onClick={() => setSelectedNode("absence")}
              icon={<AlarmClock className="size-5 sm:size-6 text-rose-500" />}
            />

            {/* SGPA & Grade Forecast Simulator */}
            <ArchitectureNode
              ref={simRef}
              label="SGPA Simulator"
              sublabel="Risk Analysis"
              badge="Dynamic"
              badgeColor="#22c55e"
              isActive={selectedNode === "sim"}
              onClick={() => setSelectedNode("sim")}
              icon={<TrendingUp className="size-5 sm:size-6 text-emerald-400" />}
            />

            {/* Neural Advisor & Classroom Deadlines */}
            <ArchitectureNode
              ref={advisorRef}
              label="Neural Advisor"
              sublabel="24/7 Notes Coach"
              badge="Tutor"
              badgeColor="#38bdf8"
              isActive={selectedNode === "advisor"}
              onClick={() => setSelectedNode("advisor")}
              icon={<BookOpen className="size-5 sm:size-6 text-sky-400" />}
            />
          </div>

          {/* ========================================================================= */}
          {/* ANIMATED BEAMS — CONNECTING THE WHOLE ARCHITECTURAL ECOSYSTEM             */}
          {/* ========================================================================= */}

          {/* Inputs -> Staging Layer */}
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={healthRef}
            toRef={redisRef}
            duration={3.2}
            gradientStartColor="#f43f5e"
            gradientStopColor="#ef4444"
            curvature={-35}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={classroomRef}
            toRef={neonRef}
            duration={3.4}
            gradientStartColor="#3b82f6"
            gradientStopColor="#22c55e"
            curvature={-15}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={gradesRef}
            toRef={neonRef}
            duration={3.0}
            gradientStartColor="#38bdf8"
            gradientStopColor="#22c55e"
            curvature={10}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={ocrRef}
            toRef={vectorRef}
            duration={3.2}
            gradientStartColor="#bbf246"
            gradientStopColor="#06b6d4"
            curvature={35}
          />

          {/* Data Layer -> Central Hub */}
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={redisRef}
            toRef={hubRef}
            duration={3.2}
            gradientStartColor="#ef4444"
            gradientStopColor="#bbf246"
            curvature={-30}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={neonRef}
            toRef={hubRef}
            duration={2.8}
            gradientStartColor="#22c55e"
            gradientStopColor="#bbf246"
            curvature={0}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={vectorRef}
            toRef={hubRef}
            duration={3.4}
            gradientStartColor="#06b6d4"
            gradientStopColor="#bbf246"
            curvature={30}
          />

          {/* Fine-Tuning -> Hub (Bi-directional model adaptation) */}
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={colabRef}
            toRef={hubRef}
            duration={4.0}
            gradientStartColor="#f59e0b"
            gradientStopColor="#bbf246"
            curvature={-20}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={hubRef}
            toRef={ggufRef}
            duration={3.2}
            gradientStartColor="#bbf246"
            gradientStopColor="#a3e635"
            curvature={15}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={hubRef}
            toRef={geminiRef}
            duration={3.0}
            gradientStartColor="#bbf246"
            gradientStopColor="#818cf8"
            curvature={35}
          />

          {/* Central Hub -> Outputs */}
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={hubRef}
            toRef={practiceRef}
            duration={2.8}
            gradientStartColor="#bbf246"
            gradientStopColor="#bbf246"
            curvature={-35}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={hubRef}
            toRef={absenceRef}
            duration={3.2}
            gradientStartColor="#bbf246"
            gradientStopColor="#f43f5e"
            curvature={-10}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={hubRef}
            toRef={simRef}
            duration={3.0}
            gradientStartColor="#bbf246"
            gradientStopColor="#22c55e"
            curvature={15}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={hubRef}
            toRef={advisorRef}
            duration={3.4}
            gradientStartColor="#bbf246"
            gradientStopColor="#38bdf8"
            curvature={35}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE FEATURE INSPECTOR PANEL                                       */}
      {/* ========================================================================= */}
      <div className="mt-8 max-w-5xl mx-auto rounded-3xl border border-border dark:border-white/10 bg-card/70 dark:bg-[#0f1322]/80 backdrop-blur-xl p-5 sm:p-6 md:p-7 shadow-xl transition-all duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-border dark:border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span 
                className="w-2.5 h-2.5 rounded-full animate-pulse"
                style={{ backgroundColor: activeDetail.color }} 
              />
              <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-muted-foreground">
                {activeDetail.category}
              </span>
              <span className="text-zinc-400 dark:text-zinc-600">•</span>
              <span 
                className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border"
                style={{
                  color: activeDetail.color,
                  backgroundColor: `${activeDetail.color}15`,
                  borderColor: `${activeDetail.color}40`
                }}
              >
                {activeDetail.badge}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground dark:text-white tracking-tight flex items-center gap-2.5">
              {selectedNode === "hub" ? (
                <img src="/logo/kaizen-logo.png" alt="Kaizen" className="size-6 rounded-lg object-cover border border-white/20" />
              ) : null}
              <span>{activeDetail.title}</span>
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeDetail.metrics.map((m, i) => (
              <span 
                key={i} 
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono border border-border dark:border-white/10 bg-background/80 dark:bg-white/5 text-foreground dark:text-zinc-200"
              >
                <CheckCircle2 size={12} className="text-primary dark:text-[#bbf246]" />
                {m}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-muted-foreground dark:text-zinc-300 leading-relaxed">
          <p className="max-w-3xl">
            {activeDetail.desc}
          </p>
          <div className="shrink-0 flex items-center gap-1.5 text-xs font-mono text-primary dark:text-[#bbf246]">
            <span>Click any node above to inspect pipeline</span>
            <ArrowRight size={13} />
          </div>
        </div>
      </div>
    </div>
  );
}
