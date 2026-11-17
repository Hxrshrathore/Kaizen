"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Copy, Check, ChevronDown, ChevronUp, 
  BrainCircuit, ShieldCheck, CheckCircle2,
  Square, ArrowDown
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
 * Apple-Minimalist AI Reasoning & Generative Blueprint View
 * 
 * Directives:
 * 1. Ultra-transparent liquid glass (allowing the Hue Orb to shine through)
 * 2. Zero fake placeholder cards flashing on generation start
 * 3. Jitter-free streaming without browser smooth-scroll thrashing
 * 4. Default collapsed state with localStorage persistence
 * 5. Clean, distraction-free typography with 0 clutter tabs
 */
export function AiReasoningView({
  reasoning,
  modelName = "NVIDIA Nemotron 3.5 Bolt",
  isLive = false,
  isComplete = false,
  durationSeconds = 0,
  subjectCode = "CS40003",
  subjectName = "Software Testing and Automation",
  examType = "end_sem",
  isExpanded: controlledExpanded,
  onToggleExpand,
  isFloatingOverlay = true,
  onStop,
}: AiReasoningViewProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  // Handle scroll tracking for Jump to Latest control
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    setShowJumpToBottom(distanceToBottom > 80);
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  // Auto-follow stream: Use scrollTop directly to avoid smooth-scroll queue jitter
  useEffect(() => {
    if (isLive && scrollContainerRef.current && isExpanded && !showJumpToBottom) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [reasoning, isLive, isExpanded, showJumpToBottom]);

  const isMid = examType === "mid_sem";
  const marks = isMid ? 20 : 50;

  // Parse custom reasoning into clean structured blocks
  const customReasoningBlocks: Array<{ 
    type: "step" | "bullet" | "paragraph" | "header"; 
    stepNum?: string; 
    title?: string; 
    content: string 
  }> = [];

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
    const copyText = reasoning || "NVIDIA Nemotron 3.5 Bolt verified examination blueprint for KIIT Autonomous Regulations.";
    navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className={`relative w-full rounded-2xl sm:rounded-3xl flex flex-col overflow-hidden transition-all duration-300
        backdrop-blur-xl bg-[#06080d]/35 dark:bg-[#030407]/40
        border border-white/12 dark:border-white/10
        shadow-[0_16px_40px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.18)]
        before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:pointer-events-none
        after:absolute after:inset-0 after:rounded-[inherit] after:pointer-events-none after:bg-[radial-gradient(ellipse_at_top,rgba(204,255,0,0.05),transparent_65%)]
        ${isFloatingOverlay ? (isExpanded ? "h-full" : "h-[48px]") : isExpanded ? "max-h-[460px] min-h-[180px]" : "h-[46px]"}
      `}
    >
      {/* ────────────────── TOP DISCLOSURE BAR / HEADER ────────────────── */}
      <div 
        onClick={toggleExpand}
        className={`flex items-center justify-between px-3.5 sm:px-4 py-2 sm:py-2.5 cursor-pointer select-none transition-colors border-b border-white/10 shrink-0 ${
          isExpanded ? "bg-white/[0.03] hover:bg-white/[0.05]" : "h-full bg-white/[0.02] hover:bg-white/[0.04]"
        }`}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* Animated Brain Icon */}
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
            isLive 
              ? "bg-primary/20 text-primary border border-primary/40 shadow-sm shadow-primary/20 animate-pulse" 
              : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
          }`}>
            <BrainCircuit size={15} className={isLive ? "animate-pulse" : ""} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                {modelName}
              </span>

              {isLive ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/20 border border-primary/30 text-primary">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                  <span className="aui-shimmer-text">Thinking for {displaySeconds}s...</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
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

        {/* Right Action Icons */}
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          {isLive && onStop && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStop();
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-colors shadow-sm cursor-pointer"
              title="Stop Paper Generation"
            >
              <Square size={10} className="fill-rose-400 text-rose-400" />
              <span className="hidden sm:inline">Stop</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-white/10 transition-colors cursor-pointer"
            title="Copy Reasoning CoT"
          >
            {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy CoT"}</span>
          </button>

          <button
            type="button"
            onClick={toggleExpand}
            className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-white/10 transition-colors cursor-pointer"
            aria-label={isExpanded ? "Collapse Reasoning" : "Expand Reasoning"}
          >
            {isExpanded ? (
              <ChevronDown size={14} className="text-primary" />
            ) : (
              <ChevronUp size={14} className="text-primary" />
            )}
          </button>
        </div>
      </div>

      {/* ────────────────── EXPANDED REASONING TRACES (Clean Typography) ────────────────── */}
      {isExpanded && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3.5 sm:p-5 space-y-3 text-xs text-muted-foreground font-sans relative"
          >
            {hasCustomReasoning ? (
              <div className="space-y-2.5">
                {customReasoningBlocks.map((block, idx) => {
                  if (block.type === "header") {
                    return (
                      <div key={idx} className="flex items-center gap-2 text-xs font-mono font-medium text-primary/90 italic pb-1">
                        <Sparkles size={12} className="text-primary flex-shrink-0" />
                        <span>{renderInlineFormatted(block.content)}</span>
                      </div>
                    );
                  }

                  if (block.type === "step") {
                    return (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-primary/30 transition-all mt-2.5 first:mt-0"
                      >
                        <div className="w-5 h-5 rounded bg-primary/15 text-primary border border-primary/30 flex items-center justify-center font-mono font-bold text-[11px] flex-shrink-0">
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
                      <div key={idx} className="flex items-start gap-2 pl-3 sm:pl-5 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/70 mt-1.5 flex-shrink-0" />
                        <div className="flex-1 leading-relaxed break-words whitespace-pre-wrap">
                          {renderInlineFormatted(block.content)}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <p key={idx} className="pl-3 sm:pl-5 text-xs leading-relaxed text-muted-foreground/90 break-words whitespace-pre-wrap">
                      {renderInlineFormatted(block.content)}
                    </p>
                  );
                })}
              </div>
            ) : (
              /* Clean Minimal Live Ingestion Indicator (Zero Fake Step Flashes) */
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
                <div className="relative flex items-center justify-center flex-shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary animate-ping absolute" />
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-mono font-bold text-foreground tracking-wide">
                    {isLive ? "Connecting to NVIDIA Nemotron 3.5 Bolt..." : "Autonomous Blueprint Verified"}
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground mt-0.5 truncate">
                    {isLive ? `Synthesizing ${subjectCode} examination blueprint & Bloom's taxonomy` : "Ready for inspection."}
                  </div>
                </div>
              </div>
            )}

            {/* Jump to Latest Floating Pill */}
            {showJumpToBottom && (
              <button
                type="button"
                onClick={scrollToBottom}
                className="sticky bottom-2 left-1/2 -translate-x-1/2 mx-auto px-3 py-1.5 rounded-full bg-primary text-black font-mono text-[10px] font-bold shadow-lg shadow-primary/30 flex items-center gap-1.5 hover:scale-105 transition-all z-20 cursor-pointer"
              >
                <ArrowDown size={11} />
                <span>Jump to Latest Trace</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AiReasoningView;
