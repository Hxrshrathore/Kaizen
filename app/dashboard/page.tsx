'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Upload, Activity, ArrowUpRight, ShieldAlert, CheckCircle, 
  AlertTriangle, Calendar, Clock, Plus, Trash2, X, Sparkles, ChevronRight, Lock, Loader2, BookOpen, Mail
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

const StatsCard = ({ title, value, subtext, color }: any) => (
  <div className="p-6 bg-card border border-border flex flex-col justify-between h-auto min-h-[110px] hover:border-input transition-colors duration-300">
     <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium font-display mb-1">{title}</h3>
     <div className={`text-4xl font-display font-medium ${color} tracking-tight`}>{value}</div>
     <div className="text-xs text-muted-foreground font-mono mt-4">{subtext}</div>
  </div>
);

const ActionButton = ({ icon, title, desc, onClick }: any) => (
  <motion.button 
    onClick={onClick}
    initial="initial"
    whileHover="hovered"
    whileTap="tapped"
    variants={{
      initial: { backgroundColor: "#0e0e11", borderColor: "#222", scale: 1 },
      hovered: { backgroundColor: "#151518", borderColor: "#ccff00", scale: 1.02 },
      tapped: { scale: 0.98 }
    }}
    transition={{ duration: 0.2 }}
    className="group flex flex-col items-start p-6 border transition-all text-left w-full relative overflow-hidden"
  >
    <motion.div 
      variants={{
        initial: { color: "#888" },
        hovered: { color: "#ccff00" }
      }}
      className="mb-4"
    >
      {icon}
    </motion.div>
    <h3 className="text-xl font-display font-bold text-foreground mb-1">{title}</h3>
    <p className="text-muted-foreground text-sm">{desc}</p>
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
       <div className="flex h-[80vh] items-center justify-center">
           <Loader2 className="text-primary animate-spin" size={40} />
       </div>
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
    if (promotion.status === 'PROMOTED') return <CheckCircle size={16} className="text-primary" />;
    if (promotion.status === 'PROBATION') return <AlertTriangle size={16} className="text-orange-500" />;
    return <ShieldAlert size={16} className="text-red-500" />;
  };

  return (
    <div className="max-w-7xl mx-auto pt-4 md:pt-8 pb-20 px-4">
      
      {/* Header */}
      <div className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl md:text-6xl font-display font-medium mb-2 text-foreground">
            ACADEMIC <span className="text-primary">KAIZEN</span>
          </h1>
          <p className="text-muted-foreground font-mono text-xs md:text-sm">
            WELCOME BACK, {profile.name.toUpperCase()}
          </p>
        </div>
        <div className="text-right hidden md:block">
           <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">SESSION ID</div>
           <div className="text-xl font-display text-foreground">{profile.rollNumber || 'GUEST'}</div>
        </div>
      </div>

      {/* Top Grid: Timetable + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 md:mb-12">
        
        {/* --- LIVE SCHEDULE WIDGET --- */}
        <div className="lg:col-span-2 relative h-full min-h-[300px] bg-card border border-border p-6 overflow-hidden flex flex-col group">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <h3 className="text-xl font-display font-bold text-foreground uppercase tracking-wider">{displaySchedule.title}</h3>
                    {displaySchedule.showNoClassTag && (
                      <span className="text-[10px] bg-white/10 text-muted-foreground px-2 py-0.5 rounded-sm uppercase tracking-widest font-mono">
                        No Class Today
                      </span>
                    )}
                </div>
                {displaySchedule.badge && (
                  <span className="text-primary text-xs font-mono border border-primary/30 bg-primary/10 px-2 py-1 rounded-sm">
                      {displaySchedule.badge}
                  </span>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
               {displaySchedule.classes.length > 0 ? (
                  displaySchedule.classes.map((cls: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-[#151518] border border-input rounded-sm hover:border-primary/50 transition-colors">
                      <div>
                        <h4 className="text-foreground font-medium text-sm">{cls.subject}</h4>
                        <div className="text-xs text-muted-foreground font-mono mt-1">{cls.faculty} • <span className="text-[#aaa]">{cls.room}</span></div>
                      </div>
                      <div className="text-primary font-mono text-xs text-right shrink-0 bg-card px-2 py-1 border border-input rounded-sm">
                        {cls.startTime} -<br/> {cls.endTime}
                      </div>
                    </div>
                  ))
               ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-70">
                    <CheckCircle className="text-muted-foreground mb-3" size={32} />
                    <p className="text-muted-foreground text-sm">No classes scheduled for this week.</p>
                  </div>
               )}
            </div>
        </div>

        {/* Stats Column */}
        <div className="space-y-4 lg:col-span-1 flex flex-col h-full">
           <StatsCard 
             title="Current CGPA" 
             value={profile.currentCGPA.toFixed(2)} 
             subtext="Updated via SGR Upload"
             color="text-foreground"
           />
           <StatsCard 
             title="Total Credits" 
             value={profile.totalCredits} 
             subtext={`Semesters Logged: ${profile.semestersLogged}`}
             color="text-primary"
           />
           
           {/* Promotion Status Card */}
           <MotionDiv 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
             whileHover={{ y: -2, borderColor: "#333" }}
             className="relative p-6 bg-card border border-border overflow-hidden flex-1 flex flex-col justify-center min-h-[180px]"
           >
              <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium mb-2 font-display">ACADEMIC STANDING</h3>
              <div className="flex items-end gap-2">
                <span className={`text-3xl font-bold font-display tracking-tight ${getPromotionColor()}`}>
                  {promotion.status}
                </span>
              </div>
              <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground font-mono leading-relaxed">
                {getPromotionIcon()}
                {promotion.details}
              </div>
              <MotionDiv 
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                className={`absolute bottom-0 left-0 h-1 w-full origin-left ${
                  promotion.status === 'PROMOTED' ? 'bg-primary' : 
                  promotion.status === 'PROBATION' ? 'bg-orange-500' : 'bg-red-500'
                }`} 
              />
           </MotionDiv>
        </div>
      </div>

      {/* Upcoming Events Section */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium font-display flex items-center gap-2">
            <Calendar size={14} className="text-primary" /> Upcoming Events
          </h3>
          <button 
            onClick={() => setIsAddingEvent(!isAddingEvent)}
            className={`text-xs uppercase tracking-wider font-bold px-3 py-1 border transition-all flex items-center gap-2 ${isAddingEvent ? 'bg-muted border-input text-muted-foreground' : 'bg-primary border-primary text-black hover:bg-[#b3e600]'}`}
          >
            {isAddingEvent ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Add Event</>}
          </button>
        </div>

        {/* Add Event Form */}
        <AnimatePresence>
          {isAddingEvent && (
            <MotionDiv 
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              className="bg-card border border-border overflow-hidden"
            >
              <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Subject / Event Name</label>
                  <input 
                    type="text" 
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    placeholder="e.g. Data Structures Mid-Sem"
                    className="w-full bg-[#050507] border border-input p-2 text-foreground text-sm focus:border-primary outline-none transition-colors"
                  />
                </div>
                <div>
                   <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Date</label>
                   <input 
                    type="date" 
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                    className="w-full bg-[#050507] border border-input p-2 text-foreground text-sm focus:border-primary outline-none transition-colors"
                  />
                </div>
                <div>
                   <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Time</label>
                   <div className="flex gap-2">
                      <input 
                        type="time" 
                        value={newEvent.time}
                        onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                        className="w-full bg-[#050507] border border-input p-2 text-foreground text-sm focus:border-primary outline-none transition-colors"
                      />
                      <button 
                        onClick={handleSubmitEvent}
                        className="bg-primary text-black px-4 flex items-center justify-center hover:bg-[#b3e600] transition-colors"
                      >
                        <CheckCircle size={18} />
                      </button>
                   </div>
                </div>
              </div>
            </MotionDiv>
          )}
        </AnimatePresence>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.length > 0 ? (
            events.map((event, idx) => {
              const dateObj = new Date(event.date);
              const day = dateObj.getDate();
              const month = dateObj.toLocaleString('default', { month: 'short' });
              
              return (
                <MotionDiv
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -2, borderColor: "#444" }}
                  className="flex items-center gap-4 p-4 bg-card border border-border group transition-all relative"
                >
                   {/* Delete Button */}
                   <button 
                     onClick={() => handleRemoveEvent(event.id)}
                     className="absolute top-2 right-2 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                   >
                     <Trash2 size={14} />
                   </button>

                   <div className="bg-accent border border-input w-14 h-14 flex flex-col items-center justify-center shrink-0">
                      <span className="text-primary text-sm font-bold leading-none">{day}</span>
                      <span className="text-muted-foreground text-[10px] uppercase font-mono">{month}</span>
                   </div>
                   
                   <div>
                     <h4 className="text-sm font-medium text-foreground line-clamp-1">{event.title}</h4>
                     <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 font-mono">
                       <Clock size={10} /> {event.time}
                       <span className="w-1 h-1 bg-[#444] rounded-full" />
                       <span className="capitalize">{event.type}</span>
                     </div>
                   </div>
                </MotionDiv>
              );
            })
          ) : (
             <div className="col-span-full border border-dashed border-border p-8 text-center text-muted-foreground text-sm bg-muted">
               No upcoming events planned. Click "Add Event" to schedule exams.
             </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium mb-6 font-display">OPERATIONAL MODULES</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12">
        <ActionButton 
          icon={<Upload size={20} />} 
          title="Ingest Grades" 
          desc="Upload Semester PDFs" 
          onClick={() => router.push('/dashboard/upload')} 
        />
        <ActionButton 
          icon={<ArrowUpRight size={20} />} 
          title="Optimizer" 
          desc="Generate Improvement Plan" 
          onClick={() => router.push('/dashboard/improvement')} 
        />
        <ActionButton 
          icon={<Activity size={20} />} 
          title="Cognitive Check" 
          desc="Log Daily Wellness" 
          onClick={() => router.push('/dashboard/checkin')} 
        />
        <ActionButton 
          icon={<BookOpen size={20} />} 
          title="Google Classroom" 
          desc="View Courses & Handouts" 
          onClick={() => router.push('/classroom')} 
        />
        <ActionButton 
          icon={<Mail size={20} />} 
          title="Attendance Sync" 
          desc="Fetch University Emails" 
          onClick={() => router.push('/attendance')} 
        />
      </div>

      {/* System Status / AI Teaser */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-card border border-border">
           <div className="flex items-center gap-2 mb-4 text-green-500 font-mono text-xs uppercase">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
             System Status
           </div>
           <p className="text-muted-foreground text-sm">Academic database integrity verified. Last sync: Today, {new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}.</p>
        </div>
        
        {/* Updated AI Teaser Card */}
        <div className="relative p-6 bg-card border border-border overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none" />
           
           <div className="flex justify-between items-start mb-4">
             <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase">
               <Sparkles size={12} />
               Kaizen Advisor Lite
             </div>
             <span className="text-[10px] bg-primary text-black px-2 py-0.5 font-bold uppercase tracking-wider rounded-sm">
               Preview
             </span>
           </div>
           
           <p className="text-muted-foreground text-sm mb-4">
             Context-aware chat is now active. <span className="text-foreground">Predictive features remain locked</span> until Phase 2.
           </p>

           <button 
             onClick={() => router.push('/dashboard/advisor')} 
             className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-widest hover:text-primary transition-colors"
           >
             Launch Advisor <ChevronRight size={14} />
           </button>
        </div>
      </div>
    </div>
  );
}