"use client";

import React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

const GithubIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

export const LandingFooter: React.FC = () => {
  return (
    <footer className="relative z-10 border-t border-border dark:border-white/10 pt-20 pb-12 px-6 bg-background dark:bg-[#07070b] text-foreground dark:text-[#f4f4f5] transition-colors duration-300">
      {/* Ambient background glow */}
      <div 
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#bbf246]/10 dark:bg-[#bbf246]/5 rounded-full blur-[140px]"
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-5">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-border dark:border-white/15 bg-card dark:bg-[#0f0f17] shadow-sm transition-transform duration-300 group-hover:scale-105">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="/logo/kaizen-logo.png" 
                  alt="Kaizen Logo" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="inline-flex items-baseline">
                <span className="font-display font-bold text-xl tracking-wider text-foreground">
                  KAIZEN
                </span>
                <sup className="text-[#bbf246] text-[10px] font-mono tracking-wider ml-1 font-semibold">
                  BETA
                </sup>
              </div>
            </Link>

            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              Continuous academic evolution. Deterministic SGPA forecasting, burnout prediction, and neural advisement engineered for KIIT University scholars.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 dark:bg-white/5 border border-border dark:border-white/10 text-xs font-mono text-foreground/80 dark:text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-[#bbf246] animate-pulse shadow-[0_0_8px_#bbf246]" />
                <span>OPERATIONAL · KIIT DEEMED TO BE UNIVERSITY</span>
              </div>
            </div>
          </div>

          {/* Navigation Column 1: Academic Engine */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-semibold text-foreground dark:text-[#f4f4f5] tracking-widest uppercase">
              Academic Engine
            </h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="/dashboard/simulator" className="hover:text-primary dark:hover:text-[#bbf246] transition-colors">
                  SGPA Simulator
                </Link>
              </li>
              <li>
                <Link href="/dashboard/improvement" className="hover:text-primary dark:hover:text-[#bbf246] transition-colors">
                  Improvement Optimizer
                </Link>
              </li>
              <li>
                <Link href="/dashboard/upload" className="hover:text-primary dark:hover:text-[#bbf246] transition-colors">
                  Grade Ingestion Pipeline
                </Link>
              </li>
              <li>
                <Link href="/dashboard/mock-exams" className="hover:text-primary dark:hover:text-[#bbf246] transition-colors">
                  Exo-Sim Mock Trials
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation Column 2: Neural Suite */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-semibold text-foreground dark:text-[#f4f4f5] tracking-widest uppercase">
              Neural Suite
            </h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="/dashboard/advisor" className="hover:text-primary dark:hover:text-[#bbf246] transition-colors">
                  Gemini Neural Advisor
                </Link>
              </li>
              <li>
                <Link href="/dashboard/checkin" className="hover:text-primary dark:hover:text-[#bbf246] transition-colors">
                  Sleep & Burnout Predictor
                </Link>
              </li>
              <li>
                <Link href="/dashboard/focus" className="hover:text-primary dark:hover:text-[#bbf246] transition-colors">
                  Focus Kaizen (Biological)
                </Link>
              </li>
              <li>
                <Link href="/dashboard/archives" className="hover:text-primary dark:hover:text-[#bbf246] transition-colors">
                  Neural Knowledge Archives
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation Column 3: Platform */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-semibold text-foreground dark:text-[#f4f4f5] tracking-widest uppercase">
              Platform & Specs
            </h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <a href="/#features" className="hover:text-primary dark:hover:text-[#bbf246] transition-colors">
                  Core Architecture
                </a>
              </li>
              <li>
                <a href="/#roadmap" className="hover:text-primary dark:hover:text-[#bbf246] transition-colors">
                  Release Roadmap
                </a>
              </li>
              <li>
                <Link href="/join-beta" className="text-primary dark:text-[#bbf246] hover:underline transition-colors flex items-center gap-1 font-medium">
                  <span>Join Early Beta</span>
                  <ExternalLink size={12} />
                </Link>
              </li>
              <li>
                <a 
                  href="https://github.com/Hxrshrathore" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  GitHub Repository
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground font-mono">
          <div className="flex flex-wrap items-center gap-4 md:gap-6">
            <p>© 2026 KAIZEN SYSTEMS INC. ALL RIGHTS RESERVED.</p>

            <a 
              href="https://hxrshrathore.me" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary dark:hover:text-[#bbf246] transition-colors"
            >
              DESIGNED BY HARSH (HXRSHRATHORE.ME)
            </a>

            <a 
              href="https://github.com/Hxrshrathore"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border dark:border-white/10 bg-muted/40 dark:bg-white/5 text-muted-foreground dark:text-zinc-300 hover:border-primary/40 hover:bg-primary/10 hover:text-primary dark:hover:text-[#bbf246] transition-all shadow-sm group"
            >
              <GithubIcon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary dark:group-hover:text-[#bbf246] transition-colors" />
              <span className="font-semibold text-[10px] tracking-wide">WE HAVE OPEN SOURCE CODE</span>
            </a>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">ENGINE STATUS:</span>
            <span className="inline-flex items-center gap-1.5 text-primary dark:text-[#bbf246] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#bbf246] animate-pulse" />
              HIGH PERFORMANCE (100%)
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
