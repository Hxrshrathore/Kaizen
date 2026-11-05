"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  CheckCircle,
  XCircle,
  Search,
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
  Download,
  RefreshCw,
  Crop,
  Maximize2,
  Sliders,
  FileText,
  Layers,
  Calendar,
  AlertCircle,
  Check,
  Zap,
  ScanLine,
} from "lucide-react";

type OcrQuestion = {
  id: string;
  imagePath: string;
  subject: string | null;
  subjectCode: string | null;
  year: string | null;
  examType: string | null;
  sourcePdf: string | null;
  pageNumber: number | null;
  rawOcrText: string | null;
  correctedText: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  bboxX0: number | null;
  bboxY0: number | null;
  bboxX1: number | null;
  bboxY1: number | null;
  pageWidth: number | null;
  pageHeight: number | null;
  createdAt: string;
};

type PaperMeta = {
  sourcePdf: string;
  subject: string;
  subjectCode: string;
  examType: string;
  year: string;
  total: number;
  pending: number;
};

type SubjectMeta = {
  subject: string;
  subjectCode: string;
  count: number;
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
  const [recropping, setRecropping] = useState(false);
  const [activeItem, setActiveItem] = useState<OcrQuestion | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [editorText, setEditorText] = useState("");
  
  // Hierarchical Filter State
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [examTypeFilter, setExamTypeFilter] = useState("ALL");
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [paperFilter, setPaperFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Metadata dropdown options & stats
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [subjectsList, setSubjectsList] = useState<SubjectMeta[]>([]);
  const [papersList, setPapersList] = useState<PaperMeta[]>([]);

  // View & Tool States
  const [zoom, setZoom] = useState(1);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showRawOcr, setShowRawOcr] = useState(false);
  const [showPageModal, setShowPageModal] = useState(false);
  
  // Editable Tags
  const [editSubject, setEditSubject] = useState("");
  const [editSubjectCode, setEditSubjectCode] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editExamType, setEditExamType] = useState("");

  // Crop / Vertex Editing State
  const [boxCoords, setBoxCoords] = useState<{ x0: number; y0: number; x1: number; y1: number }>({
    x0: 0,
    y0: 0,
    x1: 595,
    y1: 842,
  });

  // Neural OCR Scanning & Smoker Effect State
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("Initializing vector stream...");
  const [textUpdatedPulse, setTextUpdatedPulse] = useState(false);
  const [ocrMethod, setOcrMethod] = useState<string | null>(null);

  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [imageKey, setImageKey] = useState<number>(Date.now());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Fetch Stats & Hierarchical Metadata ──────────────────────
  const fetchMetadataStats = useCallback(async () => {
    try {
      const resp = await fetch("/api/ingestion?stats=true");
      if (!resp.ok) return;
      const data = await resp.json();
      if (data.stats) setStats(data.stats);
      if (data.subjects) setSubjectsList(data.subjects);
      if (data.papers) setPapersList(data.papers);
    } catch (e) {
      console.error("Failed to fetch ingestion stats:", e);
    }
  }, []);

  useEffect(() => {
    fetchMetadataStats();
  }, [fetchMetadataStats]);

  // ── Fetch Questions with Hierarchical Filter ─────────────────
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (examTypeFilter !== "ALL") params.set("examType", examTypeFilter);
      if (subjectFilter !== "ALL") params.set("subject", subjectFilter);
      if (paperFilter !== "ALL") params.set("sourcePdf", paperFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      params.set("limit", "150");

      const resp = await fetch(`/api/ingestion?${params.toString()}`);
      const data = await resp.json();

      if (!Array.isArray(data)) {
        throw new Error(data.error || "Database query failed");
      }

      setQuestions(data);
      if (data.length > 0) {
        handleSelect(data[0], 0);
      } else {
        setActiveItem(null);
        setEditorText("");
      }
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Failed to load records", "err");
      setQuestions([]);
    }
    setLoading(false);
  }, [statusFilter, examTypeFilter, subjectFilter, paperFilter, searchQuery]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // ── Helpers ──────────────────────────────────────────────────
  const showToast = (msg: string, type: "ok" | "err") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSelect = (q: OcrQuestion, idx: number) => {
    setActiveItem(q);
    setActiveIdx(idx);
    setEditorText(q.correctedText || q.rawOcrText || "");
    setEditSubject(q.subject || "");
    setEditSubjectCode(q.subjectCode || "ENG2001");
    setEditYear(q.year || "2024");
    setEditExamType(q.examType || "Endsem");
    setZoom(1);
    setShowRawOcr(false);

    // Initial bounding box coordinates
    setBoxCoords({
      x0: q.bboxX0 ?? 50,
      y0: q.bboxY0 ?? 100,
      x1: q.bboxX1 ?? 500,
      y1: q.bboxY1 ?? 600,
    });
  };

  const navigateItem = useCallback(
    (dir: "prev" | "next") => {
      const newIdx =
        dir === "next"
          ? Math.min(activeIdx + 1, questions.length - 1)
          : Math.max(activeIdx - 1, 0);
      if (newIdx !== activeIdx && questions[newIdx]) {
        handleSelect(questions[newIdx], newIdx);
      }
    },
    [activeIdx, questions]
  );

  // ── Quick Uncrop / Expand Margins ───────────────────────────
  const handleQuickUncrop = async (delta: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  }) => {
    if (!activeItem || recropping || isScanning) return;
    setRecropping(true);
    setIsScanning(true);
    setScanStatus("Expanding boundary & re-scanning PDF stream...");

    const startTime = Date.now();
    const pw = activeItem.pageWidth || 595.32;
    const ph = activeItem.pageHeight || 841.92;

    const newX0 = Math.max(0, (boxCoords.x0 || 50) - (delta.left || 0));
    const newY0 = Math.max(0, (boxCoords.y0 || 100) - (delta.top || 0));
    const newX1 = Math.min(pw, (boxCoords.x1 || pw - 50) + (delta.right || 0));
    const newY1 = Math.min(ph, (boxCoords.y1 || ph - 100) + (delta.bottom || 0));

    try {
      const resp = await fetch("/api/pdf/recrop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: activeItem.id,
          bboxX0: newX0,
          bboxY0: newY0,
          bboxX1: newX1,
          bboxY1: newY1,
          updateText: true,
        }),
      });

      const res = await resp.json();
      if (!resp.ok) throw new Error(res.error || "Recrop failed");

      // Smooth animation dwell
      const elapsed = Date.now() - startTime;
      if (elapsed < 800) {
        await new Promise((r) => setTimeout(r, 800 - elapsed));
      }

      setBoxCoords({ x0: newX0, y0: newY0, x1: newX1, y1: newY1 });
      setImageKey(Date.now());
      if (res.extractedText) {
        setEditorText(res.extractedText);
        setTextUpdatedPulse(true);
        setTimeout(() => setTextUpdatedPulse(false), 2500);
      }

      // Update question in state
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === activeItem.id
            ? {
                ...q,
                bboxX0: newX0,
                bboxY0: newY0,
                bboxX1: newX1,
                bboxY1: newY1,
                rawOcrText: res.extractedText || q.rawOcrText,
                correctedText: res.extractedText || q.correctedText,
              }
            : q
        )
      );

      showToast("✓ Margins uncropped & re-scanned", "ok");
    } catch (e: any) {
      showToast(e.message || "Failed to uncrop", "err");
    } finally {
      setRecropping(false);
      setIsScanning(false);
      setScanStatus("");
    }
  };

  // ── Rerun Neural OCR ─────────────────────────────────────────
  const handleRerunOcr = async (forceGemini = false) => {
    if (!activeItem || isScanning || recropping) return;
    setIsScanning(true);
    setScanStatus("Acquiring vector coordinates & bounding stream...");

    const startTime = Date.now();
    const t1 = setTimeout(() => {
      setScanStatus("Parsing typographic glyphs, code & math expressions...");
    }, 350);
    const t2 = setTimeout(() => {
      setScanStatus(
        forceGemini
          ? "Streaming via Gemini 1.5 Flash Vision..."
          : "Synthesizing vector tokens & question stem..."
      );
    }, 750);

    try {
      const resp = await fetch("/api/pdf/recrop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: activeItem.id,
          bboxX0: boxCoords.x0,
          bboxY0: boxCoords.y0,
          bboxX1: boxCoords.x1,
          bboxY1: boxCoords.y1,
          updateText: true,
          forceGemini,
        }),
      });

      clearTimeout(t1);
      clearTimeout(t2);

      const res = await resp.json();
      if (!resp.ok) throw new Error(res.error || "OCR extraction failed");

      // Minimum animation duration so the user sees the scanning beam & smoker
      const elapsed = Date.now() - startTime;
      if (elapsed < 900) {
        await new Promise((r) => setTimeout(r, 900 - elapsed));
      }

      setScanStatus("Syncing extracted tokens to database...");
      await new Promise((r) => setTimeout(r, 200));

      if (res.extractedText) {
        setEditorText(res.extractedText);
        setTextUpdatedPulse(true);
        setTimeout(() => setTextUpdatedPulse(false), 2500);
      }

      setImageKey(Date.now());
      setOcrMethod(res.method || "pymupdf_vector");

      setQuestions((prev) =>
        prev.map((q) =>
          q.id === activeItem.id
            ? {
                ...q,
                rawOcrText: res.extractedText || q.rawOcrText,
                correctedText: res.extractedText || q.correctedText,
              }
            : q
        )
      );

      const methodLabel =
        res.method === "gemini_vision_ocr"
          ? "Gemini Vision OCR"
          : "PyMuPDF Neural Vector";
      showToast(
        `✓ OCR complete (${res.extractedText?.length || 0} chars via ${methodLabel})`,
        "ok"
      );
    } catch (e: any) {
      showToast(e.message || "Failed to rerun OCR", "err");
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setIsScanning(false);
      setScanStatus("");
    }
  };

  // ── Manual Coordinate Save (Full Page Modal) ─────────────────
  const saveCustomBox = async () => {
    if (!activeItem) return;
    setRecropping(true);
    setIsScanning(true);
    setScanStatus("Applying coordinates & running neural OCR...");
    setShowPageModal(false);

    try {
      const resp = await fetch("/api/pdf/recrop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: activeItem.id,
          bboxX0: boxCoords.x0,
          bboxY0: boxCoords.y0,
          bboxX1: boxCoords.x1,
          bboxY1: boxCoords.y1,
          updateText: true,
        }),
      });
      const res = await resp.json();
      if (!resp.ok) throw new Error(res.error || "Recrop failed");

      setImageKey(Date.now());
      if (res.extractedText) {
        setEditorText(res.extractedText);
        setTextUpdatedPulse(true);
        setTimeout(() => setTextUpdatedPulse(false), 2500);
      }
      showToast("✓ Custom bounding box applied & saved to DB!", "ok");
    } catch (e: any) {
      showToast(e.message || "Failed to save crop", "err");
    } finally {
      setRecropping(false);
      setIsScanning(false);
      setScanStatus("");
    }
  };

  // ── Update Question Status (Approve / Reject) ─────────────────
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
          subjectCode: editSubjectCode,
          year: editYear,
          examType: editExamType,
        }),
      });
      if (!resp.ok) throw new Error("Update failed");

      showToast(
        status === "APPROVED" ? "✓ Approved (A) & saved to dataset" : "✗ Rejected (R)",
        status === "APPROVED" ? "ok" : "err"
      );

      // Optimistic update: remove from list and auto-advance to next sequential item
      const nextList = questions.filter((q) => q.id !== id);
      setQuestions(nextList);
      fetchMetadataStats();

      if (nextList.length > 0) {
        const nextIdx = Math.min(activeIdx, nextList.length - 1);
        handleSelect(nextList[nextIdx], nextIdx);
      } else {
        setActiveItem(null);
        setEditorText("");
      }
    } catch {
      showToast("Update failed", "err");
    }
    setSubmitting(false);
  };

  const exportApproved = async () => {
    const resp = await fetch("/api/ingestion?status=APPROVED&limit=5000");
    const data: OcrQuestion[] = await resp.json();
    const csv = ["Subject,SubjectCode,Year,ExamType,Question"]
      .concat(
        data.map(
          (q) =>
            `"${q.subject || ""}","${q.subjectCode || ""}","${q.year || ""}","${
              q.examType || ""
            }","${(q.correctedText || "").replace(/"/g, '""')}"`
        )
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kaizen_approved_dataset_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Keyboard Shortcuts ───────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (document.activeElement === textareaRef.current) {
        if (e.key === "Escape") textareaRef.current?.blur();
        return;
      }
      switch (e.key.toLowerCase()) {
        case "j":
        case "arrowdown":
          e.preventDefault();
          navigateItem("next");
          break;
        case "k":
        case "arrowup":
          e.preventDefault();
          navigateItem("prev");
          break;
        case "a":
          if (activeItem) updateStatus(activeItem.id, "APPROVED");
          break;
        case "r":
          if (activeItem) updateStatus(activeItem.id, "REJECTED");
          break;
        case "e":
          e.preventDefault();
          textareaRef.current?.focus();
          break;
        case "u":
          setShowPageModal((v) => !v);
          break;
        case "o":
          e.preventDefault();
          handleRerunOcr(false);
          break;
        case "+":
        case "=":
          setZoom((z) => Math.min(z + 0.25, 3));
          break;
        case "-":
          setZoom((z) => Math.max(z - 0.25, 0.5));
          break;
        case "?":
          setShowShortcuts((v) => !v);
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeItem, navigateItem]);

  // Filtered papers dropdown based on current subject & examType
  const filteredPapers = papersList.filter((p) => {
    if (examTypeFilter !== "ALL" && p.examType !== examTypeFilter) return false;
    if (subjectFilter !== "ALL" && p.subject !== subjectFilter) return false;
    return true;
  });

  const progress =
    stats.total > 0
      ? Math.round(((stats.approved + stats.rejected) / stats.total) * 100)
      : 0;

  const getMediaUrl = (path: string | null) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `https://pub-60fc676d8ba24a13a46925ab4941ddb5.r2.dev${cleanPath}`;
  };

  return (
    <div className="h-[calc(100vh-64px)] bg-[#060608] text-zinc-100 flex flex-col font-sans overflow-hidden relative">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-2xl text-sm font-bold border backdrop-blur-xl transition-all ${
            toast.type === "ok"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/15 border-red-500/30 text-red-300"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div
          className="fixed inset-0 bg-background/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="bg-[#0f0f12] border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-bold mb-4 flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-indigo-400" /> Keyboard Shortcuts
            </h2>
            {[
              ["A", "Approve & Next (Fast)"],
              ["R", "Reject & Next"],
              ["J / ↓", "Next Question"],
              ["K / ↑", "Previous Question"],
              ["E", "Focus OCR text editor"],
              ["O", "Rerun Neural OCR (Scanner & Smoker)"],
              ["U", "Open Visual Page Cropper"],
              ["+ / -", "Zoom In / Out"],
              ["?", "Toggle this panel"],
            ].map(([key, desc]) => (
              <div
                key={key}
                className="flex justify-between items-center py-2 border-b border-zinc-800/50 text-xs last:border-0"
              >
                <span className="text-zinc-400">{desc}</span>
                <kbd className="px-2 py-0.5 bg-zinc-800 rounded font-mono text-zinc-300 font-bold">
                  {key}
                </kbd>
              </div>
            ))}
            <button
              onClick={() => setShowShortcuts(false)}
              className="mt-5 w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── TOP HEADER: Filter Hierarchy Bar ── */}
      <div className="h-14 border-b border-zinc-800/50 flex items-center justify-between px-4 bg-zinc-950/70 backdrop-blur-xl shrink-0 gap-3">
        {/* Title & Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h1 className="font-bold text-xs tracking-wider uppercase text-zinc-200 hidden sm:inline">
            PYQ Ingestion & Crop Engine
          </h1>
        </div>

        {/* Hierarchical Filters */}
        <div className="flex items-center gap-2 flex-1 max-w-3xl overflow-x-auto py-1">
          {/* Exam Type Toggle */}
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 shrink-0">
            {["ALL", "Midsem", "Endsem"].map((et) => (
              <button
                key={et}
                onClick={() => setExamTypeFilter(et)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                  examTypeFilter === et
                    ? "bg-indigo-600 text-foreground shadow"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {et}
              </button>
            ))}
          </div>

          {/* Subject Filter Dropdown */}
          <select
            value={subjectFilter}
            onChange={(e) => {
              setSubjectFilter(e.target.value);
              setPaperFilter("ALL"); // Reset paper filter when subject changes
            }}
            className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 max-w-[200px] shrink-0"
          >
            <option value="ALL">All Subjects ({subjectsList.length})</option>
            {subjectsList.map((s) => (
              <option key={s.subject} value={s.subject}>
                {s.subject} ({s.subjectCode}) · {s.count}
              </option>
            ))}
          </select>

          {/* Paper Selector Dropdown */}
          <select
            value={paperFilter}
            onChange={(e) => setPaperFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 flex-1 min-w-[180px] max-w-[280px] truncate"
          >
            <option value="ALL">All Papers ({filteredPapers.length})</option>
            {filteredPapers.map((p) => (
              <option key={p.sourcePdf} value={p.sourcePdf}>
                [{p.examType}] {p.sourcePdf} ({p.total} q · {p.pending} pend)
              </option>
            ))}
          </select>
        </div>

        {/* Global Stats & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden lg:flex items-center gap-1.5 font-mono text-[11px]">
            <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold">
              {stats.pending} PENDING
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
              {stats.approved} APPROVED
            </span>
          </div>

          <button
            onClick={() => setShowShortcuts(true)}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800"
            title="Shortcuts (?)"
          >
            <Keyboard className="w-4 h-4" />
          </button>
          <button
            onClick={exportApproved}
            className="p-1.5 text-zinc-400 hover:text-emerald-400 rounded-lg hover:bg-zinc-800"
            title="Export Approved CSV"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              fetchMetadataStats();
              fetchQuestions();
            }}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Line */}
      <div className="h-1 bg-zinc-900 shrink-0">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ── MAIN CONTENT: Sidebar + Editor ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── LEFT: Sequential Question Stream ── */}
        <div className="w-[320px] md:w-[350px] border-r border-zinc-800/40 bg-[#060608] flex flex-col shrink-0">
          {/* Status Sub-filter + Search */}
          <div className="p-2.5 border-b border-zinc-800/40 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search text or subject..."
                className="w-full bg-zinc-900/90 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 text-zinc-300 placeholder:text-zinc-600"
              />
            </div>
            <div className="flex gap-1">
              {["PENDING", "APPROVED", "REJECTED", "ALL"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`flex-1 text-[10px] py-1 rounded font-bold transition-all ${
                    statusFilter === st
                      ? st === "PENDING"
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        : st === "APPROVED"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : st === "REJECTED"
                        ? "bg-red-500/15 text-red-400 border border-red-500/30"
                        : "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                      : "bg-zinc-900/60 text-zinc-500 hover:text-zinc-300 border border-transparent"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Sequential Question List */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/20">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-40 text-zinc-500 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                <span className="text-xs">Loading sequential queue...</span>
              </div>
            ) : questions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-zinc-600 gap-2 p-6 text-center">
                <Inbox className="w-8 h-8 opacity-40" />
                <p className="text-xs">No questions matching current filters.</p>
              </div>
            ) : (
              questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => handleSelect(q, idx)}
                  className={`w-full text-left px-3 py-2.5 transition-all group ${
                    activeItem?.id === q.id
                      ? "bg-indigo-500/10 border-l-2 border-l-indigo-500"
                      : "hover:bg-zinc-900/40 border-l-2 border-l-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] font-mono font-bold text-indigo-400 shrink-0">
                        #{idx + 1}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-zinc-800 text-zinc-400 rounded">
                        p.{q.pageNumber || 1}
                      </span>
                      <span className="text-[10px] text-zinc-500 truncate font-mono">
                        {q.subjectCode || "ENG"}
                      </span>
                    </div>
                    <div
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        q.status === "PENDING"
                          ? "bg-amber-400"
                          : q.status === "APPROVED"
                          ? "bg-emerald-400"
                          : "bg-red-400"
                      }`}
                    />
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {q.correctedText || q.rawOcrText || "(No OCR text available)"}
                  </p>
                </button>
              ))
            )}
          </div>

          {/* Sequential Pagination Nav */}
          <div className="p-2 border-t border-zinc-800/40 flex items-center justify-between gap-2 bg-zinc-950/40 text-xs">
            <button
              onClick={() => navigateItem("prev")}
              disabled={activeIdx === 0}
              className="flex-1 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1 font-medium"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev (K)
            </button>
            <span className="text-[10px] font-mono text-zinc-500">
              {questions.length > 0 ? `${activeIdx + 1} / ${questions.length}` : "0 / 0"}
            </span>
            <button
              onClick={() => navigateItem("next")}
              disabled={activeIdx >= questions.length - 1}
              className="flex-1 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1 font-medium"
            >
              Next (J) <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── RIGHT: Question Viewer, Crop Toolbar & Editor ── */}
        {activeItem ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Info Strip of Active Question */}
            <div className="px-4 py-2 bg-zinc-900/50 border-b border-zinc-800/40 flex items-center justify-between text-xs shrink-0 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-mono font-bold rounded text-[11px]">
                  {activeItem.subjectCode || "ENG2001"}
                </span>
                <span className="font-bold text-zinc-200 truncate">
                  {activeItem.subject || "General Engineering"}
                </span>
                <span className="text-zinc-500">·</span>
                <span className="text-zinc-400 font-mono text-[11px]">
                  {activeItem.year} {activeItem.examType}
                </span>
                <span className="text-zinc-500">·</span>
                <span className="text-zinc-400 font-mono text-[11px] truncate max-w-[200px]" title={activeItem.sourcePdf || ""}>
                  {activeItem.sourcePdf}
                </span>
                <span className="text-indigo-300 font-mono text-[11px] font-bold">
                  (Page {activeItem.pageNumber})
                </span>
              </div>

              {/* Progress within current selected paper */}
              <div className="text-[11px] font-mono text-zinc-400 shrink-0">
                Question <span className="text-zinc-200 font-bold">{activeIdx + 1}</span> of{" "}
                <span className="text-zinc-200 font-bold">{questions.length}</span>
              </div>
            </div>

            {/* Image Preview & Dynamic Uncrop Controls */}
            <div className="h-[46%] border-b border-zinc-800/40 bg-[#06060a] flex flex-col shrink-0">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-1.5 border-b border-zinc-800/30 shrink-0 bg-zinc-950/40">
                {/* Uncrop / Expand Controls */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold mr-1">
                    Uncrop:
                  </span>
                  <button
                    onClick={() => handleQuickUncrop({ top: 30 })}
                    disabled={recropping}
                    className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-800 text-[10px] font-mono flex items-center gap-1 hover:border-indigo-500/50 transition-colors"
                    title="Uncrop Top boundary by 30pt"
                  >
                    ▲ Top +30pt
                  </button>
                  <button
                    onClick={() => handleQuickUncrop({ bottom: 30 })}
                    disabled={recropping}
                    className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-800 text-[10px] font-mono flex items-center gap-1 hover:border-indigo-500/50 transition-colors"
                    title="Uncrop Bottom boundary by 30pt"
                  >
                    ▼ Bottom +30pt
                  </button>
                  <button
                    onClick={() => handleQuickUncrop({ left: 20, right: 20 })}
                    disabled={recropping}
                    className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-800 text-[10px] font-mono flex items-center gap-1 hover:border-indigo-500/50 transition-colors"
                    title="Uncrop Left & Right by 20pt"
                  >
                    ◀▶ Width +40pt
                  </button>
                  <button
                    onClick={() => setShowPageModal(true)}
                    className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded border border-indigo-500/30 text-[10px] font-bold flex items-center gap-1.5 transition-colors"
                    title="Open full page view to visually resize bounding box"
                  >
                    <Sliders className="w-3 h-3" /> Visual Page Cropper (U)
                  </button>
                  <button
                    onClick={() => handleRerunOcr(false)}
                    disabled={recropping || isScanning}
                    className="px-2.5 py-1 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 hover:from-cyan-500/30 hover:to-indigo-500/30 text-cyan-300 rounded border border-cyan-500/40 text-[10px] font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(6,182,212,0.15)] hover:shadow-[0_0_18px_rgba(6,182,212,0.35)]"
                    title="Rerun Neural OCR over current bounding box (Hotkey: O)"
                  >
                    <Sparkles className={`w-3 h-3 ${isScanning ? "animate-spin text-cyan-400" : "text-cyan-400"}`} />
                    <span>{isScanning ? "Scanning..." : "Rerun OCR (O)"}</span>
                  </button>
                </div>

                {/* Zoom controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
                    className="p-1 text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-800"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono text-zinc-400 w-8 text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
                    className="p-1 text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-800"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setZoom(1)}
                    className="p-1 text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-800"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Image Viewport */}
              <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-[#08080c] relative">
                {/* ── HIGH-TECH NEURAL OCR & SMOKER SCANNER OVERLAY ── */}
                {(isScanning || recropping) && (
                  <div className="absolute inset-0 z-30 bg-black/65 backdrop-blur-[3px] flex flex-col items-center justify-center overflow-hidden pointer-events-none select-none">
                    {/* SVG Gooey Smoke Filter (preloader fluid physics) */}
                    <svg className="absolute w-0 h-0 pointer-events-none">
                      <defs>
                        <filter id="neural-ocr-gooey-smoke">
                          <feGaussianBlur in="SourceGraphic" stdDeviation={14} result="blur" />
                          <feColorMatrix
                            in="blur"
                            mode="matrix"
                            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 45 -7"
                            result="goo"
                          />
                          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                        </filter>
                      </defs>
                    </svg>

                    {/* Organic Smoky Plasma Waves */}
                    <div
                      className="absolute inset-0 pointer-events-none overflow-hidden opacity-45 mix-blend-screen"
                      style={{ filter: "url(#neural-ocr-gooey-smoke)" }}
                    >
                      <div className="ocr-smoke-orb-1" />
                      <div className="ocr-smoke-orb-2" />
                      <div className="ocr-smoke-orb-3" />
                    </div>

                    {/* Cybernetic Laser Scanning Beam */}
                    <div className="ocr-laser-line pointer-events-none">
                      <div className="w-full h-[2.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#22d3ee,0_0_40px_#6366f1,0_0_70px_#38bdf8]" />
                      <div className="w-full h-28 -mt-28 bg-gradient-to-t from-cyan-500/25 via-indigo-500/10 to-transparent pointer-events-none" />
                      <div className="absolute left-1/2 -top-1.5 -translate-x-1/2 w-3.5 h-3.5 bg-cyan-300 rounded-full blur-[1px] shadow-[0_0_15px_#22d3ee]" />
                    </div>

                    {/* HUD Target Reticles (4 Corners) */}
                    <div className="absolute top-4 left-4 w-7 h-7 border-t-2 border-l-2 border-cyan-400/80 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                    <div className="absolute top-4 right-4 w-7 h-7 border-t-2 border-r-2 border-cyan-400/80 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                    <div className="absolute bottom-4 left-4 w-7 h-7 border-b-2 border-l-2 border-cyan-400/80 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                    <div className="absolute bottom-4 right-4 w-7 h-7 border-b-2 border-r-2 border-cyan-400/80 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />

                    {/* Centered Futuristic HUD Telemetry Card */}
                    <div className="relative z-30 px-6 py-4 rounded-2xl bg-zinc-950/85 border border-cyan-500/40 backdrop-blur-md shadow-[0_0_35px_rgba(6,182,212,0.25)] flex flex-col items-center gap-2 max-w-sm text-center">
                      <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold tracking-widest uppercase">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
                        </span>
                        <span>NEURAL OCR STREAMING</span>
                      </div>
                      <p className="text-xs text-zinc-200 font-mono tracking-wide animate-pulse">
                        {scanStatus}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-400 border-t border-zinc-800/80 pt-2 mt-1">
                        <span className="text-indigo-300">
                          [{boxCoords.x0.toFixed(0)}, {boxCoords.y0.toFixed(0)}] → [{boxCoords.x1.toFixed(0)}, {boxCoords.y1.toFixed(0)}]
                        </span>
                        <span className="text-zinc-600">|</span>
                        <span className="text-emerald-400 font-semibold">200 DPI VECTORS</span>
                      </div>
                    </div>
                  </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={imageKey}
                  src={`${getMediaUrl(activeItem.imagePath)}?t=${imageKey}`}
                  alt="Question Crop"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: "center",
                    transition: "transform 0.15s ease",
                  }}
                  className="max-w-full max-h-full object-contain rounded shadow-2xl border border-zinc-800/40"
                />
              </div>
            </div>

            {/* Editor Pane */}
            <div className="flex-1 flex flex-col p-3 overflow-hidden bg-[#07070a]">
              {/* Metadata tag editor */}
              <div className="flex items-center justify-between mb-2 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                    Question Text & Tags
                  </span>
                  <input
                    value={editSubjectCode}
                    onChange={(e) => setEditSubjectCode(e.target.value)}
                    placeholder="Code (e.g. CS20002)"
                    className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded text-[11px] font-mono text-indigo-300 w-24 focus:outline-none focus:border-indigo-500"
                    title="Subject Code"
                  />
                  <input
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    placeholder="Subject Name"
                    className="px-2 py-0.5 bg-zinc-800/80 border border-zinc-700/60 rounded text-[11px] text-zinc-300 w-44 focus:outline-none focus:border-indigo-500"
                    title="Subject Name"
                  />
                  <input
                    value={editYear}
                    onChange={(e) => setEditYear(e.target.value)}
                    placeholder="Year"
                    className="px-2 py-0.5 bg-zinc-800/80 border border-zinc-700/60 rounded text-[11px] font-mono text-zinc-300 w-16 focus:outline-none focus:border-indigo-500"
                    title="Year"
                  />
                  <input
                    value={editExamType}
                    onChange={(e) => setEditExamType(e.target.value)}
                    placeholder="Exam Type"
                    className="px-2 py-0.5 bg-zinc-800/80 border border-zinc-700/60 rounded text-[11px] text-zinc-300 w-20 focus:outline-none focus:border-indigo-500"
                    title="Exam Type"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {activeItem.rawOcrText && activeItem.rawOcrText !== editorText && (
                    <button
                      onClick={() => setShowRawOcr((v) => !v)}
                      className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
                    >
                      {showRawOcr ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      Original OCR
                    </button>
                  )}
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-mono">
                    Shortcuts: [A] Approve · [R] Reject · [E] Edit
                  </span>
                </div>
              </div>

              {/* Raw OCR diff view if requested */}
              {showRawOcr && activeItem.rawOcrText && (
                <div className="mb-2 p-2.5 bg-zinc-900/80 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-500 line-clamp-3 shrink-0">
                  <span className="font-bold text-zinc-400">Previous Extraction: </span>
                  {activeItem.rawOcrText}
                </div>
              )}

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={editorText}
                onChange={(e) => setEditorText(e.target.value)}
                className={`flex-1 w-full bg-zinc-900/60 border rounded-xl p-3 text-zinc-100 font-mono text-xs leading-relaxed resize-none focus:outline-none shadow-inner transition-all duration-300 ${
                  textUpdatedPulse
                    ? "border-emerald-500/80 ring-2 ring-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.25)] bg-emerald-950/10"
                    : "border-zinc-800 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                }`}
                placeholder="Question text..."
              />

              {/* Action Buttons: Approve & Reject */}
              <div className="flex items-center gap-3 mt-2 shrink-0">
                <button
                  onClick={() => updateStatus(activeItem.id, "REJECTED")}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40"
                >
                  <XCircle className="w-4 h-4" /> Reject (R)
                </button>
                <button
                  onClick={() => updateStatus(activeItem.id, "APPROVED")}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-foreground font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 transition-all disabled:opacity-40"
                >
                  <CheckCircle className="w-4 h-4" /> Approve & Save to Dataset (A)
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Empty / Complete View */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <Database className="w-12 h-12 text-zinc-700" />
            <h2 className="text-lg font-bold text-zinc-300">All Questions Processed</h2>
            <p className="text-xs text-zinc-500 max-w-sm">
              No questions remaining in this category. Select another Subject or Paper from the top
              dropdown to continue rapid review!
            </p>
          </div>
        )}
      </div>

      {/* ── VISUAL PAGE CROPPER MODAL ── */}
      {showPageModal && activeItem && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setShowPageModal(false)}
        >
          <div
            className="bg-[#0f0f14] border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
              <div className="flex items-center gap-2">
                <Crop className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm text-zinc-200">
                  Visual Page Cropper — {activeItem.sourcePdf} (Page {activeItem.pageNumber})
                </h3>
              </div>
              <button
                onClick={() => setShowPageModal(false)}
                className="text-zinc-400 hover:text-zinc-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Coordinates Adjustment Controls */}
            <div className="px-5 py-2.5 bg-zinc-900/60 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono text-zinc-400 font-bold">4 Vertices (pt):</span>
                <div className="flex items-center gap-1.5 font-mono">
                  <label className="text-zinc-500">X0:</label>
                  <input
                    type="number"
                    value={Math.round(boxCoords.x0)}
                    onChange={(e) =>
                      setBoxCoords((prev) => ({ ...prev, x0: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-16 px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-200"
                  />
                  <label className="text-zinc-500 ml-2">Y0:</label>
                  <input
                    type="number"
                    value={Math.round(boxCoords.y0)}
                    onChange={(e) =>
                      setBoxCoords((prev) => ({ ...prev, y0: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-16 px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-200"
                  />
                  <label className="text-zinc-500 ml-2">X1:</label>
                  <input
                    type="number"
                    value={Math.round(boxCoords.x1)}
                    onChange={(e) =>
                      setBoxCoords((prev) => ({ ...prev, x1: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-16 px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-200"
                  />
                  <label className="text-zinc-500 ml-2">Y1:</label>
                  <input
                    type="number"
                    value={Math.round(boxCoords.y1)}
                    onChange={(e) =>
                      setBoxCoords((prev) => ({ ...prev, y1: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-16 px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-200"
                  />
                </div>
              </div>

              {/* Quick Padding Buttons */}
              <div className="flex items-center gap-1 font-mono text-[11px]">
                <button
                  onClick={() =>
                    setBoxCoords((prev) => ({
                      ...prev,
                      y0: Math.max(0, prev.y0 - 25),
                      y1: Math.min(activeItem.pageHeight || 842, prev.y1 + 25),
                    }))
                  }
                  className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300"
                >
                  Expand Y (+50pt)
                </button>
                <button
                  onClick={() =>
                    setBoxCoords((prev) => ({
                      ...prev,
                      x0: Math.max(0, prev.x0 - 20),
                      x1: Math.min(activeItem.pageWidth || 595, prev.x1 + 20),
                    }))
                  }
                  className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300"
                >
                  Expand X (+40pt)
                </button>
              </div>
            </div>

            {/* Modal Body: Full Page Image with Crop Box Overlay */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[#070709] relative min-h-[400px]">
              <div
                className="relative inline-block border border-zinc-800 shadow-2xl"
                style={{
                  width: activeItem.pageWidth ? `${activeItem.pageWidth}px` : "595px",
                  height: activeItem.pageHeight ? `${activeItem.pageHeight}px` : "842px",
                }}
              >
                {/* Full page background from /api/pdf/page */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/pdf/page?pdf=${encodeURIComponent(
                    activeItem.sourcePdf || ""
                  )}&page=${activeItem.pageNumber || 1}&dpi=100`}
                  alt="Full PDF page"
                  className="w-full h-full object-contain pointer-events-none select-none"
                />

                {/* Crop Box Overlay */}
                <div
                  className="absolute border-2 border-emerald-400 bg-emerald-400/15 shadow-[0_0_15px_rgba(52,211,153,0.3)] pointer-events-none"
                  style={{
                    left: `${(boxCoords.x0 / (activeItem.pageWidth || 595.32)) * 100}%`,
                    top: `${(boxCoords.y0 / (activeItem.pageHeight || 841.92)) * 100}%`,
                    width: `${
                      ((boxCoords.x1 - boxCoords.x0) / (activeItem.pageWidth || 595.32)) * 100
                    }%`,
                    height: `${
                      ((boxCoords.y1 - boxCoords.y0) / (activeItem.pageHeight || 841.92)) * 100
                    }%`,
                  }}
                >
                  {/* Vertex handle tags */}
                  <div className="absolute top-1 left-1 bg-emerald-500 text-black font-mono font-bold text-[9px] px-1 rounded shadow">
                    Crop Area
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-zinc-800 flex items-center justify-between bg-zinc-950/80">
              <span className="text-xs text-zinc-500">
                Adjust the vertex coordinates above to include all lines and answer choices.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPageModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCustomBox}
                  disabled={recropping}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-foreground rounded-xl text-xs font-bold transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
                >
                  {recropping ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  Save & Apply Crop to Database
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Keyframe styles for OCR laser scan & gooey smoke physics ── */}
      <style>{`
        @keyframes ocrLaserSweep {
          0% {
            top: 0%;
            opacity: 0.85;
          }
          50% {
            top: 96%;
            opacity: 1;
          }
          100% {
            top: 0%;
            opacity: 0.85;
          }
        }

        @keyframes ocrSmokeOrb1 {
          0% {
            transform: translate(-30%, -20%) scale(1) rotate(0deg);
          }
          50% {
            transform: translate(30%, 20%) scale(1.3) rotate(180deg);
          }
          100% {
            transform: translate(-30%, -20%) scale(1) rotate(360deg);
          }
        }

        @keyframes ocrSmokeOrb2 {
          0% {
            transform: translate(30%, 25%) scale(1.2) rotate(360deg);
          }
          50% {
            transform: translate(-30%, -20%) scale(0.9) rotate(180deg);
          }
          100% {
            transform: translate(30%, 25%) scale(1.2) rotate(0deg);
          }
        }

        @keyframes ocrSmokeOrb3 {
          0% {
            transform: scale(0.85) rotate(0deg);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.4) rotate(90deg);
            opacity: 0.85;
          }
          100% {
            transform: scale(0.85) rotate(180deg);
            opacity: 0.5;
          }
        }

        .ocr-laser-line {
          position: absolute;
          left: 0;
          right: 0;
          animation: ocrLaserSweep 2.2s ease-in-out infinite;
          z-index: 25;
        }

        .ocr-smoke-orb-1 {
          position: absolute;
          width: 280px;
          height: 280px;
          top: 15%;
          left: 15%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(6, 182, 212, 0.75) 0%, rgba(99, 102, 241, 0.45) 60%, transparent 80%);
          animation: ocrSmokeOrb1 5.5s ease-in-out infinite;
        }

        .ocr-smoke-orb-2 {
          position: absolute;
          width: 340px;
          height: 340px;
          bottom: 10%;
          right: 15%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.7) 0%, rgba(16, 185, 129, 0.4) 60%, transparent 80%);
          animation: ocrSmokeOrb2 6.5s ease-in-out infinite;
        }

        .ocr-smoke-orb-3 {
          position: absolute;
          width: 220px;
          height: 220px;
          top: 35%;
          left: 45%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(14, 165, 233, 0.7) 0%, rgba(139, 92, 246, 0.35) 60%, transparent 80%);
          animation: ocrSmokeOrb3 4.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
