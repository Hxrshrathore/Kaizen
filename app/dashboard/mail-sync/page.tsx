'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Sparkles, RefreshCw, Search, CheckCircle2, AlertCircle, 
  Clock, Calendar, Star, ArrowUpRight, Check, ExternalLink, 
  Inbox, Layers, ShieldCheck, Tag, Loader2, Copy, Bookmark, ChevronRight
} from 'lucide-react';
import { AcademicEmail } from '@/lib/mail-service';

const MotionDiv = motion.div as any;

const CATEGORY_TABS = [
  { id: 'ALL', label: 'All Messages', icon: Inbox },
  { id: 'DEADLINE', label: 'Deadlines', icon: AlertCircle, color: 'text-red-400' },
  { id: 'CLASSROOM', label: 'Classroom', icon: Layers, color: 'text-cyan-400' },
  { id: 'EXAM', label: 'Exams & SGR', icon: ShieldCheck, color: 'text-amber-400' },
  { id: 'CAREER', label: 'Placements', icon: Tag, color: 'text-emerald-400' },
  { id: 'GENERAL', label: 'Notices', icon: Mail, color: 'text-blue-400' },
];

const URGENCY_STYLES: Record<string, { badge: string; border: string }> = {
  HIGH: {
    badge: 'bg-red-500/10 text-red-400 border-red-500/30',
    border: 'border-l-red-500'
  },
  MEDIUM: {
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    border: 'border-l-amber-500'
  },
  LOW: {
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    border: 'border-l-blue-500'
  }
};

export default function MailSyncPage() {
  const [emails, setEmails] = useState<AcademicEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Status Metadata
  const [isLiveGoogle, setIsLiveGoogle] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({
    unreadCount: 0,
    urgentCount: 0,
    deadlinesCount: 0,
    classroomCount: 0
  });

  // Action feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch Emails
  const fetchInbox = async (forceRefresh = false) => {
    try {
      if (forceRefresh) setIsSyncing(true);
      else setLoading(true);

      const url = `/api/mail/sync${forceRefresh ? '?refresh=true' : ''}`;
      const res = await fetch(url, {
        method: forceRefresh ? 'POST' : 'GET'
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to fetch mailbox');

      setEmails(data.emails || []);
      setIsLiveGoogle(data.isLiveGoogle);
      setUserEmail(data.userEmail || '');
      setLastSyncedAt(data.lastSyncedAt || new Date().toISOString());

      if (data.metrics) {
        setMetrics(data.metrics);
      } else {
        const unread = (data.emails || []).filter((e: any) => !e.isRead).length;
        const urgent = (data.emails || []).filter((e: any) => e.urgency === 'HIGH').length;
        const deadlines = (data.emails || []).filter((e: any) => e.category === 'DEADLINE').length;
        const classroom = (data.emails || []).filter((e: any) => e.category === 'CLASSROOM').length;
        setMetrics({ unreadCount: unread, urgentCount: urgent, deadlinesCount: deadlines, classroomCount: classroom });
      }

      // Default select the first email
      if ((data.emails || []).length > 0 && !selectedEmailId) {
        setSelectedEmailId(data.emails[0].id);
      }

      if (forceRefresh) {
        showToast(data.message || 'Inbox synchronized with Google Gmail API!');
      }
    } catch (err: any) {
      console.error('Mail Sync Error:', err);
      showToast(err.message || 'Sync failed');
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  // Filtered List
  const filteredEmails = useMemo(() => {
    return emails.filter(email => {
      const matchCat = selectedCategory === 'ALL' || email.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || (
        email.subject.toLowerCase().includes(q) ||
        email.sender.name.toLowerCase().includes(q) ||
        email.snippet.toLowerCase().includes(q) ||
        (email.neuralSummary.relatedCourseCode && email.neuralSummary.relatedCourseCode.toLowerCase().includes(q))
      );
      return matchCat && matchSearch;
    });
  }, [emails, selectedCategory, searchQuery]);

  const selectedEmail = useMemo(() => {
    return emails.find(e => e.id === selectedEmailId) || filteredEmails[0] || null;
  }, [emails, selectedEmailId, filteredEmails]);

  // 2. Toggle Read / Starred
  const handleToggleRead = async (emailId: string, currentRead: boolean) => {
    setEmails(prev => prev.map(e => e.id === emailId ? { ...e, isRead: !currentRead } : e));
    try {
      await fetch('/api/mail/sync', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId, isRead: !currentRead })
      });
    } catch {}
  };

  const handleToggleStarred = async (emailId: string, currentStarred: boolean) => {
    setEmails(prev => prev.map(e => e.id === emailId ? { ...e, isStarred: !currentStarred } : e));
    try {
      await fetch('/api/mail/sync', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId, isStarred: !currentStarred })
      });
      showToast(!currentStarred ? 'Starred thread' : 'Removed star');
    } catch {}
  };

  const handleAddDeadlineEvent = (email: AcademicEmail) => {
    const deadline = email.neuralSummary.detectedDeadline;
    const title = `${email.neuralSummary.relatedCourseCode ? `[${email.neuralSummary.relatedCourseCode}] ` : ''}${email.subject}`;
    
    // Store in localStorage for Chrono-Sync
    try {
      const savedEvents = JSON.parse(localStorage.getItem('kaizen_chrono_events') || '[]');
      savedEvents.push({
        id: Date.now().toString(),
        title,
        date: deadline ? new Date(deadline).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        time: '23:59',
        type: 'assignment',
        source: 'Gmail Neural Inbox'
      });
      localStorage.setItem('kaizen_chrono_events', JSON.stringify(savedEvents));
    } catch {}

    showToast('Event synchronized to Chrono-Sync calendar!');
  };

  const handleCopySummary = (summaryText: string) => {
    navigator.clipboard.writeText(summaryText);
    showToast('Neural summary copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[75vh] items-center justify-center gap-3">
        <Loader2 className="text-primary animate-spin" size={38} />
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground animate-pulse">
          Connecting to Neural Inbox & Google Gmail API...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pt-6 pb-20 px-4 md:px-8">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 bg-card border border-primary/40 text-foreground px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 text-xs font-mono"
          >
            <Sparkles size={16} className="text-primary shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5">
              <Mail size={11} />
              Gmail &amp; Classroom Synchronizer
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {isLiveGoogle ? `Live Connected (${userEmail})` : 'KIIT Academic Feed Active'}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-foreground">
            NEURAL <span className="text-primary">INBOX</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Autonomous academic triage: automatically categorizes university notices, course deadlines, and exam schedules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchInbox(true)}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-black text-xs font-bold font-mono uppercase tracking-wider hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Syncing Gmail...' : 'Sync Inbox Now'}</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
        <div className="p-4 rounded-2xl bg-card border border-border/80">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Unread Alerts</div>
          <div className="text-3xl font-display font-bold text-primary">
            {metrics.unreadCount}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">Requires student action</div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/80">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Urgent Deadlines</div>
          <div className="text-3xl font-display font-bold text-red-400">
            {metrics.urgentCount}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">Due within 72 hours</div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/80">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Classroom Tasks</div>
          <div className="text-3xl font-display font-bold text-cyan-400">
            {metrics.classroomCount}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">Google Classroom stream</div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/80">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Monitored Inboxes</div>
          <div className="text-3xl font-display font-bold text-foreground">
            {emails.length}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">Synced academic threads</div>
        </div>
      </div>

      {/* Search & Category Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {CATEGORY_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all shrink-0 border ${
                  isActive 
                    ? 'bg-primary text-black border-primary font-bold shadow-sm'
                    : 'bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted/60'
                }`}
              >
                <Icon size={12} className={isActive ? 'text-black' : tab.color} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search notices, courses, exams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-card border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Main Two-Pane Inbox Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[680px]">
        
        {/* Left Pane: Email List (5 Cols) */}
        <div className="lg:col-span-5 bg-card border border-border rounded-2xl overflow-hidden flex flex-col shadow-sm">
          <div className="p-3.5 border-b border-border bg-muted/30 flex items-center justify-between text-xs font-mono text-muted-foreground">
            <span>{filteredEmails.length} Messages</span>
            <span>Synced: {new Date(lastSyncedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border/60 custom-scrollbar">
            {filteredEmails.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs font-mono">
                No academic messages match your search or filter.
              </div>
            ) : (
              filteredEmails.map(email => {
                const isSelected = selectedEmail?.id === email.id;
                const urgency = URGENCY_STYLES[email.urgency] || URGENCY_STYLES.LOW;

                return (
                  <div
                    key={email.id}
                    onClick={() => {
                      setSelectedEmailId(email.id);
                      if (!email.isRead) handleToggleRead(email.id, false);
                    }}
                    className={`p-3.5 cursor-pointer transition-all border-l-4 relative group ${urgency.border} ${
                      isSelected 
                        ? 'bg-primary/10 border-primary shadow-[inset_0_0_12px_rgba(var(--primary),0.05)]' 
                        : email.isRead 
                        ? 'bg-card/50 hover:bg-muted/40' 
                        : 'bg-card hover:bg-muted/50 font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {!email.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        )}
                        <span className="text-xs font-bold text-foreground truncate">
                          {email.sender.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStarred(email.id, Boolean(email.isStarred));
                          }}
                          className={`p-1 rounded hover:bg-muted transition-colors ${
                            email.isStarred ? 'text-amber-400' : 'text-muted-foreground/40 hover:text-muted-foreground'
                          }`}
                        >
                          <Star size={12} className={email.isStarred ? 'fill-amber-400' : ''} />
                        </button>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {email.date}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-xs font-semibold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                      {email.subject}
                    </h4>

                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mb-2">
                      {email.snippet}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border uppercase tracking-wider ${urgency.badge}`}>
                        {email.category}
                      </span>
                      {email.neuralSummary.relatedCourseCode && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-muted text-primary border border-primary/20">
                          {email.neuralSummary.relatedCourseCode}
                        </span>
                      )}
                      {email.neuralSummary.detectedDeadline && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono text-red-400 bg-red-500/10 border border-red-500/20 flex items-center gap-1">
                          <Clock size={9} />
                          <span>Deadline</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Email Detail & Neural Brief (7 Cols) */}
        <div className="lg:col-span-7 bg-card border border-border rounded-2xl overflow-hidden flex flex-col shadow-sm">
          {selectedEmail ? (
            <div className="flex flex-col h-full overflow-hidden">
              
              {/* Email Detail Top Bar */}
              <div className="p-5 border-b border-border bg-muted/20 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-display font-bold text-foreground leading-snug">
                    {selectedEmail.subject}
                  </h2>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleToggleStarred(selectedEmail.id, Boolean(selectedEmail.isStarred))}
                      className={`p-2 rounded-lg border border-border transition-colors ${
                        selectedEmail.isStarred ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 'text-muted-foreground hover:text-foreground'
                      }`}
                      title="Star Thread"
                    >
                      <Star size={14} className={selectedEmail.isStarred ? 'fill-amber-400' : ''} />
                    </button>
                    <button
                      onClick={() => handleToggleRead(selectedEmail.id, selectedEmail.isRead)}
                      className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors text-xs font-mono"
                      title={selectedEmail.isRead ? 'Mark as Unread' : 'Mark as Read'}
                    >
                      <Check size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-muted-foreground pt-1 border-t border-border/40">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary">
                      {selectedEmail.sender.name.charAt(0)}
                    </div>
                    <span className="text-foreground font-semibold">{selectedEmail.sender.name}</span>
                    <span className="text-muted-foreground/70 text-[11px]">&lt;{selectedEmail.sender.email}&gt;</span>
                  </div>
                  <span>{selectedEmail.date}</span>
                </div>
              </div>

              {/* Scrollable Content Container */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
                
                {/* ── KAIZEN NEURAL BRIEFING CARD ── */}
                <div className="p-4 rounded-xl bg-primary/5 border-2 border-primary/30 relative overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles size={15} className="text-primary animate-pulse" />
                      <span className="text-xs font-mono font-bold tracking-wider uppercase text-primary">
                        Kaizen Neural Executive Brief
                      </span>
                    </div>
                    {selectedEmail.neuralSummary.relatedCourseCode && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30">
                        {selectedEmail.neuralSummary.relatedCourseCode}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-foreground/90 leading-relaxed mb-3 font-sans">
                    {selectedEmail.neuralSummary.takeaway}
                  </p>

                  {/* Detected Deadline Action Button */}
                  {selectedEmail.neuralSummary.detectedDeadline && (
                    <div className="mb-3 p-2.5 bg-background/80 border border-red-500/30 rounded-lg flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-mono text-red-400">
                        <Clock size={14} className="shrink-0" />
                        <span>Deadline: <strong>{new Date(selectedEmail.neuralSummary.detectedDeadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong></span>
                      </div>
                      <button
                        onClick={() => handleAddDeadlineEvent(selectedEmail)}
                        className="px-2.5 py-1 bg-red-500 text-white rounded text-[10px] font-mono font-bold uppercase tracking-wider hover:bg-red-600 transition-colors flex items-center gap-1 shadow-sm"
                      >
                        <Calendar size={11} />
                        <span>Add to Chrono-Sync</span>
                      </button>
                    </div>
                  )}

                  {/* Action Items List */}
                  {selectedEmail.neuralSummary.actionItems.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase font-mono text-muted-foreground mb-1.5 tracking-wider">
                        Extracted Action Items
                      </div>
                      <div className="space-y-1.5">
                        {selectedEmail.neuralSummary.actionItems.map((item, idx) => {
                          const taskId = `${selectedEmail.id}-task-${idx}`;
                          const isDone = completedTasks[taskId] || false;
                          return (
                            <label
                              key={idx}
                              className={`flex items-start gap-2 p-2 rounded-lg bg-card/80 border border-border/60 text-xs cursor-pointer transition-colors ${
                                isDone ? 'line-through text-muted-foreground/60' : 'text-foreground'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isDone}
                                onChange={() => setCompletedTasks({ ...completedTasks, [taskId]: !isDone })}
                                className="mt-0.5 rounded border-border text-primary focus:ring-primary"
                              />
                              <span className="flex-1 leading-snug">{item}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── FULL EMAIL BODY ── */}
                <div>
                  <div className="text-[10px] uppercase font-mono text-muted-foreground mb-2 tracking-wider">
                    Official Message Content
                  </div>
                  <div className="p-4 bg-muted/20 border border-border rounded-xl text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap font-sans">
                    {selectedEmail.body}
                  </div>
                </div>

              </div>

              {/* Bottom Action Footer */}
              <div className="p-3.5 border-t border-border bg-muted/20 flex flex-wrap items-center justify-between gap-2.5">
                <button
                  onClick={() => handleCopySummary(selectedEmail.neuralSummary.takeaway)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-mono text-muted-foreground hover:text-foreground transition-all"
                >
                  <Copy size={12} />
                  <span>Copy Neural Brief</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAddDeadlineEvent(selectedEmail)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 text-xs font-mono font-bold transition-all"
                  >
                    <Calendar size={12} />
                    <span>Sync with Calendar</span>
                  </button>

                  <a
                    href="https://mail.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-black text-xs font-mono font-bold hover:bg-primary/90 transition-all shadow-sm"
                  >
                    <span>Open in Gmail</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground">
              <Mail size={36} className="text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium">Select a message to view the Kaizen Neural Brief.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
