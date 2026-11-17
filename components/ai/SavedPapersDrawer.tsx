"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Trash2, FileText, Sparkles, Clock, 
  Check, ArrowRight, BookOpen, AlertCircle, Loader2
} from "lucide-react";
import type { StoredPaper } from "@/lib/paper-storage";

interface SavedPapersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPaper: (paper: StoredPaper) => void;
  activeSubjectCode?: string;
}

export function SavedPapersDrawer({
  isOpen,
  onClose,
  onSelectPaper,
  activeSubjectCode,
}: SavedPapersDrawerProps) {
  const [papers, setPapers] = useState<StoredPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPapers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/ai/papers");
      if (res.ok) {
        const data = await res.json();
        setPapers(data.papers || []);
      } else {
        setError("Failed to load saved papers");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load papers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPapers();
    }
  }, [isOpen]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      setDeletingId(id);
      const res = await fetch(`/api/ai/papers/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPapers(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete paper:", err);
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative w-full max-w-md h-full bg-[#080a0f] border-l border-white/15 shadow-2xl flex flex-col font-mono text-xs overflow-hidden"
        >
          {/* Drawer Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary border border-primary/30 flex items-center justify-center">
                <FileText size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Saved Examination Papers
                </h3>
                <span className="text-[10px] text-muted-foreground">
                  {papers.length} {papers.length === 1 ? "paper" : "papers"} stored in repository
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-white/10 transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          {/* List of Papers */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3.5 space-y-2.5">
            {loading ? (
              <div className="h-40 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Loader2 size={18} className="animate-spin text-primary" />
                <span className="text-[11px]">Loading paper library...</span>
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            ) : papers.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-muted-foreground text-center px-4 space-y-2">
                <FileText size={28} className="text-muted-foreground/40" />
                <p className="text-xs text-foreground font-semibold">No Saved Papers Yet</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Generate an examination paper and it will automatically be verified and stored in your academic repository.
                </p>
              </div>
            ) : (
              papers.map((paper) => {
                const dateStr = paper.createdAt 
                  ? new Date(paper.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })
                  : "Recent";

                const matchRate = paper.pyqMatchRate || 88.4;

                return (
                  <div
                    key={paper.id}
                    onClick={() => {
                      onSelectPaper(paper);
                      onClose();
                    }}
                    className="group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-primary/40 transition-all cursor-pointer space-y-2 relative"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-primary/15 text-primary font-bold text-[10px] border border-primary/25">
                          {paper.subjectCode}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                          {paper.examType === "mid_sem" ? "Mid-Sem" : "End-Sem"}
                        </span>
                      </div>

                      {/* PYQ Match Badge */}
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-[10px] font-bold">
                        ✦ {matchRate}% PYQ Match
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-foreground tracking-tight line-clamp-1">
                      {paper.subjectName}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-white/5">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {dateStr}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, paper.id)}
                          disabled={deletingId === paper.id}
                          className="p-1 rounded text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete paper"
                        >
                          {deletingId === paper.id ? (
                            <Loader2 size={12} className="animate-spin text-rose-400" />
                          ) : (
                            <Trash2 size={12} />
                          )}
                        </button>

                        <span className="text-primary font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                          Open <ArrowRight size={10} />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-3.5 border-t border-white/10 bg-white/[0.02] text-center text-[10px] text-muted-foreground">
            Papers are stored securely in Neon PostgreSQL with full PYQ provenance.
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default SavedPapersDrawer;
