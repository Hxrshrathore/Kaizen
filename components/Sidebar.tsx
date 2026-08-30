'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Upload, Play, TrendingUp, Activity, LogOut, 
  User, PieChart, Sparkles, Zap, BrainCircuit, FileQuestion, 
  CalendarClock, Mail, ChevronRight, DatabaseZap
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  user?: { name: string; email: string };
  loading?: boolean;
}

export default function Sidebar({ isOpen, onToggle, user, loading }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const displayUser = user || { name: 'Guest Student', email: 'Please login' };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // Organized all original pages into sections
  const menuItems = [
    { 
      section: 'CORE', 
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
        { path: '/dashboard/insights', label: 'Insights', icon: <PieChart size={18} /> },
        { path: '/dashboard/profile', label: 'Student Profile', icon: <User size={18} /> },
      ]
    },
    { 
      section: 'ACADEMIC ENGINE', 
      items: [
        { path: '/dashboard/upload', label: 'Ingest Grades', icon: <Upload size={18} /> },
        { path: '/dashboard/simulator', label: 'SGPA Simulator', icon: <Play size={18} /> },
        { path: '/dashboard/improvement', label: 'Optimizer', icon: <TrendingUp size={18} /> },
        { path: '/dashboard/mock-exams', label: 'Exo-Sim', icon: <FileQuestion size={18} /> },
      ]
    },
    { 
      section: 'NEURAL SUITE', 
      items: [
        { path: '/dashboard/advisor', label: 'AI Advisor', icon: <Sparkles size={18} /> },
        { path: '/dashboard/focus', label: 'Focus Kaizen', icon: <Zap size={18} /> },
        { path: '/dashboard/archives', label: 'Neural Archives', icon: <BrainCircuit size={18} /> },
        { path: '/dashboard/checkin', label: 'Cognitive Check', icon: <Activity size={18} /> },
      ]
    },
    {
      section: 'DATA PIPELINE',
      items: [
        { path: '/dashboard/data-ingestion', label: 'OCR Annotation', icon: <DatabaseZap size={18} /> },
      ]
    },
    { 
      section: 'CONNECTIVITY', 
      items: [
        { path: '/dashboard/mail-sync', label: 'Neural Inbox', icon: <Mail size={18} /> },
        { path: '/dashboard/scheduler', label: 'Chrono-Sync', icon: <CalendarClock size={18} /> },
      ]
    }
  ];

  const SidebarContent = (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-sm flex items-center justify-center mr-3">
          <Activity className="w-5 h-5" />
        </div>
        <span className="font-display font-bold text-xl tracking-wider text-foreground">KAIZEN</span>
      </div>

      {/* Menu */}
      <div className="flex-1 py-6 px-3 space-y-6 overflow-y-auto custom-scrollbar">
        {menuItems.map((group, idx) => (
          <div key={idx}>
            <div className="px-4 mb-2 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              {group.section}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link 
                    key={item.path}
                    href={item.path}
                    onClick={() => {
                      if (window.innerWidth < 768) onToggle();
                    }}
                  >
                    <div 
                      className={`relative w-full flex items-center gap-3 px-4 py-2.5 rounded-sm transition-all duration-200 group mb-1 cursor-pointer ${
                        isActive 
                          ? 'bg-primary/10 text-primary border-l-2 border-primary' 
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground border-l-2 border-transparent'
                      }`}
                    >
                      <span className={`${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground transition-colors'}`}>
                        {item.icon}
                      </span>
                      <span className="font-medium text-xs md:text-sm tracking-wide">{item.label}</span>
                      
                      {isActive && (
                         <ChevronRight size={14} className="ml-auto opacity-50" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User / Logout */}
      <div className="p-4 border-t border-border bg-muted/50">
                 <>
                    <div className="text-xs text-foreground font-medium truncate">{displayUser.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate" title={displayUser.email}>{displayUser.email}</div>
                 </>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-sm text-muted-foreground hover:text-foreground hover:border-destructive hover:bg-destructive/10 transition-colors text-[10px] uppercase tracking-widest font-bold"
        >
          <LogOut size={12} /> End Session
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 h-screen fixed left-0 top-0 z-40">
        {SidebarContent}
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={onToggle}>
            <motion.div 
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-3/4 h-full shadow-2xl"
              onClick={(e: any) => e.stopPropagation()}
            >
              {SidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};