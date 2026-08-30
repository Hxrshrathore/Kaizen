'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Cpu, AlertTriangle } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  subtitle: string;
  phase: string;
  eta: string;
}

const MotionDiv = motion.div as any;

const ComingSoon: React.FC<ComingSoonProps> = ({ title, subtitle, phase, eta }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 relative overflow-hidden min-h-[500px]">
      {/* Background Grid & Noise */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />
      
      <MotionDiv 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-lg w-full bg-muted border border-border p-12 text-center overflow-hidden group"
      >
        {/* Scanning Line Animation */}
        <MotionDiv 
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 right-0 h-1 bg-primary/20 blur-sm w-full"
        />

        <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-8 border border-input group-hover:border-primary transition-colors relative">
          <Lock size={32} className="text-muted-foreground group-hover:text-primary transition-colors" />
          <div className="absolute inset-0 border-2 border-primary rounded-full opacity-0 group-hover:opacity-20 animate-ping" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted border border-input rounded mb-6">
           <AlertTriangle size={12} className="text-orange-500" />
           <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Module Offline</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-2">{title}</h1>
        <p className="text-primary font-mono uppercase tracking-widest text-sm mb-8">{subtitle}</p>

        <p className="text-muted-foreground leading-relaxed text-sm mb-8">
          This neural module is currently under development. Access is restricted to Level 4 Administrators.
          <br/>
          <span className="text-muted-foreground text-xs mt-2 block">Reason: Pending Major Project Integration</span>
        </p>

        <div className="grid grid-cols-2 gap-4 text-xs font-mono border-t border-border pt-6">
           <div className="text-right pr-4 border-r border-border">
             <span className="block text-muted-foreground mb-1">DEVELOPMENT PHASE</span>
             <span className="text-foreground">{phase}</span>
           </div>
           <div className="text-left pl-4">
             <span className="block text-muted-foreground mb-1">ESTIMATED DEPLOYMENT</span>
             <span className="text-foreground">{eta}</span>
           </div>
        </div>
      </MotionDiv>
      
      <div className="mt-8 flex items-center gap-2 text-muted-foreground text-[10px] uppercase tracking-[0.2em] animate-pulse">
        <Cpu size={12} /> System Status: Building...
      </div>
    </div>
  );
};

export default ComingSoon;