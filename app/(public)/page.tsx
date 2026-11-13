'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, Zap, Activity, Brain, Eye, Menu, X, 
  ChevronRight, Database, Cpu, HeartPulse, Sparkles, Timer, Layers, Code, RefreshCw
} from 'lucide-react';
import { CinematicHero } from '@/components/ui/cinematic-landing-hero';
import { GooeyLoader } from '@/components/ui/gooey-loader';
import { ArchitectureFlow } from '@/components/ui/architecture-flow';

// --- ANIMATION WRAPPERS ---
const MotionDiv = motion.div as any;
const MotionH1 = motion.h1 as any;
const MotionP = motion.p as any;

// --- 60-30-10 COLOR PALETTE (Strict High-Contrast Dark System) ---
// 60% Base: Deep Obsidian #07070b
// 30% Primary: Structural Cards #0f0f17, Crisp White #f4f4f5, Muted Zinc #a1a1aa, Borders rgba(255,255,255,0.08)
// 10% Accent: Electric Lime #bbf246 / #ccff00 (Matching the Kaizen Logo)
const COLORS = {
  base: "#07070b",                        // 60% Base Canvas
  surface: "#0f0f17",                     // 30% Primary Surface
  surfaceHover: "#161624",                // 30% Primary Surface Hover
  border: "rgba(255, 255, 255, 0.08)",   // 30% Primary Border
  borderHover: "rgba(187, 242, 70, 0.35)",// 10% Accent Glow Border
  text: "#f4f4f5",                        // 30% Primary High-Contrast Text
  textMuted: "#a1a1aa",                   // 30% Primary Secondary Text
  accent: "#bbf246",                      // 10% Accent Electric Lime
  accentGlow: "rgba(187, 242, 70, 0.25)",
};

export default function LandingPage() {
  const router = useRouter();
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleEnter = () => {
    router.push('/join-beta');
  };

  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="preloader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 dark:bg-[#07070b]/95 backdrop-blur-md"
          >
            <div className="flex flex-col items-center justify-center">
              <GooeyLoader 
                primaryColor="#bbf246" 
                secondaryColor="#84cc16" 
                borderColor="#181824" 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={containerRef} className="relative w-full overflow-hidden bg-background text-foreground transition-colors duration-300">

      <main className="relative z-10 w-full min-h-[100dvh]">
        <CinematicHero
          brandName="KAIZEN"
          tagline1="Continuous evolution,"
          tagline2="redefined."
          cardHeading="Academic intelligence, elevated."
          cardDescription={<><span className="text-[#bbf246] font-semibold">KAIZEN</span> empowers students with rule-based grade prediction, AI-powered advisory, and beautiful attendance analytics — built for the modern academic journey.</>}
          metricValue={9}
          metricLabel="CGPA Target"
          ctaHeading="Your potential, realized."
          ctaDescription="Join students who turned grade anxiety into actionable data — powered by Gemini AI."
        />
      </main>

      <section className="relative z-10 py-32 px-6 max-w-7xl mx-auto border-b border-border dark:border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-xs font-mono uppercase mb-6 rounded-full">
              <HeartPulse size={12} /> The Research Problem
            </div>
            <h2 className="text-4xl md:text-6xl font-display text-foreground mb-8 leading-[0.9]">
              THE SILENT <br/> <span className="text-muted-foreground">CRISIS.</span>
            </h2>
            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
              <p>
                <strong className="text-foreground">64% of college dropouts</strong> occur not due to academic inability, but due to poor planning and "grade ambiguity."
              </p>
              <p>
                KAIZEN acts as a deterministic simulation engine. By calculating "what-if" scenarios for internals and end-sems, we convert anxiety into actionable data.
              </p>
            </div>
          </div>
          <div className="md:col-span-7 relative h-[500px] md:h-[600px] rounded-3xl overflow-hidden group bg-card dark:bg-[#0f0f17] border border-border dark:border-white/10 shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(187,242,70,0.12),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <GooeyLoader 
                primaryColor="#bbf246" 
                secondaryColor="#84cc16" 
                borderColor="#181824" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* --- THE PROTOCOL --- */}
      <section className="relative z-10 py-32 px-6 max-w-7xl mx-auto border-b border-border dark:border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          {/* Sticky Left Column */}
          <div className="lg:col-span-5 lg:sticky top-32">
            <h2 className="text-5xl md:text-7xl font-display text-foreground mb-6 leading-[0.9]">
              THE <br/> <span className="text-muted-foreground">PROTOCOL.</span>
            </h2>
            <p className="text-primary dark:text-[#bbf246] font-mono uppercase tracking-widest text-sm mb-8">From Chaos to Clarity</p>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
              A systematic approach to academic optimization. We break down complex semester data into actionable, daily targets.
            </p>
          </div>

          {/* Right Column (Steps) */}
          <div className="lg:col-span-7 space-y-8">
             <ProtocolStep 
               number="01"
               title="Ingest"
               desc="Upload raw academic PDFs. System parses credits, grades, and backlogs locally."
               icon={<Database size={28} className="text-primary dark:text-[#bbf246]" />}
             />
             <ProtocolStep 
               number="02"
               title="Analyze"
               desc="Algorithms detect weak subjects (C/D grades) and simulate future scenarios."
               icon={<Cpu size={28} className="text-primary dark:text-[#bbf246]" />}
             />
             <ProtocolStep 
               number="03"
               title="Execute"
               desc="Deploy focus timers and study plans to meet the calculated targets."
               icon={<Zap size={28} className="text-primary dark:text-[#bbf246]" />}
             />
             <ProtocolStep 
               number="04"
               title="Self-Heal"
               desc="Continuous feedback loops: user overrides train institutional patterns, automatically self-healing classroom classifications and timetable sync."
               icon={<RefreshCw size={28} className="text-primary dark:text-[#bbf246]" />}
             />
          </div>

        </div>
      </section>

      {/* --- SYSTEM ARCHITECTURE FLOW (Animated Beam Pipeline) --- */}
      <section id="architecture" className="relative z-10 py-32 px-6 max-w-7xl mx-auto border-b border-border dark:border-white/10 scroll-mt-24">
        <div id="features" className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 dark:bg-[#bbf246]/10 border border-primary/20 dark:border-[#bbf246]/30 text-xs font-mono uppercase tracking-widest text-primary dark:text-[#bbf246] mb-5 shadow-sm">
            <Sparkles size={13} />
            <span>Multi-Agent System Architecture</span>
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold text-foreground tracking-tight mb-5 leading-tight">
            CONNECTED <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-[#bbf246]">INTELLIGENCE.</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
            The full pipeline: from Apple Health circadian sleep sync & Google Classroom assignment reminders, through Upstash Redis & Vector course notes, to the Kaizen Model Router, per-subject QLoRA fine-tuning, AI-driven PYQ practice drills for weak topics, and morning class absence prediction.
          </p>
        </div>

        <ArchitectureFlow />
      </section>

      {/* --- TECH STACK --- */}
      <section className="relative z-10 py-32 px-6 max-w-7xl mx-auto border-b border-border dark:border-white/10">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
           <div>
              <h3 className="text-xs font-mono text-primary dark:text-[#bbf246] mb-4 uppercase tracking-widest">System Core</h3>
              <h2 className="text-5xl md:text-6xl font-display text-foreground mb-6 leading-tight">
                ENGINEERED WITH <br/> PRECISION.
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-10 max-w-md">
                Built on a modern stack ensuring type safety, blazing fast interactions, and secure local data processing.
              </p>
              <div className="grid grid-cols-2 gap-4">
                 <TechItem label="React 19" icon={<Code size={24} className="text-primary dark:text-[#bbf246]" />} />
                 <TechItem label="Gemini API" icon={<Sparkles size={24} className="text-primary dark:text-[#bbf246]" />} />
                 <TechItem label="TypeScript" icon={<BracketsIcon />} />
                 <TechItem label="Framer Motion" icon={<Layers size={24} className="text-primary dark:text-[#bbf246]" />} />
              </div>
           </div>
           <div className="h-full min-h-[400px] rounded-[2rem] border border-border dark:border-white/10 relative overflow-hidden flex flex-col items-center justify-center group shadow-2xl bg-card dark:bg-[#0f0f17] transition-colors duration-300">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(187,242,70,0.12),transparent_70%)] opacity-50 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
              
              <div className="relative z-10 text-center flex flex-col items-center">
                 <MotionDiv 
                   initial={{ scale: 0.8, opacity: 0 }}
                   whileInView={{ scale: 1, opacity: 1 }}
                   viewport={{ once: true }}
                   transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
                   className="w-24 h-24 rounded-full border border-primary/40 dark:border-[#bbf246]/30 flex items-center justify-center mb-6 bg-primary/10 dark:bg-[#bbf246]/10 backdrop-blur-md relative"
                 >
                    <div className="absolute inset-0 rounded-full border border-primary/50 dark:border-[#bbf246]/50 border-t-transparent animate-spin" style={{ animationDuration: '3s' }} />
                    <Database size={32} className="text-primary dark:text-[#bbf246] animate-pulse" />
                 </MotionDiv>
                 
                 <div className="text-7xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/40 mb-4 tracking-tighter drop-shadow-sm">
                   100%
                 </div>
                 <div className="text-xs font-mono text-primary dark:text-[#bbf246] uppercase tracking-widest px-5 py-2 rounded-full border border-primary/30 dark:border-[#bbf246]/30 bg-primary/10 dark:bg-[#bbf246]/10 shadow-[0_0_15px_rgba(187,242,70,0.2)]">
                   Client Side Processing
                 </div>
              </div>
           </div>
         </div>
      </section>

      {/* --- ROADMAP --- */}
      <section id="roadmap" className="relative z-10 py-32 px-6 max-w-7xl mx-auto overflow-hidden">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-6xl font-display text-foreground mb-4">PROJECT TIMELINE</h2>
          <p className="text-muted-foreground font-mono uppercase tracking-widest text-sm">Development Roadmap</p>
        </div>

        <div className="absolute left-1/2 top-[300px] bottom-32 w-px bg-border dark:bg-white/10 -translate-x-1/2 hidden md:block pointer-events-none" />

        <div className="relative space-y-24">
          <RoadmapItem 
            quarter="PHASE 1 (COMPLETED)"
            title="Core Engine & Self-Healing Sync"
            status="Complete"
            description="Relational Subject Registry, Dynamic Routine Resolver for 638 students, Google Classroom Submissions API & 7th-Sem Auto-Filter with Self-Healing Feedback."
            position="left"
          />
          <RoadmapItem 
            quarter="PHASE 2 (CURRENT)"
            title="Neural OCR & Model Tuning"
            status="Active"
            description="FIC Major Project Review 1, Ingestion Studio for 500+ KIIT Endsem papers, Fine-tuning Kaizen-Tutor 3B on T4 GPU, Multi-modal RAG search."
            position="right"
          />
          <RoadmapItem 
            quarter="PHASE 3 (UPCOMING)"
            title="Campus Pilot & Proctorial Sync"
            status="Locked"
            description="Campus-wide deployment for 638 ECS students, Tutor-Mentor Proctorial integration, Predictive SGPA Simulation, Final B.Tech Defense."
            position="left"
          />
          <RoadmapItem 
            quarter="FUTURE"
            title="Campus Intelligence Network"
            status="Concept"
            description="Federated learning across departments, automated proctorial reporting, and campus-wide knowledge graphs."
            position="right"
          />
        </div>
      </section>

      {/* --- FOOTER CTA --- */}
      <section 
        className="relative z-10 h-[60vh] flex flex-col items-center justify-center group cursor-pointer overflow-hidden border-t border-border dark:border-white/10 bg-[radial-gradient(circle_at_center,rgba(187,242,70,0.18)_0%,var(--background)_80%)] dark:bg-[radial-gradient(circle_at_center,rgba(187,242,70,0.12)_0%,#07070b_80%)] transition-colors duration-300" 
        onClick={handleEnter} 
      >
        <div className="absolute inset-0 bg-[#bbf246]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl pointer-events-none" />

        <MotionDiv 
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          className="relative z-10 text-center flex flex-col items-center gap-8 pointer-events-none"
        >
          <div className="relative">
            <h2 className="text-[8vw] sm:text-[10vw] font-display font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/60 group-hover:to-primary dark:group-hover:to-[#bbf246] group-hover:scale-105 transition-all duration-700 ease-out">
              ENTER KAIZEN
            </h2>
            <div className="absolute -inset-4 bg-[#bbf246]/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />
          </div>
          
          <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-card/80 dark:bg-white/5 border border-border dark:border-white/10 backdrop-blur-md group-hover:bg-primary/10 dark:group-hover:bg-[#bbf246]/10 group-hover:border-primary/40 dark:group-hover:border-[#bbf246]/30 transition-all duration-500 shadow-xl">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#bbf246] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#bbf246]"></span>
            </span>
            <p className="font-mono text-sm sm:text-base uppercase tracking-[0.2em] text-muted-foreground group-hover:text-foreground transition-colors">
              Initialize Academic Core
            </p>
          </div>
        </MotionDiv>
      </section>

    </div>
    </>
  );
}

// --- Sub-Components ---

const ProtocolStep: React.FC<{ number: string, title: string, desc: string, icon: React.ReactNode }> = ({ number, title, desc, icon }) => (
  <MotionDiv 
    initial="initial"
    whileInView="visible"
    whileHover="hovered"
    viewport={{ once: true, margin: "-50px" }}
    variants={{
      initial: { opacity: 0, x: 50 },
      visible: { opacity: 1, x: 0, transition: { duration: 0.6, type: "spring", bounce: 0.4 } },
      hovered: { scale: 1.02, transition: { duration: 0.3 } }
    }}
    className="p-8 md:p-12 border border-border dark:border-white/10 bg-card dark:bg-[#0f0f17] hover:border-primary/60 dark:hover:border-[#bbf246] rounded-[2rem] relative overflow-hidden group shadow-2xl transition-all duration-300"
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(187,242,70,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
    
    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
      <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-muted/70 dark:bg-black/60 border border-border dark:border-white/10 flex items-center justify-center text-primary dark:text-[#bbf246] shadow-inner group-hover:scale-110 transition-transform duration-500">
        {icon}
      </div>
      
      <div className="flex-grow">
        <div className="flex items-center gap-4 mb-3">
          <span className="font-mono text-3xl font-bold text-foreground/20 dark:text-white/20 group-hover:text-primary/70 dark:group-hover:text-[#bbf246]/60 transition-colors">{number}</span>
          <h3 className="text-3xl font-display text-foreground">{title}</h3>
        </div>
        <p className="text-muted-foreground text-lg leading-relaxed">{desc}</p>
      </div>
    </div>
  </MotionDiv>
);

const RoadmapItem: React.FC<{
  quarter: string;
  title: string;
  status: string;
  description: string;
  position: 'left' | 'right';
}> = ({ quarter, title, status, description, position }) => {
  return (
    <motion.div 
      initial="initial"
      whileHover="hovered"
      className="relative flex flex-col md:flex-row items-center justify-between w-full group"
    >
      <div className="absolute left-0 top-0 bottom-0 w-px bg-border dark:bg-white/10 md:hidden pointer-events-none" />
      
      <MotionDiv 
        whileInView={{ opacity: 1, x: 0 }}
        initial={{ opacity: 0, x: position === 'left' ? -30 : 30 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`w-full md:w-[45%] pl-8 md:pl-0 ${position === 'left' ? 'md:mr-auto md:text-right' : 'md:ml-auto md:text-left'}`}
      >
        <div className={`flex flex-col gap-2 mb-3 ${position === 'left' ? 'md:items-end' : 'md:items-start'}`}>
          <div className="flex items-center gap-3">
             {position === 'right' && (
                <span className="text-primary dark:text-[#bbf246] font-mono text-xs uppercase tracking-widest">{quarter}</span>
             )}
            <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
              status === 'Active' ? 'border-primary dark:border-[#bbf246] text-primary dark:text-[#bbf246] bg-primary/10 dark:bg-[#bbf246]/10' : 
              status === 'Complete' ? 'border-emerald-500 text-emerald-500 dark:text-emerald-400 bg-emerald-500/10' :
              'border-border dark:border-white/10 text-muted-foreground'
            }`}>
              {status}
            </span>
             {position === 'left' && (
                <span className="text-primary dark:text-[#bbf246] font-mono text-xs uppercase tracking-widest">{quarter}</span>
             )}
          </div>
          
          <h3 className="text-2xl font-display font-bold text-foreground group-hover:text-primary dark:group-hover:text-[#bbf246] transition-colors">
            {title}
          </h3>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm ml-0 md:ml-auto">{description}</p>
      </MotionDiv>

      <div className="absolute left-0 md:left-1/2 -translate-x-1/2 md:-translate-x-1/2 top-0 w-4 h-4 rounded-full border-4 border-background dark:border-[#07070b] z-10 flex items-center justify-center pointer-events-none transition-colors">
         <div className={`w-full h-full rounded-full transition-all duration-300 ${status === 'Active' ? 'bg-primary dark:bg-[#bbf246] shadow-[0_0_10px_#bbf246]' : status === 'Complete' ? 'bg-emerald-400' : 'bg-muted-foreground/30 dark:bg-white/20'}`} />
      </div>
    </motion.div>
  );
};

const TechItem: React.FC<{ label: string, icon: React.ReactNode }> = ({ label, icon }) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="flex flex-col items-center justify-center gap-4 p-6 border border-border dark:border-white/10 rounded-2xl text-sm text-muted-foreground transition-all duration-300 group cursor-pointer shadow-sm hover:shadow-xl bg-card dark:bg-[#0f0f17] hover:border-primary/60 dark:hover:border-[#bbf246]"
  >
    <div className="w-14 h-14 rounded-xl bg-muted/60 dark:bg-black/60 border border-border dark:border-white/10 flex items-center justify-center text-primary dark:text-[#bbf246] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(187,242,70,0.3)] transition-all duration-500">
      {icon}
    </div>
    <span className="font-medium text-foreground/90 group-hover:text-foreground transition-colors tracking-wide">{label}</span>
  </motion.div>
);

const BracketsIcon = () => (
   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary dark:text-[#bbf246]"><path d="M16 18l6-6-6-6"/><path d="M8 6l-6 6 6 6"/></svg>
);
