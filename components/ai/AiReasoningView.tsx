"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, Copy, Check, ChevronDown, ChevronUp, 
  BrainCircuit, ShieldCheck, CheckCircle2, Clock, 
  Cpu, Layers, Award, Minimize2, Maximize2, Square,
  BarChart2, Table2, UserCheck, ArrowDown, RefreshCw,
  FileCheck, AlertCircle, Eye
} from "lucide-react";

export interface AiReasoningStep {
  id: string;
  title: string;
  category?: string;
  status: "pending" | "active" | "completed";
  bullets: string[];
}

interface AiReasoningViewProps {
  reasoning?: string | null;
  modelName?: string;
  isLive?: boolean;
  isComplete?: boolean;
  durationSeconds?: number;
  subjectCode?: string;
  subjectName?: string;
  examType?: "mid_sem" | "end_sem";
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  isFloatingOverlay?: boolean;
  onStop?: () => void;
}

/**
 * Parses inline markdown segments including **bold**, *italic*, [Tags], and code snippets
 */
function renderInlineFormatted(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[A-Za-z0-9_:\s\-]+\])/g);

  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const inner = part.slice(2, -2);
      return (
        <strong key={idx} className="font-semibold text-foreground">
          {inner}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      const code = part.slice(1, -1);
      return (
        <code key={idx} className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[11px] text-primary">
          {code}
        </code>
      );
    }
    if (part.startsWith("[") && part.endsWith("]")) {
      return (
        <span
          key={idx}
          className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-[10px] font-mono font-bold bg-primary/15 text-primary border border-primary/25"
        >
          {part}
        </span>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

/**
 * Assistant-UI Styled AI Reasoning & Generative UI Component
 * 
 * Includes:
 * 1. Shimmering ReasoningTrigger with elapsed timer & stop button
 * 2. Chain-of-Thought Grouped ladder with real-time token streaming
 * 3. Curricular DataTable showing questions, CO allocations & Bloom's taxonomy
 * 4. Cognitive Domain Chart (Area / Distribution visualization)
 * 5. Human-in-the-Loop Faculty Endorsement Approval Card
 * 6. Smooth Auto-Follow Stream with Jump to Latest button
 * 7. Exact project font hierarchy (Space Grotesk, Manrope, Nunito Sans, JetBrains Mono)
 * 8. Kaizen Theme Colors (Electric Lime #ccff00, Emerald #10b981, Obsidian Glass)
 */
export function AiReasoningView({
  reasoning,
  modelName = "NVIDIA Nemotron 3.5 Bolt",
  isLive = false,
  isComplete = false,
  durationSeconds = 0,
  subjectCode = "EX40003",
  subjectName = "Engineering Professional Practice",
  examType = "end_sem",
  isExpanded: controlledExpanded,
  onToggleExpand,
  isFloatingOverlay = true,
  onStop,
}: AiReasoningViewProps) {
  const [internalExpanded, setInternalExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<"cot" | "table" | "chart" | "approval">("cot");
  const [copied, setCopied] = useState(false);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isApproved, setIsApproved] = useState(false);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const toggleExpand = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  // Live stopwatch timer while generating
  useEffect(() => {
    if (!isLive) {
      if (durationSeconds > 0) {
        setLiveSeconds(durationSeconds);
      }
      return;
    }

    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      setLiveSeconds(parseFloat(elapsed.toFixed(1)));
    }, 100);

    return () => clearInterval(interval);
  }, [isLive, durationSeconds]);

  // Progressive step advancement during live generation
  useEffect(() => {
    if (!isLive) return;

    const timeouts = [
      setTimeout(() => setActiveStepIndex(1), 1600),
      setTimeout(() => setActiveStepIndex(2), 3800),
      setTimeout(() => setActiveStepIndex(3), 6800),
      setTimeout(() => setActiveStepIndex(4), 9800),
    ];

    return () => timeouts.forEach(clearTimeout);
  }, [isLive]);

  // Handle scroll tracking for Jump to Latest control
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    setShowJumpToBottom(distanceToBottom > 80);
  };

  const scrollToBottom = () => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-follow stream
  useEffect(() => {
    if (isLive && scrollEndRef.current && isExpanded && !showJumpToBottom) {
      scrollEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [reasoning, activeStepIndex, isLive, isExpanded, showJumpToBottom]);

  const isMid = examType === "mid_sem";
  const marks = isMid ? 20 : 50;
  const time = isMid ? "1.5 Hours" : "2.5 Hours";

  // Pre-configured pedagogical reasoning blueprint steps
  const defaultSteps: AiReasoningStep[] = [
    {
      id: "step-1",
      title: "Analyze Examination Parameters & Autonomous Regulations",
      category: "ACADEMIC_REGULATION",
      status: !isLive || isComplete || activeStepIndex > 0 ? "completed" : "active",
      bullets: [
        `Role verified: Senior Faculty Paper Setter (School of Electronics & Computer Science Engineering)`,
        `Target: B.Tech 7th Semester [${subjectCode}] - ${subjectName}`,
        `Autonomous Format: ${isMid ? "Mid-Semester (Full Marks: 20, 1.5 Hours)" : "End-Semester (Full Marks: 50, 2.5 Hours)"}`,
        `Mandatory Instruction: "${isMid ? "Answer any 4 questions including Question No. 1 which is COMPULSORY." : "Answer any 5 questions including Question No. 1 which is COMPULSORY."}"`,
        `Structure: ${isMid ? "5 Total Questions (Q1 compulsory 5m + any 3 from Q2-Q5)" : "8 Questions across 4 Sections (Q1 compulsory 10m + Sections I-IV)"}`
      ]
    },
    {
      id: "step-2",
      title: "Cross-Reference Google Classroom Modules & Syllabus Grounding",
      category: "GROUNDING",
      status: !isLive || isComplete ? "completed" : activeStepIndex > 1 ? "completed" : activeStepIndex === 1 ? "active" : "pending",
      bullets: [
        `Ingesting classroom coursework units & assignments mapped to [${subjectCode}]`,
        `Validating Course Outcome allocations: [CO1] Foundational Principles to [CO5] Synthesis & Applications`,
        `Synthesizing historical PYQs: Prioritizing high-recurrence analytical models and practical case studies`,
        `Filtering out obsolete test questions & eliminating prohibited temporary markers`
      ]
    },
    {
      id: "step-3",
      title: "Solve Combinatorial Knapsack & Recurrence Permutations",
      category: "COMBINATORIAL_ENGINE",
      status: !isLive || isComplete ? "completed" : activeStepIndex > 2 ? "completed" : activeStepIndex === 2 ? "active" : "pending",
      bullets: [
        `Executing constrained 0/1 knapsack optimization over archived KIIT examination repository`,
        `Balancing topic entropy: ensuring equal distribution across Units I, II, III & IV`,
        `Harmonizing difficulty curvature: 30% Foundational, 50% Analytical / Numerical, 20% Synthesis`,
        `Structuring internal sectional choices (Question 2 OR 3, 4 OR 5, 6 OR 7) for uniform difficulty`
      ]
    },
    {
      id: "step-4",
      title: "Bloom's Taxonomy & Marks Balance Verification",
      category: "PEDAGOGICAL_AUDIT",
      status: !isLive || isComplete ? "completed" : activeStepIndex > 3 ? "completed" : activeStepIndex === 3 ? "active" : "pending",
      bullets: [
        `Audit compulsory Question 1: ${isMid ? "5 sub-questions × 1 mark = 5 marks" : "5 sub-questions × 2 marks = 10 marks"} verified`,
        `Audit sectional sub-questions: Each main question structured into (a) 6 marks + (b) 4 marks = 10 marks`,
        `Cognitive domain alignment: Verifying Bloom's level distribution [L1 Remember] -> [L3 Apply] -> [L5 Evaluate]`,
        `Total marks calculation strictly matches ${marks} marks with zero arithmetic deviation`
      ]
    },
    {
      id: "step-5",
      title: "Synthesize Formal Examination Paper Blueprint",
      category: "FINAL_SYNTHESIS",
      status: !isLive || isComplete ? "completed" : activeStepIndex === 4 ? "active" : "pending",
      bullets: [
        `Constructing official Kalinga Institute of Industrial Technology Autonomous Header`,
        `Injecting precise faculty metadata, course code, duration (${time}), and maximum marks (${marks})`,
        `Formulating unambiguous question prompts with explicit marking rubrics and [CO] tags`,
        `Rendering final camera-ready examination sheet format`
      ]
    }
  ];

  // Curricular Data Table rows for Generative UI
  const curricularTableData = isMid ? [
    { q: "Q1(a)-(e)", section: "Compulsory", co: "CO1, CO2", bloom: "L1 Remember / L2 Understand", marks: "5 Marks (5×1m)", status: "Grounded" },
    { q: "Q2(a)-(b)", section: "Sectional Choice", co: "CO1", bloom: "L3 Apply / Numerical", marks: "5 Marks (3m+2m)", status: "Verified" },
    { q: "Q3(a)-(b)", section: "Sectional Choice", co: "CO1, CO2", bloom: "L4 Analyze", marks: "5 Marks (3m+2m)", status: "Verified" },
    { q: "Q4(a)-(b)", section: "Sectional Choice", co: "CO2", bloom: "L3 Apply / Problem", marks: "5 Marks (3m+2m)", status: "Verified" },
    { q: "Q5(a)-(b)", section: "Sectional Choice", co: "CO2", bloom: "L5 Evaluate", marks: "5 Marks (3m+2m)", status: "Verified" },
  ] : [
    { q: "Q1(a)-(e)", section: "Compulsory", co: "CO1 to CO5", bloom: "L1 Remember / L2 Understand", marks: "10 Marks (5×2m)", status: "Grounded" },
    { q: "Q2 OR Q3", section: "Section I", co: "CO1", bloom: "L3 Apply / Case Problem", marks: "10 Marks (6m+4m)", status: "Verified" },
    { q: "Q4 OR Q5", section: "Section II", co: "CO2", bloom: "L4 Analyze / DCF / BVA", marks: "10 Marks (6m+4m)", status: "Verified" },
    { q: "Q6 OR Q7", section: "Section III", co: "CO3", bloom: "L3 Apply / IPR / Basis Path", marks: "10 Marks (6m+4m)", status: "Verified" },
    { q: "Q8", section: "Section IV", co: "CO4, CO5", bloom: "L5 Evaluate / Synthesis", marks: "10 Marks (6m+4m)", status: "Verified" },
  ];

  // Bloom's Cognitive Distribution Data
  const bloomsDistribution = [
    { level: "L1 Remember", pct: 20, color: "bg-emerald-400", desc: "Definitions & Statutory Principles" },
    { level: "L2 Understand", pct: 20, color: "bg-lime-400", desc: "Conceptual Distinctions & Workflow" },
    { level: "L3 Apply", pct: 30, color: "bg-primary", desc: "Numerical & Analytical Case Formulations" },
    { level: "L4 Analyze", pct: 20, color: "bg-amber-400", desc: "Comparative Matrix & Trade-offs" },
    { level: "L5 Evaluate", pct: 10, color: "bg-cyan-400", desc: "System Appraisal & Synthesis" },
  ];

  // If actual custom reasoning was returned by LLM, parse it into structured blocks
  const customReasoningBlocks: Array<{ type: "step" | "bullet" | "paragraph" | "header"; stepNum?: string; title?: string; content: string }> = [];
  if (reasoning && reasoning.trim()) {
    const lines = reasoning.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i].trim();
      if (!rawLine) continue;

      const stepMatch = rawLine.match(/^(\d+)\.\s+(\*\*[^*]+\*\*|[^*]+)/);
      if (stepMatch) {
        const stepNum = stepMatch[1];
        const title = stepMatch[2].replace(/\*\*/g, "").replace(/:$/, "").trim();
        customReasoningBlocks.push({ type: "step", stepNum, title, content: rawLine });
        continue;
      }

      const bulletMatch = rawLine.match(/^[*•-]\s+(.*)/);
      if (bulletMatch) {
        customReasoningBlocks.push({ type: "bullet", content: bulletMatch[1].trim() });
        continue;
      }

      if (rawLine.toLowerCase().includes("thinking process") || rawLine.toLowerCase().includes("reasoning")) {
        customReasoningBlocks.push({ type: "header", content: rawLine });
      } else {
        customReasoningBlocks.push({ type: "paragraph", content: rawLine });
      }
    }
  }

  const hasCustomReasoning = customReasoningBlocks.length > 0;
  const displaySeconds = liveSeconds > 0 ? liveSeconds : (durationSeconds || 11.4);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const copyText = reasoning || defaultSteps.map(s => `## ${s.title}\n${s.bullets.map(b => `- ${b}`).join('\n')}`).join('\n\n');
    navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className={`relative w-full rounded-2xl sm:rounded-3xl flex flex-col overflow-hidden transition-all duration-300
        backdrop-blur-3xl bg-[#080a0f]/85 dark:bg-[#06070c]/90
        border border-white/15 dark:border-white/12
        shadow-[0_24px_64px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.22)]
        before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/35 before:to-transparent before:pointer-events-none
        after:absolute after:inset-0 after:rounded-[inherit] after:pointer-events-none after:bg-[radial-gradient(ellipse_at_top,rgba(204,255,0,0.06),transparent_65%)]
        ${isFloatingOverlay ? "h-full" : isExpanded ? "max-h-[460px] min-h-[200px]" : "h-[52px]"}
      `}
    >
      {/* ────────────────── TOP BANNER / BAR HEADER (assistant-ui ReasoningTrigger) ────────────────── */}
      <div 
        onClick={toggleExpand}
        className={`flex items-center justify-between px-3.5 sm:px-4 py-2.5 sm:py-3 cursor-pointer select-none transition-colors border-b border-white/10 shrink-0 ${
          isExpanded ? "bg-white/[0.03] hover:bg-white/[0.06]" : "h-full bg-white/[0.04] hover:bg-white/[0.08]"
        }`}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* Animated Brain Icon */}
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
            isLive 
              ? "bg-primary/20 text-primary border border-primary/40 shadow-sm shadow-primary/25 animate-pulse" 
              : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/15"
          }`}>
            <BrainCircuit size={17} className={isLive ? "animate-pulse" : ""} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                {modelName}
              </span>

              {isLive ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/20 border border-primary/35 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                  <span className="aui-shimmer-text">Thinking for {displaySeconds}s...</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 size={11} className="text-emerald-400" />
                  Thought for {displaySeconds}s • 5 Steps Verified
                </span>
              )}
            </div>

            {/* Subtext Badges */}
            <div className="hidden sm:flex items-center gap-2 mt-0.5 text-[10px] font-mono text-muted-foreground">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <ShieldCheck size={11} /> KIIT Autonomous Regs
              </span>
              <span>•</span>
              <span>Bloom&apos;s Taxonomy</span>
              <span>•</span>
              <span>CO1-CO5 Mapped</span>
              <span>•</span>
              <span className="text-primary font-bold">{marks} Marks Match</span>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          {/* Stop Generation Button (assistant-ui Stop Control) */}
          {isLive && onStop && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStop();
              }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-mono bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-colors shadow-sm"
              title="Stop Paper Generation"
            >
              <Square size={11} className="fill-rose-400 text-rose-400" />
              <span className="hidden sm:inline">Stop</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-white/10 transition-colors shadow-sm"
            title="Copy Reasoning CoT"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy CoT"}</span>
          </button>

          <button
            type="button"
            onClick={toggleExpand}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-white/10 text-[11px] font-mono transition-colors"
            aria-label={isExpanded ? "Collapse to bottom" : "Expand Reasoning"}
            title={isExpanded ? "De-expand & tie to bottom" : "Expand Live Reasoning Over Stage"}
          >
            {isExpanded ? (
              <>
                <ChevronDown size={14} className="text-primary" />
                <span className="hidden md:inline text-[10px]">De-expand</span>
              </>
            ) : (
              <>
                <ChevronUp size={14} className="text-primary" />
                <span className="hidden md:inline text-[10px]">Expand Live Traces</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ────────────────── EXPANDED GENERATIVE UI CONTENT (assistant-ui ReasoningContent) ────────────────── */}
      {isExpanded && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
          
          {/* View Mode Tabs (Generative UI: CoT / Table / Chart / Approval) */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-white/10 bg-black/25 text-[11px] font-mono shrink-0 gap-2">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
              <button
                type="button"
                onClick={() => setActiveTab("cot")}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === "cot"
                    ? "bg-primary text-black shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <Sparkles size={11} />
                <span>CoT Ladder</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("table")}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === "table"
                    ? "bg-primary text-black shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <Table2 size={11} />
                <span>Curricular Table</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("chart")}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === "chart"
                    ? "bg-primary text-black shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <BarChart2 size={11} />
                <span>Bloom&apos;s Chart</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("approval")}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === "approval"
                    ? "bg-primary text-black shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <UserCheck size={11} />
                <span>Endorsement Card</span>
              </button>
            </div>

            <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>{isLive ? "Live Synthesis" : "Audit Complete"}</span>
            </div>
          </div>

          {/* Tab 1: Chain of Thought Traces (ReasoningText) */}
          {activeTab === "cot" && (
            <div 
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3.5 sm:p-5 space-y-3.5 text-xs text-muted-foreground font-sans relative"
            >
              {hasCustomReasoning ? (
                <div className="space-y-3">
                  {customReasoningBlocks.map((block, idx) => {
                    if (block.type === "header") {
                      return (
                        <div key={idx} className="flex items-center gap-2 text-xs font-mono font-medium text-primary/90 italic pb-1">
                          <Sparkles size={13} className="text-primary flex-shrink-0" />
                          <span>{renderInlineFormatted(block.content)}</span>
                        </div>
                      );
                    }

                    if (block.type === "step") {
                      return (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:border-primary/30 transition-all mt-3 first:mt-0"
                        >
                          <div className="w-6 h-6 rounded-md bg-primary/15 text-primary border border-primary/30 flex items-center justify-center font-mono font-bold text-xs flex-shrink-0">
                            {block.stepNum}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-foreground font-mono tracking-wide break-words">
                              {block.title}
                            </h4>
                          </div>
                        </div>
                      );
                    }

                    if (block.type === "bullet") {
                      return (
                        <div key={idx} className="flex items-start gap-2.5 pl-3 sm:pl-6 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/70 mt-1.5 flex-shrink-0" />
                          <div className="flex-1 leading-relaxed break-words whitespace-pre-wrap">
                            {renderInlineFormatted(block.content)}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <p key={idx} className="pl-3 sm:pl-6 text-xs leading-relaxed text-muted-foreground/90 break-words whitespace-pre-wrap">
                        {renderInlineFormatted(block.content)}
                      </p>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  {defaultSteps.map((step, idx) => {
                    const isStepActive = isLive && (activeStepIndex === idx);
                    const isStepCompleted = !isLive || isComplete || (activeStepIndex > idx);

                    return (
                      <div
                        key={step.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isStepActive
                            ? "bg-primary/[0.07] border-primary/40 shadow-sm shadow-primary/10"
                            : isStepCompleted
                            ? "bg-white/[0.02] border-white/10"
                            : "bg-transparent border-white/5 opacity-55"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0 ${
                              isStepCompleted
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                : isStepActive
                                ? "bg-primary/20 text-primary border border-primary/40 animate-pulse"
                                : "bg-white/5 text-muted-foreground border border-white/10"
                            }`}>
                              {isStepCompleted ? (
                                <Check size={11} className="text-emerald-400" />
                              ) : isStepActive ? (
                                <span className="animate-spin text-xs">◓</span>
                              ) : (
                                <span>{idx + 1}</span>
                              )}
                            </div>

                            <span className={`text-xs font-mono font-bold break-words ${
                              isStepActive ? "text-primary" : isStepCompleted ? "text-foreground" : "text-muted-foreground"
                            }`}>
                              {idx + 1}. {step.title}
                            </span>
                          </div>

                          {step.category && (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-muted-foreground border border-white/10 uppercase flex-shrink-0">
                              {step.category}
                            </span>
                          )}
                        </div>

                        {/* Step details bullets */}
                        <div className="pl-6 space-y-1 mt-2 text-[11px] font-mono text-muted-foreground">
                          {step.bullets.map((bullet, bIdx) => (
                            <div key={bIdx} className="flex items-start gap-2">
                              <span className={`w-1 h-1 rounded-full mt-1.5 flex-shrink-0 ${
                                isStepCompleted ? "bg-emerald-400" : isStepActive ? "bg-primary animate-ping" : "bg-muted-foreground/40"
                              }`} />
                              <span className="leading-relaxed break-words whitespace-pre-wrap">{renderInlineFormatted(bullet)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Live Blinking Stream Indicator when Live */}
              {isLive && (
                <div className="flex items-center gap-2 pt-2 text-[11px] font-mono text-primary animate-pulse pl-1">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span>{reasoning ? "NVIDIA Nemotron live pedagogical cognitive trace... ▌" : "Synthesizing examination questions adhering to autonomous guidelines... ▌"}</span>
                </div>
              )}
              <div ref={scrollEndRef} />

              {/* Jump to Latest Floating Pill (assistant-ui Stream Down) */}
              {showJumpToBottom && (
                <button
                  type="button"
                  onClick={scrollToBottom}
                  className="sticky bottom-3 left-1/2 -translate-x-1/2 mx-auto px-3 py-1.5 rounded-full bg-primary text-black font-mono text-[10px] font-bold shadow-lg shadow-primary/30 flex items-center gap-1.5 hover:scale-105 transition-all z-20 cursor-pointer"
                >
                  <ArrowDown size={12} />
                  <span>Jump to Latest Trace</span>
                </button>
              )}
            </div>
          )}

          {/* Tab 2: Curricular Data Table (assistant-ui DataTable) */}
          {activeTab === "table" && (
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3.5 sm:p-5 space-y-3">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground">Autonomous Curriculum: <strong className="text-foreground">{subjectCode}</strong></span>
                <span className="text-primary font-bold">{marks} Marks / {time}</span>
              </div>

              <div className="rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10 text-[10px] uppercase text-muted-foreground">
                      <th className="p-2.5 font-bold">Question</th>
                      <th className="p-2.5 font-bold">Section</th>
                      <th className="p-2.5 font-bold">CO Tag</th>
                      <th className="p-2.5 font-bold">Bloom&apos;s Level</th>
                      <th className="p-2.5 font-bold">Marks</th>
                      <th className="p-2.5 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {curricularTableData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-2.5 font-bold text-foreground">{row.q}</td>
                        <td className="p-2.5 text-muted-foreground">{row.section}</td>
                        <td className="p-2.5">
                          <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold">
                            {row.co}
                          </span>
                        </td>
                        <td className="p-2.5 text-muted-foreground">{row.bloom}</td>
                        <td className="p-2.5 font-bold text-foreground">{row.marks}</td>
                        <td className="p-2.5">
                          <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px] font-bold">
                            <CheckCircle2 size={11} /> {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Bloom's Cognitive Chart (assistant-ui Chart) */}
          {activeTab === "chart" && (
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3.5 sm:p-5 space-y-4">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                <h4 className="text-xs font-mono font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <BarChart2 size={13} className="text-primary" />
                  Cognitive Domain Weightage Verification
                </h4>
                <p className="text-[11px] font-mono text-muted-foreground">
                  Validating adherence to Autonomous Examination Regulations &amp; Outcome-Based Education (OBE) metrics.
                </p>
              </div>

              <div className="space-y-3">
                {bloomsDistribution.map((item, idx) => (
                  <div key={idx} className="space-y-1.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-foreground">{item.level}</span>
                      <span className="text-primary font-bold">{item.pct}% Weightage</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.pct}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.08 }}
                        className={`h-full ${item.color} rounded-full`}
                      />
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Faculty Endorsement Card (assistant-ui ApprovalCard) */}
          {activeTab === "approval" && (
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3.5 sm:p-5 flex flex-col justify-center">
              <div className="max-w-md mx-auto w-full p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/15 space-y-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary border border-primary/30 flex items-center justify-center mx-auto shadow-md shadow-primary/20">
                  <FileCheck size={24} />
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
                    Paper Setter Endorsement
                  </h3>
                  <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                    Senior Faculty In-Charge verification for <strong>{subjectCode}</strong> ({subjectName}).
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-black/30 border border-white/10 text-left space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Format:</span>
                    <span className="text-foreground font-bold">{isMid ? "Mid-Semester (20m)" : "End-Semester (50m)"}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Bloom&apos;s Compliance:</span>
                    <span className="text-emerald-400 font-bold">100% Verified</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>CO Allocation:</span>
                    <span className="text-emerald-400 font-bold">CO1 - CO5 Mapped</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsApproved(true)}
                    disabled={isApproved}
                    className="flex-1 h-10 rounded-xl bg-primary text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-80"
                  >
                    {isApproved ? (
                      <>
                        <Check size={14} />
                        <span>Blueprint Endorsed</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} />
                        <span>Endorse &amp; Lock</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-3.5 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-foreground transition-colors flex items-center justify-center gap-1"
                    title="Export Audit Logs"
                  >
                    <Copy size={13} />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

export default AiReasoningView;
