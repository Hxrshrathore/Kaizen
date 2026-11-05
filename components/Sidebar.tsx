'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Upload, Play, TrendingUp, Activity, LogOut, 
  User, PieChart, Sparkles, Zap, BrainCircuit, FileQuestion, 
  CalendarClock, Mail, ChevronRight, DatabaseZap, Shield,
  Pin, PinOff
} from 'lucide-react';
import { getOfficialBadge } from '@/lib/rbac';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  user?: {
    name: string;
    email: string;
    userType?: string;
    officialTag?: string;
    officialTags?: string[];
  };
  loading?: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
}

export default function Sidebar({
  isOpen,
  onToggle,
  user,
  loading,
  isPinned = false,
  onTogglePin,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const displayUser = user || { name: 'Guest Student', email: 'Please login' };
  const badge = getOfficialBadge(displayUser as any);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const menuItems = [
    { 
      section: 'CORE', 
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={19} /> },
        { path: '/dashboard/insights', label: 'Insights', icon: <PieChart size={19} /> },
        { path: '/dashboard/profile', label: 'Student Profile', icon: <User size={19} /> },
      ]
    },
    { 
      section: 'ACADEMIC ENGINE', 
      items: [
        { path: '/dashboard/upload', label: 'Ingest Grades', icon: <Upload size={19} /> },
        { path: '/dashboard/simulator', label: 'SGPA Simulator', icon: <Play size={19} /> },
        { path: '/dashboard/improvement', label: 'Optimizer', icon: <TrendingUp size={19} /> },
        { path: '/dashboard/mock-exams', label: 'Exo-Sim', icon: <FileQuestion size={19} /> },
      ]
    },
    { 
      section: 'NEURAL SUITE', 
      items: [
        { path: '/dashboard/advisor', label: 'AI Advisor', icon: <Sparkles size={19} /> },
        { path: '/dashboard/focus', label: 'Focus Kaizen', icon: <Zap size={19} /> },
        { path: '/dashboard/archives', label: 'Neural Archives', icon: <BrainCircuit size={19} /> },
        { path: '/dashboard/checkin', label: 'Cognitive Check', icon: <Activity size={19} /> },
      ]
    },
    {
      section: 'DATA PIPELINE',
      items: [
        { path: '/dashboard/data-ingestion', label: 'Data Ingestion', icon: <DatabaseZap size={19} /> },
      ]
    },
    { 
      section: 'CONNECTIVITY', 
      items: [
        { path: '/dashboard/mail-sync', label: 'Neural Inbox', icon: <Mail size={19} /> },
        { path: '/dashboard/scheduler', label: 'Chrono-Sync', icon: <CalendarClock size={19} /> },
      ]
    }
  ];

  // Helper renderer for desktop and mobile
  const renderSidebar = (expanded: boolean) => (
    <div className="flex flex-col h-full bg-card/95 backdrop-blur-xl border-r border-border select-none overflow-hidden">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-3.5 border-b border-border shrink-0 overflow-hidden">
        <div className="flex items-center min-w-0">
          <div className="w-10 h-10 bg-primary text-primary-foreground rounded-lg flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 hover:scale-105">
            <Activity className="w-5 h-5" />
          </div>
          <div
            className={`transition-all duration-300 overflow-hidden whitespace-nowrap ml-3 ${
              expanded ? 'opacity-100 max-w-[140px]' : 'opacity-0 max-w-0 pointer-events-none'
            }`}
          >
            <span className="font-display font-bold text-xl tracking-wider text-foreground">KAIZEN</span>
          </div>
        </div>

        {/* Pin / Unpin button (Desktop only when expanded) */}
        {expanded && onTogglePin && (
          <button
            onClick={onTogglePin}
            className={`hidden md:flex p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors ${
              isPinned ? 'text-primary bg-primary/10' : ''
            }`}
            title={isPinned ? 'Unpin sidebar (collapse to hover rail)' : 'Pin sidebar open'}
          >
            {isPinned ? <PinOff size={15} /> : <Pin size={15} />}
          </button>
        )}
      </div>

      {/* Menu Navigation */}
      <div className="flex-1 py-4 px-2 space-y-4 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {menuItems.map((group, idx) => (
          <div key={idx} className="space-y-1">
            {/* Section Divider or Header */}
            <div className="overflow-hidden transition-all duration-300">
              {expanded ? (
                <div className="px-3 py-1 text-[10px] font-mono text-muted-foreground uppercase tracking-widest whitespace-nowrap truncate animate-in fade-in duration-200">
                  {group.section}
                </div>
              ) : (
                <div className="w-6 h-[1px] bg-border/60 mx-auto my-2 transition-all duration-200" />
              )}
            </div>

            {/* Menu Items */}
            {group.items.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link 
                  key={item.path}
                  href={item.path}
                  onClick={() => {
                    if (window.innerWidth < 768) onToggle();
                  }}
                  className="block"
                >
                  <div 
                    className={`relative flex items-center rounded-lg transition-all duration-200 group cursor-pointer ${
                      expanded 
                        ? 'px-3 py-2.5 w-full gap-3' 
                        : 'w-10 h-10 mx-auto justify-center'
                    } ${
                      isActive 
                        ? 'bg-primary/15 text-primary font-bold shadow-sm' 
                        : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                    }`}
                    title={!expanded ? item.label : undefined}
                  >
                    <span className={`shrink-0 transition-transform duration-200 ${
                      isActive ? 'text-primary scale-105' : 'text-muted-foreground group-hover:text-foreground group-hover:scale-110'
                    }`}>
                      {item.icon}
                    </span>
                    
                    {/* Text Label */}
                    <span 
                      className={`font-medium text-xs md:text-sm tracking-wide whitespace-nowrap overflow-hidden transition-all duration-200 ${
                        expanded ? 'opacity-100 max-w-[155px]' : 'opacity-0 max-w-0 pointer-events-none'
                      }`}
                    >
                      {item.label}
                    </span>
                    
                    {/* Chevron when active and expanded */}
                    {isActive && expanded && (
                       <ChevronRight size={14} className="ml-auto opacity-70 text-primary shrink-0 animate-in fade-in" />
                    )}

                    {/* Active vertical dot indicator when collapsed */}
                    {isActive && !expanded && (
                      <span className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* User Profile & Logout Footer */}
      <div className="p-3 border-t border-border bg-muted/30 shrink-0 overflow-hidden transition-all duration-300">
        {expanded ? (
          <div className="space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between gap-1.5 overflow-hidden">
              <div className="min-w-0 flex-1">
                <div className="text-xs text-foreground font-bold truncate">{displayUser.name}</div>
                <div className="text-[10px] text-muted-foreground truncate font-mono" title={displayUser.email}>
                  {displayUser.email}
                </div>
              </div>
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border shrink-0 tracking-wider uppercase ${badge.badgeClasses}`}
                title={badge.description}
              >
                {badge.label}
              </span>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-destructive hover:bg-destructive/10 transition-colors text-[10px] uppercase tracking-widest font-bold shadow-sm"
            >
              <LogOut size={12} />
              <span>End Session</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold font-mono text-primary cursor-pointer hover:scale-105 transition-transform"
              title={`${displayUser.name} (${badge.label})`}
            >
              {displayUser.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <button 
              onClick={handleLogout}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive hover:bg-destructive/10 transition-colors"
              title="End Session"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const isDesktopExpanded = isPinned || isHovered;

  return (
    <>
      {/* Desktop Collapsible Hover Sidebar */}
      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`hidden md:flex flex-col h-screen fixed left-0 top-0 z-40 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isDesktopExpanded 
            ? 'w-64 shadow-[8px_0_30px_rgba(0,0,0,0.4)]' 
            : 'w-[72px] shadow-none'
        }`}
      >
        {renderSidebar(isDesktopExpanded)}
      </div>

      {/* Mobile Sidebar Overlay Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={onToggle}>
            <motion.div 
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="w-3/4 max-w-[280px] h-full shadow-2xl"
              onClick={(e: any) => e.stopPropagation()}
            >
              {renderSidebar(true)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
