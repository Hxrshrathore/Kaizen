'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Upload, Activity, ArrowUpRight, ShieldAlert, CheckCircle, 
  AlertTriangle, Calendar, Clock, Plus, Trash2, X, Sparkles, ChevronRight, Lock, Loader2, BookOpen, Mail, FileText
} from 'lucide-react';

// --- TYPES ---
interface UserProfile {
  name: string;
  email: string;
  rollNumber: string;
  section: string;
  currentCGPA: number;
  totalCredits: number;
  semestersLogged: number;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: string;
}

// --- ANIMATION WRAPPERS ---
const MotionDiv = motion.div as any;

// --- SUB-COMPONENTS ---

const StatsCard = ({ title, value, subtext, color, delay = 0 }: any) => (
  <MotionDiv 
    initial={{ opacity: 0, scale: 0.95, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ duration: 0.5, delay, type: "spring", bounce: 0.4 }}
    whileHover={{ y: -4, borderColor: "#444", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.8)" }}
    className="relative p-6 bg-card border border-border flex flex-col justify-between h-auto min-h-[110px] transition-all duration-300 overflow-hidden group cursor-default"
  >
     <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
     <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium font-display mb-1 relative z-10">{title}</h3>
     <div className={`text-4xl font-display font-medium ${color} tracking-tight relative z-10 group-hover:scale-105 transition-transform origin-left`}>{value}</div>
     <div className="text-xs text-muted-foreground font-mono mt-4 relative z-10">{subtext}</div>
  </MotionDiv>
);

const ActionButton = ({ icon, title, desc, onClick, delay = 0 }: any) => (
  <motion.button 
    onClick={onClick}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, type: "spring" }}
    whileHover="hovered"
    whileTap="tapped"
    variants={{
      initial: { backgroundColor: "var(--card)", borderColor: "var(--border)", scale: 1 },
      hovered: { backgroundColor: "var(--accent)", borderColor: "var(--primary)", scale: 1.02, boxShadow: "0 10px 30px -10px rgba(var(--primary),0.15)" },
      tapped: { scale: 0.98 }
    }}
    className="group flex flex-col items-start p-6 bg-card border border-border transition-all text-left w-full relative overflow-hidden"
  >
    <div className="absolute -inset-24 bg-primary/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-full" />
    <motion.div 
      variants={{
        initial: { color: "var(--muted-foreground)", scale: 1 },
        hovered: { color: "var(--primary)", scale: 1.1 }
      }}
      className="mb-4 relative z-10"
    >
      {icon}
    </motion.div>
    <h3 className="text-xl font-display font-bold text-foreground mb-1 relative z-10 group-hover:text-white transition-colors">{title}</h3>
    <p className="text-muted-foreground text-sm relative z-10">{desc}</p>
  </motion.button>
);

// --- MAIN PAGE COMPONENT ---

export default function Dashboard() {
  const router = useRouter();
  
  // State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<any[]>([]); // Linked to schedule route
  
  // Local Event State (Can be connected to DB later)
  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: '1', title: 'Data Structures End Sem', date: '2026-04-15', time: '10:00', type: 'exam' },
    { id: '2', title: 'Minor Project Review', date: '2026-04-20', time: '14:30', type: 'submission' }
  ]);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '' });

  // --- 1. FETCH REAL DATA ---
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          
          try {
            const schedRes = await fetch('/api/schedule');
            if (schedRes.ok) {
              const schedData = await schedRes.json();
              setSchedule(schedData.schedule || []);
            }
          } catch (e) {
            console.error("Failed to load schedule", e);
          }
        } else {
          // If 401 Unauthorized, redirect
          router.push('/login');
        }
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  // --- LOGIC ---

  const checkPromotionEligibility = (cgpa: number) => {
    if (cgpa >= 6.0) return { status: 'PROMOTED', details: 'Eligible for next academic year.' };
    if (cgpa >= 5.0) return { status: 'PROBATION', details: 'Warning: Low CGPA detected.' };
    return { status: 'CRITICAL', details: 'Immediate intervention required.' };
  };

  const handleSubmitEvent = () => {
    if (newEvent.title && newEvent.date) {
      setEvents(prev => [...prev, {
        id: Date.now().toString(),
        title: newEvent.title,
        date: newEvent.date,
        time: newEvent.time || '00:00',
        type: 'exam'
      }].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      setNewEvent({ title: '', date: '', time: '' });
      setIsAddingEvent(false);
    }
  };

  const handleRemoveEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const displaySchedule = React.useMemo(() => {
    if (!schedule || schedule.length === 0) return { classes: [], title: "LIVE SCHEDULE", badge: "", showNoClassTag: false };

    const daysShort = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const daysLong = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const todayIdx = new Date().getDay();
    
    // Check today
    let todayClasses = schedule.filter(s => s.day === daysShort[todayIdx]);
    
    if (todayClasses.length > 0) {
      return { 
        classes: todayClasses, 
        title: "LIVE SCHEDULE", 
        badge: daysLong[todayIdx], 
        showNoClassTag: false 
      };
    }

    // Find next day with classes
    for (let offset = 1; offset <= 7; offset++) {
      const nextDayIdx = (todayIdx + offset) % 7;
      const nextClasses = schedule.filter(s => s.day === daysShort[nextDayIdx]);
      if (nextClasses.length > 0) {
        return { 
          classes: nextClasses, 
          title: offset === 1 ? "TOMORROW'S CLASSES" : "UPCOMING SCHEDULE", 
          badge: daysLong[nextDayIdx], 
          showNoClassTag: true 
        };
      }
    }

    return { classes: [], title: "LIVE SCHEDULE", badge: "", showNoClassTag: false };
  }, [schedule]);

  // --- RENDERING ---

  if (loading) {
    return (
       <MotionDiv 
         initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
         className="flex h-[80vh] items-center justify-center"
       >
           <Loader2 className="text-primary animate-spin" size={40} />
       </MotionDiv>
    );
  }

  // Fallback if data failed (shouldn't happen due to redirect)
  if (!profile) return null;

  const promotion = checkPromotionEligibility(profile.currentCGPA);

  const getPromotionColor = () => {
    if (promotion.status === 'PROMOTED') return 'text-primary';
    if (promotion.status === 'PROBATION') return 'text-orange-500';
    return 'text-red-500';
  };

  const getPromotionIcon = () => {
    if (promotion.status === 'PROMOTED') return <CheckCircle size={16} className="text-primary animate-pulse" />;
    if (promotion.status === 'PROBATION') return <AlertTriangle size={16} className="text-orange-500 animate-pulse" />;
    return <ShieldAlert size={16} className="text-red-500 animate-pulse" />;
  };

  return (
    <div className="max-w-7xl mx-auto pt-4 md:pt-8 pb-20 px-4">
      
      {/* Header */}
      <MotionDiv 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between md:items-end gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-6xl font-display font-medium mb-2 text-foreground tracking-tight">
            ACADEMIC <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-300">KAIZEN</span>
          </h1>
          <MotionDiv 
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className="text-muted-foreground font-mono text-xs md:text-sm"
          >
            WELCOME BACK, <span className="text-foreground">{profile.name.toUpperCase()}</span>
          </MotionDiv>
        </div>
        <div className="text-right hidden md:flex flex-col items-end gap-2">
           <div>
             <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mb-1 text-right">SESSION ID</div>
             <div className="text-xl font-display text-foreground bg-muted px-4 py-1 rounded border border-border">{profile.rollNumber || 'GUEST'}</div>
           </div>
        </div>
      </MotionDiv>

      {/* Top Grid: Timetable + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 md:mb-12">
        
        {/* --- LIVE SCHEDULE WIDGET --- */}
        <MotionDiv 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
          className="lg:col-span-2 relative h-full min-h-[300px] bg-card border border-border p-6 overflow-hidden flex flex-col group hover:border-[#333] transition-colors duration-500 shadow-2xl"
        >
            <div className="absolute -inset-32 bg-primary/5 blur-[100px] rounded-full pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
            
            <div className="flex justify-between items-center mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <h3 className="text-xl font-display font-bold text-foreground uppercase tracking-wider">{displaySchedule.title}</h3>
                    {displaySchedule.showNoClassTag && (
                      <span className="text-[10px] bg-white/10 text-muted-foreground px-2 py-0.5 rounded-sm uppercase tracking-widest font-mono">
                        No Class Today
                      </span>
                    )}
                </div>
                {displaySchedule.badge && (
                  <span className="text-primary text-xs font-mono border border-primary/30 bg-primary/10 px-3 py-1 rounded shadow-[0_0_15px_rgba(204,255,0,0.2)]">
                      {displaySchedule.badge}
                  </span>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 relative z-10">
               {displaySchedule.classes.length > 0 ? (
                  displaySchedule.classes.map((cls: any, idx: number) => (
                    <MotionDiv 
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + (idx * 0.1), duration: 0.4 }}
                      whileHover={{ scale: 1.01, backgroundColor: "var(--accent)" }}
                      className="flex items-center justify-between p-4 bg-muted border border-input rounded-sm hover:border-primary/50 transition-all cursor-default relative overflow-hidden group/item"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover/item:scale-y-100 transition-transform origin-top" />
                      <div className="pl-2">
                        <h4 className="text-foreground font-medium text-sm group-hover/item:text-primary transition-colors">{cls.subject}</h4>
                        <div className="text-xs text-muted-foreground font-mono mt-1">{cls.faculty} • <span className="opacity-70">{cls.room}</span></div>
                      </div>
                      <div className="text-primary font-mono text-xs text-right shrink-0 bg-card px-3 py-1.5 border border-input rounded shadow-inner">
                        {cls.startTime} -<br/> {cls.endTime}
                      </div>
                    </MotionDiv>
                  ))
               ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-70">
                    <CheckCircle className="text-muted-foreground mb-3" size={32} />
                    <p className="text-muted-foreground text-sm">No classes scheduled for this week.</p>
                  </div>
               )}
            </div>
        </MotionDiv>

        {/* Stats Column */}
        <div className="space-y-4 lg:col-span-1 flex flex-col h-full">
           <StatsCard 
             title="Current CGPA" 
             value={profile.currentCGPA.toFixed(2)} 
             subtext="Updated via SGR Upload"
             color="text-foreground"
             delay={0.1}
           />
           <StatsCard 
             title="Total Credits" 
             value={profile.totalCredits} 
             subtext={`Semesters Logged: ${profile.semestersLogged}`}
             color="text-primary"
             delay={0.2}
           />
           
           {/* Promotion Status Card */}
           <MotionDiv 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 0.5, delay: 0.3, type: "spring" }}
             whileHover={{ y: -4, borderColor: "#444", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.8)" }}
             className="relative p-6 bg-card border border-border overflow-hidden flex-1 flex flex-col justify-center min-h-[180px] group"
           >
              <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium mb-2 font-display relative z-10">ACADEMIC STANDING</h3>
              <div className="flex items-end gap-2 relative z-10">
                <span className={`text-3xl font-bold font-display tracking-tight ${getPromotionColor()} group-hover:scale-105 transition-transform origin-left`}>
                  {promotion.status}
                </span>
              </div>
              <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground font-mono leading-relaxed relative z-10">
                {getPromotionIcon()}
                {promotion.details}
              </div>
              <MotionDiv 
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 0.8, ease: "anticipate" }}
                className={`absolute bottom-0 left-0 h-1.5 w-full origin-left ${
                  promotion.status === 'PROMOTED' ? 'bg-primary shadow-[0_0_10px_rgba(204,255,0,0.5)]' : 
                  promotion.status === 'PROBATION' ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                }`} 
              />
           </MotionDiv>
        </div>
      </div>

      {/* Upcoming Events Section */}
      <MotionDiv 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-12"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium font-display flex items-center gap-2">
            <Calendar size={14} className="text-primary" /> Upcoming Events
          </h3>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddingEvent(!isAddingEvent)}
            className={`text-xs uppercase tracking-wider font-bold px-4 py-2 rounded-sm border transition-all flex items-center gap-2 shadow-lg ${isAddingEvent ? 'bg-muted border-input text-muted-foreground' : 'bg-primary border-primary text-black hover:bg-[#b3e600] hover:shadow-[0_0_15px_rgba(204,255,0,0.4)]'}`}
          >
            {isAddingEvent ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Add Event</>}
          </motion.button>
        </div>

        {/* Add Event Form */}
        <AnimatePresence>
          {isAddingEvent && (
            <MotionDiv 
              initial={{ height: 0, opacity: 0, marginBottom: 0, scale: 0.98 }}
              animate={{ height: 'auto', opacity: 1, marginBottom: 24, scale: 1 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0, scale: 0.98 }}
              transition={{ type: "spring", bounce: 0.3 }}
              className="bg-card border border-border overflow-hidden shadow-2xl"
            >
              <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Subject / Event Name</label>
                  <input 
                    type="text" 
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    placeholder="e.g. Data Structures Mid-Sem"
                    className="w-full bg-background border border-input p-2.5 text-foreground text-sm focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all"
                  />
                </div>
                <div>
                   <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Date</label>
                   <input 
                    type="date" 
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                    className="w-full bg-background border border-input p-2.5 text-foreground text-sm focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all"
                  />
                </div>
                <div>
                   <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Time</label>
                   <div className="flex gap-2">
                      <input 
                        type="time" 
                        value={newEvent.time}
                        onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                        className="w-full bg-background border border-input p-2.5 text-foreground text-sm focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all"
                      />
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSubmitEvent}
                        className="bg-primary text-primary-foreground px-5 rounded-sm flex items-center justify-center hover:opacity-90 transition-colors shadow-lg"
                      >
                        <CheckCircle size={18} />
                      </motion.button>
                   </div>
                </div>
              </div>
            </MotionDiv>
          )}
        </AnimatePresence>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {events.length > 0 ? (
              events.map((event, idx) => {
                const dateObj = new Date(event.date);
                const day = dateObj.getDate();
                const month = dateObj.toLocaleString('default', { month: 'short' });
                
                return (
                  <MotionDiv
                    key={event.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    transition={{ delay: idx * 0.05, type: "spring" }}
                    whileHover={{ y: -4, borderColor: "#555", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.7)" }}
                    className="flex items-center gap-4 p-4 bg-card border border-border group transition-all relative overflow-hidden"
                  >
                     <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                     
                     {/* Delete Button */}
                     <button 
                       onClick={() => handleRemoveEvent(event.id)}
                       className="absolute top-2 right-2 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 p-1 rounded backdrop-blur-sm"
                     >
                       <Trash2 size={14} />
                     </button>
  
                     <div className="bg-accent border border-input w-14 h-14 rounded-sm flex flex-col items-center justify-center shrink-0 group-hover:border-primary/50 transition-colors shadow-inner">
                        <span className="text-primary text-sm font-bold leading-none">{day}</span>
                        <span className="text-muted-foreground text-[10px] uppercase font-mono mt-0.5">{month}</span>
                     </div>
                     
                     <div className="relative z-10">
                       <h4 className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">{event.title}</h4>
                       <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 font-mono">
                         <Clock size={10} className="group-hover:text-primary transition-colors" /> {event.time}
                         <span className="w-1 h-1 bg-border rounded-full" />
                         <span className="capitalize">{event.type}</span>
                       </div>
                     </div>
                  </MotionDiv>
                );
              })
            ) : (
               <MotionDiv 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                 className="col-span-full border border-dashed border-border p-8 text-center text-muted-foreground text-sm bg-muted rounded-md"
               >
                 No upcoming events planned. Click "Add Event" to schedule exams.
               </MotionDiv>
            )}
          </AnimatePresence>
        </div>
      </MotionDiv>

      {/* Quick Actions */}
      <MotionDiv 
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
      >
        <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium mb-6 font-display">OPERATIONAL MODULES</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12">
          <ActionButton delay={0.1} icon={<Upload size={20} />} title="Ingest Grades" desc="Upload Semester PDFs" onClick={() => router.push('/dashboard/upload')} />
          <ActionButton delay={0.2} icon={<ArrowUpRight size={20} />} title="Optimizer" desc="Generate Improvement Plan" onClick={() => router.push('/dashboard/improvement')} />
          <ActionButton delay={0.3} icon={<Activity size={20} />} title="Cognitive Check" desc="Log Daily Wellness" onClick={() => router.push('/dashboard/checkin')} />
          <ActionButton delay={0.4} icon={<BookOpen size={20} />} title="Google Classroom" desc="View Courses & Handouts" onClick={() => router.push('/dashboard/classroom')} />
          <ActionButton delay={0.5} icon={<FileText size={20} />} title="Paper Generator" desc="AI Exam Synthesizer" onClick={() => router.push('/dashboard/generator')} />
          <ActionButton delay={0.6} icon={<Mail size={20} />} title="Attendance Sync" desc="Fetch University Emails" onClick={() => router.push('/attendance')} />
        </div>
      </MotionDiv>

      {/* System Status / AI Teaser */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MotionDiv 
          initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
          className="p-6 bg-card border border-border hover:border-[#333] transition-colors"
        >
           <div className="flex items-center gap-2 mb-4 text-green-500 font-mono text-xs uppercase">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
             <div className="w-2 h-2 bg-green-500 rounded-full absolute" />
             System Status
           </div>
           <p className="text-muted-foreground text-sm">Academic database integrity verified. Last sync: Today, {new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}.</p>
        </MotionDiv>
        
        {/* Updated AI Teaser Card */}
        <MotionDiv 
          initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
          className="relative p-6 bg-card border border-border overflow-hidden group hover:border-primary/30 transition-all duration-500"
        >
           <div className="absolute inset-0 bg-gradient-to-bl from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
           <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-bl-[100px] pointer-events-none group-hover:scale-110 transition-transform duration-700" />
           
           <div className="flex justify-between items-start mb-4 relative z-10">
             <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase font-bold tracking-wider">
               <Sparkles size={14} className="animate-pulse" />
               Kaizen Advisor Lite
             </div>
             <span className="text-[10px] bg-primary text-black px-2 py-0.5 font-bold uppercase tracking-wider rounded-sm shadow-[0_0_10px_rgba(204,255,0,0.3)]">
               Preview
             </span>
           </div>
           
           <p className="text-muted-foreground text-sm mb-4 relative z-10">
             Context-aware chat is now active. <span className="text-foreground font-medium">Predictive features remain locked</span> until Phase 2.
           </p>

           <motion.button 
             whileHover={{ x: 5 }}
             onClick={() => router.push('/dashboard/advisor')} 
             className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-widest hover:text-primary transition-colors relative z-10"
           >
             Launch Advisor <ChevronRight size={14} />
           </motion.button>
        </MotionDiv>
      </div>
    </div>
  );
}