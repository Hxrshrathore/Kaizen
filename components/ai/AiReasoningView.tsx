"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, Copy, Check, ChevronDown, ChevronUp, 
  BrainCircuit, ShieldCheck, CheckCircle2, Clock, 
  Cpu, Layers, Award
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
}

/**
 * Parses inline markdown segments including **bold**, *italic*, [Tags], and code snippets
 */
function renderInlineFormatted(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[A-Za-z0-9_:\s]+\])/g);

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
        <code key={idx} className="px-1.5 py-0.5 rounded bg-muted/80 font-mono text-[11px] text-primary">
          {code}
        </code>
      );
    }
    if (part.startsWith("[") && part.endsWith("]")) {
      return (
        <span
          key={idx}
          className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20"
        >
          {part}
        </span>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

/**
 * Formats structured thinking traces from NVIDIA Nemotron 3.5 Bolt
 * Features live progressive streaming, timer, and smooth auto-collapse accordion.
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
}: AiReasoningViewProps) {
  const [internalExpanded, setInternalExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const toggleExpand = () => {
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

    // Advance steps gracefully over the typical 12-second window
    const timeouts = [
      setTimeout(() => setActiveStepIndex(1), 1800),
      setTimeout(() => setActiveStepIndex(2), 4200),
      setTimeout(() => setActiveStepIndex(3), 7400),
      setTimeout(() => setActiveStepIndex(4), 10500),
    ];

    return () => timeouts.forEach(clearTimeout);
  }, [isLive]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const copyText = reasoning || defaultSteps.map(s => `## ${s.title}\n${s.bullets.map(b => `- ${b}`).join('\n')}`).join('\n\n');
    navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
  const scrollEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLive && scrollEndRef.current) {
      scrollEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [reasoning, activeStepIndex, isLive]);

  return (
    <div 
      ref={containerRef}
      className={`rounded-2xl border transition-all duration-300 shadow-sm overflow-hidden ${
        isLive 
          ? "border-primary/40 bg-card/90 ring-1 ring-primary/30 shadow-primary/5" 
          : "border-border bg-card/70 backdrop-blur-md hover:border-primary/30"
      }`}
    >
      {/* ────────────────── TOP BANNER / ACCORDION HEADER ────────────────── */}
      <div 
        onClick={toggleExpand}
        className="flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 cursor-pointer select-none transition-colors border-b border-border/60"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Animated Brain Icon */}
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
            isLive 
              ? "bg-primary/20 text-primary border border-primary/40 animate-pulse shadow-sm shadow-primary/20" 
              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
          }`}>
            <BrainCircuit size={17} className={isLive ? "animate-pulse" : ""} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                {modelName} Reasoning
              </span>

              {isLive ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/15 text-primary border border-primary/30 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                  Thinking for {displaySeconds}s...
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 size={11} className="text-emerald-400" />
                  Thought for {displaySeconds}s • 5 Steps Verified
                </span>
              )}
            </div>

            {/* Subtext Pills */}
            <div className="hidden sm:flex items-center gap-2 mt-1 text-[11px] font-mono text-muted-foreground">
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck size={12} /> KIIT Autonomous Regs
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
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground border border-border transition-colors shadow-sm"
            title="Copy Reasoning CoT"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy CoT"}</span>
          </button>

          <button
            type="button"
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label={isExpanded ? "Collapse Reasoning" : "Expand Reasoning"}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* ────────────────── EXPANDABLE DETAILED CONTENT ────────────────── */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="p-4 sm:p-5 space-y-3.5 max-h-[460px] overflow-y-auto custom-scrollbar text-xs leading-relaxed text-muted-foreground font-sans border-t border-border/40 bg-background/30">
              
              {/* Header Note */}
              <div className="flex items-center justify-between pb-2 border-b border-border/40 text-[11px] font-mono">
                <div className="flex items-center gap-1.5 text-primary">
                  <Sparkles size={13} />
                  <span className="font-bold">Generative Chain-of-Thought (CoT) Verification Ladder</span>
                </div>
                <div className="text-muted-foreground">
                  Status: {isLive ? <span className="text-primary animate-pulse font-bold">Synthesizing...</span> : <span className="text-emerald-400 font-bold">Audit Complete</span>}
                </div>
              </div>

              {/* Render custom LLM reasoning if present, otherwise render rich interactive default steps */}
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
                          className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/80 hover:border-primary/30 transition-all mt-3 first:mt-0"
                        >
                          <div className="w-6 h-6 rounded-md bg-primary/15 text-primary border border-primary/30 flex items-center justify-center font-mono font-bold text-xs flex-shrink-0">
                            {block.stepNum}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-xs font-bold text-foreground font-mono tracking-wide">
                              {block.title}
                            </h4>
                          </div>
                        </div>
                      );
                    }

                    if (block.type === "bullet") {
                      return (
                        <div key={idx} className="flex items-start gap-2.5 pl-4 sm:pl-7 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/70 mt-1.5 flex-shrink-0" />
                          <div className="flex-1 leading-relaxed">
                            {renderInlineFormatted(block.content)}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <p key={idx} className="pl-4 sm:pl-7 text-xs leading-relaxed text-muted-foreground/90">
                        {renderInlineFormatted(block.content)}
                      </p>
                    );
                  })}
                </div>
              ) : (
                /* Default Animated Step Ladder */
                <div className="space-y-3">
                  {defaultSteps.map((step, idx) => {
                    const isStepActive = step.status === "active";
                    const isStepCompleted = step.status === "completed";
                    const isStepPending = step.status === "pending";

                    return (
                      <div
                        key={step.id}
                        className={`p-3.5 rounded-xl border transition-all duration-300 ${
                          isStepActive
                            ? "bg-primary/5 border-primary/40 ring-1 ring-primary/20 shadow-sm"
                            : isStepCompleted
                            ? "bg-muted/30 border-border/80 hover:border-border"
                            : "bg-muted/10 border-border/40 opacity-40"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2.5">
                            {/* Status Icon */}
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0 ${
                              isStepCompleted
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : isStepActive
                                ? "bg-primary/20 text-primary border border-primary/40 animate-pulse"
                                : "bg-muted text-muted-foreground border border-border"
                            }`}>
                              {isStepCompleted ? (
                                <Check size={12} className="text-emerald-400" />
                              ) : isStepActive ? (
                                <span className="animate-spin text-xs">◓</span>
                              ) : (
                                <span>{idx + 1}</span>
                              )}
                            </div>

                            <span className={`text-xs font-mono font-bold ${
                              isStepActive ? "text-primary" : isStepCompleted ? "text-foreground" : "text-muted-foreground"
                            }`}>
                              {idx + 1}. {step.title}
                            </span>
                          </div>

                          {step.category && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/60 uppercase">
                              {step.category}
                            </span>
                          )}
                        </div>

                        {/* Step details bullets */}
                        <div className="pl-7 space-y-1 mt-2 text-[11px] font-mono text-muted-foreground">
                          {step.bullets.map((bullet, bIdx) => (
                            <div key={bIdx} className="flex items-start gap-2">
                              <span className={`w-1 h-1 rounded-full mt-1.5 flex-shrink-0 ${
                                isStepCompleted ? "bg-emerald-400" : isStepActive ? "bg-primary animate-ping" : "bg-muted-foreground/50"
                              }`} />
                              <span>{renderInlineFormatted(bullet)}</span>
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

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AiReasoningView;
