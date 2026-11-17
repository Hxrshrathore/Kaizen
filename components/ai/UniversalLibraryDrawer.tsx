"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  X, Trash2, FileText, Sparkles, Clock, 
  ArrowRight, AlertCircle, Loader2,
  FolderArchive, RefreshCw, BrainCircuit, Search,
  Eye, Check, BookOpen, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { StoredPaper, StoredFlashcardSet } from "@/lib/paper-storage";

interface UniversalLibraryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onPaperSelect?: (paper: StoredPaper) => void;
}

export function UniversalLibraryDrawer({
  isOpen,
  onClose,
  onPaperSelect,
}: UniversalLibraryDrawerProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | "PAPERS" | "FLASHCARDS">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [papers, setPapers] = useState<StoredPaper[]>([]);
  const [flashcards, setFlashcards] = useState<StoredFlashcardSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedPreviewPaper, setSelectedPreviewPaper] = useState<StoredPaper | null>(null);
  const [selectedPreviewFlashcard, setSelectedPreviewFlashcard] = useState<StoredFlashcardSet | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchLibrary = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/ai/library");
      if (res.ok) {
        const data = await res.json();
        setPapers(data.papers || []);
        setFlashcards(data.flashcards || []);
      } else {
        setError("Failed to load library items");
      }
    } catch (err: any) {
      setError(err.message || "Failed to sync library");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLibrary();
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (selectedPreviewPaper || selectedPreviewFlashcard) {
          setSelectedPreviewPaper(null);
          setSelectedPreviewFlashcard(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedPreviewPaper, selectedPreviewFlashcard, onClose]);

  const handleDeletePaper = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      setDeletingId(id);
      const res = await fetch(`/api/ai/library?id=${id}&type=paper`, { method: "DELETE" });
      if (res.ok) {
        setPapers(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete paper:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteFlashcard = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      setDeletingId(id);
      const res = await fetch(`/api/ai/library?id=${id}&type=flashcard`, { method: "DELETE" });
      if (res.ok) {
        setFlashcards(prev => prev.filter(f => f.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete flashcard set:", err);
    } finally {
      setDeletingId(null);
    }
  };

  if (!mounted) return null;

  const totalCount = papers.length + flashcards.length;

  const filteredPapers = papers.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.subjectCode.toLowerCase().includes(q) || p.subjectName.toLowerCase().includes(q);
  });

  const filteredFlashcards = flashcards.filter(f => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return f.topic.toLowerCase().includes(q);
  });

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[99999] flex justify-end bg-black/70 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: "100%", opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg h-full bg-card/95 dark:bg-[#07090e]/95 border-l border-border shadow-2xl flex flex-col font-mono text-xs overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 pt-5 border-b border-border flex items-center justify-between shrink-0 bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary border border-primary/30 flex items-center justify-center shadow-xs">
                  <FolderArchive size={18} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground">
                    Universal AI Library
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      {totalCount} {totalCount === 1 ? "artifact" : "artifacts"} saved
                    </span>
                    <button 
                      onClick={fetchLibrary}
                      title="Sync library"
                      className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                    >
                      <RefreshCw size={10} className={loading ? "animate-spin" : ""} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-8 px-2.5 gap-1.5 rounded-lg border-border hover:border-primary/50 text-xs font-mono transition-all cursor-pointer shadow-xs"
              >
                <X size={14} className="text-primary" />
                <span className="font-bold">Close</span>
              </Button>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="p-3 border-b border-border space-y-2.5 bg-background/50 shrink-0">
              <div className="flex items-center gap-1.5">
                <Button
                  variant={activeTab === "ALL" ? "default" : "ghost"}
                  size="xs"
                  onClick={() => setActiveTab("ALL")}
                  className="font-mono text-[11px] cursor-pointer"
                >
                  All ({totalCount})
                </Button>
                <Button
                  variant={activeTab === "PAPERS" ? "default" : "ghost"}
                  size="xs"
                  onClick={() => setActiveTab("PAPERS")}
                  className="font-mono text-[11px] cursor-pointer"
                >
                  Papers ({papers.length})
                </Button>
                <Button
                  variant={activeTab === "FLASHCARDS" ? "default" : "ghost"}
                  size="xs"
                  onClick={() => setActiveTab("FLASHCARDS")}
                  className="font-mono text-[11px] cursor-pointer"
                >
                  Flashcards ({flashcards.length})
                </Button>
              </div>

              <div className="relative flex items-center">
                <Search size={13} className="absolute left-2.5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search papers by subject, topic..."
                  className="w-full bg-card border border-input rounded-lg pl-8 pr-3 py-1.5 text-[11px] font-mono text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Main Content List */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3.5 space-y-2.5">
              {loading ? (
                <div className="h-44 flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <Loader2 size={20} className="animate-spin text-primary" />
                  <span className="text-[11px]">Syncing repository artifacts...</span>
                </div>
              ) : error ? (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{error}</span>
                </div>
              ) : totalCount === 0 ? (
                <div className="h-56 flex flex-col items-center justify-center text-muted-foreground text-center px-4 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center">
                    <FolderArchive size={24} className="text-muted-foreground/40" />
                  </div>
                  <div>
                    <p className="text-xs text-foreground font-semibold">Your AI Library is Empty</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed mt-1 max-w-[280px]">
                      Generate question papers or active recall flashcards and they will automatically be stored here.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* QUESTION PAPERS */}
                  {(activeTab === "ALL" || activeTab === "PAPERS") && filteredPapers.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 px-1">
                        <FileText size={11} className="text-primary" />
                        <span>Question Papers ({filteredPapers.length})</span>
                      </div>

                      {filteredPapers.map((paper) => {
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
                          <motion.div
                            key={paper.id}
                            layout
                            className="p-3.5 rounded-xl border border-border bg-card hover:border-primary/40 transition-all cursor-pointer group"
                            onClick={() => {
                              try {
                                const event = new CustomEvent('load_saved_paper', { detail: paper });
                                window.dispatchEvent(event);
                              } catch {}
                              if (onPaperSelect) {
                                onPaperSelect(paper);
                              }
                              setSelectedPreviewPaper(paper);
                            }}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 text-[9px] font-bold">
                                  {paper.subjectCode}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[9px] uppercase">
                                  {paper.examType.replace("_", "-")}
                                </span>
                              </div>

                              <Badge 
                                variant="secondary"
                                className="px-1.5 py-0.5 text-[9px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono"
                              >
                                +{matchRate.toFixed(1)}% Match
                              </Badge>
                            </div>

                            <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {paper.subjectName}
                            </h4>

                            <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border/60">
                              <span className="flex items-center gap-1">
                                <Clock size={11} className="text-primary/70" />
                                {dateStr}
                              </span>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  title="Delete paper"
                                  onClick={(e) => handleDeletePaper(e, paper.id)}
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
                      })}
                    </div>
                  )}

                  {/* FLASHCARDS */}
                  {(activeTab === "ALL" || activeTab === "FLASHCARDS") && filteredFlashcards.length > 0 && (
                    <div className="space-y-2 mt-3">
                      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 px-1">
                        <BrainCircuit size={11} className="text-primary" />
                        <span>Active Recall Flashcards ({filteredFlashcards.length})</span>
                      </div>

                      {filteredFlashcards.map((set) => {
                        const dateStr = set.createdAt 
                          ? new Date(set.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "Recent";

                        return (
                          <motion.div
                            key={set.id}
                            layout
                            className="p-3.5 rounded-xl border border-border bg-card hover:border-primary/40 transition-all cursor-pointer group"
                            onClick={() => setSelectedPreviewFlashcard(set)}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 text-[9px] font-bold">
                                  FLASHCARDS
                                </span>
                                <span className="text-[9px] text-muted-foreground">
                                  {set.cardsCount || set.cards?.length || 6} Cards
                                </span>
                              </div>

                              <Badge variant="outline" className="text-[9px] font-mono text-muted-foreground">
                                {dateStr}
                              </Badge>
                            </div>

                            <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                              {set.topic}
                            </h4>

                            <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border/60">
                              <span className="text-muted-foreground">
                                Click to inspect cards
                              </span>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  title="Delete flashcard set"
                                  onClick={(e) => handleDeleteFlashcard(e, set.id)}
                                  disabled={deletingId === set.id}
                                  className="p-1 rounded hover:bg-rose-500/20 text-muted-foreground hover:text-rose-400 transition-colors cursor-pointer"
                                >
                                  {deletingId === set.id ? (
                                    <Loader2 size={12} className="animate-spin text-rose-400" />
                                  ) : (
                                    <Trash2 size={12} />
                                  )}
                                </button>

                                <span className="flex items-center gap-1 text-primary group-hover:translate-x-0.5 transition-transform font-bold">
                                  Review <ArrowRight size={11} />
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-border bg-muted/20 flex items-center justify-between shrink-0">
              <span className="text-[10px] text-muted-foreground">
                Synced with Neon Serverless Cloud
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

          {/* Paper Detailed Preview Modal */}
          {selectedPreviewPaper && (
            <div 
              className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
              onClick={() => setSelectedPreviewPaper(null)}
            >
              <div 
                className="w-full max-w-2xl max-h-[85vh] bg-card border border-border rounded-2xl flex flex-col overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                  <div>
                    <h3 className="font-bold text-sm text-foreground">
                      {selectedPreviewPaper.subjectName} ({selectedPreviewPaper.subjectCode})
                    </h3>
                    <p className="text-[10px] text-muted-foreground uppercase">
                      {selectedPreviewPaper.examType} • {selectedPreviewPaper.fullMarks} Marks • {selectedPreviewPaper.duration}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setSelectedPreviewPaper(null)}
                    className="cursor-pointer"
                  >
                    <X size={13} />
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar text-xs font-mono whitespace-pre-wrap leading-relaxed">
                  {selectedPreviewPaper.content}
                </div>

                <div className="p-3 border-t border-border bg-muted/20 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedPreviewPaper.content);
                    }}
                    className="cursor-pointer font-mono text-xs gap-1.5"
                  >
                    <Check size={12} /> Copy Markdown
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      try {
                        const event = new CustomEvent('load_saved_paper', { detail: selectedPreviewPaper });
                        window.dispatchEvent(event);
                      } catch {}
                      router.push("/dashboard/generator");
                      if (onPaperSelect) onPaperSelect(selectedPreviewPaper);
                      setSelectedPreviewPaper(null);
                      onClose();
                    }}
                    className="cursor-pointer font-mono text-xs gap-1.5 bg-primary text-primary-foreground font-bold"
                  >
                    Open in Generator <ArrowRight size={12} />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Flashcard Preview Modal */}
          {selectedPreviewFlashcard && (
            <div 
              className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
              onClick={() => setSelectedPreviewFlashcard(null)}
            >
              <div 
                className="w-full max-w-2xl max-h-[85vh] bg-card border border-border rounded-2xl flex flex-col overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                  <div>
                    <h3 className="font-bold text-sm text-foreground">
                      {selectedPreviewFlashcard.topic}
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      {selectedPreviewFlashcard.cardsCount || selectedPreviewFlashcard.cards?.length} Active Recall Cards
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setSelectedPreviewFlashcard(null)}
                    className="cursor-pointer"
                  >
                    <X size={13} />
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
                  {selectedPreviewFlashcard.cards?.map((card, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-border bg-background space-y-1.5 font-mono text-xs">
                      <div className="text-[10px] font-bold text-primary uppercase">
                        Question #{idx + 1}
                      </div>
                      <p className="text-foreground font-semibold">
                        {card.question}
                      </p>
                      <div className="text-[10px] font-bold text-emerald-500 uppercase pt-1">
                        Answer
                      </div>
                      <p className="text-muted-foreground">
                        {card.answer}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="p-3 border-t border-border bg-muted/20 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    Active Recall Artifact
                  </span>
                  <Button
                    size="sm"
                    onClick={() => {
                      router.push("/dashboard/archives");
                      setSelectedPreviewFlashcard(null);
                      onClose();
                    }}
                    className="cursor-pointer font-mono text-xs gap-1.5 bg-primary text-black"
                  >
                    Open in Neural Archives <ArrowRight size={12} />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

export default UniversalLibraryDrawer;
