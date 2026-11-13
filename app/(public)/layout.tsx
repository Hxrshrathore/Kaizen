"use client";

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Layers, Timer, Activity, ArrowRight } from 'lucide-react';
import { NotchNav } from '@/components/ui/notch-nav';
import { LandingFooter } from '@/components/ui/landing-footer';
import { ThemeToggle } from '@/components/theme-toggle';
import { SmoothScroll } from '@/components/ui/smooth-scroll';

import { Logo } from '@/components/ui/logo';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavChange = (id: string) => {
    const href = id === 'architecture' ? '#architecture' : '#roadmap';
    if (pathname !== '/') {
      router.push(`/${href}`);
    } else {
      const element = document.querySelector(href);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navItems = [
    { id: 'architecture', label: 'Architecture', icon: Layers },
    { id: 'roadmap', label: 'Roadmap', icon: Timer }
  ];

  return (
    <SmoothScroll>
      <div className="relative flex flex-col min-h-screen text-foreground bg-background transition-colors duration-300 overflow-x-hidden">
        {/* Frame Accent Overlay (Hardware Bezel & Side Borders: White in Light Mode, Black in Dark Mode) */}
        <div className="hidden md:block fixed inset-[12px] rounded-[20px] shadow-[0_0_0_100vmax_#ffffff] dark:shadow-[0_0_0_100vmax_#000000] border border-black/10 dark:border-white/10 z-40 pointer-events-none transition-shadow duration-300" />

        {/* Navigation */}
        <NotchNav 
          className="pointer-events-none z-50"
          items={navItems}
          onActiveChange={handleNavChange}
          centerSlot={
            <div className="pointer-events-auto flex items-center justify-center">
              <ThemeToggle 
                variant="circle" 
                className="w-7 h-7 rounded-full border border-border bg-card/70 hover:bg-card/90 text-foreground shadow-sm" 
              />
            </div>
          }
          logo={
            <div className="pointer-events-auto">
              <Logo />
            </div>
          }
          rightContent={
            <div className="pointer-events-auto flex items-center">
              <button
                onClick={() => router.push('/join-beta')}
                className="relative group inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-xs font-semibold text-white bg-zinc-950 hover:bg-zinc-900 dark:bg-white/10 dark:hover:bg-white/15 border border-zinc-800 dark:border-white/15 hover:border-[#bbf246]/50 shadow-sm transition-all duration-200 active:scale-95 overflow-hidden whitespace-nowrap"
              >
                <span className="relative z-10 font-medium tracking-tight">Join Beta</span>
                <ArrowRight size={13} className="relative z-10 text-white/80 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-[#bbf246]" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#bbf246]/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
              </button>
            </div>
          }
        />

        {/* Main Content Area */}
        <main className={`flex-grow ${pathname === '/' ? '' : 'pt-24 pb-16'}`}>
          {children}
        </main>

        <LandingFooter />
      </div>
    </SmoothScroll>
  );
}
