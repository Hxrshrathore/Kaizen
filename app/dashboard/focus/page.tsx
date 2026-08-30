'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Coffee, Zap, Wind } from 'lucide-react';

export default function FocusPage() {
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [sessions, setSessions] = useState(0);

  const totalTime = mode === 'focus' ? 25 * 60 : 5 * 60;
  // Calculate percentage for SVG stroke
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  
  // Responsive SVG calculations
  // ViewBox: 0 0 300 300. Center: 150, 150. Radius: 120.
  const radius = 120;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (mode === 'focus') {
        setSessions((s) => s + 1);
        setMode('break');
        setTimeLeft(5 * 60);
      } else {
        setMode('focus');
        setTimeLeft(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto pt-6 md:pt-12 px-4 pb-20 flex flex-col items-center min-h-full">
      
      {/* Header */}
      <div className="text-center mb-8 md:mb-12">
        <h2 className="text-3xl md:text-4xl font-display font-medium mb-2 text-foreground">
          FOCUS <span className="text-primary">KAIZEN</span>
        </h2>
        <p className="text-muted-foreground text-sm md:text-base">
          Synchronize your cognitive rhythm. Prevent burnout.
        </p>
      </div>

      {/* Timer Circle Container */}
      <div className="relative w-full max-w-[280px] md:max-w-[320px] aspect-square flex items-center justify-center mb-10 md:mb-12">
        
        {/* Breathing Animation Background */}
        <AnimatePresence>
          {isActive && mode === 'focus' && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [1, 1.15, 1], opacity: 0.15 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-4 bg-primary rounded-full blur-2xl z-0"
            />
          )}
        </AnimatePresence>

        {/* Circular Progress SVG */}
        <svg className="w-full h-full transform -rotate-90 z-10" viewBox="0 0 300 300">
          {/* Track Circle */}
          <circle
            cx="150" cy="150" r={radius}
            stroke="#1a1a1a"
            strokeWidth="8"
            fill="transparent"
          />
          {/* Progress Circle (Animated) */}
          <motion.circle
            cx="150" cy="150" r={radius}
            stroke={mode === 'focus' ? '#ccff00' : '#00ccff'}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (circumference * progress) / 100}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (circumference * progress) / 100 }}
            transition={{ duration: 0.5 }} // Smooth out the 1-second tick jumps
          />
        </svg>

        {/* Timer Text Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <motion.div 
            key={mode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-2"
          >
            {mode === 'focus' ? <Zap size={16} className="text-primary"/> : <Coffee size={16} className="text-[#00ccff]" />}
            <span className={`text-xs uppercase tracking-widest ${mode === 'focus' ? 'text-primary' : 'text-[#00ccff]'}`}>
              {mode === 'focus' ? 'Deep Work' : 'Neural Recovery'}
            </span>
          </motion.div>
          
          <div className="text-5xl md:text-6xl font-display font-bold text-foreground tracking-tighter">
            {formatTime(timeLeft)}
          </div>
          
          <AnimatePresence>
            {isActive && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-muted-foreground text-xs font-mono mt-3 uppercase tracking-widest text-center px-4"
              >
                {mode === 'focus' ? 'Breathe In... Breathe Out...' : 'Relax...'}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-6 mb-10">
        <motion.button 
          onClick={toggleTimer}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-lg ${
            isActive 
              ? 'bg-accent text-foreground border border-input' 
              : 'bg-primary text-black border border-primary hover:bg-[#b3e600]'
          }`}
        >
          {isActive ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
        </motion.button>
        
        <motion.button 
          onClick={resetTimer}
          whileHover={{ scale: 1.05, borderColor: "#444", color: "#fff" }}
          whileTap={{ scale: 0.95 }}
          className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground transition-colors shadow-lg"
        >
          <RotateCcw size={20} />
        </motion.button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm px-2">
        <div className="p-4 bg-card border border-border text-center rounded-sm">
          <div className="text-2xl font-display text-foreground mb-1">{sessions}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Sessions</div>
        </div>
        <div className="p-4 bg-card border border-border text-center rounded-sm">
          <div className="text-2xl font-display text-foreground mb-1">{sessions * 25}m</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Total Time</div>
        </div>
      </div>

      {/* Tip */}
      <div className="mt-8 flex items-center gap-2 text-muted-foreground text-xs text-center px-4 max-w-md">
        <Wind size={14} className="shrink-0" />
        <span>Tip: Sync your breathing with the pulsing ring to lower cortisol.</span>
      </div>

    </div>
  );
}