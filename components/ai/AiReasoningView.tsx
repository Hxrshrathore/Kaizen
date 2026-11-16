"use client";

import React, { useState } from "react";
import { Sparkles, Copy, Check, ChevronDown, ChevronUp, BrainCircuit, ShieldCheck } from "lucide-react";

interface AiReasoningViewProps {
  reasoning: string;
  modelName?: string;
  isLive?: boolean;
}

/**
 * Parses inline markdown segments including **bold**, *italic*, [Tags], and code snippets
 */
function renderInlineFormatted(text: string) {
  // Regex to split by **bold**, `code`, [CO tags], or (Notes)
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
        <code key={idx} className="px-1.5 py-0.5 rounded bg-muted font-mono text-[11px] text-primary">
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
 * Formats structured thinking traces from NVIDIA Nemotron 3.5
 * Parses numbered steps, sub-bullets, and bolded entities
 */
export function AiReasoningView({
  reasoning,
  modelName = "NVIDIA Nemotron 3.5 Bolt (E4B)",
  isLive = false,
}: AiReasoningViewProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  if (!reasoning || !reasoning.trim()) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(reasoning);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Parse lines into logical blocks
  const lines = reasoning.split("\n");
  const blocks: Array<{
    type: "step" | "bullet" | "paragraph" | "header";
    stepNum?: string;
    title?: string;
    content: string;
  }> = [];

  let currentStep: { stepNum: string; title: string; bullets: string[] } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Check for numbered step: e.g. "1.  **Analyze the Request & Constraints:**" or "1. Step Title"
    const stepMatch = rawLine.match(/^(\d+)\.\s+(\*\*[^*]+\*\*|[^*]+)/);
    if (stepMatch) {
      const stepNum = stepMatch[1];
      let title = stepMatch[2].replace(/\*\*/g, "").replace(/:$/, "").trim();
      blocks.push({
        type: "step",
        stepNum,
        title,
        content: rawLine,
      });
      continue;
    }

    // Check for bullet: "*   **Role:** Official Senior..." or "- item"
    const bulletMatch = rawLine.match(/^[*•-]\s+(.*)/);
    if (bulletMatch) {
      blocks.push({
        type: "bullet",
        content: bulletMatch[1].trim(),
      });
      continue;
    }

    // Normal paragraph or intro
    if (rawLine.toLowerCase().includes("thinking process") || rawLine.toLowerCase().includes("reasoning")) {
      blocks.push({
        type: "header",
        content: rawLine,
      });
    } else {
      blocks.push({
        type: "paragraph",
        content: rawLine,
      });
    }
  }

  const stepCount = blocks.filter((b) => b.type === "step").length;

  return (
    <div className="rounded-2xl border border-primary/20 bg-card/70 backdrop-blur-md shadow-lg overflow-hidden transition-all">
      {/* Top Banner Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary/5 border-b border-primary/15">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
            <BrainCircuit size={16} className={isLive ? "animate-pulse" : ""} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary font-mono">
                {modelName} Pedagogical &amp; Examination Blueprint Reasoning
              </span>
              {isLive ? (
                <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {stepCount > 0 ? `${stepCount} Synthesized Steps` : "Chain of Thought"}
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Live generative cognitive traces verifying Bloom&apos;s Taxonomy, CO allocations, and KIIT Autonomous Regulations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-colors"
            title="Copy Reasoning Trace"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copied ? "Copied" : "Copy CoT"}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label={isExpanded ? "Collapse Reasoning" : "Expand Reasoning"}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Structured Content Area */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-3.5 max-h-[460px] overflow-y-auto text-xs leading-relaxed text-muted-foreground font-sans">
          {blocks.map((block, idx) => {
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
      )}
    </div>
  );
}

export default AiReasoningView;
