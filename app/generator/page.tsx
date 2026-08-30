"use client";

import { useState, useEffect } from "react";
import { 
  FileText, 
  Sparkles, 
  Settings, 
  Download, 
  Printer, 
  Clock, 
  BookOpen, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  Wifi,
  WifiOff,
  RefreshCw
} from "lucide-react";

const BACKEND_URL = "http://localhost:8000";

// Llama 3.2 Instruct prompt builder
function buildPrompt(subject: string, examType: string) {
  const examLabel = examType === "mid_sem" ? "Mid Semester" : "End Semester";
  const totalMarks = examType === "mid_sem" ? 25 : 60;
  const duration = examType === "mid_sem" ? "1.5 Hours" : "3 Hours";

  return `<|begin_of_text|><|start_header_id|>system<|end_header_id|>

You are a KIIT University Professor creating examination question papers. Generate questions that follow KIIT's marking scheme and examination pattern. Questions should be academically rigorous and appropriate for B.Tech Electronics and Computer Science students.<|eot_id|><|start_header_id|>user<|end_header_id|>

Generate a complete ${examLabel} Examination question paper for the subject "${subject}" at KIIT University.

Format the paper exactly as follows:
- Header: KIIT UNIVERSITY, School of Electronics Engineering
- Subject: ${subject}
- Exam: ${examLabel} Examination 2025
- Full Marks: ${totalMarks} | Time: ${duration}

SECTION A: ${examType === "mid_sem" ? "5 questions x 2 marks = 10 marks" : "5 questions x 2 marks = 10 marks"}
(Short answer questions testing fundamental concepts)

SECTION B: ${examType === "mid_sem" ? "3 questions x 5 marks = 15 marks (answer any 2)" : "5 questions x 10 marks = 50 marks (answer any 3)"}
(Descriptive/numerical questions with sub-parts)

Generate realistic, diverse questions covering different topics from the syllabus.<|eot_id|><|start_header_id|>assistant<|end_header_id|>

`;
}

export default function PaperGeneratorPage() {
  const [subject, setSubject] = useState("");
  const [examType, setExamType] = useState("end_sem");
  const [loading, setLoading] = useState(false);
  const [generatedPaper, setGeneratedPaper] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<"checking" | "online" | "offline">("checking");
  const [genTime, setGenTime] = useState<number | null>(null);
  const [tokensPerSec, setTokensPerSec] = useState<number | null>(null);

  // Check backend health on mount
  useEffect(() => {
    checkServer();
  }, []);

  async function checkServer() {
    setServerStatus("checking");
    try {
      const res = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(5000) });
      const data = await res.json();
      setServerStatus(data.model_loaded ? "online" : "offline");
    } catch {
      setServerStatus("offline");
    }
  }

  const handleGenerate = async () => {
    if (!subject.trim()) {
      setError("Please enter a subject name");
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedPaper(null);
    setGenTime(null);
    setTokensPerSec(null);

    try {
      const prompt = buildPrompt(subject, examType);

      const res = await fetch(`${BACKEND_URL}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          max_tokens: 1024,
          temperature: 0.7,
          top_p: 0.9,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server returned ${res.status}`);
      }

      const data = await res.json();
      setGeneratedPaper(data.response);
      setGenTime(data.time_taken);
      setTokensPerSec(data.tokens_per_sec);
    } catch (err: any) {
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        setError("Cannot connect to LLM server. Make sure the FastAPI backend is running on port 8000.");
      } else {
        setError(err.message || "Failed to generate paper");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!generatedPaper) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html><head><title>KAIZEN - Generated Paper</title>
        <style>body{font-family:serif;padding:40px;line-height:1.8;white-space:pre-wrap;}</style>
        </head><body>${generatedPaper}</body></html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownload = () => {
    if (!generatedPaper) return;
    const blob = new Blob([generatedPaper], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `KAIZEN_${subject.replace(/\s+/g, "_")}_${examType}_paper.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 p-6 lg:p-12 font-outfit">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent mb-2">
            AI Paper Generator
          </h1>
          <p className="text-zinc-400 text-lg">
            Generating KIIT-pattern question papers using Llama-3.2-3B.
          </p>
        </div>
        <div className="flex gap-4 items-center">
          {/* Server Status Indicator */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium ${
            serverStatus === "online" 
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : serverStatus === "offline"
              ? "bg-red-500/10 border-red-500/30 text-red-400"
              : "bg-zinc-900 border-zinc-800 text-zinc-500"
          }`}>
            {serverStatus === "online" ? <Wifi className="w-4 h-4" /> : 
             serverStatus === "offline" ? <WifiOff className="w-4 h-4" /> :
             <Loader2 className="w-4 h-4 animate-spin" />}
            {serverStatus === "online" ? "LLM Online" : 
             serverStatus === "offline" ? "LLM Offline" : "Checking..."}
          </div>
          {serverStatus === "offline" && (
            <button 
              onClick={checkServer}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-3xl shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles className="w-12 h-12 text-indigo-500" />
            </div>
            
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" /> Exam Settings
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Subject Name</label>
                <input 
                  type="text" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Computer Networks"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Examination Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setExamType("mid_sem")}
                    className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                      examType === "mid_sem" 
                      ? "bg-indigo-500/10 border-indigo-500 text-indigo-400" 
                      : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                    }`}
                  >
                    Mid-Semester
                  </button>
                  <button 
                    onClick={() => setExamType("end_sem")}
                    className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                      examType === "end_sem" 
                      ? "bg-indigo-500/10 border-indigo-500 text-indigo-400" 
                      : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                    }`}
                  >
                    End-Semester
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleGenerate}
                  disabled={loading || serverStatus === "offline"}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-foreground font-bold py-4 rounded-2xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating Paper...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Questions
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Status Panel */}
          <div className={`p-6 border rounded-3xl ${
            serverStatus === "online" 
              ? "bg-emerald-500/5 border-emerald-500/20" 
              : "bg-amber-500/5 border-amber-500/20"
          }`}>
            <div className="flex gap-3">
              {serverStatus === "online" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              )}
              <div>
                <h3 className={`font-bold text-sm mb-1 ${
                  serverStatus === "online" ? "text-emerald-500" : "text-amber-500"
                }`}>
                  {serverStatus === "online" ? "Llama 3.2-3B Active" : "LLM Server Required"}
                </h3>
                <p className={`text-xs leading-relaxed ${
                  serverStatus === "online" ? "text-emerald-200/60" : "text-amber-200/60"
                }`}>
                  {serverStatus === "online" 
                    ? "Model loaded on CPU. Fine-tuned on KIIT PYQ data (2020-2023) for accurate exam patterns."
                    : "Start the LLM server: cd llm_backend && python main.py"
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Generation Stats */}
          {genTime !== null && (
            <div className="p-6 bg-zinc-900/50 border border-zinc-800/50 rounded-3xl">
              <h3 className="text-sm font-bold text-zinc-400 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Generation Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Time</span>
                  <span className="text-zinc-300 font-mono">{genTime.toFixed(1)}s</span>
                </div>
                {tokensPerSec !== null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Speed</span>
                    <span className="text-zinc-300 font-mono">{tokensPerSec.toFixed(1)} tok/s</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Paper Preview Area */}
        <div className="lg:col-span-8">
          <div className="min-h-[800px] bg-zinc-900/40 border border-zinc-800/50 rounded-3xl overflow-hidden flex flex-col shadow-2xl relative">
            {!generatedPaper && !loading && !error && (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40">
                <FileText className="w-20 h-20 mb-6 text-zinc-500" />
                <h3 className="text-2xl font-bold mb-2">No Paper Generated Yet</h3>
                <p className="text-zinc-500 max-w-md">
                  Select your subject and click generate. The local Llama 3.2 model will create a paper following KIIT&apos;s marking scheme.
                </p>
              </div>
            )}

            {error && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mb-6" />
                <h3 className="text-2xl font-bold mb-2 text-red-400">Generation Failed</h3>
                <p className="text-zinc-500 max-w-md mb-6">{error}</p>
                <button 
                  onClick={handleGenerate}
                  className="px-6 py-3 bg-zinc-800 border border-zinc-700 rounded-xl hover:bg-zinc-700 transition-all text-sm font-medium"
                >
                  Try Again
                </button>
              </div>
            )}

            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 animate-pulse rounded-full"></div>
                  <Loader2 className="w-16 h-16 text-indigo-400 animate-spin relative z-10" />
                </div>
                <h3 className="text-2xl font-bold mb-2">AI is Generating...</h3>
                <p className="text-zinc-500 animate-pulse">Running Llama 3.2-3B inference on CPU (may take 30-60 seconds)</p>
              </div>
            )}

            {generatedPaper && !loading && (
              <>
                <div className="flex justify-between items-center p-6 bg-zinc-900/80 border-b border-zinc-800/50">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="font-bold text-zinc-300">Generated Paper</span>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={handlePrint}
                      className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-indigo-500/50 hover:bg-zinc-800 transition-all text-zinc-400 hover:text-indigo-400 shadow-lg"
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-6 py-3 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-indigo-500/50 hover:bg-zinc-800 transition-all text-zinc-400 hover:text-indigo-400 shadow-lg font-bold"
                    >
                      <Download className="w-5 h-5" /> Download
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-12 bg-[#ffffff10] backdrop-blur-sm">
                  <div className="max-w-[800px] mx-auto bg-white text-black p-12 shadow-2xl rounded-sm min-h-full font-serif whitespace-pre-wrap leading-relaxed">
                    {generatedPaper}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
