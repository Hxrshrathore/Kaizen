'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Smile, Frown, Battery, Zap, Loader2 } from 'lucide-react';

// --- ANIMATION WRAPPER ---
const MotionDiv = motion.div as any;

export default function CheckInPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [stress, setStress] = useState(3);
  const [focus, setFocus] = useState(3);
  const [energy, setEnergy] = useState(3);

  const handleSubmit = () => {
    setIsSyncing(true);
    // Simulate syncing delay
    setTimeout(() => {
      setSubmitted(true);
      setIsSyncing(false);
    }, 1200);
  };

  if (submitted) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center">
        <MotionDiv 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(204,255,0,0.3)]"
        >
          <Zap className="text-black" size={32} />
        </MotionDiv>
        <h2 className="text-2xl font-display font-medium text-foreground mb-2">DATA LOGGED</h2>
        <p className="text-muted-foreground max-w-sm text-sm">
          Your cognitive state has been recorded. This data helps refine your personal baseline in the <span className="text-muted-foreground">Minor Project</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pt-8 pb-20">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-display font-medium mb-2 text-foreground">
          DAILY <span className="text-primary">SYNC</span>
        </h2>
        <p className="text-muted-foreground">Calibrate your cognitive baseline.</p>
      </div>

      <div className="space-y-12">
        <SliderInput 
          label="Stress Levels" 
          value={stress} 
          onChange={setStress} 
          minIcon={<Smile size={18} />} 
          maxIcon={<Frown size={18} />} 
          disabled={isSyncing}
        />
        <SliderInput 
          label="Focus Clarity" 
          value={focus} 
          onChange={setFocus} 
          minIcon={<Battery size={18} className="rotate-90" />} 
          maxIcon={<Zap size={18} />} 
          disabled={isSyncing}
        />
        <SliderInput 
          label="Energy Reserve" 
          value={energy} 
          onChange={setEnergy} 
          minIcon={<Battery size={18} />} 
          maxIcon={<Zap size={18} />} 
          disabled={isSyncing}
        />

        <div className="pt-8">
           <motion.button 
             onClick={handleSubmit}
             disabled={isSyncing}
             whileHover={{ scale: 1.02, backgroundColor: "#b3e600" }}
             whileTap={{ scale: 0.98 }}
             className="w-full py-4 bg-primary text-black font-bold font-display uppercase tracking-widest transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
           >
             {isSyncing ? (
               <>
                 <Loader2 size={16} className="animate-spin" /> Syncing Neural Baseline...
               </>
             ) : (
               "Sync Data"
             )}
           </motion.button>
           <p className="text-center text-[10px] text-muted-foreground mt-4 uppercase tracking-widest">
             Data is stored locally. No analysis performed.
           </p>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENT ---
const SliderInput: React.FC<{ 
  label: string, 
  value: number, 
  onChange: (v: number) => void,
  minIcon: React.ReactNode,
  maxIcon: React.ReactNode,
  disabled: boolean
}> = ({ label, value, onChange, minIcon, maxIcon, disabled }) => (
  <div className={disabled ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
    <div className="flex justify-between mb-4">
      <label className="text-sm font-medium text-foreground uppercase tracking-wider">{label}</label>
      <span className="font-mono text-primary">{value}/5</span>
    </div>
    <div className="flex items-center gap-4">
      <div className="text-muted-foreground">{minIcon}</div>
      <input 
        type="range" 
        min="1" max="5" step="1" 
        value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-[#ccff00] outline-none focus:ring-1 focus:ring-[#ccff00]/50"
        disabled={disabled}
      />
      <div className="text-muted-foreground">{maxIcon}</div>
    </div>
  </div>
);