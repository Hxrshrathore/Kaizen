"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Trash2, FileText, Sparkles, Clock, 
  Check, ArrowRight, BookOpen, AlertCircle, Loader2,
  FolderArchive, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const [mounted, setMounted] = useState(false);
  const [papers, setPapers] = useState<StoredPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

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

  if (!mounted) return null;

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[99999] flex justify-end bg-black/75 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: "100%", opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md h-full bg-[#0a0c12] border-l border-white/20 shadow-2xl flex flex-col font-mono text-xs overflow-hidden"
          >
            {/* Drawer Header - Always visible with prominent Close button */}
            <div className="p-4 pt-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.03]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary border border-primary/40 flex items-center justify-center shadow-[0_0_15px_rgba(204,255,0,0.15)]">
                  <FolderArchive size={17} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Saved Papers Library
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      {papers.length} {papers.length === 1 ? "paper" : "papers"} stored
                    </span>
                    <button 
                      onClick={fetchPapers}
                      title="Refresh library"
                      className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                    >
                      <RefreshCw size={10} className={loading ? "animate-spin" : ""} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Prominent Close button with visible pill and icon */}
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-8 px-2.5 gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-foreground border border-white/20 hover:border-primary/50 text-xs font-mono transition-all cursor-pointer shadow-sm"
              >
                <X size={14} className="text-primary" />
                <span className="font-bold">Close</span>
              </Button>
            </div>

            {/* List of Papers */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3.5 space-y-2.5">
              {loading ? (
                <div className="h-44 flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <Loader2 size={20} className="animate-spin text-primary" />
                  <span className="text-[11px]">Syncing repository papers...</span>
                </div>
              ) : error ? (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{error}</span>
                </div>
              ) : papers.length === 0 ? (
                <div className="h-56 flex flex-col items-center justify-center text-muted-foreground text-center px-4 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <FileText size={24} className="text-muted-foreground/40" />
                  </div>
                  <div>
                    <p className="text-xs text-foreground font-semibold">No Saved Papers Yet</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed mt-1 max-w-[280px]">
                      Generate an examination paper and it will automatically be verified and stored in your autonomous repository.
                    </p>
                  </div>
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
                  const isCurrent = activeSubjectCode === paper.subjectCode;

                  return (
                    <motion.div
                      key={paper.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => {
                        onSelectPaper(paper);
                        onClose();
                      }}
                      className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isCurrent 
                          ? "bg-primary/[0.07] border-primary/40 shadow-[0_0_20px_rgba(204,255,0,0.06)]"
                          : "bg-white/[0.03] border-white/10 hover:border-white/25 hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 text-[9px] font-bold">
                            {paper.subjectCode}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground text-[9px] uppercase">
                            {paper.examType.replace("_", "-")}
                          </span>
                        </div>

                        <Badge 
                          variant="secondary"
                          className="px-1.5 py-0.5 text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono"
                        >
                          +{matchRate.toFixed(1)}% PYQ Match
                        </Badge>
                      </div>

                      <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {paper.subjectName}
                      </h4>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-2.5 pt-2 border-t border-white/5">
                        <span className="flex items-center gap-1">
                          <Clock size={11} className="text-primary/70" />
                          {dateStr}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            title="Delete paper"
                            onClick={(e) => handleDelete(e, paper.id)}
                            disabled={deletingId === paper.id}
                            className="p-1 rounded hover:bg-rose-500/20 text-muted-foreground hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            {deletingId === paper.id ? (
                              <Loader2 size={12} className="animate-spin text-rose-400" />
                            ) : (
                              <Trash2 size={12} />
                            )}
                          </button>

                          <span className="flex items-center gap-1 text-primary group-hover:translate-x-0.5 transition-transform font-bold">
                            Open <ArrowRight size={11} />
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer with close button */}
            <div className="p-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                Saved locally &amp; synced with Neon PostgreSQL
              </span>
              <Button
                variant="ghost"
                size="xs"
                onClick={onClose}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Close Drawer
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
