"use client";

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Layers, Timer, Activity, ArrowRight } from 'lucide-react';
import { NotchNav } from '@/components/ui/notch-nav';
import { LandingFooter } from '@/components/ui/landing-footer';
import SpecularButton from '@/components/SpecularButton';

import { Logo } from '@/components/ui/logo';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavChange = (id: string) => {
    const href = id === 'architecture' ? '#features' : '#roadmap';
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
    <div className="relative flex flex-col min-h-screen bg-white text-slate-900 overflow-x-hidden">
      {/* Black Frame Overlay */}
      <div className="hidden md:block fixed inset-[12px] rounded-[20px] shadow-[0_0_0_100vmax_black] z-40 pointer-events-none" />

      {/* Light Mode Navigation */}
      <NotchNav 
        className="!bg-transparent border-0 z-50 pointer-events-none text-slate-900"
        items={navItems}
        onActiveChange={handleNavChange}
        logo={
          <div className="pointer-events-auto">
            <Logo isWhite={true} />
          </div>
        }
        rightContent={
          <div className="pointer-events-auto">
            <SpecularButton 
              size="sm"
              onClick={() => router.push('/join-beta')}
              className="group !font-semibold !text-sm !tracking-normal"
            >
              <div className="flex items-center gap-1.5">
                <span>Join Beta</span>
                <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </SpecularButton>
          </div>
        }
      />

      {/* Main Content Area */}
      <main className="flex-grow pt-24 pb-16">
        {children}
      </main>

      <LandingFooter />
    </div>
  );
}
