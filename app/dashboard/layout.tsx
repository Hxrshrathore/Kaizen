'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Menu, Bell, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

// --- TYPES ---
interface UserProfile {
  name: string;
  email: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // Fetch user data once at layout level to pass to sidebar
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          setUser({ name: data.name, email: data.email });
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
      
      {/* Sidebar - Passed user data */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setSidebarOpen(!isSidebarOpen)} 
        user={user}
        loading={loading}
      />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col md:ml-64 h-screen overflow-hidden transition-all duration-300">
        
        {/* Header */}
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 z-20 sticky top-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="md:hidden text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <Menu size={22} />
            </button>
            
            <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_#22c55e]" />
              System Operational
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button className="relative p-2 text-muted-foreground hover:text-primary transition-colors group">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full ring-2 ring-background group-hover:scale-110 transition-transform" />
            </button>
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