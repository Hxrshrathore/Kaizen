"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Mail, User, ShieldAlert, CheckCircle2, ArrowRight, Languages, Scale, Frown } from "lucide-react";
import { useRouter } from "next/navigation";

const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// --- Theme Colors ---
const COLORS = {
  background: "#ffffff",
  surface: "#f8fafc",
  surfaceHover: "#f1f5f9",
  border: "#000000",
  primary: "#3B82F6",
  accent: "#1d4ed8",
  text: "#0f172a",
  textMuted: "#64748b",
  destructive: "#ef4444"
};

export default function JoinBetaPage() {
  const router = useRouter();
  
  const HoverExpandCard = ({ icon: Icon, title, children, iconColor }: { icon: React.ElementType, title: string, children: React.ReactNode, iconColor: string }) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
      <div 
        className="p-5 rounded-2xl border transition-colors cursor-default" 
        style={{ backgroundColor: "rgba(255,255,255,0.02)", borderColor: COLORS.border }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <h3 className="flex items-center gap-2 text-foreground font-medium">
          <Icon size={18} className={iconColor} /> {title}
        </h3>
        <AnimatePresence>
          {isHovered && (
            <motion.div 
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: "auto", opacity: 1, marginTop: 8 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
              className="overflow-hidden text-sm text-muted-foreground"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };
  
  // Explicit consent states (None can be pre-ticked!)
  const [consentData, setConsentData] = useState(false);
  const [consentCommunication, setConsentCommunication] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  const canSubmit = consentData && consentCommunication;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    
    // In a real app, this would hit an API.
    console.log("Consent recorded and data submitted.", { consents: { data: consentData, communication: consentCommunication } });
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6" style={{ backgroundColor: COLORS.background }}>
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-50" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 -mt-32 lg:-mt-48"
      >
        {/* Left Column: Information & DPDP Notices */}
        <div className="flex flex-col justify-center space-y-8 pr-0 lg:pr-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-xs font-mono uppercase mb-6 rounded-full">
              <Scale size={12} /> DPDP Act 2023 Compliant
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4 leading-tight">
              Privacy First. <br />
              <span className="text-muted-foreground">Always.</span>
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Before you join the KAIZEN Beta, we are legally required to obtain your explicit consent regarding how we process your digital personal data.
            </p>
          </div>

          <div className="space-y-4">
            <HoverExpandCard icon={ShieldCheck} title="Data Collection & Purpose" iconColor="text-primary">
              <p className="mb-2">
                We collect your <strong>Name, Email, and Academic PDFs (Grades/Credits)</strong> solely for the purpose of account creation, academic simulation, and grade forecasting.
              </p>
            </HoverExpandCard>

            <HoverExpandCard icon={ShieldAlert} title="Your Rights" iconColor="text-yellow-500">
              <p className="mb-3">
                Under the DPDP Act 2023, you have the right to withdraw your consent at any time. Withdrawal of consent is as easy as providing it via your dashboard settings. You also have the right to grievance redressal.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-xs text-muted-foreground font-mono mb-1">DATA PROTECTION OFFICER (DPO)</p>
                <p className="text-sm text-foreground">Harsh Rathore</p>
                <a href="mailto:Hxrshrathore@gmail.com" className="text-sm text-primary hover:underline">Hxrshrathore@gmail.com</a>
              </div>
            </HoverExpandCard>
          </div>
          
          <div 
            className="w-fit"
            onMouseEnter={() => setIsLanguageOpen(true)}
            onMouseLeave={() => setIsLanguageOpen(false)}
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-default">
              <Languages size={16} /> View Notice in other languages (Sec 6.3)
            </div>
            
            <AnimatePresence>
              {isLanguageOpen && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                  className="text-xs text-muted-foreground overflow-hidden max-w-sm"
                >
                  As required by the Eighth Schedule to the Constitution, this notice can be requested in Hindi, Bengali, Telugu, Marathi, Tamil, Urdu, Gujarati, Kannada, Odia, Malayalam, Punjabi, Assamese, Maithili, Santali, Kashmiri, Nepali, Sindhi, Konkani, Dogri, Manipuri, Bodo, or Sanskrit by contacting our DPO.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Form & Consent */}
        <div className="p-8 md:p-10 rounded-[2rem] border shadow-xl relative overflow-hidden bg-white" style={{ borderColor: COLORS.border }}>
          
          <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-900 text-sm leading-relaxed">
            <strong>Notice:</strong> Beta is currently only open to Students & Faculty members of Electronics & Computer Science Students Batch 2023-2027 (current 7th Sem Students).
          </div>
          
          <div className="mb-8 flex items-start gap-2 text-slate-500 font-handwritten text-lg -rotate-1 opacity-80">
            <Frown size={20} className="shrink-0 mt-1" />
            <p>IK it Sucks, but We don't have your data from your School.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="pt-2 border-t space-y-4" style={{ borderColor: COLORS.border }}>
              <p className="text-sm font-medium text-foreground mb-2">Consent Declarations</p>
              
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className={`relative flex items-center justify-center w-5 h-5 mt-0.5 rounded border transition-colors shrink-0 ${consentData ? 'border-[#1eb563]' : 'border-muted-foreground group-hover:border-[#1eb563]'}`}>
                  <input 
                    type="checkbox" 
                    className="opacity-0 absolute inset-0 cursor-pointer" 
                    checked={consentData}
                    onChange={(e) => setConsentData(e.target.checked)}
                  />
                  {consentData && <CheckCircle2 size={14} className="text-[#1eb563] absolute" />}
                </div>
                <span className="text-sm text-muted-foreground group-hover:text-gray-300 transition-colors leading-snug">
                  I freely and unconditionally consent to the processing of my academic data for the purpose of generating simulation insights, as outlined in the notice.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className={`relative flex items-center justify-center w-5 h-5 mt-0.5 rounded border transition-colors shrink-0 ${consentCommunication ? 'border-[#1eb563]' : 'border-muted-foreground group-hover:border-[#1eb563]'}`}>
                  <input 
                    type="checkbox" 
                    className="opacity-0 absolute inset-0 cursor-pointer" 
                    checked={consentCommunication}
                    onChange={(e) => setConsentCommunication(e.target.checked)}
                  />
                  {consentCommunication && <CheckCircle2 size={14} className="text-[#1eb563] absolute" />}
                </div>
                <span className="text-sm text-muted-foreground group-hover:text-gray-300 transition-colors leading-snug">
                  I confirm that the data provided is verifiably authentic and I consent to receive system updates and beta invitations at this email address.
                </span>
              </label>
            </div>

            <button 
              type="submit"
              disabled={!canSubmit}
              className={`relative w-full py-4 px-5 rounded-xl font-medium flex flex-col sm:flex-row items-center justify-between gap-3 transition-all duration-300 border ${
                canSubmit 
                  ? "bg-white text-slate-800 border-slate-200 hover:bg-slate-50 shadow-sm hover:shadow-md" 
                  : "bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200/60">
                  <img src="/logo/kiit.png" alt="KIIT Logo" className="h-8 w-auto object-contain drop-shadow-sm" />
                  <span className="text-slate-300 text-xs">✕</span>
                  <GoogleLogo />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[15px] font-semibold leading-tight">Sign up with KIIT Email</span>
                  <span className="text-xs text-slate-500 font-normal mt-1 flex items-center gap-1">
                    <Mail size={10} /> restricted to <span className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">@kiit.ac.in</span>
                  </span>
                </div>
              </div>
              <ArrowRight size={18} className={`transition-transform duration-300 ${canSubmit ? "text-slate-400 group-hover:translate-x-1" : "text-slate-300 opacity-50"}`} />
            </button>
            
            {!canSubmit && (
               <p className="text-center text-xs text-destructive mt-4">
                 * You must provide affirmative consent to both declarations to proceed.
               </p>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
}
