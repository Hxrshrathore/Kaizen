'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User as UserIcon, LogOut, GraduationCap, FolderKanban, 
  BrainCircuit, FolderArchive, Sparkles, BookOpen, ChevronRight,
  ShieldCheck, Award, School
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface ProfileData {
  id?: string;
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
    color?: string;
    border?: string;
    bg?: string;
    badgeClasses?: string;
  };
}

interface HeaderProfileCardProps {
  user: ProfileData;
  onOpenLibrary?: () => void;
  onLogout: () => void;
}

export function HeaderProfileCard({ user, onOpenLibrary, onLogout }: HeaderProfileCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 220);
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format semester from program or logged count
  const extractSemester = () => {
    if (user.program) {
      const match = user.program.match(/(\d+)(?:st|nd|rd|th)?\s*sem/i);
      if (match) return `Semester ${match[1]}`;
    }
    if (user.semestersLogged && user.semestersLogged > 0) {
      return `Semester ${user.semestersLogged + 1}`;
    }
    return 'Semester 7';
  };

  const roll = user.rollNumber && user.rollNumber !== 'N/A' 
    ? user.rollNumber 
    : user.email.match(/^(\d+)@/)?.[1] || '22051867';

  return (
    <div 
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header Profile Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 pl-1.5 pr-3 py-1 h-9 rounded-full border border-border bg-muted/40 hover:bg-muted/80 hover:border-primary/40 transition-all text-xs cursor-pointer group focus:outline-none"
        aria-expanded={isOpen}
      >
        <div className="relative w-6 h-6 rounded-full overflow-hidden bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
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
          <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-1 ring-background" />
        </div>
        <span className="font-mono font-medium text-foreground max-w-[105px] truncate hidden sm:inline group-hover:text-primary transition-colors">
          {user.name.split(' ')[0]}
        </span>
      </button>

      {/* Floating Hover Panel - VisionOS Apple Glassmorphism */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-88 z-50 rounded-2xl border border-black/10 dark:border-white/10 bg-card/95 dark:bg-[#090a0f]/95 backdrop-blur-2xl p-4 shadow-[0_16px_40px_-10px_rgba(0,0,0,0.5)] animate-in fade-in-0 zoom-in-95 duration-150 font-sans">
          
          {/* Top Header Card */}
          <div className="flex items-start gap-3 pb-3.5 border-b border-border/60">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-primary/10 border border-primary/25 shrink-0 flex items-center justify-center shadow-inner">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-base font-bold font-mono text-primary">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-bold text-foreground truncate">{user.name}</h4>
                <ShieldCheck size={14} className="text-primary shrink-0" />
              </div>
              <p className="text-[11px] font-mono text-muted-foreground truncate">{user.email}</p>
              
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold border border-primary/30 bg-primary/10 text-primary">
                  {user.badge?.label || 'KIIT AUTONOMOUS'}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-muted text-muted-foreground">
                  {extractSemester()}
                </span>
              </div>
            </div>
          </div>

          {/* Academic Details Matrix */}
          <div className="py-3 border-b border-border/60 space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80 flex items-center justify-between">
              <span>Academic Enrollment</span>
              <span className="text-primary font-bold">KIIT ID</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-muted/40 border border-border/50">
                <span className="block text-[10px] text-muted-foreground font-mono">Roll Number</span>
                <span className="font-mono font-bold text-foreground truncate block">{roll}</span>
              </div>
              <div className="p-2 rounded-xl bg-muted/40 border border-border/50">
                <span className="block text-[10px] text-muted-foreground font-mono">Class / Section</span>
                <span className="font-mono font-bold text-primary truncate block">{user.section || 'ECS GROUP-03'}</span>
              </div>
              <div className="p-2 rounded-xl bg-muted/40 border border-border/50">
                <span className="block text-[10px] text-muted-foreground font-mono">Branch / Stream</span>
                <span className="font-bold text-foreground truncate block">{user.branch || 'E&CSc'}</span>
              </div>
              <div className="p-2 rounded-xl bg-muted/40 border border-border/50">
                <span className="block text-[10px] text-muted-foreground font-mono">Current CGPA</span>
                <span className="font-mono font-bold text-emerald-500 block">
                  {typeof user.currentCGPA === 'number' && user.currentCGPA > 0 ? user.currentCGPA.toFixed(2) : '8.64'}
                </span>
              </div>
            </div>

            {user.department && (
              <div className="px-2.5 py-1.5 rounded-lg bg-muted/30 border border-border/40 text-[10px] text-muted-foreground flex items-center gap-1.5 truncate">
                <School size={12} className="shrink-0 text-muted-foreground" />
                <span className="truncate">{user.department}</span>
              </div>
            )}
          </div>

          {/* Quick Hub Navigation */}
          <div className="py-2.5 border-b border-border/60 space-y-1">
            <Link
              href="/dashboard/projects"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-muted/70 text-xs font-medium text-foreground transition-colors group"
            >
              <div className="flex items-center gap-2">
                <FolderKanban size={14} className="text-primary" />
                <span>Minor / Major Project Portal</span>
              </div>
              <ChevronRight size={13} className="text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/dashboard/records"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-muted/70 text-xs font-medium text-foreground transition-colors group"
            >
              <div className="flex items-center gap-2">
                <GraduationCap size={14} className="text-primary" />
                <span>Curricular Gradebook & Records</span>
              </div>
              <ChevronRight size={13} className="text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
            </Link>

            {onOpenLibrary && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenLibrary();
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-muted/70 text-xs font-medium text-foreground transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FolderArchive size={14} className="text-primary" />
                  <span>AI Generated Library</span>
                </div>
                <ChevronRight size={13} className="text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
              </button>
            )}
          </div>

          {/* Footer Action: End Session */}
          <div className="pt-2.5">
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all text-xs font-mono font-bold tracking-wider uppercase cursor-pointer"
            >
              <LogOut size={13} />
              <span>End Session</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
