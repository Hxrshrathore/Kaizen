'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, ArrowLeft, Loader2, AlertCircle, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div;

export default function AttendancePage() {
  const router = useRouter();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugBody, setDebugBody] = useState<string | null>(null);

  async function fetchAttendance() {
    try {
      setLoading(true);
      const res = await fetch('/api/attendance');
      const data = await res.json();
      if (res.ok) {
        setRecords(data.records || []);
      } else {
        setError(data.error || 'Failed to fetch attendance');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAttendance();
  }, []);

  async function handleSync() {
    try {
      setSyncing(true);
      setError(null);
      setDebugBody(null);
      
      const res = await fetch('/api/attendance/sync', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to sync emails');
        return;
      }
      
      if (data.debugBody) {
        setDebugBody(data.debugBody);
      } else if (data.success) {
        fetchAttendance(); // Refresh the grid
      } else {
        setError(data.message || 'Unknown response from sync');
      }
      
    } catch (err) {
      setError('Network error during sync');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12 font-sans selection:bg-primary selection:text-black">
      {/* Background Grid Elements */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.push('/dashboard')}
              className="p-2 border border-border bg-card hover:border-primary text-muted-foreground hover:text-primary transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl md:text-5xl font-display font-bold text-foreground uppercase tracking-tight">
                Kaizen <span className="text-primary">Attendance</span>
              </h1>
              <p className="text-muted-foreground font-mono text-xs uppercase tracking-[0.2em] mt-1">
                Fetched from University Email
              </p>
            </div>
          </div>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold uppercase tracking-widest text-[10px] hover:bg-primary transition-colors disabled:opacity-50"
          >
            {syncing ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            {syncing ? 'Scanning Gmail...' : 'Sync Latest Email'}
          </button>
        </div>

        {error && (
          <div className="mb-8 p-4 border border-red-500/30 bg-red-500/10 text-red-500 font-mono text-xs uppercase tracking-widest flex items-center gap-3">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Debug UI for Unparsed Emails */}
        {debugBody && (
          <div className="mb-8 p-6 border border-primary/30 bg-primary/5 text-primary">
            <h2 className="text-xl font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <Database size={20} /> Parser Failed - Unknown Format
            </h2>
            <p className="text-sm text-muted-foreground font-mono mb-4">
              I found an email, but I don't know how to read it yet! Please copy the raw text below and send it to the Assistant so it can write a custom regex parser for your university's format:
            </p>
            <div className="relative">
              <pre className="p-4 bg-background/50 border border-border font-mono text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap max-h-96">
                {debugBody}
              </pre>
              <button 
                onClick={() => navigator.clipboard.writeText(debugBody)}
                className="absolute top-2 right-2 px-3 py-1 bg-white text-black text-[10px] font-bold uppercase tracking-widest hover:bg-primary"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {records.length > 0 ? (
              records.map((rec) => (
                <div key={rec.id} className="p-6 border border-border bg-card hover:border-primary/50 transition-colors group">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-bold font-display uppercase">{rec.courseCode}</h3>
                      <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mt-1">
                        {rec.subjectName || 'Regular Subject'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-light text-primary">{rec.percentage.toFixed(0)}%</div>
                      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Attendance</div>
                    </div>
                  </div>
                  
                  <div className="h-1 w-full bg-muted mb-6 overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-1000" 
                      style={{ width: `${Math.min(100, Math.max(0, rec.percentage))}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    <span>Attended: {rec.attended}</span>
                    <span>Total: {rec.total}</span>
                  </div>
                </div>
              ))
            ) : (
              !debugBody && (
                <div className="col-span-full py-32 text-center border border-dashed border-border">
                  <Database className="text-[#222] mx-auto mb-4" size={64} />
                  <p className="text-muted-foreground font-mono uppercase tracking-[0.2em]">No Attendance Records Found</p>
                  <p className="text-muted-foreground text-xs mt-2">Click "Sync Latest Email" to import from Gmail</p>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
