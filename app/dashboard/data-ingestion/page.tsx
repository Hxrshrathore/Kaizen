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
  RotateCw,
  Database,
  Eye,
  EyeOff,
  Download,
  RefreshCw,
  Crop,
  Maximize2,
  Sliders,
  FileText,
  Layers,
  Check,
  Zap,
  ScanLine,
  Move,
  Upload,
  FileCode,
  Terminal,
  Cpu,
  Play,
  Activity,
  MoreHorizontal,
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
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  bboxX0: number | null;
  bboxY0: number | null;
  bboxX1: number | null;
  bboxY1: number | null;
  pageWidth: number | null;
  pageHeight: number | null;
  rotation?: number | null;
  createdAt: string;
  contentType?: string;
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

  // Architecture Tier: Neon DB Production vs Upstash Redis Staging Buffer
  const [dataSource, setDataSource] = useState<"neon" | "redis">("redis");
  const [stagingStats, setStagingStats] = useState({
    stagedPending: 0,
    totalStagedKeys: 0,
    neonApprovedTotal: 0,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // View & Tool States
  const [zoom, setZoom] = useState(1);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showRawOcr, setShowRawOcr] = useState(false);
  const [showPageModal, setShowPageModal] = useState(false);
  const [viewMode, setViewMode] = useState<"zoomed" | "crop">("zoomed");

  // Apple-style View & Loading States
  const [renderMode, setRenderMode] = useState<"fast_cdn" | "live_pdf">("fast_cdn");
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [editorTab, setEditorTab] = useState<"text" | "math" | "meta">("text");

  const handleFixCropLoading = () => {
    setRenderMode("fast_cdn");
    setImageError(false);
    setImageLoading(false);
    setImageKey(Date.now());
    setViewMode("zoomed");
    showToast("✓ Bypassed slow PDF vector render. Restored instant snapshot!", "ok");
  };

  // Apple-style Intelligence: Clean & Format OCR text
  const handleAiCleanText = () => {
    if (!editorText.trim()) return;
    let cleaned = editorText
      // Remove repetitive institutional header noise if caught in crop
      .replace(/^.*KIIT\s*(DEEMED\s*TO\s*BE)?\s*UNIVERSITY.*$/gim, "")
      .replace(/^.*SCHOOL\s*OF\s*COMPUTER\s*ENGINEERING.*$/gim, "")
      .replace(/^.*AUTUMN|SPRING\s*END\s*SEMESTER\s*EXAM.*$/gim, "")
      .replace(/^.*Page\s*\d+\s*(of\s*\d+)?.*$/gim, "")
      .replace(/^.*(Time|Full\s*Marks)\s*:\s*.*$/gim, "")
      // Normalize question numbering bullets
      .replace(/^\s*([0-9]+)\s*[\.)]\s*/gm, "\n$1. ")
      .replace(/^\s*\(([a-z0-9]+)\)\s*/gm, "\n   ($1) ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    setEditorText(cleaned);
    setTextUpdatedPulse(true);
    setTimeout(() => setTextUpdatedPulse(false), 2000);
    showToast("✨ Question text polished & noise removed", "ok");
  };

  // Apple-style Intelligence: Format Math / LaTeX
  const handleFormatLatex = () => {
    if (!editorText.trim()) return;
    let formatted = editorText
      .replace(/\bint\b/g, "\\int")
      .replace(/\bsum\b/g, "\\sum")
      .replace(/\btheta\b/g, "\\theta")
      .replace(/\balpha\b/g, "\\alpha")
      .replace(/\bbeta\b/g, "\\beta")
      .replace(/\bpi\b/g, "\\pi")
      .replace(/\binfinity\b/g, "\\infty")
      .replace(/<=/g, "\\le")
      .replace(/>=/g, "\\ge")
      .replace(/!=/g, "\\ne");

    setEditorText(formatted);
    setTextUpdatedPulse(true);
    setTimeout(() => setTextUpdatedPulse(false), 2000);
    showToast("📐 Math symbols converted to LaTeX notation", "ok");
  };

  // Dragging state for photo-editor style crop
  const [dragHandle, setDragHandle] = useState<
    "move" | "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w" | "draw" | null
  >(null);
  const [dragStart, setDragStart] = useState<{
    mouseX: number;
    mouseY: number;
    initialBox: { x0: number; y0: number; x1: number; y1: number };
  }>({
    mouseX: 0,
    mouseY: 0,
    initialBox: { x0: 0, y0: 0, x1: 595, y1: 842 },
  });

  const cropCanvasRef = useRef<HTMLDivElement>(null);
  const fullscreenCanvasRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [fullscreenStudio, setFullscreenStudio] = useState(false);
  const [rotation, setRotation] = useState<number>(0);

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

  const handleRotate = (deg = 90) => {
    const nextRot = (rotation + deg) % 360;
    setRotation(nextRot);
    setImageKey(Date.now());
    showToast(`Rotated image to ${nextRot}°`, "ok");
  };

  const applyPreset = (preset: "q1" | "q2" | "q3" | "full" | "auto") => {
    if (!activeItem) return;
    const isSideways = rotation % 180 === 90;
    const pw = isSideways ? (activeItem.pageHeight || 841.92) : (activeItem.pageWidth || 595.32);
    const ph = isSideways ? (activeItem.pageWidth || 595.32) : (activeItem.pageHeight || 841.92);
    if (preset === "q1") {
      setBoxCoords({ x0: 35, y0: 80, x1: pw - 35, y1: Math.min(ph * 0.35, 280) });
    } else if (preset === "q2") {
      setBoxCoords({ x0: 35, y0: ph * 0.32, x1: pw - 35, y1: ph * 0.65 });
    } else if (preset === "q3") {
      setBoxCoords({ x0: 35, y0: ph * 0.63, x1: pw - 35, y1: ph - 40 });
    } else if (preset === "full") {
      setBoxCoords({ x0: 25, y0: 40, x1: pw - 25, y1: ph - 40 });
    } else if (preset === "auto") {
      if (activeItem.bboxX0 !== null && activeItem.bboxX1 !== null) {
        setBoxCoords({
          x0: activeItem.bboxX0,
          y0: activeItem.bboxY0 || 40,
          x1: activeItem.bboxX1,
          y1: activeItem.bboxY1 || 280,
        });
      } else {
        setBoxCoords({ x0: 35, y0: 80, x1: pw - 35, y1: Math.min(ph * 0.45, 380) });
      }
    }
  };

  // Neural OCR Scanning & Laser State
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("Initializing vector stream...");
  const [textUpdatedPulse, setTextUpdatedPulse] = useState(false);
  const [ocrMethod, setOcrMethod] = useState<string | null>(null);

  // Live OCR & Pipeline Observation Studio State
  const [showOcrStudio, setShowOcrStudio] = useState(false);
  const [ocrStudioTab, setOcrStudioTab] = useState<"runner" | "inspector" | "telemetry">("runner");
  const [rawPdfList, setRawPdfList] = useState<string[]>([]);
  const [selectedRawPdf, setSelectedRawPdf] = useState("");
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([
    "[READY] Kaizen Multi-Format OCR & Pipeline Studio initialized.",
    "[R2 CDN] Cloudflare R2 object storage connected (bucket: kaizen).",
    "[STAGING] Upstash Redis staging buffer active.",
  ]);
  const [testOcrRunning, setTestOcrRunning] = useState(false);
  const [testOcrResult, setTestOcrResult] = useState<{
    extractedText: string;
    method: string;
    latencyMs: number;
    tokensExtracted: number;
    hasLatex: boolean;
    bbox?: number[];
  } | null>(null);
  const [manualOverlayScan, setManualOverlayScan] = useState(false);
  const [showFormulaPreview, setShowFormulaPreview] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [imageKey, setImageKey] = useState<number>(Date.now());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const logTerminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll pipeline logs to bottom
  useEffect(() => {
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
    }
  }, [pipelineLogs]);

  // Fetch list of raw PDFs for the live pipeline runner
  const fetchRawPdfs = useCallback(async () => {
    try {
      const resp = await fetch("/api/ingestion/stream");
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data.files) && data.files.length > 0) {
          setRawPdfList(data.files);
          setSelectedRawPdf(data.files[0]);
        }
      }
    } catch (e) {
      console.error("Failed to load raw PDFs list:", e);
    }
  }, []);

  useEffect(() => {
    fetchRawPdfs();
  }, [fetchRawPdfs]);

  // Run Live Pipeline
  const handleRunLivePipeline = async (targetFile?: string) => {
    const fileToIngest = targetFile || selectedRawPdf;
    if (!fileToIngest || pipelineRunning) return;

    setPipelineRunning(true);
    setPipelineStep(1);
    const ts = () => new Date().toLocaleTimeString();

    const appendLog = (msg: string) => {
      setPipelineLogs((prev) => [...prev, `[${ts()}] ${msg}`]);
    };

    appendLog(`>>> STARTING LIVE INGESTION PIPELINE: ${fileToIngest}`);
    appendLog(`[Step 1/5] Slicing raw PDF pages & rendering 200 DPI vector bitmap...`);

    const t1 = setTimeout(() => {
      setPipelineStep(2);
      appendLog(`[Step 2/5] Applying Pillow enhancement: 1.35x contrast boost, 1.5x sharpness, haze reduction...`);
    }, 700);

    const t2 = setTimeout(() => {
      setPipelineStep(3);
      appendLog(`[Step 3/5] Streaming enhanced page PNG to Cloudflare R2 bucket 'kaizen'...`);
    }, 1500);

    const t3 = setTimeout(() => {
      setPipelineStep(4);
      appendLog(`[Step 4/5] Executing AI OCR & Typographic Glyph parser (LaTeX math, marks, question isolation)...`);
    }, 2400);

    try {
      const resp = await fetch("/api/ingestion/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: fileToIngest }),
      });

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      const res = await resp.json();
      if (!resp.ok) throw new Error(res.error || "Pipeline failed");

      setPipelineStep(5);
      appendLog(`[Step 5/5] Staged ${res.stagedCount} clean questions into Upstash Redis staging buffer!`);
      appendLog(`✓ PIPELINE COMPLETE: ${res.totalPages} pages processed, ${res.totalPendingInRedis} total items in Redis queue.`);

      showToast(`✓ Ingested ${res.stagedCount} questions into Redis staging!`, "ok");

      fetchMetadataStats();
      if (dataSource === "redis") {
        fetchQuestions();
      }
    } catch (err: any) {
      appendLog(`[ERROR] Pipeline failed: ${err.message}`);
      showToast(err.message || "Pipeline error", "err");
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setPipelineRunning(false);
    }
  };

  // Run Test OCR on currently cropped region
  const handleTestOcrLive = async () => {
    if (!activeItem || testOcrRunning) return;
    setTestOcrRunning(true);
    showToast("Testing OCR on active question crop...", "ok");

    try {
      const resp = await fetch("/api/ocr/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourcePdf: activeItem.sourcePdf,
          pageNumber: activeItem.pageNumber || 1,
          bboxX0: boxCoords.x0,
          bboxY0: boxCoords.y0,
          bboxX1: boxCoords.x1,
          bboxY1: boxCoords.y1,
          rotation,
          dpi: 200,
          forceGemini: true,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "OCR test failed");

      setTestOcrResult(data);
      showToast(`✓ OCR extracted ${data.tokensExtracted} tokens in ${data.latencyMs}ms!`, "ok");
    } catch (e: any) {
      showToast(e.message || "OCR test failed", "err");
    } finally {
      setTestOcrRunning(false);
    }
  };

  // Fetch Stats & Metadata
  const fetchMetadataStats = useCallback(async () => {
    try {
      const resp = await fetch("/api/ingestion?stats=true");
      if (resp.ok) {
        const data = await resp.json();
        if (data.stats) setStats(data.stats);
        if (data.subjects) setSubjectsList(data.subjects);
        if (data.papers) setPapersList(data.papers);
      }
      const stgResp = await fetch("/api/staging?limit=1");
      if (stgResp.ok) {
        const stgData = await stgResp.json();
        if (stgData.stats) setStagingStats(stgData.stats);
      }
    } catch (e) {
      console.error("Failed to fetch ingestion stats:", e);
    }
  }, []);

  useEffect(() => {
    fetchMetadataStats();
  }, [fetchMetadataStats]);

  // Fetch Questions
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      if (dataSource === "redis") {
        const resp = await fetch(`/api/staging?status=PENDING_REVIEW&limit=150`);
        const data = await resp.json();
        if (data.stats) setStagingStats(data.stats);

        const mapped: OcrQuestion[] = (data.questions || []).map((sq: any) => ({
          id: sq.id,
          subject: sq.subject || "General Engineering",
          subjectCode: sq.subjectCode || "ENG2001",
          year: sq.year || "2024",
          examType: sq.examType || "Endsem",
          sourcePdf: sq.sourceDoc,
          pageNumber: sq.pageNumber,
          bboxX0: sq.bbox?.x0 ?? 35,
          bboxY0: sq.bbox?.y0 ?? 80,
          bboxX1: sq.bbox?.x1 ?? 560,
          bboxY1: sq.bbox?.y1 ?? 280,
          pageWidth: sq.pageWidth || 595.32,
          pageHeight: sq.pageHeight || 841.92,
          imagePath: sq.imageUrl || "",
          rawOcrText: sq.rawOcrText,
          correctedText: sq.cleanText,
          status: sq.status,
          rotation: sq.rotation || 0,
          createdAt: sq.createdAt,
          contentType: sq.contentType,
        }));

        setQuestions(mapped);
        if (mapped.length > 0) {
          handleSelect(mapped[0], 0);
        } else {
          setActiveItem(null);
          setEditorText("");
        }
      } else {
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
      }
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Failed to load records", "err");
      setQuestions([]);
    }
    setLoading(false);
  }, [dataSource, statusFilter, examTypeFilter, subjectFilter, paperFilter, searchQuery]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

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
    setRotation(q.rotation || 0);
    setShowRawOcr(false);

    const pw = q.pageWidth || 595.32;
    const ph = q.pageHeight || 841.92;
    const isFullScan =
      q.bboxX0 === null ||
      (q.bboxY1 ?? ph) - (q.bboxY0 ?? 0) > ph * 0.75 ||
      (q.rawOcrText && q.rawOcrText.startsWith("Scanned examination paper:"));

    const initX0 = q.bboxX0 !== null && !isFullScan ? q.bboxX0 : 35;
    const initY0 = q.bboxY0 !== null && !isFullScan ? q.bboxY0 : 80;
    const initX1 = q.bboxX1 !== null && !isFullScan ? q.bboxX1 : pw - 35;
    const initY1 = q.bboxY1 !== null && !isFullScan ? q.bboxY1 : 280;

    setBoxCoords({
      x0: initX0,
      y0: initY0,
      x1: initX1,
      y1: initY1,
    });

    setViewMode(isFullScan ? "crop" : "zoomed");
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

  // Mouse Handlers for 8-Handle Crop Box
  const handleMouseDown = (
    e: React.MouseEvent,
    handle: "move" | "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w" | "draw"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragHandle(handle);

    const canvas = fullscreenStudio ? fullscreenCanvasRef.current : cropCanvasRef.current;
    if (handle === "draw" && canvas && activeItem) {
      const rect = canvas.getBoundingClientRect();
      const isSideways = rotation % 180 === 90;
      const pw = isSideways ? (activeItem.pageHeight || 841.92) : (activeItem.pageWidth || 595.32);
      const ph = isSideways ? (activeItem.pageWidth || 595.32) : (activeItem.pageHeight || 841.92);
      const clickX = Math.max(0, Math.min(pw, (e.clientX - rect.left) * (pw / rect.width)));
      const clickY = Math.max(0, Math.min(ph, (e.clientY - rect.top) * (ph / rect.height)));
      setDragStart({
        mouseX: e.clientX,
        mouseY: e.clientY,
        initialBox: { x0: clickX, y0: clickY, x1: clickX, y1: clickY },
      });
      setBoxCoords({ x0: clickX, y0: clickY, x1: clickX, y1: clickY });
    } else {
      setDragStart({
        mouseX: e.clientX,
        mouseY: e.clientY,
        initialBox: { ...boxCoords },
      });
    }
  };

  useEffect(() => {
    const canvas = fullscreenStudio ? fullscreenCanvasRef.current : cropCanvasRef.current;
    if (!dragHandle || !activeItem || !canvas) return;

    const isSideways = rotation % 180 === 90;
    const pw = isSideways ? (activeItem.pageHeight || 841.92) : (activeItem.pageWidth || 595.32);
    const ph = isSideways ? (activeItem.pageWidth || 595.32) : (activeItem.pageHeight || 841.92);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = pw / rect.width;
      const scaleY = ph / rect.height;
      const dx = (e.clientX - dragStart.mouseX) * scaleX;
      const dy = (e.clientY - dragStart.mouseY) * scaleY;
      const init = dragStart.initialBox;

      if (dragHandle === "move") {
        const bw = init.x1 - init.x0;
        const bh = init.y1 - init.y0;
        const newX0 = Math.max(0, Math.min(pw - bw, init.x0 + dx));
        const newY0 = Math.max(0, Math.min(ph - bh, init.y0 + dy));
        setBoxCoords({
          x0: newX0,
          y0: newY0,
          x1: newX0 + bw,
          y1: newY0 + bh,
        });
      } else if (dragHandle === "nw") {
        setBoxCoords({
          x0: Math.max(0, Math.min(init.x1 - 20, init.x0 + dx)),
          y0: Math.max(0, Math.min(init.y1 - 20, init.y0 + dy)),
          x1: init.x1,
          y1: init.y1,
        });
      } else if (dragHandle === "ne") {
        setBoxCoords({
          x0: init.x0,
          y0: Math.max(0, Math.min(init.y1 - 20, init.y0 + dy)),
          x1: Math.min(pw, Math.max(init.x0 + 20, init.x1 + dx)),
          y1: init.y1,
        });
      } else if (dragHandle === "se") {
        setBoxCoords({
          x0: init.x0,
          y0: init.y0,
          x1: Math.min(pw, Math.max(init.x0 + 20, init.x1 + dx)),
          y1: Math.min(ph, Math.max(init.y0 + 20, init.y1 + dy)),
        });
      } else if (dragHandle === "sw") {
        setBoxCoords({
          x0: Math.max(0, Math.min(init.x1 - 20, init.x0 + dx)),
          y0: init.y0,
          x1: init.x1,
          y1: Math.min(ph, Math.max(init.y0 + 20, init.y1 + dy)),
        });
      } else if (dragHandle === "n") {
        setBoxCoords((prev) => ({
          ...prev,
          y0: Math.max(0, Math.min(init.y1 - 20, init.y0 + dy)),
        }));
      } else if (dragHandle === "s") {
        setBoxCoords((prev) => ({
          ...prev,
          y1: Math.min(ph, Math.max(init.y0 + 20, init.y1 + dy)),
        }));
      } else if (dragHandle === "w") {
        setBoxCoords((prev) => ({
          ...prev,
          x0: Math.max(0, Math.min(init.x1 - 20, init.x0 + dx)),
        }));
      } else if (dragHandle === "e") {
        setBoxCoords((prev) => ({
          ...prev,
          x1: Math.min(pw, Math.max(init.x0 + 20, init.x1 + dx)),
        }));
      } else if (dragHandle === "draw") {
        const curX = Math.max(0, Math.min(pw, (e.clientX - rect.left) * scaleX));
        const curY = Math.max(0, Math.min(ph, (e.clientY - rect.top) * scaleY));
        setBoxCoords({
          x0: Math.min(init.x0, curX),
          y0: Math.min(init.y0, curY),
          x1: Math.max(init.x0, curX),
          y1: Math.max(init.y0, curY),
        });
      }
    };

    const handleMouseUp = () => {
      setDragHandle(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragHandle, dragStart, activeItem, fullscreenStudio, rotation]);

  // Apply Interactive Crop & Read OCR
  const handleApplyAndRecrop = async () => {
    if (!activeItem || recropping || isScanning) return;
    setRecropping(true);
    setIsScanning(true);
    setScanStatus("Applying crop boundaries & re-scanning PDF vectors...");

    const startTime = Date.now();
    try {
      const resp = await fetch("/api/pdf/recrop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: activeItem.id,
          sourcePdf: activeItem.sourcePdf,
          pageNumber: activeItem.pageNumber || 1,
          bboxX0: boxCoords.x0,
          bboxY0: boxCoords.y0,
          bboxX1: boxCoords.x1,
          bboxY1: boxCoords.y1,
          updateText: true,
          forceGemini: true,
          rotation,
        }),
      });

      const res = await resp.json();
      if (!resp.ok) throw new Error(res.error || "Recrop failed");

      const elapsed = Date.now() - startTime;
      if (elapsed < 850) {
        await new Promise((r) => setTimeout(r, 850 - elapsed));
      }

      setImageKey(Date.now());
      if (res.method) setOcrMethod(res.method);
      if (res.extractedText) {
        setEditorText(res.extractedText);
        setTextUpdatedPulse(true);
        setTimeout(() => setTextUpdatedPulse(false), 2500);
      }

      setViewMode("zoomed");

      setActiveItem((prev) =>
        prev
          ? {
              ...prev,
              bboxX0: boxCoords.x0,
              bboxY0: boxCoords.y0,
              bboxX1: boxCoords.x1,
              bboxY1: boxCoords.y1,
              rawOcrText: res.extractedText || prev.rawOcrText,
              correctedText: res.extractedText || prev.correctedText,
            }
          : null
      );

      setQuestions((prev) =>
        prev.map((q) =>
          q.id === activeItem.id
            ? {
                ...q,
                bboxX0: boxCoords.x0,
                bboxY0: boxCoords.y0,
                bboxX1: boxCoords.x1,
                bboxY1: boxCoords.y1,
                rawOcrText: res.extractedText || q.rawOcrText,
                correctedText: res.extractedText || q.correctedText,
              }
            : q
        )
      );

      showToast(`✓ Question cropped & OCR extracted (${res.extractedText?.length || 0} chars)`, "ok");
    } catch (e: any) {
      showToast(e.message || "Failed to apply crop", "err");
    } finally {
      setRecropping(false);
      setIsScanning(false);
      setScanStatus("");
    }
  };

  // Quick Uncrop / Expand Margins
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
          sourcePdf: activeItem.sourcePdf,
          pageNumber: activeItem.pageNumber || 1,
          bboxX0: newX0,
          bboxY0: newY0,
          bboxX1: newX1,
          bboxY1: newY1,
          updateText: true,
          forceGemini: true,
          rotation,
        }),
      });

      const res = await resp.json();
      if (!resp.ok) throw new Error(res.error || "Recrop failed");

      const elapsed = Date.now() - startTime;
      if (elapsed < 800) {
        await new Promise((r) => setTimeout(r, 800 - elapsed));
      }

      setBoxCoords({ x0: newX0, y0: newY0, x1: newX1, y1: newY1 });
      setImageKey(Date.now());
      if (res.method) setOcrMethod(res.method);
      if (res.extractedText) {
        setEditorText(res.extractedText);
        setTextUpdatedPulse(true);
        setTimeout(() => setTextUpdatedPulse(false), 2500);
      }

      setActiveItem((prev) =>
        prev
          ? {
              ...prev,
              bboxX0: newX0,
              bboxY0: newY0,
              bboxX1: newX1,
              bboxY1: newY1,
              rawOcrText: res.extractedText || prev.rawOcrText,
              correctedText: res.extractedText || prev.correctedText,
            }
          : null
      );

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

  // Rerun Neural OCR
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
          ? "Streaming via Gemini Flash Vision..."
          : "Synthesizing vector tokens & question stem..."
      );
    }, 750);

    try {
      const resp = await fetch("/api/pdf/recrop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: activeItem.id,
          sourcePdf: activeItem.sourcePdf,
          pageNumber: activeItem.pageNumber || 1,
          bboxX0: boxCoords.x0,
          bboxY0: boxCoords.y0,
          bboxX1: boxCoords.x1,
          bboxY1: boxCoords.y1,
          updateText: true,
          forceGemini: true,
          rotation,
        }),
      });

      clearTimeout(t1);
      clearTimeout(t2);

      const res = await resp.json();
      if (!resp.ok) throw new Error(res.error || "OCR extraction failed");

      const elapsed = Date.now() - startTime;
      if (elapsed < 800) {
        await new Promise((r) => setTimeout(r, 800 - elapsed));
      }

      setScanStatus("Syncing extracted tokens to database...");
      await new Promise((r) => setTimeout(r, 150));

      if (res.extractedText) {
        setEditorText(res.extractedText);
        setTextUpdatedPulse(true);
        setTimeout(() => setTextUpdatedPulse(false), 2500);
      }

      setImageKey(Date.now());
      setOcrMethod(res.method || "gemini_vision_ocr");

      setActiveItem((prev) =>
        prev
          ? {
              ...prev,
              rawOcrText: res.extractedText || prev.rawOcrText,
              correctedText: res.extractedText || prev.correctedText,
            }
          : null
      );

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

      showToast(
        `✓ OCR complete (${res.extractedText?.length || 0} chars)`,
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

  // Custom Coordinates Save
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
          sourcePdf: activeItem.sourcePdf,
          pageNumber: activeItem.pageNumber || 1,
          bboxX0: boxCoords.x0,
          bboxY0: boxCoords.y0,
          bboxX1: boxCoords.x1,
          bboxY1: boxCoords.y1,
          updateText: true,
          forceGemini: true,
          rotation,
        }),
      });
      const res = await resp.json();
      if (!resp.ok) throw new Error(res.error || "Recrop failed");

      setImageKey(Date.now());
      if (res.method) setOcrMethod(res.method);
      if (res.extractedText) {
        setEditorText(res.extractedText);
        setTextUpdatedPulse(true);
        setTimeout(() => setTextUpdatedPulse(false), 2500);
      }

      setActiveItem((prev) =>
        prev
          ? {
              ...prev,
              bboxX0: boxCoords.x0,
              bboxY0: boxCoords.y0,
              bboxX1: boxCoords.x1,
              bboxY1: boxCoords.y1,
              rawOcrText: res.extractedText || prev.rawOcrText,
              correctedText: res.extractedText || prev.correctedText,
            }
          : null
      );

      setQuestions((prev) =>
        prev.map((q) =>
          q.id === activeItem.id
            ? {
                ...q,
                bboxX0: boxCoords.x0,
                bboxY0: boxCoords.y0,
                bboxX1: boxCoords.x1,
                bboxY1: boxCoords.y1,
                rawOcrText: res.extractedText || q.rawOcrText,
                correctedText: res.extractedText || q.correctedText,
              }
            : q
        )
      );
      showToast("✓ Custom bounding box applied & saved", "ok");
    } catch (e: any) {
      showToast(e.message || "Failed to save crop", "err");
    } finally {
      setRecropping(false);
      setIsScanning(false);
      setScanStatus("");
    }
  };

  // Update Question Status (Approve / Reject)
  const updateStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (dataSource === "redis") {
        const resp = await fetch("/api/staging", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            action: status === "APPROVED" ? "APPROVE" : "REJECT",
            cleanText: editorText,
            subject: editSubject,
            subjectCode: editSubjectCode,
            year: editYear,
            examType: editExamType,
          }),
        });
        if (!resp.ok) throw new Error("Staging update failed");

        showToast(
          status === "APPROVED"
            ? "✓ Promoted to Neon DB & indexed in Upstash Vector!"
            : "✗ Rejected in Redis (Neon DB untouched)",
          status === "APPROVED" ? "ok" : "err"
        );
      } else {
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
      }

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

  // File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    showToast(`Uploading & slicing ${file.name}...`, "ok");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/ingestion/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      showToast(
        `✓ Ingested ${data.result?.stagedQuestionsCount || 0} questions to Redis staging!`,
        "ok"
      );
      setDataSource("redis");
      fetchQuestions();
      fetchMetadataStats();
    } catch (err: any) {
      showToast(err.message || "Upload failed", "err");
    } finally {
      setIsUploading(false);
      if (uploadInputRef.current) uploadInputRef.current.value = "";
    }
  };

  // Fine-Tuning Dataset Exporter
  const handleFineTuneExport = (format: "alpaca" | "chatml" | "sharegpt" | "csv") => {
    const a = document.createElement("a");
    a.href = `/api/dataset/export?format=${format}&source=${dataSource}`;
    a.download = `kaizen_finetune_${format}_${Date.now()}.${format === "csv" ? "csv" : "jsonl"}`;
    a.click();
    showToast(`✓ Exporting ${format.toUpperCase()} dataset...`, "ok");
    setShowExportModal(false);
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

  // Keyboard Shortcuts
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
          if (e.shiftKey) {
            e.preventDefault();
            handleRotate(90);
          } else if (activeItem) {
            updateStatus(activeItem.id, "REJECTED");
          }
          break;
        case "t":
          e.preventDefault();
          handleRotate(90);
          break;
        case "e":
          e.preventDefault();
          textareaRef.current?.focus();
          break;
        case "u":
          setShowPageModal((v) => !v);
          break;
        case "c":
          e.preventDefault();
          setViewMode((v) => (v === "crop" ? "zoomed" : "crop"));
          break;
        case "f":
          e.preventDefault();
          setFullscreenStudio((v) => !v);
          break;
        case "z":
          e.preventDefault();
          setViewMode("zoomed");
          break;
        case "o":
          e.preventDefault();
          handleRerunOcr(true);
          break;
        case "enter":
          if (viewMode === "crop") {
            e.preventDefault();
            handleApplyAndRecrop();
          }
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
  }, [activeItem, navigateItem, viewMode]);

  const filteredPapers = papersList.filter((p) => {
    if (examTypeFilter !== "ALL" && p.examType !== examTypeFilter) return false;
    if (subjectFilter !== "ALL" && p.subject !== subjectFilter) return false;
    return true;
  });

  const getMediaUrl = (path: string | null) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `https://pub-60fc676d8ba24a13a46925ab4941ddb5.r2.dev${cleanPath}`;
  };

  return (
    <div className="h-[calc(100vh-64px)] bg-[#07070a] text-zinc-100 flex flex-col font-sans overflow-hidden relative select-none">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold border backdrop-blur-xl transition-all flex items-center gap-2 ${
            toast.type === "ok"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 shadow-emerald-500/10"
              : "bg-red-500/15 border-red-500/30 text-red-300 shadow-red-500/10"
          }`}
        >
          {toast.type === "ok" ? <Check className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="bg-[#0f0f14] border border-zinc-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-sm font-bold mb-3 flex items-center gap-2 text-zinc-100">
              <Keyboard className="w-4 h-4 text-indigo-400" /> Keyboard Shortcuts
            </h2>
            {[
              ["A", "Approve & Next (Fast)"],
              ["R", "Reject & Next"],
              ["J / ↓", "Next Question"],
              ["K / ↑", "Previous Question"],
              ["E", "Focus Text Editor"],
              ["O", "Run Gemini AI OCR"],
              ["C", "Toggle Crop Tool vs Zoomed"],
              ["Enter", "Apply Crop Box"],
              ["T / Shift+R", "Rotate Image 90°"],
              ["F", "Fullscreen Studio"],
              ["+ / -", "Zoom In / Out"],
              ["?", "Shortcuts panel"],
            ].map(([key, desc]) => (
              <div
                key={key}
                className="flex justify-between items-center py-1.5 border-b border-zinc-800/40 text-xs last:border-0"
              >
                <span className="text-zinc-400">{desc}</span>
                <kbd className="px-2 py-0.5 bg-zinc-800/80 rounded font-mono text-zinc-200 font-bold text-[11px]">
                  {key}
                </kbd>
              </div>
            ))}
            <button
              onClick={() => setShowShortcuts(false)}
              className="mt-4 w-full py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Fine-Tuning Dataset Export Modal */}
      {showExportModal && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setShowExportModal(false)}
        >
          <div
            className="bg-[#0f0f14] border border-zinc-800 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span>Export Dataset for Fine-Tuning</span>
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-zinc-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Download formatted training data ready for fine-tuning using Unsloth, HuggingFace, LLaMA-Factory, or Gemini.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => handleFineTuneExport("alpaca")}
                className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/50 rounded-xl text-left transition-all"
              >
                <div className="font-bold text-xs text-emerald-300">Alpaca / Unsloth</div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">instruction / input / output</div>
              </button>

              <button
                onClick={() => handleFineTuneExport("chatml")}
                className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-500/50 rounded-xl text-left transition-all"
              >
                <div className="font-bold text-xs text-cyan-300">ChatML / OpenAI</div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">messages role JSONL</div>
              </button>

              <button
                onClick={() => handleFineTuneExport("sharegpt")}
                className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-purple-500/50 rounded-xl text-left transition-all"
              >
                <div className="font-bold text-xs text-purple-300">ShareGPT</div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">conversations JSONL</div>
              </button>

              <button
                onClick={() => handleFineTuneExport("csv")}
                className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 rounded-xl text-left transition-all"
              >
                <div className="font-bold text-xs text-amber-300">Standard CSV</div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Spreadsheet export</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live OCR & Pipeline Observation Studio Modal */}
      {showOcrStudio && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-xl z-50 flex items-center justify-center p-3 md:p-6"
          onClick={() => setShowOcrStudio(false)}
        >
          <div
            className="bg-[#0a0a0e] border border-cyan-500/30 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3 border-b border-zinc-800/80 bg-zinc-950/90 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs font-bold text-zinc-100 font-mono tracking-wide">
                      NEURAL OCR & PIPELINE STUDIO
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[9px] font-mono font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      LIVE
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                <button
                  onClick={() => setOcrStudioTab("runner")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all ${
                    ocrStudioTab === "runner" ? "bg-cyan-600 text-white shadow" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Play className="w-3 h-3" /> Runner
                </button>
                <button
                  onClick={() => setOcrStudioTab("inspector")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all ${
                    ocrStudioTab === "inspector" ? "bg-indigo-600 text-white shadow" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Cpu className="w-3 h-3" /> Inspector
                </button>
                <button
                  onClick={() => setOcrStudioTab("telemetry")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all ${
                    ocrStudioTab === "telemetry" ? "bg-purple-600 text-white shadow" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Activity className="w-3 h-3" /> Telemetry
                </button>
              </div>

              <button
                onClick={() => setShowOcrStudio(false)}
                className="text-zinc-400 hover:text-white text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {ocrStudioTab === "runner" && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-cyan-400" /> Raw Examination Paper:
                      </span>
                      <span className="text-zinc-500 text-[11px]">{rawPdfList.length} PDFs</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={selectedRawPdf}
                        onChange={(e) => setSelectedRawPdf(e.target.value)}
                        disabled={pipelineRunning}
                        className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 font-mono truncate"
                      >
                        {rawPdfList.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => handleRunLivePipeline()}
                        disabled={pipelineRunning || !selectedRawPdf}
                        className="px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 shadow disabled:opacity-50 transition-all shrink-0"
                      >
                        {pipelineRunning ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-200" />
                        ) : (
                          <Play className="w-3.5 h-3.5 text-cyan-200" />
                        )}
                        <span>{pipelineRunning ? "Processing..." : "Run Pipeline"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { num: 1, title: "200 DPI Slicing", desc: "Vector Raster" },
                      { num: 2, title: "Image Enhancement", desc: "Contrast 1.35x" },
                      { num: 3, title: "Cloudflare R2", desc: "CDN Global Sync" },
                      { num: 4, title: "AI OCR Parsing", desc: "LaTeX & Math Tokens" },
                      { num: 5, title: "Redis Buffer", desc: "Staging Queue" },
                    ].map((st) => {
                      const isActive = pipelineRunning && pipelineStep === st.num;
                      const isDone = pipelineStep > st.num || (!pipelineRunning && pipelineStep === 5);
                      return (
                        <div
                          key={st.num}
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            isActive
                              ? "bg-cyan-500/15 border-cyan-400 animate-pulse"
                              : isDone
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                              : "bg-zinc-950/60 border-zinc-800 text-zinc-500"
                          }`}
                        >
                          <div className="flex items-center justify-center mb-1">
                            {isDone ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : isActive ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                            ) : (
                              <span className="text-[10px] font-mono text-zinc-600">#{st.num}</span>
                            )}
                          </div>
                          <div className="text-[11px] font-semibold text-zinc-200 truncate">{st.title}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="rounded-xl border border-zinc-800 bg-black/95 overflow-hidden flex flex-col">
                    <div className="px-3 py-1.5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                      <div className="flex items-center gap-1.5 text-cyan-400">
                        <Terminal className="w-3 h-3" /> Live Console
                      </div>
                      <button
                        onClick={() => setPipelineLogs([])}
                        className="text-[10px] text-zinc-500 hover:text-zinc-300 underline"
                      >
                        Clear
                      </button>
                    </div>
                    <div
                      ref={logTerminalRef}
                      className="h-36 p-3 font-mono text-[11px] overflow-y-auto space-y-1 select-text scrollbar-thin"
                    >
                      {pipelineLogs.map((log, i) => (
                        <div
                          key={i}
                          className={
                            log.includes("ERROR")
                              ? "text-red-400"
                              : log.includes("✓") || log.includes("STAGED")
                              ? "text-emerald-300 font-semibold"
                              : log.includes("Step")
                              ? "text-cyan-300"
                              : "text-zinc-400"
                          }
                        >
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {ocrStudioTab === "inspector" && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                    <div className="grid grid-cols-4 gap-2 text-xs font-mono">
                      <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                        <span className="text-zinc-500 text-[10px]">PAGE</span>
                        <div className="text-zinc-200 font-bold">{activeItem?.pageNumber || 1}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                        <span className="text-zinc-500 text-[10px]">CROP AREA</span>
                        <div className="text-indigo-300 font-bold truncate">
                          [{boxCoords.x0.toFixed(0)}, {boxCoords.y0.toFixed(0)}] → [{boxCoords.x1.toFixed(0)}, {boxCoords.y1.toFixed(0)}]
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                        <span className="text-zinc-500 text-[10px]">ROTATION</span>
                        <div className="text-amber-300 font-bold">{rotation}°</div>
                      </div>
                      <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                        <span className="text-zinc-500 text-[10px]">VECTOR DPI</span>
                        <div className="text-emerald-300 font-bold">200 DPI</div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleTestOcrLive}
                        disabled={testOcrRunning || !activeItem}
                        className="flex-1 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all"
                      >
                        {testOcrRunning ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        <span>Run OCR Test Benchmark</span>
                      </button>
                    </div>
                  </div>

                  {testOcrResult && (
                    <div className="p-3 rounded-xl border border-indigo-500/40 bg-zinc-950 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-indigo-400 font-semibold">{testOcrResult.method}</span>
                        <span className="text-emerald-400">{testOcrResult.tokensExtracted} tokens in {testOcrResult.latencyMs}ms</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-100 max-h-36 overflow-y-auto whitespace-pre-wrap">
                        {testOcrResult.extractedText}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {ocrStudioTab === "telemetry" && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1 font-mono">
                    <span className="text-cyan-300 font-bold block">Cloudflare R2 CDN</span>
                    <div className="text-zinc-400 text-[11px]">Bucket: <span className="text-zinc-200">kaizen</span></div>
                    <div className="text-zinc-400 text-[11px] truncate">CDN: https://pub-60fc676d8ba24a13a46925ab4941ddb5.r2.dev</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1 font-mono">
                    <span className="text-amber-300 font-bold block">Upstash Redis Staging</span>
                    <div className="text-zinc-400 text-[11px]">Pending: <span className="text-amber-300 font-bold">{stagingStats.stagedPending}</span></div>
                    <div className="text-zinc-400 text-[11px]">Total Keys: <span className="text-zinc-200">{stagingStats.totalStagedKeys}</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TOP HEADER (Minimal, 52px high) ── */}
      <header className="h-[52px] border-b border-zinc-800/60 bg-[#09090d]/95 backdrop-blur-md px-4 flex items-center justify-between gap-3 shrink-0">
        {/* Left: Source Selector (Redis Staging vs Neon DB) */}
        <div className="flex items-center gap-3">
          <div className="inline-flex p-0.5 bg-zinc-900 border border-zinc-800 rounded-lg">
            <button
              onClick={() => setDataSource("redis")}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                dataSource === "redis"
                  ? "bg-zinc-800 text-amber-300 shadow-sm border border-amber-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Upstash Redis Staging Buffer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Staging</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/10 text-amber-300 font-mono font-bold">
                {stagingStats.stagedPending}
              </span>
            </button>
            <button
              onClick={() => setDataSource("neon")}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                dataSource === "neon"
                  ? "bg-zinc-800 text-indigo-300 shadow-sm border border-indigo-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Neon PostgreSQL Production DB"
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>Verified DB</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-500/10 text-indigo-300 font-mono font-bold">
                {stats.approved}
              </span>
            </button>
          </div>
        </div>

        {/* Center: Clean Filters */}
        <div className="hidden md:flex items-center gap-2 text-xs">
          <select
            value={examTypeFilter}
            onChange={(e) => setExamTypeFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="ALL">All Exams</option>
            <option value="Midsem">Midsem</option>
            <option value="Endsem">Endsem</option>
          </select>

          <select
            value={subjectFilter}
            onChange={(e) => {
              setSubjectFilter(e.target.value);
              setPaperFilter("ALL");
            }}
            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500 max-w-[180px] truncate font-medium"
          >
            <option value="ALL">All Subjects ({subjectsList.length})</option>
            {subjectsList.map((s) => (
              <option key={s.subject} value={s.subject}>
                {s.subject} ({s.subjectCode})
              </option>
            ))}
          </select>

          <select
            value={paperFilter}
            onChange={(e) => setPaperFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500 max-w-[220px] truncate font-medium"
          >
            <option value="ALL">All Papers ({filteredPapers.length})</option>
            {filteredPapers.map((p) => (
              <option key={p.sourcePdf} value={p.sourcePdf}>
                [{p.examType}] {p.sourcePdf}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Upload + Live Studio + Actions */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={uploadInputRef}
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.pptx"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => uploadInputRef.current?.click()}
            disabled={isUploading}
            className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
          >
            {isUploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            ) : (
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>{isUploading ? "Uploading..." : "Upload"}</span>
          </button>

          <button
            onClick={() => setShowOcrStudio(true)}
            className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Open Live Neural OCR & Pipeline Control Center"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Live Studio</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          </button>

          {/* More Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu((v) => !v)}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors"
              title="More options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMoreMenu && (
              <div
                className="absolute right-0 mt-1.5 w-48 bg-[#0f0f14] border border-zinc-800 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95"
                onClick={() => setShowMoreMenu(false)}
              >
                <button
                  onClick={() => setShowExportModal(true)}
                  className="w-full px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
                >
                  <FileCode className="w-3.5 h-3.5 text-emerald-400" /> Fine-Tune Export
                </button>
                <button
                  onClick={exportApproved}
                  className="w-full px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" /> Download CSV
                </button>
                <button
                  onClick={() => setShowShortcuts(true)}
                  className="w-full px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
                >
                  <Keyboard className="w-3.5 h-3.5 text-amber-400" /> Shortcuts (?)
                </button>
                <button
                  onClick={() => setShowPageModal(true)}
                  className="w-full px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
                >
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Visual Cropper (U)
                </button>
                <div className="h-px bg-zinc-800 my-1" />
                <button
                  onClick={() => {
                    fetchMetadataStats();
                    fetchQuestions();
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-zinc-400 hover:bg-zinc-800 flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-zinc-400" /> Refresh Queue
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN STUDIO: SIDE-BY-SIDE VERIFICATION WORKSPACE ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── LEFT QUEUE SIDEBAR (280px) ── */}
        <aside className="w-[280px] border-r border-zinc-800/60 bg-[#08080c] flex flex-col shrink-0">
          {/* Search & Status Filters */}
          <div className="p-2.5 border-b border-zinc-800/60 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-7 pr-3 py-1 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="grid grid-cols-4 gap-1">
              {["PENDING", "APPROVED", "REJECTED", "ALL"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`text-[10px] py-1 rounded font-semibold transition-all ${
                    statusFilter === st
                      ? st === "PENDING"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : st === "APPROVED"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : st === "REJECTED"
                        ? "bg-red-500/20 text-red-300 border border-red-500/40"
                        : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                      : "bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-transparent"
                  }`}
                >
                  {st === "PENDING" ? "Pend" : st === "APPROVED" ? "Appr" : st === "REJECTED" ? "Rej" : "All"}
                </button>
              ))}
            </div>
          </div>

          {/* Question Cards List */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/30">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-40 text-zinc-500 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                <span className="text-xs">Loading queue...</span>
              </div>
            ) : questions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-zinc-600 gap-2 p-6 text-center">
                <Inbox className="w-8 h-8 opacity-40" />
                <p className="text-xs">No questions found.</p>
              </div>
            ) : (
              questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => handleSelect(q, idx)}
                  className={`w-full text-left px-3 py-2.5 transition-all ${
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
                      <span className="text-[10px] font-mono px-1 py-0.2 bg-zinc-800 text-zinc-400 rounded">
                        p.{q.pageNumber || 1}
                      </span>
                      <span className="text-[10px] text-zinc-400 truncate font-mono">
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

          {/* Footer Pagination */}
          <div className="p-2 border-t border-zinc-800/60 flex items-center justify-between text-xs bg-zinc-950/60">
            <button
              onClick={() => navigateItem("prev")}
              disabled={activeIdx === 0}
              className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 rounded-lg border border-zinc-800 flex items-center gap-1 text-[11px] font-medium"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev (K)
            </button>
            <span className="text-[11px] font-mono text-zinc-500">
              {questions.length > 0 ? `${activeIdx + 1} / ${questions.length}` : "0 / 0"}
            </span>
            <button
              onClick={() => navigateItem("next")}
              disabled={activeIdx >= questions.length - 1}
              className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 rounded-lg border border-zinc-800 flex items-center gap-1 text-[11px] font-medium"
            >
              Next (J) <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>

        {/* ── MAIN WORKSPACE: Side-by-Side (Image Left, OCR Editor Right) ── */}
        {activeItem ? (
          <div className="flex-1 flex overflow-hidden">
            {/* ── LEFT PANE: QUESTION IMAGE & CROP VIEWPORT (50% width) ── */}
            <div className="w-1/2 border-r border-zinc-800/60 flex flex-col bg-[#07070a] overflow-hidden">
              {/* Image Viewport Header (Apple-style frosted bar) */}
              <div className="h-11 border-b border-zinc-800/60 px-3 bg-[#0a0a0e]/90 backdrop-blur-md flex items-center justify-between gap-2 shrink-0">
                {/* View Mode Toggle: Zoomed Crop vs Page Tool */}
                <div className="flex items-center gap-2">
                  <div className="inline-flex p-0.5 bg-zinc-900 border border-zinc-800 rounded-lg shadow-sm">
                    <button
                      onClick={() => setViewMode("zoomed")}
                      className={`px-3 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                        viewMode === "zoomed"
                          ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                      title="Focus Crop View (Hotkey: Z)"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>Question View</span>
                    </button>
                    <button
                      onClick={() => setViewMode("crop")}
                      className={`px-3 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                        viewMode === "crop"
                          ? "bg-emerald-500/20 text-emerald-300 shadow-sm border border-emerald-500/40"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                      title="Interactive Page Crop Tool (Hotkey: C)"
                    >
                      <Crop className="w-3 h-3 text-emerald-400" />
                      <span>Adjust Crop</span>
                    </button>
                  </div>

                  {/* Render Mode & Fix Loading Pill */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const next = renderMode === "fast_cdn" ? "live_pdf" : "fast_cdn";
                        setRenderMode(next);
                        setImageKey(Date.now());
                        showToast(`Switched to ${next === "fast_cdn" ? "Instant CDN Snapshot" : "Live Vector PDF"}`, "ok");
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono font-medium flex items-center gap-1 transition-colors border shadow-sm ${
                        renderMode === "fast_cdn"
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                          : "bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
                      }`}
                      title="Toggle between Instant CDN snapshot and Live Vector PDF render"
                    >
                      <Zap className="w-2.5 h-2.5" />
                      <span>{renderMode === "fast_cdn" ? "Fast CDN" : "Vector PDF"}</span>
                    </button>

                    <button
                      onClick={handleFixCropLoading}
                      className="px-2 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-amber-500/30 text-[10px] font-mono text-amber-300 hover:text-amber-200 flex items-center gap-1 transition-colors shadow-sm"
                      title="One-click fix: Bypasses loading lag and immediately restores instant snapshot"
                    >
                      <RefreshCw className="w-2.5 h-2.5 text-amber-400" />
                      <span>Fix Loading</span>
                    </button>
                  </div>
                </div>

                {/* Right controls: Rotate, Zoom, Fullscreen */}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                    <button
                      onClick={() => handleRotate(-90)}
                      disabled={recropping || isScanning}
                      className="p-1 text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-800"
                      title="Rotate CCW 90°"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleRotate(90)}
                      disabled={recropping || isScanning}
                      className="px-1.5 py-0.5 text-[10px] font-mono font-bold text-amber-400 hover:bg-zinc-800 rounded"
                      title="Rotate CW 90° (T)"
                    >
                      {rotation}°
                    </button>
                  </div>

                  <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                    <button
                      onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
                      className="p-1 text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-800"
                      title="Zoom Out (-)"
                    >
                      <ZoomOut className="w-3 h-3" />
                    </button>
                    <span className="text-[10px] font-mono text-zinc-400 px-1 w-8 text-center">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
                      className="p-1 text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-800"
                      title="Zoom In (+)"
                    >
                      <ZoomIn className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => setFullscreenStudio(true)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors"
                    title="Fullscreen Studio (F)"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Viewport Body (Canvas) */}
              <div
                ref={viewportRef}
                className="flex-1 overflow-auto flex items-center justify-center p-3 relative bg-[#07070a] select-none"
              >
                {/* Cybernetic Laser Scan Overlay */}
                {(isScanning || recropping || manualOverlayScan) && (
                  <div className="absolute inset-0 z-30 bg-black/65 backdrop-blur-[2px] flex flex-col items-center justify-center pointer-events-none">
                    <div className="ocr-laser-line pointer-events-none">
                      <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee]" />
                    </div>
                    <div className="px-4 py-2 rounded-xl bg-zinc-950/90 border border-cyan-500/40 text-center space-y-1">
                      <div className="text-cyan-400 text-xs font-mono font-bold flex items-center justify-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        <span>NEURAL OCR EXTRACTING</span>
                      </div>
                      <p className="text-[11px] font-mono text-zinc-300">{scanStatus}</p>
                    </div>
                  </div>
                )}

                {/* Loading Delay / Fallback Banner */}
                {(imageError || (renderMode === "live_pdf" && imageLoading)) && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-full bg-amber-950/90 border border-amber-500/40 backdrop-blur-md shadow-2xl flex items-center gap-2.5 text-xs text-amber-200">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>Vector render slow or unavailable</span>
                    <button
                      onClick={handleFixCropLoading}
                      className="px-2 py-0.5 rounded-full bg-amber-400 hover:bg-amber-300 text-black font-bold text-[10px] transition-colors shadow-sm"
                    >
                      Switch to Instant Snapshot
                    </button>
                  </div>
                )}

                {/* MODE 1: ZOOMED QUESTION FOCUS */}
                {viewMode === "zoomed" ? (
                  <div
                    className="relative flex items-center justify-center w-full h-full p-2 overflow-hidden"
                    style={{
                      transform: `scale(${zoom})`,
                      transformOrigin: "center",
                      transition: "transform 0.15s ease",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      key={`${activeItem.id}-${imageKey}-${rotation}-${renderMode}`}
                      src={
                        renderMode === "live_pdf" && activeItem.sourcePdf
                          ? `/api/pdf/crop?id=${activeItem.id}&pdf=${encodeURIComponent(
                              activeItem.sourcePdf
                            )}&page=${activeItem.pageNumber || 1}&x0=${boxCoords.x0.toFixed(
                              1
                            )}&y0=${boxCoords.y0.toFixed(1)}&x1=${boxCoords.x1.toFixed(
                              1
                            )}&y1=${boxCoords.y1.toFixed(1)}&dpi=200&rotation=${rotation}&t=${imageKey}`
                          : `${getMediaUrl(activeItem.imagePath)}?t=${imageKey}`
                      }
                      alt="Focused Question Crop"
                      className="max-w-full max-h-[calc(100vh-140px)] object-contain rounded-xl shadow-2xl border border-zinc-800 bg-white"
                      onLoad={() => {
                        setImageLoading(false);
                        setImageError(false);
                      }}
                      onError={(e) => {
                        setImageError(true);
                        setRenderMode("fast_cdn");
                        const target = e.currentTarget as HTMLImageElement;
                        target.src = `${getMediaUrl(activeItem.imagePath)}?t=${imageKey}`;
                      }}
                    />

                    {/* Bottom overlay badge */}
                    <div className="absolute bottom-2 left-3 px-2.5 py-1 rounded-lg bg-black/80 border border-zinc-800 text-[10px] font-mono text-zinc-400 backdrop-blur-md flex items-center gap-2">
                      <span>Page {activeItem.pageNumber || 1}</span>
                      <span>·</span>
                      <span>{Math.round(boxCoords.x1 - boxCoords.x0)} × {Math.round(boxCoords.y1 - boxCoords.y0)} pt</span>
                      <span>·</span>
                      <span className="text-emerald-400">{renderMode === "fast_cdn" ? "⚡ CDN Snapshot" : "📄 Vector Render"}</span>
                    </div>

                    <button
                      onClick={() => setViewMode("crop")}
                      className="absolute bottom-2 right-3 px-3 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-emerald-500/40 text-[11px] font-mono text-emerald-300 backdrop-blur-md flex items-center gap-1.5 shadow transition-colors"
                      title="Adjust Question Crop (Hotkey: C)"
                    >
                      <Crop className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Adjust Crop (C)</span>
                    </button>
                  </div>
                ) : (
                  /* MODE 2: APPLE-GRADE INTERACTIVE PAGE CROP TOOL */
                  <div className="w-full h-full flex items-center justify-center p-2 relative bg-[#07070b]">
                    {/* Floating Apple-style Crop Toolbar HUD */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-full bg-zinc-950/85 backdrop-blur-xl border border-white/10 shadow-2xl flex items-center gap-2 select-none">
                      {/* Presets */}
                      <div className="flex items-center gap-1 text-[11px] font-medium text-zinc-300">
                        <button onClick={() => applyPreset("auto")} className="px-2 py-0.5 rounded-full hover:bg-white/10 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">Auto-Detect</button>
                        <button onClick={() => applyPreset("q1")} className="px-2 py-0.5 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors">Q1 Top</button>
                        <button onClick={() => applyPreset("q2")} className="px-2 py-0.5 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors">Q2 Mid</button>
                        <button onClick={() => applyPreset("q3")} className="px-2 py-0.5 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors">Q3 Btm</button>
                        <button onClick={() => applyPreset("full")} className="px-2 py-0.5 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors">Full Page</button>
                      </div>

                      <div className="w-px h-4 bg-white/15" />

                      {/* Rotate & Reset */}
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleRotate(90)} className="p-1 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors" title="Rotate 90°">
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => applyPreset("full")} className="px-2 py-0.5 rounded-full hover:bg-white/10 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors">
                          Reset
                        </button>
                      </div>

                      <div className="w-px h-4 bg-white/15" />

                      {/* Actions */}
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => setViewMode("zoomed")}
                          className="px-2.5 py-1 rounded-full text-xs text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleApplyAndRecrop}
                          disabled={recropping || isScanning}
                          className="px-3.5 py-1 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs flex items-center gap-1 shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>{recropping ? "Cropping..." : "Done"}</span>
                        </button>
                      </div>
                    </div>

                    {(() => {
                      const isSideways = rotation % 180 === 90;
                      const effPw = isSideways ? (activeItem.pageHeight || 841.92) : (activeItem.pageWidth || 595.32);
                      const effPh = isSideways ? (activeItem.pageWidth || 595.32) : (activeItem.pageHeight || 841.92);

                      return (
                        <div
                          ref={cropCanvasRef}
                          className="relative inline-block select-none shadow-2xl border border-zinc-700 rounded-xl bg-white overflow-hidden cursor-crosshair"
                          style={{
                            height: "calc(100vh - 160px)",
                            aspectRatio: `${effPw} / ${effPh}`,
                          }}
                          onMouseDown={(e) => handleMouseDown(e, "draw")}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            key={`page-bg-${activeItem.id}-${rotation}-${imageKey}`}
                            src={`/api/pdf/page?pdf=${encodeURIComponent(
                              activeItem.sourcePdf || ""
                            )}&page=${activeItem.pageNumber || 1}&dpi=150&rotation=${rotation}`}
                            alt="Full PDF Page"
                            className="w-full h-full object-contain pointer-events-none select-none"
                            onError={(e) => {
                              // If full PDF page fails, fallback to pre-cropped question image
                              const target = e.currentTarget as HTMLImageElement;
                              target.src = `${getMediaUrl(activeItem.imagePath)}?t=${imageKey}`;
                            }}
                          />

                          {(() => {
                            const pw = effPw;
                            const ph = effPh;
                            const x0Pct = (boxCoords.x0 / pw) * 100;
                            const y0Pct = (boxCoords.y0 / ph) * 100;
                            const x1Pct = (boxCoords.x1 / pw) * 100;
                            const y1Pct = (boxCoords.y1 / ph) * 100;
                            const bwPct = ((boxCoords.x1 - boxCoords.x0) / pw) * 100;
                            const bhPct = ((boxCoords.y1 - boxCoords.y0) / ph) * 100;

                            return (
                              <>
                                {/* Darkened Frosted Backdrop outside crop selection */}
                                <div className="absolute left-0 right-0 top-0 bg-black/65 pointer-events-none" style={{ height: `${y0Pct}%` }} />
                                <div className="absolute left-0 right-0 bottom-0 bg-black/65 pointer-events-none" style={{ top: `${y1Pct}%` }} />
                                <div className="absolute left-0 bg-black/65 pointer-events-none" style={{ top: `${y0Pct}%`, width: `${x0Pct}%`, height: `${bhPct}%` }} />
                                <div className="absolute right-0 bg-black/65 pointer-events-none" style={{ top: `${y0Pct}%`, left: `${x1Pct}%`, height: `${bhPct}%` }} />

                                {/* Interactive Apple Crop Selection Box */}
                                <div
                                  className="absolute border-[1.5px] border-emerald-400 bg-emerald-400/5 shadow-[0_0_20px_rgba(52,211,153,0.3)] cursor-grab active:cursor-grabbing z-10"
                                  style={{
                                    left: `${x0Pct}%`,
                                    top: `${y0Pct}%`,
                                    width: `${bwPct}%`,
                                    height: `${bhPct}%`,
                                  }}
                                  onMouseDown={(e) => handleMouseDown(e, "move")}
                                >
                                  {/* Apple Rule of Thirds Grid (illuminates when dragging) */}
                                  <div className={`absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none transition-opacity duration-200 ${dragHandle ? "opacity-90" : "opacity-30"}`}>
                                    <div className="border-r border-b border-white/40 border-dashed" />
                                    <div className="border-r border-b border-white/40 border-dashed" />
                                    <div className="border-b border-white/40 border-dashed" />
                                    <div className="border-r border-b border-white/40 border-dashed" />
                                    <div className="border-r border-b border-white/40 border-dashed" />
                                    <div className="border-b border-white/40 border-dashed" />
                                    <div className="border-r border-white/40 border-dashed" />
                                    <div className="border-r border-white/40 border-dashed" />
                                    <div />
                                  </div>

                                  {/* Center Crosshair Pill */}
                                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full bg-zinc-950/90 border border-emerald-500/40 text-[9px] font-mono text-emerald-300 pointer-events-none flex items-center gap-1.5 shadow-lg backdrop-blur-md">
                                    <Move className="w-2.5 h-2.5 text-emerald-400" />
                                    <span>Drag to Move</span>
                                  </div>

                                  {/* ── Apple-style Thick Corner Brackets ── */}
                                  {/* Top-Left (NW) */}
                                  <div
                                    onMouseDown={(e) => handleMouseDown(e, "nw")}
                                    className="absolute -top-[3px] -left-[3px] w-6 h-6 cursor-nwse-resize group/h z-20"
                                    title="Resize Top-Left"
                                  >
                                    <div className="absolute top-0 left-0 w-5 h-[3.5px] bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover/h:bg-emerald-400 transition-colors" />
                                    <div className="absolute top-0 left-0 w-[3.5px] h-5 bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover/h:bg-emerald-400 transition-colors" />
                                  </div>

                                  {/* Top-Right (NE) */}
                                  <div
                                    onMouseDown={(e) => handleMouseDown(e, "ne")}
                                    className="absolute -top-[3px] -right-[3px] w-6 h-6 cursor-nesw-resize group/h z-20"
                                    title="Resize Top-Right"
                                  >
                                    <div className="absolute top-0 right-0 w-5 h-[3.5px] bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover/h:bg-emerald-400 transition-colors" />
                                    <div className="absolute top-0 right-0 w-[3.5px] h-5 bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover/h:bg-emerald-400 transition-colors" />
                                  </div>

                                  {/* Bottom-Right (SE) */}
                                  <div
                                    onMouseDown={(e) => handleMouseDown(e, "se")}
                                    className="absolute -bottom-[3px] -right-[3px] w-6 h-6 cursor-nwse-resize group/h z-20"
                                    title="Resize Bottom-Right"
                                  >
                                    <div className="absolute bottom-0 right-0 w-5 h-[3.5px] bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover/h:bg-emerald-400 transition-colors" />
                                    <div className="absolute bottom-0 right-0 w-[3.5px] h-5 bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover/h:bg-emerald-400 transition-colors" />
                                  </div>

                                  {/* Bottom-Left (SW) */}
                                  <div
                                    onMouseDown={(e) => handleMouseDown(e, "sw")}
                                    className="absolute -bottom-[3px] -left-[3px] w-6 h-6 cursor-nesw-resize group/h z-20"
                                    title="Resize Bottom-Left"
                                  >
                                    <div className="absolute bottom-0 left-0 w-5 h-[3.5px] bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover/h:bg-emerald-400 transition-colors" />
                                    <div className="absolute bottom-0 left-0 w-[3.5px] h-5 bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover/h:bg-emerald-400 transition-colors" />
                                  </div>

                                  {/* ── Apple-style Edge Drag Bars ── */}
                                  {/* Top Bar (N) */}
                                  <div
                                    onMouseDown={(e) => handleMouseDown(e, "n")}
                                    className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-8 h-2 cursor-ns-resize flex items-center justify-center group/h z-20"
                                    title="Resize Top"
                                  >
                                    <div className="w-7 h-[3px] bg-white/95 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.8)] group-hover/h:bg-emerald-400 transition-colors" />
                                  </div>

                                  {/* Bottom Bar (S) */}
                                  <div
                                    onMouseDown={(e) => handleMouseDown(e, "s")}
                                    className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-8 h-2 cursor-ns-resize flex items-center justify-center group/h z-20"
                                    title="Resize Bottom"
                                  >
                                    <div className="w-7 h-[3px] bg-white/95 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.8)] group-hover/h:bg-emerald-400 transition-colors" />
                                  </div>

                                  {/* Left Bar (W) */}
                                  <div
                                    onMouseDown={(e) => handleMouseDown(e, "w")}
                                    className="absolute top-1/2 -left-[5px] -translate-y-1/2 w-2 h-8 cursor-ew-resize flex items-center justify-center group/h z-20"
                                    title="Resize Left"
                                  >
                                    <div className="w-[3px] h-7 bg-white/95 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.8)] group-hover/h:bg-emerald-400 transition-colors" />
                                  </div>

                                  {/* Right Bar (E) */}
                                  <div
                                    onMouseDown={(e) => handleMouseDown(e, "e")}
                                    className="absolute top-1/2 -right-[5px] -translate-y-1/2 w-2 h-8 cursor-ew-resize flex items-center justify-center group/h z-20"
                                    title="Resize Right"
                                  >
                                    <div className="w-[3px] h-7 bg-white/95 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.8)] group-hover/h:bg-emerald-400 transition-colors" />
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT PANE: OCR TEXT & QUESTION DIGESTION STUDIO (50% width) ── */}
            <div className="w-1/2 flex flex-col bg-[#08080c] overflow-hidden border-l border-zinc-800/40">
              {/* Header (Apple-style frosted inspector header) */}
              <div className="h-11 border-b border-zinc-800/60 px-4 bg-[#0a0a0e]/90 backdrop-blur-md flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0 text-xs">
                  <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    #{activeIdx + 1}
                  </span>
                  <span className="font-semibold text-zinc-100 truncate max-w-[160px]">
                    {activeItem.subject || "Question Item"}
                  </span>
                  <span className="text-zinc-500 font-mono text-[11px] hidden sm:inline">
                    {activeItem.year} {activeItem.examType}
                  </span>
                </div>

                {/* Apple-style Segmented View Tabs */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="inline-flex p-0.5 bg-zinc-900 border border-zinc-800 rounded-lg shadow-sm">
                    <button
                      onClick={() => setEditorTab("text")}
                      className={`px-3 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                        editorTab === "text"
                          ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Question Text
                    </button>
                    <button
                      onClick={() => setEditorTab("math")}
                      className={`px-3 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                        editorTab === "math"
                          ? "bg-zinc-800 text-emerald-300 shadow-sm border border-zinc-700"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Math Preview
                    </button>
                    <button
                      onClick={() => setEditorTab("meta")}
                      className={`px-3 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                        editorTab === "meta"
                          ? "bg-zinc-800 text-purple-300 shadow-sm border border-zinc-700"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Metadata
                    </button>
                  </div>
                </div>
              </div>

              {/* Apple-style Action Toolbar: Clean AI tools */}
              <div className="px-4 py-2 border-b border-zinc-800/40 bg-zinc-950/40 flex items-center justify-between gap-2 shrink-0 text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleAiCleanText}
                    className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-medium text-[11px] flex items-center gap-1.5 transition-all shadow-sm"
                    title="Clean headers, page numbers, and standardize question stem formatting"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>Clean Noise</span>
                  </button>

                  <button
                    onClick={handleFormatLatex}
                    className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-medium text-[11px] flex items-center gap-1.5 transition-all shadow-sm"
                    title="Auto-format math equations and symbols into LaTeX notation"
                  >
                    <FileCode className="w-3 h-3 text-cyan-400" />
                    <span>Format Math</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRerunOcr(true)}
                    disabled={isScanning || recropping}
                    className="px-3 py-1 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 hover:from-emerald-600/30 hover:to-cyan-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-sm"
                    title="Re-run Gemini 1.5 Flash Vision on cropped area (Hotkey: O)"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isScanning ? "Scanning..." : "Re-scan with Gemini (O)"}</span>
                  </button>
                </div>
              </div>

              {/* Editor Body */}
              <div className="flex-1 flex flex-col p-4 overflow-hidden relative">
                {editorTab === "text" && (
                  <textarea
                    ref={textareaRef}
                    value={editorText}
                    onChange={(e) => setEditorText(e.target.value)}
                    className={`flex-1 w-full bg-[#0c0c12] border rounded-xl p-4 text-zinc-100 font-mono text-sm leading-relaxed resize-none focus:outline-none transition-all shadow-inner ${
                      textUpdatedPulse
                        ? "border-emerald-500/80 ring-2 ring-emerald-500/30 bg-emerald-950/10"
                        : "border-zinc-800/80 focus:border-emerald-500/60"
                    }`}
                    placeholder="Question text transcribed via OCR. Click 'Re-scan with Gemini' to transcribe, or type your edits directly..."
                  />
                )}

                {editorTab === "math" && (
                  <div className="flex-1 w-full bg-[#0c0c12] border border-zinc-800/80 rounded-xl p-4 text-zinc-200 font-mono text-sm leading-relaxed overflow-y-auto select-text whitespace-pre-wrap">
                    {editorText || <span className="text-zinc-600 italic">No equation or text transcribed yet...</span>}
                  </div>
                )}

                {editorTab === "meta" && (
                  <div className="flex-1 w-full bg-[#0c0c12] border border-zinc-800/80 rounded-xl p-5 overflow-y-auto space-y-4">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold mb-2">
                      Academic Paper Classification
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-mono text-zinc-400 mb-1">Subject Name</label>
                        <input
                          value={editSubject}
                          onChange={(e) => setEditSubject(e.target.value)}
                          placeholder="e.g. Computer Networks"
                          className="w-full px-3 py-2 bg-zinc-900/80 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-zinc-400 mb-1">Subject Code</label>
                        <input
                          value={editSubjectCode}
                          onChange={(e) => setEditSubjectCode(e.target.value)}
                          placeholder="e.g. IT3002"
                          className="w-full px-3 py-2 bg-zinc-900/80 border border-zinc-800 rounded-lg text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-zinc-400 mb-1">Examination Year</label>
                        <input
                          value={editYear}
                          onChange={(e) => setEditYear(e.target.value)}
                          placeholder="e.g. 2024"
                          className="w-full px-3 py-2 bg-zinc-900/80 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-zinc-400 mb-1">Exam Type</label>
                        <input
                          value={editExamType}
                          onChange={(e) => setEditExamType(e.target.value)}
                          placeholder="e.g. Endsem / Midsem"
                          className="w-full px-3 py-2 bg-zinc-900/80 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                    <div className="pt-2">
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">Source Document</label>
                      <p className="text-xs font-mono text-zinc-500 truncate bg-zinc-950 p-2.5 rounded-lg border border-zinc-900">
                        {activeItem.sourcePdf || "N/A"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Verification & Decision Bar (Apple-style clean actions) */}
              <div className="border-t border-zinc-800/60 p-3 px-4 bg-[#0a0a0e]/95 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
                {/* Stats & Navigation */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigateItem("prev")}
                    disabled={activeIdx === 0}
                    className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 disabled:opacity-30 transition-colors"
                    title="Previous Question (Left Arrow)"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigateItem("next")}
                    disabled={activeIdx >= questions.length - 1}
                    className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 disabled:opacity-30 transition-colors"
                    title="Next Question (Right Arrow)"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-mono text-zinc-500 ml-1">
                    {editorText.length} chars · ~{Math.round(editorText.length / 4)} tokens
                  </span>
                </div>

                {/* Decision Actions: Reject vs Approve */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    onClick={() => updateStatus(activeItem.id, "REJECTED")}
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40"
                    title="Reject question crop (R)"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject (R)</span>
                  </button>
                  <button
                    onClick={() => updateStatus(activeItem.id, "APPROVED")}
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-40"
                    title="Approve & advance to next question (A / Enter)"
                  >
                    <CheckCircle className="w-4 h-4 stroke-[2.5]" />
                    <span>Approve & Next (A)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8 bg-[#08080c]">
            <Database className="w-12 h-12 text-zinc-700" />
            <h2 className="text-base font-bold text-zinc-300">All Questions Processed</h2>
            <p className="text-xs text-zinc-500 max-w-sm">
              No questions remaining in this category. Select another Subject or Paper from the top dropdown or upload a new PDF!
            </p>
          </div>
        )}
      </div>

      {/* Visual Page Cropper Modal (U) */}
      {showPageModal && activeItem && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setShowPageModal(false)}
        >
          <div
            className="bg-[#0f0f14] border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
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

            <div className="px-5 py-2 bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 font-mono">
                <span className="text-zinc-400 font-bold">Bounds:</span>
                <input
                  type="number"
                  value={Math.round(boxCoords.x0)}
                  onChange={(e) => setBoxCoords((prev) => ({ ...prev, x0: parseFloat(e.target.value) || 0 }))}
                  className="w-16 px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-200"
                />
                <input
                  type="number"
                  value={Math.round(boxCoords.y0)}
                  onChange={(e) => setBoxCoords((prev) => ({ ...prev, y0: parseFloat(e.target.value) || 0 }))}
                  className="w-16 px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-200"
                />
                <input
                  type="number"
                  value={Math.round(boxCoords.x1)}
                  onChange={(e) => setBoxCoords((prev) => ({ ...prev, x1: parseFloat(e.target.value) || 0 }))}
                  className="w-16 px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-200"
                />
                <input
                  type="number"
                  value={Math.round(boxCoords.y1)}
                  onChange={(e) => setBoxCoords((prev) => ({ ...prev, y1: parseFloat(e.target.value) || 0 }))}
                  className="w-16 px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-200"
                />
              </div>

              <div className="flex items-center gap-1 font-mono text-[11px]">
                <button
                  onClick={() =>
                    setBoxCoords((prev) => ({
                      ...prev,
                      y0: Math.max(0, prev.y0 - 25),
                      y1: Math.min(activeItem.pageHeight || 842, prev.y1 + 25),
                    }))
                  }
                  className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300"
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
                  className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300"
                >
                  Expand X (+40pt)
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[#070709] relative min-h-[400px]">
              <div
                className="relative inline-block border border-zinc-800 shadow-2xl"
                style={{
                  width: activeItem.pageWidth ? `${activeItem.pageWidth}px` : "595px",
                  height: activeItem.pageHeight ? `${activeItem.pageHeight}px` : "842px",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/pdf/page?pdf=${encodeURIComponent(
                    activeItem.sourcePdf || ""
                  )}&page=${activeItem.pageNumber || 1}&dpi=100`}
                  alt="Full PDF page"
                  className="w-full h-full object-contain pointer-events-none select-none"
                />

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
                  <div className="absolute top-1 left-1 bg-emerald-500 text-black font-mono font-bold text-[9px] px-1 rounded shadow">
                    Crop Area
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-zinc-800 flex items-center justify-between bg-zinc-950/80">
              <span className="text-xs text-zinc-500">
                Adjust coordinates to frame the question and options.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPageModal(false)}
                  className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCustomBox}
                  disabled={recropping}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
                >
                  {recropping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Crop & Extract
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Photo Studio Workspace Modal (F) */}
      {fullscreenStudio && activeItem && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col select-none"
          onClick={() => setFullscreenStudio(false)}
        >
          <div
            className="px-6 py-2.5 bg-zinc-950/90 border-b border-zinc-800 flex items-center justify-between shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="p-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Crop className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                  <span>Photo Studio Cropper</span>
                  <span className="text-zinc-500">·</span>
                  <span className="text-cyan-300 font-mono text-xs">
                    {activeItem.sourcePdf} (Page {activeItem.pageNumber})
                  </span>
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
                <button onClick={() => applyPreset("q1")} className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono rounded">Q1</button>
                <button onClick={() => applyPreset("q2")} className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono rounded">Q2</button>
                <button onClick={() => applyPreset("q3")} className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono rounded">Q3</button>
                <button onClick={() => applyPreset("full")} className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono rounded">Full</button>
              </div>

              <div className="flex items-center gap-0.5 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
                <button
                  onClick={() => handleRotate(-90)}
                  disabled={recropping || isScanning}
                  className="p-1 text-zinc-400 hover:text-amber-300 rounded hover:bg-zinc-800"
                  title="Rotate CCW 90°"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleRotate(90)}
                  disabled={recropping || isScanning}
                  className="px-2 py-0.5 text-amber-400 hover:text-amber-300 rounded hover:bg-zinc-800 flex items-center gap-1 text-xs font-mono font-bold"
                  title="Rotate CW 90°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>{rotation}°</span>
                </button>
              </div>

              <button
                onClick={async () => {
                  await handleApplyAndRecrop();
                  setFullscreenStudio(false);
                }}
                disabled={recropping || isScanning}
                className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs rounded-xl shadow flex items-center gap-1.5 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Apply Crop (Enter)</span>
              </button>

              <button
                onClick={() => setFullscreenStudio(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 text-sm font-bold"
                title="Exit Fullscreen Studio"
              >
                ✕
              </button>
            </div>
          </div>

          <div
            className="flex-1 flex overflow-hidden p-4 gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Canvas */}
            <div className="flex-1 bg-[#09090e] border border-zinc-800 rounded-2xl flex flex-col overflow-hidden">
              <div className="px-4 py-2 bg-zinc-950/80 border-b border-zinc-800 text-xs font-mono text-zinc-400 flex items-center justify-between">
                <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                  <Crop className="w-3.5 h-3.5" /> Page Canvas
                </span>
                <span className="text-zinc-500">
                  {Math.round(boxCoords.x1 - boxCoords.x0)} × {Math.round(boxCoords.y1 - boxCoords.y0)} pt
                </span>
              </div>
              <div className="flex-1 overflow-auto flex items-center justify-center p-4 relative">
                <div
                  ref={fullscreenCanvasRef}
                  className="relative select-none shadow-2xl border border-zinc-700 rounded bg-white overflow-hidden cursor-crosshair"
                  style={{
                    height: "calc(82vh - 60px)",
                    aspectRatio: `${activeItem.pageWidth || 595.32} / ${
                      activeItem.pageHeight || 841.92
                    }`,
                  }}
                  onMouseDown={(e) => handleMouseDown(e, "draw")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/pdf/page?pdf=${encodeURIComponent(
                      activeItem.sourcePdf || ""
                    )}&page=${activeItem.pageNumber || 1}&dpi=150`}
                    alt="Full PDF Page"
                    className="w-full h-full object-contain pointer-events-none select-none"
                  />
                  {(() => {
                    const pw = activeItem.pageWidth || 595.32;
                    const ph = activeItem.pageHeight || 841.92;
                    const x0Pct = (boxCoords.x0 / pw) * 100;
                    const y0Pct = (boxCoords.y0 / ph) * 100;
                    const x1Pct = (boxCoords.x1 / pw) * 100;
                    const y1Pct = (boxCoords.y1 / ph) * 100;
                    const bwPct = ((boxCoords.x1 - boxCoords.x0) / pw) * 100;
                    const bhPct = ((boxCoords.y1 - boxCoords.y0) / ph) * 100;

                    return (
                      <>
                        <div className="absolute left-0 right-0 top-0 bg-black/60 pointer-events-none" style={{ height: `${y0Pct}%` }} />
                        <div className="absolute left-0 right-0 bottom-0 bg-black/60 pointer-events-none" style={{ top: `${y1Pct}%` }} />
                        <div className="absolute left-0 bg-black/60 pointer-events-none" style={{ top: `${y0Pct}%`, width: `${x0Pct}%`, height: `${bhPct}%` }} />
                        <div className="absolute right-0 bg-black/60 pointer-events-none" style={{ top: `${y0Pct}%`, left: `${x1Pct}%`, height: `${bhPct}%` }} />

                        <div
                          className="absolute border-2 border-cyan-400 bg-cyan-400/10 shadow-[0_0_20px_rgba(6,182,212,0.5)] cursor-grab active:cursor-grabbing z-10"
                          style={{
                            left: `${x0Pct}%`,
                            top: `${y0Pct}%`,
                            width: `${bwPct}%`,
                            height: `${bhPct}%`,
                          }}
                          onMouseDown={(e) => handleMouseDown(e, "move")}
                        >
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full bg-zinc-950/90 border border-cyan-500/40 text-[9px] font-mono text-cyan-300 pointer-events-none flex items-center gap-1 shadow">
                            <Move className="w-2.5 h-2.5" /> Drag
                          </div>
                          <div onMouseDown={(e) => handleMouseDown(e, "nw")} className="absolute -top-2.5 -left-2.5 w-5 h-5 bg-white border-2 border-cyan-500 rounded-full cursor-nwse-resize shadow" />
                          <div onMouseDown={(e) => handleMouseDown(e, "ne")} className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-white border-2 border-cyan-500 rounded-full cursor-nesw-resize shadow" />
                          <div onMouseDown={(e) => handleMouseDown(e, "se")} className="absolute -bottom-2.5 -right-2.5 w-5 h-5 bg-white border-2 border-cyan-500 rounded-full cursor-nwse-resize shadow" />
                          <div onMouseDown={(e) => handleMouseDown(e, "sw")} className="absolute -bottom-2.5 -left-2.5 w-5 h-5 bg-white border-2 border-cyan-500 rounded-full cursor-nesw-resize shadow" />
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Right Live Preview */}
            <div className="flex-1 bg-[#09090e] border border-zinc-800 rounded-2xl flex flex-col overflow-hidden">
              <div className="px-4 py-2 bg-zinc-950/80 border-b border-zinc-800 text-xs font-mono text-zinc-400 flex items-center justify-between">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5" /> Live Question Crop (200 DPI)
                </span>
              </div>
              <div className="flex-1 overflow-auto flex items-center justify-center p-4 relative bg-[#07070b]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={`crop-fs-${imageKey}-${boxCoords.x0.toFixed(0)}-${boxCoords.y0.toFixed(0)}-${boxCoords.x1.toFixed(0)}-${boxCoords.y1.toFixed(0)}`}
                  src={`/api/pdf/crop?pdf=${encodeURIComponent(
                    activeItem.sourcePdf || ""
                  )}&page=${activeItem.pageNumber || 1}&x0=${boxCoords.x0.toFixed(1)}&y0=${boxCoords.y0.toFixed(1)}&x1=${boxCoords.x1.toFixed(1)}&y1=${boxCoords.y1.toFixed(1)}&dpi=200&t=${imageKey}`}
                  alt="Zoomed Question Preview"
                  className="max-w-full max-h-[calc(82vh-60px)] object-contain rounded-xl shadow-2xl border border-zinc-700/80 bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Laser Sweep Keyframes */}
      <style>{`
        @keyframes ocrLaserSweep {
          0% { top: 0%; opacity: 0.85; }
          50% { top: 96%; opacity: 1; }
          100% { top: 0%; opacity: 0.85; }
        }
        .ocr-laser-line {
          position: absolute;
          left: 0;
          right: 0;
          animation: ocrLaserSweep 2.2s ease-in-out infinite;
          z-index: 25;
        }
      `}</style>
    </div>
  );
}
