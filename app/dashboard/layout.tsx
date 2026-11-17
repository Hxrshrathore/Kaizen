'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { 
  Menu, Bell, User as UserIcon, LogOut, Settings, 
  FileText, BrainCircuit, Sparkles, BookOpen, GraduationCap,
  Calendar, Layers, Shield, FolderArchive
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { ModelQuotaBar } from '@/components/ui/model-quota-bar';
import { UniversalLibraryDrawer } from '@/components/ai/UniversalLibraryDrawer';
import { HeaderProfileCard } from '@/components/profile/HeaderProfileCard';
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
  rollNumber?: string;
  program?: string;
  branch?: string;
  section?: string;
  currentCGPA?: number;
  totalCredits?: number;
  semestersLogged?: number;
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
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [libraryCount, setLibraryCount] = useState(0);

  const getPageInfo = (path: string): PageMeta => {
    if (path.includes('/dashboard/projects')) {
      return { title: 'MAJOR & MINOR PROJECT PORTAL', tagline: '// Semesters 6, 7 & 8 Autonomous System' };
    }
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

    const fetchLibraryCount = async () => {
      try {
        const res = await fetch('/api/ai/library');
        if (res.ok) {
          const data = await res.json();
          setLibraryCount(data.totalCount || 0);
        }
      } catch {}
    };

    fetchUser();
    fetchLibraryCount();
  }, [pathname]);

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

            {/* Universal AI Generated Library Trigger - Near Theme Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLibraryOpen(true)}
              className="h-9 sm:h-10 px-2.5 sm:px-3 gap-1.5 rounded-xl border border-border bg-card/60 hover:bg-card hover:border-primary/50 text-xs font-mono transition-all cursor-pointer shadow-xs"
              title="Universal AI Generated Library (Question Papers, Flashcards & Study Materials)"
            >
              <FolderArchive size={15} className="text-primary" />
              <span className="hidden sm:inline font-bold">Library</span>
              {libraryCount > 0 && (
                <Badge variant="secondary" className="h-4 px-1.5 py-0 text-[10px] font-bold bg-primary text-primary-foreground ml-0.5">
                  {libraryCount}
                </Badge>
              )}
            </Button>

            <ThemeToggle variant="square" className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl" />

            <button 
              className="relative p-2 text-muted-foreground hover:text-primary transition-colors group cursor-pointer"
              title="Notifications"
            >
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full ring-2 ring-background group-hover:scale-110 transition-transform" />
            </button>

            {user && (
              <HeaderProfileCard
                user={user}
                onOpenLibrary={() => setIsLibraryOpen(true)}
                onLogout={handleLogout}
              />
            )}
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-0 relative scroll-smooth">
          {/* Noise Texture Overlay */}
          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] pointer-events-none fixed z-0" />
          
          <div className="relative z-10 w-full h-full">
            {children}
          </div>
        </main>

      </div>

      {/* Universal AI Generated Library Drawer */}
      <UniversalLibraryDrawer
        isOpen={isLibraryOpen}
        onClose={() => {
          setIsLibraryOpen(false);
          const fetchCount = async () => {
            try {
              const res = await fetch('/api/ai/library');
              if (res.ok) {
                const data = await res.json();
                setLibraryCount(data.totalCount || 0);
              }
            } catch {}
          };
          fetchCount();
        }}
      />
    </div>
  );
}
