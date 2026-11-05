"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  FileCheck2, 
  Sparkles,
  ChevronRight,
  School,
  ArrowLeft
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/logo";

export default function JoinBetaPage() {
  const router = useRouter();
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedInstitutional, setAgreedInstitutional] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canProceed = agreedTerms && agreedInstitutional;

  const handleProceedToLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canProceed) return;

    setIsSubmitting(true);

    // Save consent declarations into cookies and session storage
    if (typeof document !== 'undefined') {
      document.cookie = "pre_consent=true; path=/; max-age=3600";
      sessionStorage.setItem(
        'kaizen_consent',
        JSON.stringify({
          termsAccepted: true,
          institutionalScope: true,
          timestamp: new Date().toISOString()
        })
      );
    }

    setTimeout(() => {
      router.push('/login');
    }, 400);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 md:p-10 bg-background text-foreground overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-overlay" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/15 blur-[140px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 w-full max-w-3xl my-8"
      >
        {/* Card Wrapper */}
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
            <div className="flex items-center gap-3">
              <Logo isWhite={false} />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-xs font-mono uppercase rounded-full w-max">
              <Sparkles size={12} /> Institutional Beta Program
            </div>
          </div>

          {/* Title Area */}
          <div className="mt-6 mb-8">
            <h1 className="text-2xl sm:text-4xl font-display font-bold tracking-tight text-foreground mb-3">
              Program Admission & <span className="text-primary">Disclaimer</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              KAIZEN is an academic simulation engine engineered for KIIT University students. 
              Before connecting your institutional profile, please review the beta guidelines and data principles below.
            </p>
          </div>

          {/* Disclaimer Items Grid */}
          <div className="space-y-4 mb-8">
            {/* Disclaimer 1 */}
            <div className="p-4 sm:p-5 rounded-2xl border border-border bg-muted/30 flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
                <School size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">1. Institutional Scope & Eligibility</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Admission is restricted to students & faculty of <span className="font-mono text-foreground font-medium">KIIT Deemed to be University</span> with active <span className="font-mono text-primary">@kiit.ac.in</span> Google Workspace accounts. External domains are strictly blocked.
                </p>
              </div>
            </div>

            {/* Disclaimer 2 */}
            <div className="p-4 sm:p-5 rounded-2xl border border-border bg-muted/30 flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 shrink-0 mt-0.5">
                <ShieldCheck size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">2. Client-Side & Local-First Processing</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Semester grade reports (PDFs) are parsed directly within your browser session using local web workers. Your credentials are never stored in plain text, and tokens are protected via encrypted HTTP-only sessions.
                </p>
              </div>
            </div>

            {/* Disclaimer 3 */}
            <div className="p-4 sm:p-5 rounded-2xl border border-border bg-muted/30 flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0 mt-0.5">
                <FileCheck2 size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">3. Deterministic Academic Forecasting</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  SGPA and CGPA calculators utilize KIIT University grading rules and course credit weightages for scenario simulation. Forecasts serve as study optimization guides, not official examination controller records.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Disclaimer Checkboxes */}
          <form onSubmit={handleProceedToLogin} className="space-y-6 pt-2">
            <div className="space-y-3 p-4 rounded-2xl bg-background border border-border">
              {/* Checkbox 1 */}
              <label className="flex items-start gap-3 cursor-pointer select-none group">
                <div 
                  onClick={() => setAgreedInstitutional(!agreedInstitutional)}
                  className={`relative flex items-center justify-center w-5 h-5 mt-0.5 rounded-md border transition-all shrink-0 ${
                    agreedInstitutional 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : 'border-muted-foreground/40 group-hover:border-primary'
                  }`}
                >
                  {agreedInstitutional && <CheckCircle2 size={14} className="stroke-[3]" />}
                </div>
                <span className="text-xs sm:text-sm text-foreground/90 leading-snug">
                  I confirm that I am an authorized member of KIIT University and will authenticate with an official <span className="font-mono text-primary font-medium">@kiit.ac.in</span> account.
                </span>
              </label>

              {/* Checkbox 2 */}
              <label className="flex items-start gap-3 cursor-pointer select-none group">
                <div 
                  onClick={() => setAgreedTerms(!agreedTerms)}
                  className={`relative flex items-center justify-center w-5 h-5 mt-0.5 rounded-md border transition-all shrink-0 ${
                    agreedTerms 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : 'border-muted-foreground/40 group-hover:border-primary'
                  }`}
                >
                  {agreedTerms && <CheckCircle2 size={14} className="stroke-[3]" />}
                </div>
                <span className="text-xs sm:text-sm text-foreground/90 leading-snug">
                  I have read and agree to the beta disclaimer, terms of simulation modeling, and data usage policy.
                </span>
              </label>
            </div>

            {/* Buttons Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors order-2 sm:order-1"
              >
                <ArrowLeft size={16} /> Return to Home
              </button>

              <button
                type="submit"
                disabled={!canProceed || isSubmitting}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-xl text-sm font-semibold transition-all shadow-lg order-1 sm:order-2 ${
                  canProceed && !isSubmitting
                    ? 'bg-primary text-primary-foreground hover:opacity-90 shadow-primary/20 cursor-pointer'
                    : 'bg-muted text-muted-foreground border border-border cursor-not-allowed opacity-60'
                }`}
              >
                <span>{isSubmitting ? "Redirecting..." : "Acknowledge & Proceed to Login"}</span>
                <ArrowRight size={16} className={`transition-transform duration-200 ${canProceed ? 'group-hover:translate-x-1' : ''}`} />
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
