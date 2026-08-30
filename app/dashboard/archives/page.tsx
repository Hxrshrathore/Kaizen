'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Sparkles, RotateCw, Layers, Loader2, Search } from 'lucide-react';

// --- TYPES ---
interface Flashcard {
  question: string;
  answer: string;
}

// --- ANIMATION WRAPPER ---
const MotionDiv = motion.div as any;

export default function ArchivesPage() {
  const [topic, setTopic] = useState('');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null);

  const generateCards = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    setCards([]);
    setFlippedIndex(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });

      if (!response.ok) throw new Error('Generation failed');

      const data = await response.json();
      if (data.cards) {
        setCards(data.cards);
      }
    } catch (error) {
      console.error("Flashcard generation failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pt-8 pb-20">
      
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-display font-medium mb-2 text-foreground">
            NEURAL <span className="text-primary">ARCHIVES</span>
          </h2>
          <p className="text-muted-foreground">Generative Active Recall System. Convert topics into memory artifacts.</p>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-card border border-border p-2 flex items-center gap-2 mb-12 max-w-2xl">
        <div className="p-3 text-muted-foreground">
          <Search size={20} />
        </div>
        <input 
          type="text" 
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && generateCards()}
          placeholder="Enter subject or concept (e.g., 'React Hooks', 'Thermodynamics')"
          className="flex-1 bg-transparent text-foreground outline-none placeholder-[#444] font-medium"
        />
        <motion.button 
          onClick={generateCards}
          disabled={isLoading || !topic}
          whileHover={{ backgroundColor: "#b3e600" }}
          whileTap={{ scale: 0.98 }}
          className="bg-primary text-black px-6 py-3 font-bold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? <Loader2 className="animate-spin" size={18} /> : <><Sparkles size={18} /> Generate</>}
        </motion.button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {cards.map((card, idx) => (
            <FlashCard 
              key={idx} 
              data={card} 
              index={idx} 
              isFlipped={flippedIndex === idx} 
              onFlip={() => setFlippedIndex(flippedIndex === idx ? null : idx)} 
            />
          ))}
        </AnimatePresence>
        
        {/* Empty State */}
        {!isLoading && cards.length === 0 && (
          <div className="col-span-full border border-dashed border-border h-64 flex flex-col items-center justify-center text-muted-foreground">
            <BrainCircuit size={48} className="mb-4 opacity-20" />
            <p className="uppercase tracking-widest text-xs">No Archives Loaded</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: FlashCard (Motion-First for perfect hover & flip) ---
const FlashCard: React.FC<{ data: Flashcard, index: number, isFlipped: boolean, onFlip: () => void }> = ({ data, index, isFlipped, onFlip }) => {
  return (
    <div className="h-64 cursor-pointer group perspective-1000" onClick={onFlip} style={{ perspective: "1000px" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1, rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        className="w-full h-full relative"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front Side */}
        <div 
          className="absolute inset-0 bg-card border border-border p-8 flex flex-col justify-between hover:border-primary transition-colors duration-300"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
        >
          <div className="flex justify-between items-start">
            <span className="text-primary font-mono text-xs uppercase tracking-widest">Query 0{index + 1}</span>
            <RotateCw size={14} className="text-muted-foreground" />
          </div>
          <h3 className="text-xl md:text-2xl font-display font-medium text-foreground leading-tight">
            {data.question}
          </h3>
          <div className="w-full h-1 bg-muted mt-4 overflow-hidden">
             <div className="w-1/3 h-full bg-[#333]" />
          </div>
        </div>

        {/* Back Side */}
        <div 
          className="absolute inset-0 bg-primary text-black p-8 flex flex-col justify-between"
          style={{ 
            backfaceVisibility: "hidden", 
            WebkitBackfaceVisibility: "hidden", 
            transform: "rotateY(180deg)" 
          }}
        >
           <div className="flex justify-between items-start">
            <span className="text-black/50 font-mono text-xs uppercase tracking-widest">Answer</span>
            <Layers size={14} className="text-black/50" />
          </div>
          <p className="text-lg font-medium leading-relaxed">
            {data.answer}
          </p>
          <div className="text-[10px] uppercase tracking-widest text-black/40 text-right">
            Verified Protocol
          </div>
        </div>
      </motion.div>
    </div>
  );
};