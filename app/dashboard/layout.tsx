'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Menu, Bell, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { ModelQuotaBar } from '@/components/ui/model-quota-bar';

// --- TYPES ---
interface UserProfile {
  name: string;
  email: string;
  image?: string | null;
  userType?: string;
  officialTag?: string;
  officialTags?: string[];
  department?: string | null;
  designation?: string | null;
  badge?: {
    label: string;
    description: string;
    color: string;
    border: string;
    bg: string;
  };
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const [user, setUser] = useState<UserProfile | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const getPageTitle = (path: string) => {
    if (path.includes('/dashboard/generator')) return 'AI Question Paper Generator';
    if (path.includes('/dashboard/advisor')) return 'Academic Co-Pilot & Advisor';
    if (path.includes('/dashboard/pyq')) return 'Autonomous PYQ Intelligence';
    if (path.includes('/dashboard/classroom')) return 'Google Classroom Coursework';
    if (path.includes('/dashboard/profile')) return 'Academic Profile';
    if (path.includes('/dashboard/evaluator')) return 'Paper Evaluator & Grading';
    return 'Kaizen Academic Suite';
  };

  // Restore sidebar pinned preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kaizen_sidebar_pinned');
      if (saved !== null) {
        setIsSidebarPinned(saved === 'true');
      }
    } catch {}
  }, []);

  const togglePin = () => {
    setIsSidebarPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('kaizen_sidebar_pinned', String(next));
      } catch {}
      return next;
    });
  };

  // Fetch user data once at layout level to pass to sidebar
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (e) {
        console.error("Layout load error", e);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden font-sans">
      
      {/* Sidebar - Passed user data & pin controls */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setSidebarOpen(!isSidebarOpen)} 
        user={user}
        loading={loading}
        isPinned={isSidebarPinned}
        onTogglePin={togglePin}
      />

      {/* Main Content Wrapper - Smoothly adapts to pinned vs collapsed hover rail */}
      <div 
        className={`flex-1 flex flex-col ${
          isSidebarPinned ? 'md:ml-64' : 'md:ml-[72px]'
        } h-screen overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]`}
      >
        
        {/* Header */}
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-3 md:px-6 z-20 sticky top-0 shrink-0">
          {/* Left: Mobile Menu & Dynamic Page Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="md:hidden text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <Menu size={20} />
            </button>
            
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-primary shrink-0 animate-pulse" />
              <h1 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-[0.16em] text-foreground truncate">
                {getPageTitle(pathname)}
              </h1>
              <span className="hidden xl:inline-block text-[10px] font-mono text-muted-foreground/60 tracking-wider">
                // KIIT Autonomous
              </span>
            </div>
          </div>

          {/* Center: Real-Time AI Token Quota & Priority Cascade Indicator */}
          <div className="hidden md:flex items-center justify-center flex-1 max-w-md mx-auto px-4">
            <ModelQuotaBar />
          </div>

          {/* Right: Controls & User Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="md:hidden">
              <ModelQuotaBar />
            </div>
            <ThemeToggle variant="square" className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl" />
            <button className="relative p-2 text-muted-foreground hover:text-primary transition-colors group">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full ring-2 ring-background group-hover:scale-110 transition-transform" />
            </button>
            {user && (
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-border bg-muted/40 hover:bg-muted/80 hover:border-primary/40 transition-all text-xs group"
                title="View Academic Profile"
              >
                <div className="w-7 h-7 rounded-full overflow-hidden bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-xs font-mono font-bold text-primary">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <span className="font-medium text-foreground max-w-[120px] truncate hidden sm:inline group-hover:text-primary transition-colors">
                  {user.name.split(' ')[0]}
                </span>
              </Link>
            )}
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-0 relative scroll-smooth">
          {/* Noise Texture Overlay */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none fixed z-0" />
          
          <div className="relative z-10 w-full h-full">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}