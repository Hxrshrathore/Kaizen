'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, Zap, Activity, Brain, Eye, Menu, X, 
  ChevronRight, Database, Cpu, HeartPulse, Sparkles, Timer, Layers, Code
} from 'lucide-react';
import { CinematicHero } from '@/components/ui/cinematic-landing-hero';
import { NotchNav } from '@/components/ui/notch-nav';
import SpecularButton from '@/components/SpecularButton';
import { GooeyLoader } from '@/components/ui/gooey-loader';

// --- ANIMATION WRAPPERS ---
const MotionDiv = motion.div as any;
const MotionH1 = motion.h1 as any;
const MotionP = motion.p as any;

// --- CONSTANTS (Single Source of Truth) ---
const COLORS = {
  accent: "#3B82F6", // Deep blue accent
  surface: "#f8fafc", // slate-50
  surfaceHover: "#f1f5f9", // slate-100
  border: "#000000", // black border
  borderHover: "#333333", // dark gray
  text: "#0f172a", // slate-900
  textMuted: "#64748b" // slate-500
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
    console.log("Navigating to join beta Page...");
    router.push('/join-beta');
  };

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothScroll = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const yHero = useTransform(smoothScroll, [0, 0.2], [0, -100]);
  const opacityHero = useTransform(smoothScroll, [0, 0.2], [1, 0]);

  const handleNavChange = (id: string) => {
    const href = id === 'architecture' ? '#features' : '#roadmap';
    const element = document.querySelector(href);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  const navItems = [
    { id: 'architecture', label: 'Architecture', icon: Layers },
    { id: 'roadmap', label: 'Roadmap', icon: Timer }
  ];

  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="preloader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-white"
          >
            <div className="flex flex-col items-center justify-center">
              <GooeyLoader 
                primaryColor="#3B82F6" 
                secondaryColor="#1d4ed8" 
                borderColor="#1e293b" 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={containerRef} className="relative w-full overflow-hidden bg-white text-slate-900">


      <main className="relative z-10 w-full min-h-[100dvh]">
        <CinematicHero
          brandName="KAIZEN"
          tagline1="Continuous evolution,"
          tagline2="redefined."
          cardHeading="Academic intelligence, elevated."
          cardDescription={<><span className="text-white font-semibold">KAIZEN</span> empowers students with rule-based grade prediction, AI-powered advisory, and beautiful attendance analytics — built for the modern academic journey.</>}
          metricValue={9}
          metricLabel="CGPA Target"
          ctaHeading="Your potential, realized."
          ctaDescription="Join students who turned grade anxiety into actionable data — powered by Gemini AI."
        />
      </main>
      <section className="relative z-10 py-32 px-6 max-w-7xl mx-auto border-b border-border">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-mono uppercase mb-6 rounded-full">
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
          <div className="md:col-span-7 relative h-[500px] md:h-[600px] rounded-3xl overflow-hidden group" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
            
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <GooeyLoader 
                primaryColor="#3B82F6" 
                secondaryColor="#1d4ed8" 
                borderColor="#1e293b" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* --- THE PROTOCOL --- */}
      <section className="relative z-10 py-32 px-6 max-w-7xl mx-auto border-b border-border">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          {/* Sticky Left Column */}
          <div className="lg:col-span-5 lg:sticky top-32">
            <h2 className="text-5xl md:text-7xl font-display mb-6 leading-[0.9]">
              THE <br/> <span className="text-muted-foreground">PROTOCOL.</span>
            </h2>
            <p className="text-primary font-mono uppercase tracking-widest text-sm mb-8">From Chaos to Clarity</p>
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
               icon={<Database size={28} />}
             />
             <ProtocolStep 
               number="02"
               title="Analyze"
               desc="Algorithms detect weak subjects (C/D grades) and simulate future scenarios."
               icon={<Cpu size={28} />}
             />
             <ProtocolStep 
               number="03"
               title="Execute"
               desc="Deploy focus timers and study plans to meet the calculated targets."
               icon={<Zap size={28} />}
             />
          </div>

        </div>
      </section>



      {/* --- TECH STACK --- */}
      <section className="relative z-10 py-32 px-6 max-w-7xl mx-auto border-b border-border">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
           <div>
              <h3 className="text-xs font-mono text-primary mb-4 uppercase tracking-widest">System Core</h3>
              <h2 className="text-5xl md:text-6xl font-display text-foreground mb-6 leading-tight">
                ENGINEERED WITH <br/> PRECISION.
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-10 max-w-md">
                Built on a modern stack ensuring type safety, blazing fast interactions, and secure local data processing.
              </p>
              <div className="grid grid-cols-2 gap-4">
                 <TechItem label="React 19" icon={<Code size={24} />} />
                 <TechItem label="Gemini API" icon={<Sparkles size={24} />} />
                 <TechItem label="TypeScript" icon={<BracketsIcon />} />
                 <TechItem label="Framer Motion" icon={<Layers size={24} />} />
              </div>
           </div>
           <div className="h-full min-h-[400px] rounded-[2rem] border relative overflow-hidden flex flex-col items-center justify-center group shadow-2xl" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15),transparent_70%)] opacity-50 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-overlay" />
              
              <div className="relative z-10 text-center flex flex-col items-center">
                 <MotionDiv 
                   initial={{ scale: 0.8, opacity: 0 }}
                   whileInView={{ scale: 1, opacity: 1 }}
                   viewport={{ once: true }}
                   transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
                   className="w-24 h-24 rounded-full border border-primary/30 flex items-center justify-center mb-6 bg-primary/5 backdrop-blur-md relative"
                 >
                    <div className="absolute inset-0 rounded-full border border-primary/50 border-t-transparent animate-spin" style={{ animationDuration: '3s' }} />
                    <Database size={32} className="text-primary animate-pulse" />
                 </MotionDiv>
                 
                 <div className="text-7xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 mb-4 tracking-tighter drop-shadow-sm">
                   100%
                 </div>
                 <div className="text-xs font-mono text-primary uppercase tracking-widest px-5 py-2 rounded-full border border-primary/20 bg-primary/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                   Client Side Processing
                 </div>
              </div>
           </div>
         </div>
      </section>

      {/* --- ROADMAP --- */}
      <section id="roadmap" className="relative z-10 py-32 px-6 max-w-7xl mx-auto overflow-hidden">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-6xl font-display mb-4">PROJECT TIMELINE</h2>
          <p className="text-muted-foreground font-mono uppercase tracking-widest text-sm">Development Roadmap</p>
        </div>

        <div className="absolute left-1/2 top-[300px] bottom-32 w-px bg-muted -translate-x-1/2 hidden md:block pointer-events-none" />

        <div className="relative space-y-24">
          <RoadmapItem 
            quarter="MINI PROJECT"
            title="Rule-Based Core"
            status="Complete"
            description="Core simulator, grade parsing, and deterministic calculations."
            position="left"
          />
          <RoadmapItem 
            quarter="MINI PROJECT"
            title="Lite Intelligence"
            status="Active"
            description="Integration of Gemini 3 Flash for basic Q&A and academic context."
            position="right"
          />
          <RoadmapItem 
            quarter="MINOR PROJECT"
            title="Predictive Core"
            status="Locked"
            description="Probabilistic grade prediction using regression models on historical data."
            position="left"
          />
          <RoadmapItem 
            quarter="FUTURE"
            title="Neural Mentor"
            status="Concept"
            description="Voice-native conversational interface for real-time academic coaching."
            position="right"
          />
        </div>
      </section>

      {/* --- FOOTER CTA --- */}
      <section className="relative z-10 h-[60vh] flex flex-col items-center justify-center group cursor-pointer overflow-hidden" onClick={handleEnter} style={{ background: "radial-gradient(circle at center, #162C6D 0%, #0A101D 100%)" }}>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-overlay" />
        
        <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl pointer-events-none" />

        <MotionDiv 
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          className="relative z-10 text-center flex flex-col items-center gap-8 pointer-events-none"
        >
          <div className="relative">
            <h2 className="text-[8vw] sm:text-[10vw] font-display font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 group-hover:to-blue-400 group-hover:scale-105 transition-all duration-700 ease-out" style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.8))" }}>
              ENTER KAIZEN
            </h2>
            <div className="absolute -inset-4 bg-blue-500/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />
          </div>
          
          <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-md group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-500 shadow-xl">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            <p className="font-mono text-sm sm:text-base uppercase tracking-[0.2em] text-blue-200/80 group-hover:text-white transition-colors">
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

const MethodologyStep: React.FC<{ number: string, title: string, desc: string, icon: React.ReactNode }> = ({ number, title, desc, icon }) => (
  <motion.div 
    initial="initial"
    whileHover="hovered"
    variants={{
      initial: { borderColor: COLORS.border, backgroundColor: COLORS.surface },
      hovered: { borderColor: COLORS.accent, backgroundColor: COLORS.surfaceHover }
    }}
    transition={{ duration: 0.3 }}
    className="border p-8 rounded-3xl text-center relative z-10 cursor-default shadow-lg"
  >
    <motion.div 
      variants={{
        initial: { color: COLORS.textMuted, borderColor: COLORS.border },
        hovered: { color: COLORS.accent, borderColor: COLORS.accent }
      }}
      transition={{ duration: 0.3 }}
      className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-background border rounded-full flex items-center justify-center"
      style={{ backgroundColor: "#050914" }}
    >
      {icon}
    </motion.div>
    
    <motion.div 
      variants={{
        initial: { color: COLORS.textMuted },
        hovered: { color: COLORS.text }
      }}
      className="mt-6 mb-4 text-4xl font-display font-bold"
    >
      {number}
    </motion.div>
    
    <h3 className="text-xl font-display text-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground">{desc}</p>
  </motion.div>
);

const ProtocolStep: React.FC<{ number: string, title: string, desc: string, icon: React.ReactNode }> = ({ number, title, desc, icon }) => (
  <MotionDiv 
    initial="initial"
    whileInView="visible"
    whileHover="hovered"
    viewport={{ once: true, margin: "-50px" }}
    variants={{
      initial: { opacity: 0, x: 50, backgroundColor: COLORS.surface, borderColor: COLORS.border },
      visible: { opacity: 1, x: 0, transition: { duration: 0.6, type: "spring", bounce: 0.4 }, backgroundColor: COLORS.surface, borderColor: COLORS.border },
      hovered: { scale: 1.02, backgroundColor: COLORS.surfaceHover, borderColor: COLORS.accent, transition: { duration: 0.3 } }
    }}
    className="p-8 md:p-12 border rounded-[2rem] relative overflow-hidden group shadow-2xl"
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
    
    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
      <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center text-primary shadow-inner group-hover:scale-110 transition-transform duration-500">
        {icon}
      </div>
      
      <div className="flex-grow">
        <div className="flex items-center gap-4 mb-3">
          <span className="font-mono text-3xl font-bold text-muted-foreground/30 group-hover:text-primary/50 transition-colors">{number}</span>
          <h3 className="text-3xl font-display text-foreground">{title}</h3>
        </div>
        <p className="text-muted-foreground text-lg leading-relaxed">{desc}</p>
      </div>
    </div>
  </MotionDiv>
);

const FeatureCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  delay?: number;
  isNew?: boolean;
}> = ({ title, description, icon, color, delay = 0, isNew }) => {
  return (
    <MotionDiv 
      initial="initial"
      whileInView="visible"
      whileHover="hovered"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        initial: { opacity: 0, y: 50, backgroundColor: COLORS.surface, borderColor: COLORS.border },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay }, backgroundColor: COLORS.surface, borderColor: COLORS.border },
        hovered: { y: -5, backgroundColor: COLORS.surfaceHover, borderColor: COLORS.accent }
      }}
      className="p-8 border rounded-3xl min-h-[280px] flex flex-col justify-between relative cursor-pointer shadow-lg"
    >
      {isNew && (
        <div className="absolute top-4 right-4 px-2 py-1 text-black text-[10px] font-bold uppercase tracking-widest rounded-sm" style={{ backgroundColor: COLORS.accent }}>
          New
        </div>
      )}
      
      <MotionDiv 
        variants={{
          initial: { scale: 1 },
          hovered: { scale: 1.1 }
        }}
        transition={{ duration: 0.3 }}
        className={`w-12 h-12 rounded-full flex items-center justify-center ${color} mb-6 shadow-inner`}
        style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
      >
        {icon}
      </MotionDiv>
      
      <div>
        <h3 className="text-2xl font-display font-medium mb-3 text-foreground">{title}</h3>
        <p className="text-muted-foreground font-light leading-relaxed text-sm">{description}</p>
      </div>
    </MotionDiv>
  );
}

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
      <div className="absolute left-0 top-0 bottom-0 w-px bg-muted md:hidden pointer-events-none" />
      
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
                <span className="text-primary font-mono text-xs uppercase tracking-widest">{quarter}</span>
             )}
            <span className={`text-[10px] uppercase px-2 py-0.5 rounded border ${
              status === 'Active' ? 'border-primary text-primary bg-primary/10' : 
              status === 'Complete' ? 'border-green-500 text-green-500 bg-green-500/10' :
              'border-input text-muted-foreground'
            }`}>
              {status}
            </span>
             {position === 'left' && (
                <span className="text-primary font-mono text-xs uppercase tracking-widest">{quarter}</span>
             )}
          </div>
          
          <motion.h3 
            variants={{
              initial: { color: COLORS.text },
              hovered: { color: COLORS.accent }
            }}
            transition={{ duration: 0.3 }}
            className="text-2xl font-display font-bold"
          >
            {title}
          </motion.h3>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm ml-0 md:ml-auto">{description}</p>
      </MotionDiv>

      <div className="absolute left-0 md:left-1/2 -translate-x-1/2 md:-translate-x-1/2 top-0 w-4 h-4 rounded-full border-4 border-black z-10 flex items-center justify-center pointer-events-none">
         <div className={`w-full h-full rounded-full transition-all duration-300 ${status === 'Active' ? 'bg-primary animate-pulse shadow-primary/50' : status === 'Complete' ? 'bg-green-500' : 'bg-[#444]'}`} />
      </div>
    </motion.div>
  );
};

const TechItem: React.FC<{ label: string, icon: React.ReactNode }> = ({ label, icon }) => (
  <motion.div 
    whileHover={{ y: -4, backgroundColor: COLORS.surfaceHover, borderColor: COLORS.accent }}
    className="flex flex-col items-center justify-center gap-4 p-6 border rounded-2xl text-sm text-muted-foreground transition-all duration-300 group cursor-pointer shadow-sm hover:shadow-xl"
    style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface }}
  >
    <div className="w-14 h-14 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center text-primary group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-500">
      {icon}
    </div>
    <span className="font-medium group-hover:text-foreground transition-colors tracking-wide">{label}</span>
  </motion.div>
);

const BracketsIcon = () => (
   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 18l6-6-6-6"/><path d="M8 6l-6 6 6 6"/></svg>
);
