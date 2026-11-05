"use client";

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Layers, Timer, Activity, ArrowRight } from 'lucide-react';
import { NotchNav } from '@/components/ui/notch-nav';
import { LandingFooter } from '@/components/ui/landing-footer';
import SpecularButton from '@/components/SpecularButton';

import { Logo } from '@/components/ui/logo';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let scrollTimer: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      if (!document.body.classList.contains('is-scrolling')) {
        document.body.classList.add('is-scrolling');
      }
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        document.body.classList.remove('is-scrolling');
      }, 150);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (scrollTimer) clearTimeout(scrollTimer);
      document.body.classList.remove('is-scrolling');
    };
  }, []);

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
    <div className={`relative flex flex-col min-h-screen text-slate-900 overflow-x-hidden ${pathname === '/' ? 'bg-background' : 'bg-white'}`}>
      {/* Black Frame Overlay */}
      <div className="hidden md:block fixed inset-[12px] rounded-[20px] shadow-[0_0_0_100vmax_black] z-40 pointer-events-none" />

      {/* Navigation */}
      <NotchNav 
        className="pointer-events-none z-50"
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
      <main className={`flex-grow ${pathname === '/' ? '' : 'pt-24 pb-16'}`}>
        {children}
      </main>

      <LandingFooter />
    </div>
  );
}
