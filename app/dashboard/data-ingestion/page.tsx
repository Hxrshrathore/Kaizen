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
  Move,
  Upload,
  FileCode,
  Terminal,
  Cpu,
  Play,
  Activity,
  Radio,
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
  const [dataSource, setDataSource] = useState<"neon" | "redis">("neon");
  const [stagingStats, setStagingStats] = useState({
    stagedPending: 0,
    totalStagedKeys: 0,
    neonApprovedTotal: 0,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // View & Tool States
  const [zoom, setZoom] = useState(1);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showRawOcr, setShowRawOcr] = useState(false);
  const [showPageModal, setShowPageModal] = useState(false);
  const [viewMode, setViewMode] = useState<"zoomed" | "crop">("zoomed");

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

  const applyPreset = (preset: "q1" | "q2" | "q3" | "full") => {
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
    }
  };

  // Neural OCR Scanning & Smoker Effect State
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("Initializing vector stream...");
  const [textUpdatedPulse, setTextUpdatedPulse] = useState(false);
  const [ocrMethod, setOcrMethod] = useState<string | null>(null);

  // ── LIVE OCR & PIPELINE OBSERVATION STUDIO STATE ─────────────
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

  // Run Live Pipeline with animated step-by-step progress & live console logs
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

      // Auto-refresh questions and stats
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

  // Run Test OCR on currently cropped region and show live telemetry
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

  // ── Fetch Stats & Hierarchical Metadata ──────────────────────
  const fetchMetadataStats = useCallback(async () => {
    try {
      const resp = await fetch("/api/ingestion?stats=true");
      if (resp.ok) {
        const data = await resp.json();
        if (data.stats) setStats(data.stats);
        if (data.subjects) setSubjectsList(data.subjects);
        if (data.papers) setPapersList(data.papers);
      }
      // Also fetch Upstash Redis Staging stats
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

  // ── Fetch Questions with Hierarchical Filter ─────────────────
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
    setRotation(0);
    setShowRawOcr(false);

    // Initial bounding box coordinates
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

    // Automatically set viewMode: crop if whole unsegmented page, else zoomed
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

  // ── Photo-Editor Drag & Resize Mouse Handlers ───────────────
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

  // ── Apply Interactive Crop & Read OCR ───────────────────────
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
      if (res.extractedText) {
        setEditorText(res.extractedText);
        setTextUpdatedPulse(true);
        setTimeout(() => setTextUpdatedPulse(false), 2500);
      }

      // Automatically flip to Zoomed mode so the user sees the clean, focused question!
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

      showToast(`✓ Question cropped & OCR text extracted (${res.extractedText?.length || 0} chars)`, "ok");
    } catch (e: any) {
      showToast(e.message || "Failed to apply crop", "err");
    } finally {
      setRecropping(false);
      setIsScanning(false);
      setScanStatus("");
    }
  };

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
          forceGemini: true,
          rotation,
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
          forceGemini: true,
          rotation,
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
          forceGemini: true,
          rotation,
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

  // ── Multi-Format File Upload & Automated Ingestion ─────────────
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
        `✓ Ingested ${data.result?.stagedQuestionsCount || 0} questions to Upstash Redis staging buffer!`,
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

  // ── Fine-Tuning Dataset Exporter ───────────────────────────────
  const handleFineTuneExport = (format: "alpaca" | "chatml" | "sharegpt" | "csv") => {
    const a = document.createElement("a");
    a.href = `/api/dataset/export?format=${format}&source=${dataSource}`;
    a.download = `kaizen_finetune_${format}_${Date.now()}.${format === "csv" ? "csv" : "jsonl"}`;
    a.click();
    showToast(`✓ Exporting ${format.toUpperCase()} dataset for fine-tuning...`, "ok");
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
          handleRerunOcr(false);
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

      {/* ── Fine-Tuning Dataset Export Modal ── */}
      {showExportModal && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setShowExportModal(false)}
        >
          <div
            className="bg-[#0f0f14] border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span>Export Dataset for LLM Fine-Tuning</span>
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Download structured training data ready for fine-tuning our academic model using Unsloth, HuggingFace, LLaMA-Factory, or Gemini.
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => handleFineTuneExport("alpaca")}
                className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/50 rounded-xl text-left transition-all"
              >
                <div className="font-bold text-xs text-emerald-300">Alpaca / Unsloth</div>
                <div className="text-[10px] text-zinc-400 font-mono mt-1">instruction / input / output JSONL</div>
              </button>

              <button
                onClick={() => handleFineTuneExport("chatml")}
                className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-500/50 rounded-xl text-left transition-all"
              >
                <div className="font-bold text-xs text-cyan-300">ChatML / OpenAI</div>
                <div className="text-[10px] text-zinc-400 font-mono mt-1">messages role JSONL</div>
              </button>

              <button
                onClick={() => handleFineTuneExport("sharegpt")}
                className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-purple-500/50 rounded-xl text-left transition-all"
              >
                <div className="font-bold text-xs text-purple-300">ShareGPT</div>
                <div className="text-[10px] text-zinc-400 font-mono mt-1">conversations JSONL</div>
              </button>

              <button
                onClick={() => handleFineTuneExport("csv")}
                className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 rounded-xl text-left transition-all"
              >
                <div className="font-bold text-xs text-amber-300">Standard CSV</div>
                <div className="text-[10px] text-zinc-400 font-mono mt-1">Excel & Spreadsheet audit</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LIVE NEURAL OCR & PIPELINE OBSERVATION STUDIO MODAL ── */}
      {showOcrStudio && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-xl z-50 flex items-center justify-center p-3 md:p-6"
          onClick={() => setShowOcrStudio(false)}
        >
          <div
            className="bg-[#0a0a0e] border border-cyan-500/30 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-zinc-800/80 bg-zinc-950/90 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                  <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-zinc-100 font-mono tracking-wide">
                      NEURAL OCR & PIPELINE CONTROL CENTER
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      LIVE STREAM
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Observe high-precision OCR extraction, monitor Cloudflare R2 uploads & Upstash Redis staging buffer.
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                <button
                  onClick={() => setOcrStudioTab("runner")}
                  className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all ${
                    ocrStudioTab === "runner"
                      ? "bg-cyan-600 text-white shadow"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Play className="w-3 h-3" />
                  <span>Pipeline Runner</span>
                </button>
                <button
                  onClick={() => setOcrStudioTab("inspector")}
                  className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all ${
                    ocrStudioTab === "inspector"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Cpu className="w-3 h-3" />
                  <span>Engine Inspector</span>
                </button>
                <button
                  onClick={() => setOcrStudioTab("telemetry")}
                  className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all ${
                    ocrStudioTab === "telemetry"
                      ? "bg-purple-600 text-white shadow"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Activity className="w-3 h-3" />
                  <span>Infrastructure</span>
                </button>
              </div>

              <button
                onClick={() => setShowOcrStudio(false)}
                className="text-zinc-400 hover:text-white text-base p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* TAB 1: PIPELINE RUNNER */}
              {ocrStudioTab === "runner" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-200 font-mono flex items-center gap-1.5">
                        <Terminal className="w-4 h-4 text-cyan-400" />
                        Select Raw Examination Paper:
                      </span>
                      <span className="text-[11px] font-mono text-zinc-400">
                        {rawPdfList.length} Raw PDFs in repository
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        value={selectedRawPdf}
                        onChange={(e) => setSelectedRawPdf(e.target.value)}
                        disabled={pipelineRunning}
                        className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500 font-mono truncate"
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
                        className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all shrink-0"
                      >
                        {pipelineRunning ? (
                          <Loader2 className="w-4 h-4 animate-spin text-cyan-200" />
                        ) : (
                          <Play className="w-4 h-4 text-cyan-200" />
                        )}
                        <span>{pipelineRunning ? "Processing Pipeline..." : "▶ Run Ingestion & OCR"}</span>
                      </button>
                    </div>
                  </div>

                  {/* 5-Stage Visual Stepper */}
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
                          className={`p-3 rounded-xl border text-center transition-all ${
                            isActive
                              ? "bg-cyan-500/15 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] animate-pulse"
                              : isDone
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                              : "bg-zinc-950/60 border-zinc-800 text-zinc-500"
                          }`}
                        >
                          <div className="flex items-center justify-center mb-1">
                            {isDone ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : isActive ? (
                              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                            ) : (
                              <span className="text-[11px] font-mono font-bold text-zinc-600">#{st.num}</span>
                            )}
                          </div>
                          <div className="text-[11px] font-bold text-zinc-200 truncate">{st.title}</div>
                          <div className="text-[9px] font-mono text-zinc-400 mt-0.5">{st.desc}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Live Streaming Terminal Console */}
                  <div className="rounded-xl border border-zinc-800 bg-black/95 overflow-hidden flex flex-col shadow-inner">
                    <div className="px-3 py-1.5 bg-zinc-950 border-b border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                      <div className="flex items-center gap-1.5 text-cyan-400">
                        <Terminal className="w-3.5 h-3.5" />
                        <span>LIVE PIPELINE CONSOLE LOG STREAM</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500">{pipelineLogs.length} events logged</span>
                        <button
                          onClick={() => setPipelineLogs([])}
                          className="text-[10px] text-zinc-400 hover:text-zinc-200 underline"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div
                      ref={logTerminalRef}
                      className="h-44 p-3 font-mono text-[11px] overflow-y-auto space-y-1 select-text scrollbar-thin"
                    >
                      {pipelineLogs.map((log, i) => (
                        <div
                          key={i}
                          className={
                            log.includes("ERROR")
                              ? "text-red-400 font-bold"
                              : log.includes("✓") || log.includes("STAGED")
                              ? "text-emerald-300 font-bold"
                              : log.includes("Step")
                              ? "text-cyan-300"
                              : log.includes(">>>")
                              ? "text-amber-300 font-bold"
                              : "text-zinc-400"
                          }
                        >
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Action to switch to Redis Staging */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-zinc-400">
                      Questions are automatically staged in Upstash Redis without touching production DB.
                    </span>
                    <button
                      onClick={() => {
                        setDataSource("redis");
                        setShowOcrStudio(false);
                        fetchQuestions();
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-amber-600/30 to-red-600/30 hover:from-amber-600/50 hover:to-red-600/50 text-amber-200 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span>Switch to Redis Staging Buffer ({stagingStats.stagedPending} Pending)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: OCR ENGINE INSPECTOR */}
              {ocrStudioTab === "inspector" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-200 font-mono flex items-center gap-1.5">
                        <Cpu className="w-4 h-4 text-indigo-400" />
                        Active Question OCR Benchmark:
                      </span>
                      <span className="text-[11px] font-mono text-zinc-400">
                        {activeItem?.sourcePdf || "No active document selected"}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs font-mono">
                      <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                        <span className="text-zinc-500 text-[10px]">PAGE NUMBER</span>
                        <div className="text-zinc-200 font-bold mt-0.5">{activeItem?.pageNumber || 1}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                        <span className="text-zinc-500 text-[10px]">BOUNDING BOX</span>
                        <div className="text-indigo-300 font-bold mt-0.5 truncate">
                          [{boxCoords.x0.toFixed(0)}, {boxCoords.y0.toFixed(0)}] → [{boxCoords.x1.toFixed(0)}, {boxCoords.y1.toFixed(0)}]
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                        <span className="text-zinc-500 text-[10px]">ROTATION</span>
                        <div className="text-amber-300 font-bold mt-0.5">{rotation}°</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                        <span className="text-zinc-500 text-[10px]">DPI VECTORS</span>
                        <div className="text-emerald-300 font-bold mt-0.5">200 DPI High-Res</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <button
                        onClick={handleTestOcrLive}
                        disabled={testOcrRunning || !activeItem}
                        className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all"
                      >
                        {testOcrRunning ? (
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-indigo-200" />
                        )}
                        <span>{testOcrRunning ? "Streaming Neural OCR..." : "⚡ Run Real-Time OCR Benchmark"}</span>
                      </button>

                      <button
                        onClick={() => {
                          setManualOverlayScan((v) => !v);
                          setShowOcrStudio(false);
                          showToast(manualOverlayScan ? "Laser scan visualizer OFF" : "Laser scan visualizer ON", "ok");
                        }}
                        className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        <ScanLine className="w-4 h-4 text-cyan-400" />
                        <span>Toggle Laser Scanner View</span>
                      </button>
                    </div>
                  </div>

                  {/* Benchmark Live Result */}
                  {testOcrResult && (
                    <div className="p-4 rounded-xl border border-indigo-500/40 bg-zinc-950 space-y-3 shadow-lg shadow-indigo-500/10 animate-in fade-in">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-indigo-400 font-bold flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          Extracted Output via {testOcrResult.method}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-bold">
                            {testOcrResult.latencyMs} ms
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-bold">
                            {testOcrResult.tokensExtracted} tokens
                          </span>
                          {testOcrResult.hasLatex && (
                            <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-bold">
                              LaTeX Detected ($...$)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-100 max-h-40 overflow-y-auto leading-relaxed select-text whitespace-pre-wrap">
                        {testOcrResult.extractedText}
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditorText(testOcrResult.extractedText);
                            showToast("✓ Extracted OCR text inserted into editor!", "ok");
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Apply to Question Text Editor</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: INFRASTRUCTURE TELEMETRY */}
              {ocrStudioTab === "telemetry" && (
                <div className="grid grid-cols-2 gap-3">
                  {/* Cloudflare R2 */}
                  <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-300 font-mono flex items-center gap-1.5">
                        <Upload className="w-4 h-4 text-cyan-400" /> Cloudflare R2 Object Storage
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-mono font-bold">
                        ACTIVE
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400 space-y-1 pt-1">
                      <div>Bucket: <span className="text-zinc-200">kaizen</span></div>
                      <div>Endpoint: <span className="text-zinc-200 truncate block">3288bf4dc7bac5817897bcbd7cbe19d8.r2.cloudflarestorage.com</span></div>
                      <div>CDN Base: <span className="text-cyan-300 underline block truncate">https://pub-60fc676d8ba24a13a46925ab4941ddb5.r2.dev</span></div>
                    </div>
                  </div>

                  {/* Upstash Redis Staging Buffer */}
                  <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 font-mono flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-400" /> Upstash Redis Staging Tier
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-mono font-bold">
                        CONNECTED
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400 space-y-1 pt-1">
                      <div>Host: <span className="text-zinc-200">creative-bass-185678.upstash.io</span></div>
                      <div>Pending Queue: <span className="text-amber-300 font-bold">{stagingStats.stagedPending} questions</span></div>
                      <div>Total Staging Keys: <span className="text-zinc-200 font-bold">{stagingStats.totalStagedKeys} keys</span></div>
                    </div>
                  </div>

                  {/* Upstash Vector */}
                  <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-300 font-mono flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-purple-400" /> Upstash Vector Index (RAG)
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-mono font-bold">
                        ONLINE
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400 space-y-1 pt-1">
                      <div>Host: <span className="text-zinc-200">healthy-gannet-73484-us1-vector.upstash.io</span></div>
                      <div>Similarity: <span className="text-zinc-200">Cosine</span></div>
                      <div>Vector Dimensions: <span className="text-purple-300 font-bold">1,536 Dimensions</span></div>
                    </div>
                  </div>

                  {/* Neon PostgreSQL Production DB */}
                  <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-300 font-mono flex items-center gap-1.5">
                        <Database className="w-4 h-4 text-indigo-400" /> Neon PostgreSQL DB
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-mono font-bold">
                        PRODUCTION
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400 space-y-1 pt-1">
                      <div>Cluster: <span className="text-zinc-200">ep-falling-bread-ahbvwe8e</span></div>
                      <div>Approved Records: <span className="text-indigo-300 font-bold">{stats.approved} Golden Questions</span></div>
                      <div>Total Production Rows: <span className="text-zinc-200 font-bold">{stats.total} records</span></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TOP HEADER: Filter Hierarchy Bar ── */}
      <div className="h-14 border-b border-zinc-800/50 flex items-center justify-between px-4 bg-zinc-950/70 backdrop-blur-xl shrink-0 gap-3">
        {/* Tier Toggle: Redis Staging vs Neon DB Production */}
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 shrink-0">
          <button
            onClick={() => setDataSource("redis")}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-md flex items-center gap-1.5 transition-all ${
              dataSource === "redis"
                ? "bg-gradient-to-r from-red-600 to-amber-600 text-white shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
            title="Upstash Redis Staging Buffer: verify OCR before any Neon DB commits"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Redis Staging</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[9px] font-mono font-bold text-amber-200">
              {stagingStats.stagedPending}
            </span>
          </button>
          <button
            onClick={() => setDataSource("neon")}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-md flex items-center gap-1.5 transition-all ${
              dataSource === "neon"
                ? "bg-indigo-600 text-white shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
            title="Neon PostgreSQL Database: approved production questions"
          >
            <Database className="w-3.5 h-3.5 text-indigo-300" />
            <span>Neon DB</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[9px] font-mono font-bold text-indigo-200">
              {stats.approved}
            </span>
          </button>
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
              setPaperFilter("ALL");
            }}
            className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 max-w-[180px] shrink-0"
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
            className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 flex-1 min-w-[150px] max-w-[220px] truncate"
          >
            <option value="ALL">All Papers ({filteredPapers.length})</option>
            {filteredPapers.map((p) => (
              <option key={p.sourcePdf} value={p.sourcePdf}>
                [{p.examType}] {p.sourcePdf} ({p.total} q · {p.pending} pend)
              </option>
            ))}
          </select>

          {/* Multi-Format Ingest File Uploader */}
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
            className="px-2.5 py-1 bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/50 hover:to-blue-600/50 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow shrink-0"
            title="Upload PDF, Image, PPTX, or DOCX for automated local enhancement, R2 upload & Gemini OCR"
          >
            {isUploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            ) : (
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>{isUploading ? "Ingesting..." : "Ingest Document"}</span>
          </button>

          {/* Fine-Tuning Export Modal Trigger */}
          <button
            onClick={() => setShowExportModal(true)}
            className="px-2.5 py-1 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/40 hover:to-teal-600/40 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow shrink-0"
            title="Export dataset for LLM Fine-Tuning (Alpaca, ChatML, ShareGPT, JSONL)"
          >
            <FileCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fine-Tune Export</span>
          </button>

          {/* Live Neural OCR Studio Trigger */}
          <button
            onClick={() => setShowOcrStudio(true)}
            className="px-3 py-1 bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 hover:from-cyan-500/35 hover:to-purple-500/35 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] shrink-0"
            title="Open Neural OCR & Pipeline Control Center: observe real-time OCR extraction, run pipeline, inspect models"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Live OCR Studio</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </button>
        </div>

        {/* Global Stats & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden xl:flex items-center gap-1.5 font-mono text-[11px]">
            <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold">
              {dataSource === "redis" ? `${stagingStats.stagedPending} IN STAGING` : `${stats.pending} PENDING`}
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
                      {q.contentType && (
                        <span className="text-[9px] font-mono px-1 py-0.2 bg-purple-500/20 text-purple-300 rounded border border-purple-500/30 shrink-0">
                          {q.contentType}
                        </span>
                      )}
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
                {activeItem.contentType && (
                  <span className="px-2 py-0.5 bg-purple-500/15 border border-purple-500/40 text-purple-300 font-mono font-bold rounded text-[11px] shrink-0">
                    {activeItem.contentType}
                  </span>
                )}
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
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800/40 shrink-0 bg-zinc-950/70 backdrop-blur-md gap-2">
                {/* View Mode Toggle: Zoomed Question vs Interactive Photo Crop Tool */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                    <button
                      onClick={() => setViewMode("zoomed")}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md flex items-center gap-1.5 transition-all ${
                        viewMode === "zoomed"
                          ? "bg-indigo-600 text-foreground shadow"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                      title="Zoom directly into the selected question area (Hotkey: Z)"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>Zoomed Question (Z)</span>
                    </button>
                    <button
                      onClick={() => setViewMode("crop")}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md flex items-center gap-1.5 transition-all ${
                        viewMode === "crop"
                          ? "bg-cyan-600 text-foreground shadow"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                      title="Interactive Photo Editor Crop tool: drag and resize 8 handles over full page (Hotkey: C)"
                    >
                      <Crop className="w-3 h-3" />
                      <span>Photo Crop Tool (C)</span>
                    </button>
                  </div>

                  {/* If in Crop Mode, show the Apply Crop & Read OCR button */}
                  {viewMode === "crop" && (
                    <button
                      onClick={handleApplyAndRecrop}
                      disabled={recropping || isScanning}
                      className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-foreground text-[11px] font-bold rounded-lg flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all animate-pulse"
                      title="Apply current dragged crop box and re-scan OCR (Hotkey: Enter)"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply Crop & Read OCR (Enter)</span>
                    </button>
                  )}
                </div>

                {/* Quick Uncrop Nudge Buttons */}
                <div className="hidden xl:flex items-center gap-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold mr-1">
                    Nudge:
                  </span>
                  <button
                    onClick={() => handleQuickUncrop({ top: 30 })}
                    disabled={recropping}
                    className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-800 text-[10px] font-mono"
                    title="Uncrop Top +30pt"
                  >
                    ▲ Top +30
                  </button>
                  <button
                    onClick={() => handleQuickUncrop({ bottom: 30 })}
                    disabled={recropping}
                    className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-800 text-[10px] font-mono"
                    title="Uncrop Bottom +30pt"
                  >
                    ▼ Bottom +30
                  </button>
                  <button
                    onClick={() => handleQuickUncrop({ left: 20, right: 20 })}
                    disabled={recropping}
                    className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-800 text-[10px] font-mono"
                    title="Uncrop Width +40pt"
                  >
                    ◀▶ Width +40
                  </button>
                </div>

                {/* Action & Zoom controls */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Rotation Controls */}
                  <div className="flex items-center gap-0.5 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                    <button
                      onClick={() => handleRotate(-90)}
                      disabled={recropping || isScanning}
                      className="p-1 text-zinc-400 hover:text-amber-300 rounded hover:bg-zinc-800 flex items-center justify-center transition-colors"
                      title="Rotate Counter-Clockwise 90° (↺)"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleRotate(90)}
                      disabled={recropping || isScanning}
                      className="px-2 py-0.5 text-amber-400 hover:text-amber-300 rounded hover:bg-zinc-800 flex items-center gap-1 text-[11px] font-mono font-bold transition-colors"
                      title="Rotate Clockwise 90° (↻ - Hotkey: T or Shift+R)"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>{rotation}°</span>
                    </button>
                  </div>

                  {/* Scan Visualizer Toggle */}
                  <button
                    onClick={() => {
                      setManualOverlayScan((v) => !v);
                      showToast(!manualOverlayScan ? "Laser scan visualizer ON" : "Laser scan visualizer OFF", "ok");
                    }}
                    className={`px-2 py-1 rounded-lg border text-[11px] font-mono font-bold flex items-center gap-1 transition-all ${
                      manualOverlayScan || isScanning
                        ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.3)] animate-pulse"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                    title="Toggle cybernetic scanning beam & smoker fluid overlay over the active image"
                  >
                    <ScanLine className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden sm:inline">Laser Scan</span>
                  </button>

                  {/* Benchmark Inspector Shortcut */}
                  <button
                    onClick={() => {
                      handleTestOcrLive();
                      setOcrStudioTab("inspector");
                      setShowOcrStudio(true);
                    }}
                    disabled={testOcrRunning}
                    className="px-2 py-1 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1 transition-all"
                    title="Run live benchmark on cropped question & inspect tokens, math LaTeX and latency"
                  >
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="hidden sm:inline">Inspect OCR</span>
                  </button>

                  <button
                    onClick={() => handleRerunOcr(false)}
                    disabled={recropping || isScanning}
                    className="px-2.5 py-1 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 hover:from-cyan-500/30 hover:to-indigo-500/30 text-cyan-300 rounded-lg border border-cyan-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                    title="Rerun Neural OCR (Hotkey: O)"
                  >
                    <Sparkles className={`w-3 h-3 ${isScanning ? "animate-spin text-cyan-400" : "text-cyan-400"}`} />
                    <span>{isScanning ? "Scanning..." : "Rerun OCR (O)"}</span>
                  </button>

                  <div className="flex items-center gap-0.5 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                    <button
                      onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
                      className="p-1 text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-800"
                      title="Zoom Out (-)"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-mono text-zinc-400 w-9 text-center">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
                      className="p-1 text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-800"
                      title="Zoom In (+)"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setZoom(1)}
                      className="px-1.5 py-1 text-[10px] font-mono text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-800"
                      title="Reset Zoom to 100%"
                    >
                      100%
                    </button>
                  </div>
                </div>
              </div>

              {/* Image Viewport */}
              <div
                ref={viewportRef}
                className="flex-1 overflow-auto flex items-center justify-center p-3 bg-[#07070a] relative select-none"
              >
                {/* ── HIGH-TECH NEURAL OCR & SMOKER SCANNER OVERLAY ── */}
                {(isScanning || recropping || manualOverlayScan) && (
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
                        <span>
                          {manualOverlayScan && !isScanning
                            ? "OPTICAL LASER SCANNER ACTIVE"
                            : "NEURAL OCR STREAMING"}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-200 font-mono tracking-wide animate-pulse">
                        {manualOverlayScan && !isScanning
                          ? "Real-time laser beam sweeping active bounding box..."
                          : scanStatus}
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

                {/* ── MODE 1: ZOOMED QUESTION FOCUS (The user's Image 1!) ── */}
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
                      key={`${activeItem.id}-${imageKey}-${rotation}`}
                      src={
                        activeItem.sourcePdf
                          ? `/api/pdf/crop?pdf=${encodeURIComponent(
                              activeItem.sourcePdf
                            )}&page=${activeItem.pageNumber || 1}&x0=${boxCoords.x0.toFixed(
                              1
                            )}&y0=${boxCoords.y0.toFixed(1)}&x1=${boxCoords.x1.toFixed(
                              1
                            )}&y1=${boxCoords.y1.toFixed(1)}&dpi=200&rotation=${rotation}&t=${imageKey}`
                          : `${getMediaUrl(activeItem.imagePath)}?t=${imageKey}`
                      }
                      alt="Focused Question Crop"
                      className="max-w-full max-h-[calc(46vh-55px)] object-contain rounded-lg shadow-2xl border border-zinc-700/80 bg-white"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.src = `${getMediaUrl(activeItem.imagePath)}?t=${imageKey}`;
                      }}
                    />

                    {/* Quick Badge at Bottom Left of Zoomed View */}
                    <div className="absolute bottom-2 left-3 px-2.5 py-0.5 rounded-full bg-zinc-950/90 border border-zinc-800 text-[10px] font-mono text-zinc-300 backdrop-blur-md flex items-center gap-1.5 shadow">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="font-bold">Focused Question Crop</span>
                      <span className="text-zinc-600">|</span>
                      <span className="text-indigo-300">
                        {Math.round(boxCoords.x1 - boxCoords.x0)} ×{" "}
                        {Math.round(boxCoords.y1 - boxCoords.y0)} pt
                      </span>
                      <span className="text-zinc-600">|</span>
                      <span className="text-emerald-400 font-semibold">200 DPI Vector</span>
                    </div>

                    {/* Quick Switch to Crop Tool Button at Bottom Right */}
                    <button
                      onClick={() => setViewMode("crop")}
                      className="absolute bottom-2 right-3 px-2.5 py-1 rounded-lg bg-zinc-900/90 hover:bg-cyan-950/80 border border-cyan-500/40 text-[11px] font-mono text-cyan-300 backdrop-blur-md flex items-center gap-1.5 shadow-lg hover:border-cyan-400 transition-colors"
                      title="Adjust Question Crop (Hotkey: C)"
                    >
                      <Crop className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Recrop Question (C)</span>
                    </button>
                  </div>
                ) : (
                  /* ── MODE 2: DUAL-PANE PHOTO STUDIO & INTERACTIVE CROPPER ── */
                  <div className="flex w-full h-full overflow-hidden">
                    {/* LEFT PANE: Full Page Photo Editor Canvas (~46% width) */}
                    <div className="w-[46%] border-r border-zinc-800/80 flex flex-col bg-[#050508] relative select-none">
                      {/* Top Header of Left Pane */}
                      <div className="px-2.5 py-1 bg-zinc-950/90 border-b border-zinc-800/60 flex items-center justify-between text-[10px] font-mono shrink-0">
                        <span className="text-cyan-400 font-bold flex items-center gap-1">
                          <Crop className="w-3 h-3" /> Page {activeItem.pageNumber} Canvas
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-zinc-500 font-bold mr-0.5">Presets:</span>
                          <button
                            onClick={() => applyPreset("q1")}
                            className="px-1.5 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-800 hover:border-cyan-500/50 transition-colors"
                            title="Top 30% of page (Question 1)"
                          >
                            Q1
                          </button>
                          <button
                            onClick={() => applyPreset("q2")}
                            className="px-1.5 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-800 hover:border-cyan-500/50 transition-colors"
                            title="Middle 30% of page (Question 2)"
                          >
                            Q2
                          </button>
                          <button
                            onClick={() => applyPreset("q3")}
                            className="px-1.5 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-800 hover:border-cyan-500/50 transition-colors"
                            title="Bottom 30% of page (Question 3)"
                          >
                            Q3
                          </button>
                          <button
                            onClick={() => applyPreset("full")}
                            className="px-1.5 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-800 hover:border-cyan-500/50 transition-colors"
                            title="Entire Page Body"
                          >
                            Full
                          </button>
                          <button
                            onClick={() => setFullscreenStudio(true)}
                            className="px-1.5 py-0.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30 flex items-center gap-1 transition-colors ml-1"
                            title="Fullscreen Studio Modal (Hotkey: F)"
                          >
                            <Maximize2 className="w-2.5 h-2.5" /> (F)
                          </button>
                        </div>
                      </div>

                      {/* Canvas Container */}
                      <div className="flex-1 overflow-auto flex items-center justify-center p-2 relative bg-[#07070b]">
                        {(() => {
                          const isSideways = rotation % 180 === 90;
                          const effPw = isSideways ? (activeItem.pageHeight || 841.92) : (activeItem.pageWidth || 595.32);
                          const effPh = isSideways ? (activeItem.pageWidth || 595.32) : (activeItem.pageHeight || 841.92);

                          return (
                            <div
                              ref={cropCanvasRef}
                              className="relative inline-block select-none shadow-2xl border border-zinc-700 rounded bg-white overflow-hidden cursor-crosshair"
                              style={{
                                height: "calc(46vh - 82px)",
                                aspectRatio: `${effPw} / ${effPh}`,
                              }}
                              onMouseDown={(e) => handleMouseDown(e, "draw")}
                            >
                              {/* Full Page High-Resolution Background */}
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                key={`page-bg-${activeItem.id}-${rotation}-${imageKey}`}
                                src={`/api/pdf/page?pdf=${encodeURIComponent(
                                  activeItem.sourcePdf || ""
                                )}&page=${activeItem.pageNumber || 1}&dpi=150&rotation=${rotation}`}
                                alt="Full PDF Page"
                                className="w-full h-full object-contain pointer-events-none select-none"
                              />

                              {/* 4 Dimmed Masks Outside the Crop Box */}
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
                                {/* Top mask */}
                                <div
                                  className="absolute left-0 right-0 top-0 bg-black/65 pointer-events-none"
                                  style={{ height: `${y0Pct}%` }}
                                />
                                {/* Bottom mask */}
                                <div
                                  className="absolute left-0 right-0 bottom-0 bg-black/65 pointer-events-none"
                                  style={{ top: `${y1Pct}%` }}
                                />
                                {/* Left mask */}
                                <div
                                  className="absolute left-0 bg-black/65 pointer-events-none"
                                  style={{
                                    top: `${y0Pct}%`,
                                    width: `${x0Pct}%`,
                                    height: `${bhPct}%`,
                                  }}
                                />
                                {/* Right mask */}
                                <div
                                  className="absolute right-0 bg-black/65 pointer-events-none"
                                  style={{
                                    top: `${y0Pct}%`,
                                    left: `${x1Pct}%`,
                                    height: `${bhPct}%`,
                                  }}
                                />

                                {/* Active Draggable & Resizable Crop Box */}
                                <div
                                  className="absolute border-2 border-cyan-400 bg-cyan-400/10 shadow-[0_0_20px_rgba(6,182,212,0.45)] cursor-grab active:cursor-grabbing z-10"
                                  style={{
                                    left: `${x0Pct}%`,
                                    top: `${y0Pct}%`,
                                    width: `${bwPct}%`,
                                    height: `${bhPct}%`,
                                  }}
                                  onMouseDown={(e) => handleMouseDown(e, "move")}
                                >
                                  {/* Rule of Thirds Grid Lines */}
                                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                                    <div className="border-r border-b border-cyan-300/30 border-dashed" />
                                    <div className="border-r border-b border-cyan-300/30 border-dashed" />
                                    <div className="border-b border-cyan-300/30 border-dashed" />
                                    <div className="border-r border-b border-cyan-300/30 border-dashed" />
                                    <div className="border-r border-b border-cyan-300/30 border-dashed" />
                                    <div className="border-b border-cyan-300/30 border-dashed" />
                                    <div className="border-r border-cyan-300/30 border-dashed" />
                                    <div className="border-r border-cyan-300/30 border-dashed" />
                                    <div />
                                  </div>

                                  {/* Center Drag Badge */}
                                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full bg-zinc-950/90 border border-cyan-500/40 text-[9px] font-mono text-cyan-300 pointer-events-none flex items-center gap-1 shadow">
                                    <Move className="w-2.5 h-2.5" /> Drag
                                  </div>

                                  {/* Dimension Tag */}
                                  <div className="absolute -top-5 left-0 px-1.5 py-0.2 bg-cyan-500 text-black font-mono font-bold text-[9px] rounded shadow-md pointer-events-none">
                                    {Math.round(boxCoords.x1 - boxCoords.x0)} ×{" "}
                                    {Math.round(boxCoords.y1 - boxCoords.y0)} pt
                                  </div>

                                  {/* 8 Photo Editor Handles */}
                                  {/* NW Corner */}
                                  <div
                                    onMouseDown={(e) => handleMouseDown(e, "nw")}
                                    className="absolute -top-2.5 -left-2.5 w-5 h-5 bg-white border-2 border-cyan-500 rounded-full shadow-lg cursor-nwse-resize hover:scale-125 transition-transform"
                                    title="Resize Top-Left"
                                  />
                                  {/* N Edge */}
                                  <div
                                    onMouseDown={(e) => handleMouseDown(e, "n")}
                                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-7 h-2 bg-white border border-cyan-500 rounded-full shadow-md cursor-ns-resize hover:scale-125 transition-transform"
                                    title="Resize Top"
                                  />
                                  {/* NE Corner */}
                                  <div
                                    onMouseDown={(e) => handleMouseDown(e, "ne")}
                                    className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-white border-2 border-cyan-500 rounded-full shadow-lg cursor-nesw-resize hover:scale-125 transition-transform"
                                    title="Resize Top-Right"
                                  />
                                  {/* E Edge */}
                                  <div
                                    onMouseDown={(e) => handleMouseDown(e, "e")}
                                    className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2 h-7 bg-white border border-cyan-500 rounded-full shadow-md cursor-ew-resize hover:scale-125 transition-transform"
                                    title="Resize Right"
                                  />
                                  {/* SE Corner */}
                                  <div
                                    onMouseDown={(e) => handleMouseDown(e, "se")}
                                    className="absolute -bottom-2.5 -right-2.5 w-5 h-5 bg-white border-2 border-cyan-500 rounded-full shadow-lg cursor-nwse-resize hover:scale-125 transition-transform"
                                    title="Resize Bottom-Right"
                                  />
                                  {/* S Edge */}
                                  <div
                                    onMouseDown={(e) => handleMouseDown(e, "s")}
                                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-7 h-2 bg-white border border-cyan-500 rounded-full shadow-md cursor-ns-resize hover:scale-125 transition-transform"
                                    title="Resize Bottom"
                                  />
                                  {/* SW Corner */}
                                  <div
                                    onMouseDown={(e) => handleMouseDown(e, "sw")}
                                    className="absolute -bottom-2.5 -left-2.5 w-5 h-5 bg-white border-2 border-cyan-500 rounded-full shadow-lg cursor-nesw-resize hover:scale-125 transition-transform"
                                    title="Resize Bottom-Left"
                                  />
                                  {/* W Edge */}
                                  <div
                                    onMouseDown={(e) => handleMouseDown(e, "w")}
                                    className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2 h-7 bg-white border border-cyan-500 rounded-full shadow-md cursor-ew-resize hover:scale-125 transition-transform"
                                    title="Resize Left"
                                  />
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                    {/* RIGHT PANE: LIVE ZOOMED QUESTION PREVIEW (~54% width) - THE USER'S IMAGE 1! */}
                    <div className="w-[54%] flex flex-col bg-[#060609] relative select-none">
                      {/* Top Header of Right Pane */}
                      <div className="px-3 py-1 bg-zinc-950/90 border-b border-zinc-800/60 flex items-center justify-between text-[10px] font-mono shrink-0">
                        <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                          <Maximize2 className="w-3 h-3 text-emerald-400" /> Live Zoomed Question Preview (200 DPI)
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-300 font-bold">
                            {Math.round(boxCoords.x1 - boxCoords.x0)} × {Math.round(boxCoords.y1 - boxCoords.y0)} pt
                          </span>
                          <button
                            onClick={handleApplyAndRecrop}
                            disabled={recropping || isScanning}
                            className="px-2.5 py-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded shadow-md transition-all flex items-center gap-1 hover:scale-105"
                            title="Apply current crop and re-read OCR (Hotkey: Enter)"
                          >
                            <Check className="w-3 h-3" /> Apply Crop (Enter)
                          </button>
                        </div>
                      </div>

                      {/* Display Area: Shows Question Zoomed In to fill the container! */}
                      <div className="flex-1 overflow-auto flex items-center justify-center p-3 relative bg-[#08080d]">
                        {(() => {
                          const isSideways = rotation % 180 === 90;
                          const effPw = isSideways ? (activeItem.pageHeight || 841.92) : (activeItem.pageWidth || 595.32);
                          const effPh = isSideways ? (activeItem.pageWidth || 595.32) : (activeItem.pageHeight || 841.92);

                          if (dragHandle) {
                            return (
                              /* While actively dragging, instant 60 FPS CSS-based zoom with 0 network latency! */
                              <div
                                className="relative overflow-hidden bg-white shadow-2xl rounded-lg border border-zinc-700/80"
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  maxHeight: "calc(46vh - 85px)",
                                }}
                              >
                                <div className="relative w-full h-full overflow-hidden">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={`/api/pdf/page?pdf=${encodeURIComponent(
                                      activeItem.sourcePdf || ""
                                    )}&page=${activeItem.pageNumber || 1}&dpi=150&rotation=${rotation}`}
                                    alt="Live Crop Drag"
                                    className="absolute pointer-events-none select-none max-w-none"
                                    style={{
                                      width: `${(effPw / Math.max(1, boxCoords.x1 - boxCoords.x0)) * 100}%`,
                                      height: `${(effPh / Math.max(1, boxCoords.y1 - boxCoords.y0)) * 100}%`,
                                      left: `${-(boxCoords.x0 / Math.max(1, boxCoords.x1 - boxCoords.x0)) * 100}%`,
                                      top: `${-(boxCoords.y0 / Math.max(1, boxCoords.y1 - boxCoords.y0)) * 100}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          }

                          return (
                            /* When released or stationary, high-res 200 DPI vector render! */
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              key={`crop-live-${imageKey}-${rotation}-${boxCoords.x0.toFixed(0)}-${boxCoords.y0.toFixed(0)}-${boxCoords.x1.toFixed(0)}-${boxCoords.y1.toFixed(0)}`}
                              src={`/api/pdf/crop?pdf=${encodeURIComponent(
                                activeItem.sourcePdf || ""
                              )}&page=${activeItem.pageNumber || 1}&x0=${boxCoords.x0.toFixed(1)}&y0=${boxCoords.y0.toFixed(1)}&x1=${boxCoords.x1.toFixed(1)}&y1=${boxCoords.y1.toFixed(1)}&dpi=200&rotation=${rotation}&t=${imageKey}`}
                              alt="Zoomed Question Preview"
                              className="max-w-full max-h-[calc(46vh-85px)] object-contain rounded-lg shadow-2xl border border-zinc-700/80 bg-white"
                            />
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}
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
                  <button
                    onClick={() => setShowFormulaPreview((v) => !v)}
                    className={`px-2 py-1 border rounded text-[11px] font-mono flex items-center gap-1 transition-all ${
                      showFormulaPreview
                        ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                    title="Toggle formula and markdown preview"
                  >
                    <FileText className="w-3 h-3 text-purple-400" />
                    <span>{showFormulaPreview ? "Edit Raw" : "Preview Math"}</span>
                  </button>

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

              {/* Textarea or Formula Preview */}
              {showFormulaPreview ? (
                <div className="flex-1 w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 text-zinc-100 font-mono text-xs leading-relaxed overflow-y-auto select-text whitespace-pre-wrap">
                  <div className="text-[10px] text-purple-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-zinc-800 pb-1.5">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    Formatted Mathematical & Typographic Question Preview
                  </div>
                  {editorText}
                </div>
              ) : (
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
              )}

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

      {/* ── FULLSCREEN PHOTO STUDIO WORKSPACE MODAL (F) ── */}
      {fullscreenStudio && activeItem && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col select-none"
          onClick={() => setFullscreenStudio(false)}
        >
          {/* Top Bar */}
          <div
            className="px-6 py-2.5 bg-zinc-950/90 border-b border-zinc-800 flex items-center justify-between shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
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
                <p className="text-[11px] text-zinc-400 font-mono">
                  Drag the cyan box or 8 handles to frame the question. Live preview zooms in on the right.
                </p>
              </div>
            </div>

            {/* Presets and Apply */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
                <span className="text-[10px] font-mono text-zinc-400 font-bold px-1.5">Presets:</span>
                <button
                  onClick={() => applyPreset("q1")}
                  className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono rounded"
                >
                  Q1 (Top)
                </button>
                <button
                  onClick={() => applyPreset("q2")}
                  className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono rounded"
                >
                  Q2 (Mid)
                </button>
                <button
                  onClick={() => applyPreset("q3")}
                  className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono rounded"
                >
                  Q3 (Bottom)
                </button>
                <button
                  onClick={() => applyPreset("full")}
                  className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono rounded"
                >
                  Full Page
                </button>
              </div>

              {/* Rotation inside Fullscreen Studio */}
              <div className="flex items-center gap-0.5 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
                <button
                  onClick={() => handleRotate(-90)}
                  disabled={recropping || isScanning}
                  className="p-1 text-zinc-400 hover:text-amber-300 rounded hover:bg-zinc-800"
                  title="Rotate CCW 90° (↺)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleRotate(90)}
                  disabled={recropping || isScanning}
                  className="px-2 py-0.5 text-amber-400 hover:text-amber-300 rounded hover:bg-zinc-800 flex items-center gap-1 text-xs font-mono font-bold"
                  title="Rotate CW 90° (↻ - Hotkey: T)"
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
                className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Apply Crop & Read (Enter)</span>
              </button>

              <button
                onClick={() => setFullscreenStudio(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 text-sm font-bold"
                title="Exit Fullscreen Studio (Esc or F)"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Main Fullscreen Workspace: Split 50% Canvas / 50% Live Zoom */}
          <div
            className="flex-1 flex overflow-hidden p-4 gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Canvas (Large 80vh PDF Page) */}
            <div className="flex-1 bg-[#09090e] border border-zinc-800 rounded-2xl flex flex-col overflow-hidden">
              <div className="px-4 py-2 bg-zinc-950/80 border-b border-zinc-800 text-xs font-mono text-zinc-400 flex items-center justify-between">
                <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                  <Crop className="w-3.5 h-3.5" /> High-Resolution Page Canvas
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
                  {/* Dimmed masks and 8 handles */}
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
                        <div
                          className="absolute left-0 right-0 top-0 bg-black/65 pointer-events-none"
                          style={{ height: `${y0Pct}%` }}
                        />
                        <div
                          className="absolute left-0 right-0 bottom-0 bg-black/65 pointer-events-none"
                          style={{ top: `${y1Pct}%` }}
                        />
                        <div
                          className="absolute left-0 bg-black/65 pointer-events-none"
                          style={{ top: `${y0Pct}%`, width: `${x0Pct}%`, height: `${bhPct}%` }}
                        />
                        <div
                          className="absolute right-0 bg-black/65 pointer-events-none"
                          style={{ top: `${y0Pct}%`, left: `${x1Pct}%`, height: `${bhPct}%` }}
                        />

                        <div
                          className="absolute border-2 border-cyan-400 bg-cyan-400/10 shadow-[0_0_25px_rgba(6,182,212,0.5)] cursor-grab active:cursor-grabbing z-10"
                          style={{
                            left: `${x0Pct}%`,
                            top: `${y0Pct}%`,
                            width: `${bwPct}%`,
                            height: `${bhPct}%`,
                          }}
                          onMouseDown={(e) => handleMouseDown(e, "move")}
                        >
                          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                            <div className="border-r border-b border-cyan-300/30 border-dashed" />
                            <div className="border-r border-b border-cyan-300/30 border-dashed" />
                            <div className="border-b border-cyan-300/30 border-dashed" />
                            <div className="border-r border-b border-cyan-300/30 border-dashed" />
                            <div className="border-r border-b border-cyan-300/30 border-dashed" />
                            <div className="border-b border-cyan-300/30 border-dashed" />
                            <div className="border-r border-cyan-300/30 border-dashed" />
                            <div className="border-r border-cyan-300/30 border-dashed" />
                            <div />
                          </div>
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2.5 py-0.5 rounded-full bg-zinc-950/90 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 pointer-events-none flex items-center gap-1 shadow">
                            <Move className="w-3 h-3" /> Drag
                          </div>
                          <div className="absolute -top-6 left-0 px-2 py-0.5 bg-cyan-500 text-black font-mono font-bold text-[10px] rounded shadow-md pointer-events-none">
                            {Math.round(boxCoords.x1 - boxCoords.x0)} × {Math.round(boxCoords.y1 - boxCoords.y0)} pt
                          </div>

                          <div
                            onMouseDown={(e) => handleMouseDown(e, "nw")}
                            className="absolute -top-3 -left-3 w-6 h-6 bg-white border-2 border-cyan-500 rounded-full shadow-lg cursor-nwse-resize hover:scale-125 transition-transform"
                          />
                          <div
                            onMouseDown={(e) => handleMouseDown(e, "n")}
                            className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-2.5 bg-white border border-cyan-500 rounded-full shadow-md cursor-ns-resize hover:scale-125 transition-transform"
                          />
                          <div
                            onMouseDown={(e) => handleMouseDown(e, "ne")}
                            className="absolute -top-3 -right-3 w-6 h-6 bg-white border-2 border-cyan-500 rounded-full shadow-lg cursor-nesw-resize hover:scale-125 transition-transform"
                          />
                          <div
                            onMouseDown={(e) => handleMouseDown(e, "e")}
                            className="absolute top-1/2 -right-2 -translate-y-1/2 w-2.5 h-8 bg-white border border-cyan-500 rounded-full shadow-md cursor-ew-resize hover:scale-125 transition-transform"
                          />
                          <div
                            onMouseDown={(e) => handleMouseDown(e, "se")}
                            className="absolute -bottom-3 -right-3 w-6 h-6 bg-white border-2 border-cyan-500 rounded-full shadow-lg cursor-nwse-resize hover:scale-125 transition-transform"
                          />
                          <div
                            onMouseDown={(e) => handleMouseDown(e, "s")}
                            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-2.5 bg-white border border-cyan-500 rounded-full shadow-md cursor-ns-resize hover:scale-125 transition-transform"
                          />
                          <div
                            onMouseDown={(e) => handleMouseDown(e, "sw")}
                            className="absolute -bottom-3 -left-3 w-6 h-6 bg-white border-2 border-cyan-500 rounded-full shadow-lg cursor-nesw-resize hover:scale-125 transition-transform"
                          />
                          <div
                            onMouseDown={(e) => handleMouseDown(e, "w")}
                            className="absolute top-1/2 -left-2 -translate-y-1/2 w-2.5 h-8 bg-white border border-cyan-500 rounded-full shadow-md cursor-ew-resize hover:scale-125 transition-transform"
                          />
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Right Live Zoom View (Large High-Resolution Preview) */}
            <div className="flex-1 bg-[#09090e] border border-zinc-800 rounded-2xl flex flex-col overflow-hidden">
              <div className="px-4 py-2 bg-zinc-950/80 border-b border-zinc-800 text-xs font-mono text-zinc-400 flex items-center justify-between">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5" /> High-Resolution Question Preview (200 DPI)
                </span>
                <span className="text-emerald-400 font-semibold font-mono">Crisp Vector Stream</span>
              </div>
              <div className="flex-1 overflow-auto flex items-center justify-center p-4 relative bg-[#07070b]">
                {dragHandle ? (
                  <div
                    className="relative overflow-hidden bg-white shadow-2xl rounded-xl border border-zinc-700/80"
                    style={{ width: "100%", height: "100%", maxHeight: "calc(82vh - 60px)" }}
                  >
                    <div className="relative w-full h-full overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/pdf/page?pdf=${encodeURIComponent(
                          activeItem.sourcePdf || ""
                        )}&page=${activeItem.pageNumber || 1}&dpi=150`}
                        alt="Live Crop Drag"
                        className="absolute pointer-events-none select-none max-w-none"
                        style={{
                          width: `${((activeItem.pageWidth || 595.32) / Math.max(1, boxCoords.x1 - boxCoords.x0)) * 100}%`,
                          height: `${((activeItem.pageHeight || 841.92) / Math.max(1, boxCoords.y1 - boxCoords.y0)) * 100}%`,
                          left: `${-(boxCoords.x0 / Math.max(1, boxCoords.x1 - boxCoords.x0)) * 100}%`,
                          top: `${-(boxCoords.y0 / Math.max(1, boxCoords.y1 - boxCoords.y0)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={`crop-fs-${imageKey}-${boxCoords.x0.toFixed(0)}-${boxCoords.y0.toFixed(0)}-${boxCoords.x1.toFixed(0)}-${boxCoords.y1.toFixed(0)}`}
                    src={`/api/pdf/crop?pdf=${encodeURIComponent(
                      activeItem.sourcePdf || ""
                    )}&page=${activeItem.pageNumber || 1}&x0=${boxCoords.x0.toFixed(1)}&y0=${boxCoords.y0.toFixed(1)}&x1=${boxCoords.x1.toFixed(1)}&y1=${boxCoords.y1.toFixed(1)}&dpi=200&t=${imageKey}`}
                    alt="Zoomed Question Preview"
                    className="max-w-full max-h-[calc(82vh-60px)] object-contain rounded-xl shadow-2xl border border-zinc-700/80 bg-white"
                  />
                )}
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
