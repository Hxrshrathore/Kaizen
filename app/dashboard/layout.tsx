'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { 
  Menu, Bell, User as UserIcon, LogOut, Settings, 
  FileText, BrainCircuit, Sparkles, BookOpen, GraduationCap,
  Calendar, Layers, Shield
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { ModelQuotaBar } from '@/components/ui/model-quota-bar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

interface PageMeta {
  title: string;
  tagline: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const [user, setUser] = useState<UserProfile | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const getPageInfo = (path: string): PageMeta => {
    if (path.includes('/dashboard/generator')) {
      return { title: 'AI QUESTION PAPER GENERATOR', tagline: '// KIIT Autonomous Regs' };
    }
    if (path.includes('/dashboard/archives')) {
      return { title: 'NEURAL ARCHIVES & RECALL', tagline: '// Active Flashcards & Leitner' };
    }
    if (path.includes('/dashboard/advisor')) {
      return { title: 'ACADEMIC CO-PILOT & ADVISOR', tagline: '// Autonomous Consultation Engine' };
    }
    if (path.includes('/dashboard/classroom')) {
      return { title: 'GOOGLE CLASSROOM MODULES', tagline: '// Coursework Knowledge Base' };
    }
    if (path.includes('/dashboard/records')) {
      return { title: 'ACADEMIC RECORDS & SGPA', tagline: '// Autonomous Curricular Gradebook' };
    }
    if (path.includes('/dashboard/scheduler')) {
      return { title: 'TIMETABLE SCHEDULER', tagline: '// Autonomous Course Matrix' };
    }
    if (path.includes('/dashboard/improvement')) {
      return { title: 'CONTINUOUS IMPROVEMENT', tagline: '// Kaizen Diagnostics Radar' };
    }
    if (path.includes('/dashboard/simulator')) {
      return { title: 'CGPA & GRADE SIMULATOR', tagline: '// Predictive Performance Engine' };
    }
    if (path.includes('/dashboard/focus')) {
      return { title: 'COGNITIVE FOCUS & FLOW', tagline: '// Neural Study Timer' };
    }
    if (path.includes('/dashboard/checkin')) {
      return { title: 'ATTENDANCE & CHECK-IN', tagline: '// Autonomous Biometrics' };
    }
    if (path.includes('/dashboard/data-ingestion')) {
      return { title: 'DATA INGESTION PIPELINE', tagline: '// Multi-Modal OCR Ingestion' };
    }
    if (path.includes('/dashboard/upload')) {
      return { title: 'SYLLABUS & MATERIAL UPLOAD', tagline: '// OCR Knowledge Pipeline' };
    }
    if (path.includes('/dashboard/mock-exams')) {
      return { title: 'MOCK EXAMINATION SANDBOX', tagline: '// Autonomous Testing Engine' };
    }
    if (path.includes('/dashboard/insights')) {
      return { title: 'ACADEMIC ANALYTICS & INSIGHTS', tagline: '// Performance Metrics' };
    }
    if (path.includes('/dashboard/mail-sync')) {
      return { title: 'UNIVERSITY MAIL SYNC', tagline: '// Circulars & Notice OCR' };
    }
    if (path.includes('/dashboard/profile')) {
      return { title: 'ACADEMIC PROFILE & CREDENTIALS', tagline: '// KIIT Student Identity' };
    }
    if (path === '/dashboard') {
      return { title: 'ACADEMIC COMMAND CENTER', tagline: '// Autonomous Neural Overview' };
    }
    return { title: 'KAIZEN ACADEMIC SUITE', tagline: '// KIIT Autonomous System' };
  };

  const pageInfo = getPageInfo(pathname);

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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

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
        
        {/* Header - Identical clean autonomous header with page title on every page */}
        <header className="h-16 border-b border-border bg-background/85 backdrop-blur-md flex items-center justify-between px-3 md:px-6 z-20 sticky top-0 shrink-0">
          {/* Left: Mobile Menu & Dynamic Page Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="md:hidden text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <Menu size={20} />
            </button>
            
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-primary shrink-0 animate-pulse shadow-[0_0_8px_rgba(204,255,0,0.6)]" />
              <h1 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-[0.16em] text-foreground truncate">
                {pageInfo.title}
              </h1>
              <span className="hidden xl:inline-block text-[10px] font-mono text-muted-foreground/60 tracking-wider">
                {pageInfo.tagline}
              </span>
            </div>
          </div>

          {/* Center: Real-Time AI Token Quota & Priority Cascade Indicator */}
          <div className="hidden md:flex items-center justify-center flex-1 max-w-md mx-auto px-4">
            <ModelQuotaBar />
          </div>

          {/* Right: Controls & User Profile Dropdown */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="md:hidden">
              <ModelQuotaBar />
            </div>

            <ThemeToggle variant="square" className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl" />

            <button 
              className="relative p-2 text-muted-foreground hover:text-primary transition-colors group cursor-pointer"
              title="Notifications"
            >
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full ring-2 ring-background group-hover:scale-110 transition-transform" />
            </button>

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 pl-1.5 pr-3 py-1 h-9 rounded-full border border-border bg-muted/40 hover:bg-muted/80 hover:border-primary/40 transition-all text-xs cursor-pointer group"
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
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
                        <span className="text-[11px] font-mono font-bold text-primary">
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                    <span className="font-medium text-foreground max-w-[100px] truncate hidden sm:inline group-hover:text-primary transition-colors font-mono">
                      {user.name.split(' ')[0]}
                    </span>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56 font-mono text-xs">
                  <DropdownMenuLabel className="font-normal py-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-xs font-bold leading-none text-foreground">{user.name}</p>
                      <p className="text-[10px] leading-none text-muted-foreground truncate">{user.email}</p>
                      {user.department && (
                        <Badge variant="outline" className="text-[9px] mt-1.5 w-fit border-primary/30 text-primary">
                          {user.department}
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile" className="flex items-center gap-2 cursor-pointer">
                      <UserIcon size={14} className="text-primary" />
                      <span>Academic Profile</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/generator" className="flex items-center gap-2 cursor-pointer">
                      <FileText size={14} className="text-primary" />
                      <span>Paper Generator</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/archives" className="flex items-center gap-2 cursor-pointer">
                      <BrainCircuit size={14} className="text-primary" />
                      <span>Neural Archives</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/records" className="flex items-center gap-2 cursor-pointer">
                      <GraduationCap size={14} className="text-primary" />
                      <span>Curricular Records</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-rose-400 focus:text-rose-400 focus:bg-rose-500/10 cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
