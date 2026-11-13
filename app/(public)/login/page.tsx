"use client";

import React, { useEffect, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Mail, Sparkles, Activity, ShieldAlert, Loader2, CheckCircle2, Frown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

function LoginInterface() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorType = searchParams.get('error');
  
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [consentData, setConsentData] = useState<any>(null);

  useEffect(() => {
    // Load consent from storage
    const storedConsent = sessionStorage.getItem('kaizen_consent');
    if (storedConsent) {
      try {
        setConsentData(JSON.parse(storedConsent));
      } catch (e) {
        console.error("Failed to parse consent data");
      }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      setTimeout(() => {
        if (!consentData) {
          alert("Please complete the consent flow first by going to /consent");
          setIsAuthenticating(false);
          return;
        }
        console.log("Authentication successful! Submitting with consent payload:", consentData);
        router.push('/dashboard');
      }, 1500);
      return;
    }

    // Actual Google Auth URL redirect
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', clientId);
    googleAuthUrl.searchParams.set('redirect_uri', 'http://localhost:3000/api/auth/callback/google');
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'openid email profile https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.coursework.me.readonly https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/fitness.sleep.read https://www.googleapis.com/auth/fitness.heart_rate.read https://www.googleapis.com/auth/fitness.activity.read');
    googleAuthUrl.searchParams.set('access_type', 'offline');
    googleAuthUrl.searchParams.set('prompt', 'consent');

    window.location.href = googleAuthUrl.toString();
  };

  const HoverExpandCard = ({ icon: Icon, title, children, iconColor, isImage }: { icon: any, title: string, children: React.ReactNode, iconColor?: string, isImage?: boolean }) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
      <div 
        className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-sm shadow-sm hover:border-primary/40 transition-colors cursor-default"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <h3 className="flex items-center gap-2 text-foreground font-medium text-sm">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/logo/kiit.png" alt="KIIT" className="h-3.5 w-auto object-contain opacity-80" />
          ) : (
            <Icon size={16} className={iconColor} />
          )}
          {title}
        </h3>
        <AnimatePresence>
          {isHovered && (
            <motion.div 
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: "auto", opacity: 1, marginTop: 8 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
              className="overflow-hidden text-[13px] text-muted-foreground leading-relaxed"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 bg-slate-50 dark:bg-[#07070b] text-slate-900 dark:text-[#f4f4f5] transition-colors duration-300">
      
      {/* Floating Theme Toggle in Top Right */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle 
          variant="circle" 
          className="w-9 h-9 rounded-full bg-white/90 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 shadow-sm" 
        />
      </div>

      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-15 pointer-events-none mix-blend-overlay" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/15 blur-[140px] rounded-full pointer-events-none opacity-50" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 my-auto"
      >
        {/* Left Column: Brand & Value Prop */}
        <div className="flex flex-col justify-center space-y-8 pr-0 lg:pr-8">
          <div>
            <div className="mb-6">
              <Logo />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4 leading-tight">
              Welcome to the <br />
              <span className="text-muted-foreground">Future of Academics.</span>
            </h1>
            <p className="text-muted-foreground leading-relaxed max-w-md text-sm">
              Securely authenticate using your institutional Google Workspace account to access predictive grade models and academic analytics.
            </p>
          </div>

          <div className="space-y-3">
            <HoverExpandCard icon={null} isImage={true} title="About the project">
              Designed by Harsh. Engineered at KIIT. Forged under the guidance of Professor SK Sabut as a 7th Semester Major Project. Kaizen represents the pure intersection of academic rigor and next-generation intelligence.
            </HoverExpandCard>
            
            <HoverExpandCard icon={Activity} title="Need Help?" iconColor="text-yellow-500">
              Things break. It’s a beta, after all. If you’re genuinely stuck, drop a line to <a href="mailto:2330231@kiit.ac.in" className="text-primary hover:underline">2330231@kiit.ac.in</a>. We’ll sort it out (probably).
            </HoverExpandCard>
          </div>
        </div>

        {/* Right Column: Auth Card */}
        <div className="p-8 md:p-10 rounded-[2rem] border border-slate-200/80 dark:border-white/10 shadow-2xl relative overflow-hidden bg-white dark:bg-[#0f0f17] flex flex-col justify-center text-foreground transition-colors duration-300">
          
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2 text-foreground">Sign In</h2>
            <p className="text-sm text-muted-foreground">Authenticate to continue to your dashboard</p>
          </div>
          
          {/* Error Display Logic */}
          {errorType && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl flex items-start gap-3 text-rose-700 dark:text-rose-400 text-xs leading-relaxed">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" /> 
              <div>
                <strong className="block mb-1 font-semibold">ACCESS DENIED</strong>
                {errorType === 'UnauthorizedDomain' 
                  ? "You must use a valid @kiit.ac.in email address to access Kaizen."
                  : "Authentication failed. Please try again."}
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <button 
              type="submit"
              disabled={isAuthenticating || !consentData}
              className={`relative w-full py-4 px-5 rounded-xl font-medium flex flex-col sm:flex-row items-center justify-between gap-3 transition-all duration-300 border bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 shadow-sm hover:shadow-md ${(isAuthenticating || !consentData) ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/10 px-2.5 py-1.5 rounded-lg border border-slate-200/60 dark:border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo/kiit.png" alt="KIIT Logo" className="h-8 w-auto object-contain drop-shadow-sm" />
                  <span className="text-slate-400 dark:text-slate-500 text-xs">✕</span>
                  <GoogleLogo />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[15px] font-semibold leading-tight text-foreground">
                    {isAuthenticating ? "Authenticating..." : "Sign in with KIIT Email"}
                  </span>
                  <span className="text-xs text-muted-foreground font-normal mt-1 flex items-center gap-1">
                    <Mail size={10} /> restricted to <span className="font-mono text-foreground font-semibold bg-slate-200/70 dark:bg-white/10 px-1 py-0.5 rounded">@kiit.ac.in</span>
                  </span>
                </div>
              </div>
              {!isAuthenticating && (
                <ArrowRight size={18} className="transition-transform duration-300 text-muted-foreground group-hover:translate-x-1" />
              )}
            </button>
            
            {consentData ? (
               <div className="mt-6">
                 <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-foreground text-sm leading-relaxed text-left mb-6">
                   <strong className="text-primary font-bold">Notice:</strong> Beta is currently only open to Students & Faculty members of Electronics & Computer Science Students Batch 2023-2027 (current 7th Sem Students).
                 </div>
                 <div className="flex items-start gap-2 text-muted-foreground font-handwritten text-lg -rotate-1 opacity-80 text-left">
                   <Frown size={20} className="shrink-0 mt-1" />
                   <p>IK it Sucks, but We don't have your data from your School.</p>
                 </div>
               </div>
            ) : (
               <div className="text-center mt-4">
                 <p className="text-xs text-amber-500 font-medium mb-1">
                   ⚠️ Missing consent declarations
                 </p>
                 <button type="button" onClick={() => router.push('/consent')} className="text-xs text-primary hover:underline">
                   Go back and complete consent
                 </button>
               </div>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
      <LoginInterface />
    </Suspense>
  );
}
