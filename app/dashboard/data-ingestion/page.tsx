"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  CheckCircle,
  XCircle,
  Search,
  LayoutList,
  Sparkles,
  Inbox,
  Loader2,
  Keyboard,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Database,
  Eye,
  EyeOff,
  Tag,
  Clock,
  BarChart3,
  AlertTriangle,
  Download,
  RefreshCw,
} from "lucide-react";

type OcrQuestion = {
  id: string;
  imagePath: string;
  subject: string | null;
  year: string | null;
  examType: string | null;
  sourcePdf: string | null;
  pageNumber: number | null;
  rawOcrText: string | null;
  correctedText: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
};

type Stats = {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
};

export default function DataIngestionPage() {
  const [questions, setQuestions] = useState<OcrQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeItem, setActiveItem] = useState<OcrQuestion | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [editorText, setEditorText] = useState("");
  const [filter, setFilter] = useState("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [zoom, setZoom] = useState(1);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showRawOcr, setShowRawOcr] = useState(false);
  
  // Editable Tags
  const [editSubject, setEditSubject] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editExamType, setEditExamType] = useState("");

  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [seeding, setSeeding] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Data fetching ────────────────────────────────────────────
  useEffect(() => { fetchData(); }, [filter]);
  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    const statuses = ["PENDING", "APPROVED", "REJECTED"];
    const results = await Promise.all(
      statuses.map(s => fetch(`/api/ingestion?status=${s}`).then(r => r.json()))
    );
    setStats({
      pending:  results[0].length ?? 0,
      approved: results[1].length ?? 0,
      rejected: results[2].length ?? 0,
      total:    results[0].length + results[1].length + results[2].length,
    });
  }

  async function fetchData() {
    setLoading(true);
    try {
      const resp = await fetch(`/api/ingestion?status=${filter}`);
      const data = await resp.json();
      
      if (!Array.isArray(data)) {
        throw new Error(data.error || "Database connection failed");
      }
      
      setQuestions(data);
      if (data.length > 0) {
        setActiveIdx(0);
        setActiveItem(data[0]);
        setEditorText(data[0].correctedText || data[0].rawOcrText || "");
        setEditSubject(data[0].subject || "");
        setEditYear(data[0].year || "");
        setEditExamType(data[0].examType || "");
      } else {
        setActiveItem(null);
        setEditorText("");
        setEditSubject("");
        setEditYear("");
        setEditExamType("");
      }
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Failed to load records", "err");
      setQuestions([]); // Fallback to empty array
    }
    setLoading(false);
  }

  // ── Helpers ──────────────────────────────────────────────────
  const showToast = (msg: string, type: "ok" | "err") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleSelect = (q: OcrQuestion, idx: number) => {
    setActiveItem(q);
    setActiveIdx(idx);
    setEditorText(q.correctedText || q.rawOcrText || "");
    setEditSubject(q.subject || "");
    setEditYear(q.year || "");
    setEditExamType(q.examType || "");
    setZoom(1);
    setShowRawOcr(false);
  };

  const navigateItem = useCallback((dir: "prev" | "next") => {
    const newIdx = dir === "next"
      ? Math.min(activeIdx + 1, questions.length - 1)
      : Math.max(activeIdx - 1, 0);
    if (newIdx !== activeIdx) handleSelect(questions[newIdx], newIdx);
  }, [activeIdx, questions]);

  const updateStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const resp = await fetch("/api/ingestion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id, 
          correctedText: editorText, 
          status,
          subject: editSubject,
          year: editYear,
          examType: editExamType
        }),
      });
      if (!resp.ok) throw new Error("Update failed");

      showToast(status === "APPROVED" ? "✓ Approved & saved to dataset" : "✗ Rejected", status === "APPROVED" ? "ok" : "err");

      // Remove from list, select next
      const nextList = questions.filter(q => q.id !== id);
      setQuestions(nextList);
      fetchStats();

      if (nextList.length > 0) {
        const newIdx = Math.min(activeIdx, nextList.length - 1);
        handleSelect(nextList[newIdx], newIdx);
      } else {
        setActiveItem(null);
        setEditorText("");
      }
    } catch {
      showToast("Update failed", "err");
    }
    setSubmitting(false);
  };

  const seedSampleData = async () => {
    setSeeding(true);
    try {
      const resp = await fetch("/api/ingestion/seed", { method: "POST" });
      if (!resp.ok) throw new Error("Seed failed");
      const data = await resp.json();
      showToast(`Seeded ${data.count} sample records`, "ok");
      await fetchData();
      await fetchStats();
    } catch {
      showToast("Seed failed — check console", "err");
    }
    setSeeding(false);
  };

  const exportApproved = async () => {
    const resp = await fetch("/api/ingestion?status=APPROVED");
    const data: OcrQuestion[] = await resp.json();
    const csv = ["subject,year,examType,question"]
      .concat(data.map(q =>
        `"${q.subject || ""}","${q.year || ""}","${q.examType || ""}","${(q.correctedText || "").replace(/"/g, '""')}"`
      )).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `kaizen_approved_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Keyboard shortcuts ───────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't fire shortcuts when user is typing in textarea
      if (document.activeElement === textareaRef.current) {
        if (e.key === "Escape") textareaRef.current?.blur();
        return;
      }
      switch (e.key) {
        case "j": case "ArrowDown": e.preventDefault(); navigateItem("next"); break;
        case "k": case "ArrowUp":   e.preventDefault(); navigateItem("prev"); break;
        case "a": if (activeItem) updateStatus(activeItem.id, "APPROVED"); break;
        case "r": if (activeItem) updateStatus(activeItem.id, "REJECTED"); break;
        case "e": textareaRef.current?.focus(); break;
        case "+": setZoom(z => Math.min(z + 0.25, 3)); break;
        case "-": setZoom(z => Math.max(z - 0.25, 0.5)); break;
        case "?": setShowShortcuts(v => !v); break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeItem, navigateItem]);

  // ── Filtered list ────────────────────────────────────────────
  const filtered = questions.filter(q =>
    !searchQuery ||
    (q.rawOcrText || q.correctedText || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (q.subject || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const progress = stats.total > 0
    ? Math.round(((stats.approved + stats.rejected) / stats.total) * 100)
    : 0;

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-64px)] bg-[#060608] text-zinc-100 flex flex-col font-sans overflow-hidden relative">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-2xl text-sm font-bold border backdrop-blur-xl transition-all ${
          toast.type === "ok"
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            : "bg-red-500/10 border-red-500/30 text-red-300"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div
          className="fixed inset-0 bg-background/70 backdrop-blur-md z-50 flex items-center justify-center"
          onClick={() => setShowShortcuts(false)}
        >
          <div className="bg-[#0f0f12] border border-zinc-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-indigo-400" /> Keyboard Shortcuts
            </h2>
            {[
              ["J / ↓", "Next item"],
              ["K / ↑", "Previous item"],
              ["A", "Approve"],
              ["R", "Reject"],
              ["E", "Focus text editor"],
              ["+ / -", "Zoom in/out image"],
              ["?", "Toggle this panel"],
              ["Esc", "Blur editor"],
            ].map(([key, desc]) => (
              <div key={key} className="flex justify-between items-center py-2.5 border-b border-zinc-800/50 last:border-0">
                <span className="text-zinc-400 text-sm">{desc}</span>
                <kbd className="px-2 py-1 bg-zinc-800 rounded text-xs font-mono text-zinc-300">{key}</kbd>
              </div>
            ))}
            <button
              onClick={() => setShowShortcuts(false)}
              className="mt-6 w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Top Header ── */}
      <div className="h-14 border-b border-zinc-800/50 flex items-center justify-between px-5 bg-zinc-950/50 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h1 className="font-bold text-sm tracking-wide text-zinc-200">OCR Annotation Tool</h1>
          <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[10px] font-mono text-zinc-500">
            Phase 2 — Active-Learning Pipeline
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Stats pills */}
          <div className="hidden md:flex items-center gap-1.5 mr-2">
            {[
              { label: "PENDING", val: stats.pending, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
              { label: "APPROVED", val: stats.approved, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
              { label: "REJECTED", val: stats.rejected, color: "text-red-400 bg-red-500/10 border-red-500/20" },
            ].map(s => (
              <span key={s.label} className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${s.color}`}>
                {s.val} {s.label}
              </span>
            ))}
          </div>

          <button
            onClick={() => setShowShortcuts(true)}
            className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors rounded-lg hover:bg-zinc-800"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="w-4 h-4" />
          </button>
          <button
            onClick={exportApproved}
            className="p-2 text-zinc-500 hover:text-emerald-400 transition-colors rounded-lg hover:bg-zinc-800"
            title="Export approved to CSV"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={fetchData}
            className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors rounded-lg hover:bg-zinc-800"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="h-1 bg-zinc-900 shrink-0">
        <div
          className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ── Main Layout ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT: Queue Sidebar ── */}
        <div className="w-[340px] border-r border-zinc-800/40 bg-[#060608] flex flex-col shrink-0">
          {/* Search + Filters */}
          <div className="p-3 border-b border-zinc-800/40 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search text or subject..."
                className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-indigo-500/50 text-zinc-300 placeholder:text-zinc-600"
              />
            </div>
            <div className="flex gap-1.5">
              {["PENDING", "APPROVED", "REJECTED"].map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`flex-1 text-[10px] py-1.5 rounded font-bold transition-all ${
                    filter === status
                      ? status === "PENDING"   ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      : status === "APPROVED"  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      :                          "bg-red-500/15 text-red-400 border border-red-500/30"
                      : "bg-zinc-900 text-zinc-600 border border-transparent hover:text-zinc-400"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-32 text-zinc-600 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-xs">Loading...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-zinc-700 gap-3 px-6 text-center">
                <Inbox className="w-8 h-8 opacity-40" />
                <p className="text-xs leading-relaxed">
                  No {filter.toLowerCase()} items.{" "}
                  {filter === "PENDING" && (
                    <button onClick={seedSampleData} className="text-indigo-400 hover:text-indigo-300 underline">
                      Seed sample data
                    </button>
                  )}
                </p>
              </div>
            ) : (
              filtered.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => handleSelect(q, idx)}
                  className={`w-full text-left px-3 py-3 border-b border-zinc-800/30 transition-all group ${
                    activeItem?.id === q.id
                      ? "bg-indigo-500/8 border-l-2 border-l-indigo-500"
                      : "hover:bg-zinc-900/60 border-l-2 border-l-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] font-mono font-bold text-indigo-400 shrink-0">{idx + 1}.</span>
                      <Tag className="w-3 h-3 text-zinc-600 shrink-0" />
                      <span className="text-[10px] font-mono text-zinc-500 truncate">{q.subject || "Unknown"} {q.year ? `· ${q.year}` : ""}</span>
                    </div>
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 ${
                      q.status === "PENDING" ? "bg-amber-500" :
                      q.status === "APPROVED" ? "bg-emerald-500" : "bg-red-500"
                    }`} />
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {q.correctedText || q.rawOcrText || "(No text extracted yet)"}
                  </p>
                </button>
              ))
            )}
          </div>

          {/* Footer: navigation + seed */}
          <div className="p-3 border-t border-zinc-800/40 shrink-0 space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateItem("prev")}
                disabled={activeIdx === 0}
                className="flex-1 flex items-center justify-center gap-1 py-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-medium"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <span className="text-[10px] text-zinc-600 font-mono shrink-0">
                {filtered.length > 0 ? `${activeIdx + 1} / ${filtered.length}` : "0 / 0"}
              </span>
              <button
                onClick={() => navigateItem("next")}
                disabled={activeIdx >= filtered.length - 1}
                className="flex-1 flex items-center justify-center gap-1 py-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-medium"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {stats.total === 0 && (
              <button
                onClick={seedSampleData}
                disabled={seeding}
                className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/15 transition-colors text-xs font-bold disabled:opacity-50"
              >
                {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                Seed Sample Dataset
              </button>
            )}
          </div>
        </div>

        {/* ── RIGHT: Editor Pane ── */}
        {activeItem ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Image pane */}
            <div className="h-[42%] border-b border-zinc-800/40 bg-[#06060a] flex flex-col shrink-0">
              {/* Image toolbar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/30 shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Source Crop</span>
                  {activeItem.sourcePdf && (
                    <span className="text-[10px] text-zinc-700 font-mono truncate max-w-[200px]" title={activeItem.sourcePdf}>
                      {activeItem.sourcePdf.split(/[\\/]/).pop()}
                      {activeItem.pageNumber != null && ` · p.${activeItem.pageNumber}`}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))} className="p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors rounded hover:bg-zinc-800">
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono text-zinc-600 w-10 text-center">{Math.round(zoom * 100)}%</span>
                  <button onClick={() => setZoom(z => Math.min(z + 0.25, 3))} className="p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors rounded hover:bg-zinc-800">
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setZoom(1)} className="p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors rounded hover:bg-zinc-800">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Image display */}
              <div className="flex-1 overflow-auto flex items-center justify-center bg-[#08080c] p-4">
                {activeItem.imagePath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activeItem.imagePath}
                    alt="Question crop"
                    style={{ transform: `scale(${zoom})`, transformOrigin: "center", transition: "transform 0.2s ease" }}
                    className="max-w-full object-contain rounded shadow-2xl"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-zinc-700">
                    <AlertTriangle className="w-8 h-8 opacity-40" />
                    <p className="text-xs">No image crop available for this record</p>
                    <p className="text-[10px] text-zinc-800">Run the PDF crop script to generate image crops</p>
                  </div>
                )}
              </div>
            </div>

            {/* Editor pane */}
            <div className="flex-1 flex flex-col p-4 overflow-hidden">
              {/* Editor header */}
              <div className="flex items-center justify-between mb-3 shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">OCR Text</span>
                  <div className="flex items-center gap-1.5 opacity-90 hover:opacity-100 transition-opacity">
                    <input 
                      value={editSubject}
                      onChange={e => setEditSubject(e.target.value)}
                      placeholder="Subject"
                      className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 focus:border-indigo-500/50 rounded text-[10px] font-mono text-indigo-400 focus:outline-none w-28 md:w-36 transition-colors"
                      title="Edit Subject"
                    />
                    <input 
                      value={editYear}
                      onChange={e => setEditYear(e.target.value)}
                      placeholder="Year"
                      className="px-2 py-0.5 bg-zinc-800 focus:bg-zinc-700 border border-transparent focus:border-zinc-600 rounded text-[10px] font-mono text-zinc-400 focus:outline-none w-14 transition-colors"
                      title="Edit Year"
                    />
                    <input 
                      value={editExamType}
                      onChange={e => setEditExamType(e.target.value)}
                      placeholder="Exam Type"
                      className="px-2 py-0.5 bg-zinc-800 focus:bg-zinc-700 border border-transparent focus:border-zinc-600 rounded text-[10px] font-mono text-zinc-400 focus:outline-none w-20 transition-colors"
                      title="Edit Exam Type"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activeItem.rawOcrText && activeItem.rawOcrText !== activeItem.correctedText && (
                    <button
                      onClick={() => setShowRawOcr(v => !v)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors text-xs text-zinc-500 hover:text-zinc-300"
                      title="Toggle raw OCR output"
                    >
                      {showRawOcr ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      Raw OCR
                    </button>
                  )}
                  <span className="text-[10px] text-amber-500/70 bg-amber-500/8 border border-amber-500/15 px-2.5 py-1 rounded-lg">
                    Edit before approving → trains the model
                  </span>
                </div>
              </div>

              {/* Show raw OCR comparison if toggled */}
              {showRawOcr && activeItem.rawOcrText && (
                <div className="mb-3 p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl shrink-0">
                  <p className="text-[10px] font-mono font-bold text-zinc-600 mb-1.5 uppercase tracking-wider">Raw TrOCR Output (read-only)</p>
                  <p className="text-xs text-zinc-600 font-mono leading-relaxed line-clamp-3">{activeItem.rawOcrText}</p>
                </div>
              )}

              {/* Text editor */}
              <textarea
                ref={textareaRef}
                value={editorText}
                onChange={e => setEditorText(e.target.value)}
                className="flex-1 w-full bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-zinc-200 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500/40 leading-relaxed font-mono text-sm transition-all shadow-inner"
                placeholder="No OCR text yet. Run run_ocr_model.py to process images, or type the question manually here."
              />

              {/* Action bar */}
              <div className="flex gap-3 mt-3 shrink-0">
                <button
                  onClick={() => updateStatus(activeItem.id, "REJECTED")}
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-500/25 text-red-400 hover:bg-red-500/8 transition-all font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  <span>Reject</span>
                  <kbd className="text-[10px] px-1.5 py-0.5 bg-red-500/10 rounded font-mono">R</kbd>
                </button>
                <button
                  onClick={() => updateStatus(activeItem.id, "APPROVED")}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-foreground rounded-xl shadow-lg shadow-emerald-500/10 transition-all transform hover:scale-[1.01] active:scale-[0.99] font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  <span>Approve & Save to Dataset</span>
                  <kbd className="text-[10px] px-1.5 py-0.5 bg-white/20 rounded font-mono">A</kbd>
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Empty state
          <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-12">
            {loading ? (
              <>
                <Loader2 className="w-10 h-10 text-zinc-700 animate-spin" />
                <p className="text-zinc-600 text-sm">Loading dataset...</p>
              </>
            ) : (
              <>
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-5 rounded-full" />
                  <Database className="w-14 h-14 text-zinc-800 relative" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-400 mb-2">No Records Found</h2>
                  <p className="text-zinc-600 text-sm max-w-sm leading-relaxed">
                    The annotation queue is empty for <span className="text-zinc-500 font-mono">{filter}</span> status.
                    {filter === "PENDING" && " Seed sample data or run the pipeline to ingest PYQ PDFs."}
                  </p>
                </div>
                {filter === "PENDING" && (
                  <button
                    onClick={seedSampleData}
                    disabled={seeding}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl hover:bg-indigo-500/15 transition-colors font-bold text-sm disabled:opacity-50"
                  >
                    {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                    Seed Sample Dataset
                  </button>
                )}
                {/* Stats overview when empty */}
                {stats.total > 0 && (
                  <div className="flex gap-4 mt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-400">{stats.approved}</div>
                      <div className="text-[10px] text-zinc-600 font-mono">APPROVED</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
                      <div className="text-[10px] text-zinc-600 font-mono">REJECTED</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-zinc-400">{stats.total}</div>
                      <div className="text-[10px] text-zinc-600 font-mono">TOTAL</div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
