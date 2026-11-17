'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit, Sparkles, RotateCw, Layers, Loader2, 
  Search, CheckCircle2, BookOpen, AlertCircle
} from 'lucide-react';

interface Flashcard {
  question: string;
  answer: string;
}

const PRESET_TOPICS = [
  "Boundary Value Analysis & Robustness",
  "Control Flow Graph & Cyclomatic Complexity",
  "Equivalence Partitioning & Decision Tables",
  "Professional Ethics & NSPE Code",
  "Intellectual Property Rights & Patents",
  "Discounted Cash Flow & Depreciation",
];

export default function ArchivesPage() {
  const [topic, setTopic] = useState('');
  const [cards, setCards] = useState<Flashcard[]>([
    {
      question: "What is Boundary Value Analysis (BVA)?",
      answer: "A black-box testing technique focused on testing values at the extreme edges (min, min+, nom, max-, max) of equivalence classes."
    },
    {
      question: "How is Cyclomatic Complexity V(G) computed?",
      answer: "V(G) = E - N + 2P, where E is the number of edges, N is the number of nodes, and P is connected components. Equivalently, V(G) = Predicate Nodes + 1."
    },
    {
      question: "What is the primary canon of the NSPE Code of Ethics?",
      answer: "Engineers shall hold paramount the safety, health, and welfare of the public in the performance of their professional duties."
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateCards = async (customTopic?: string) => {
    const queryTopic = customTopic || topic;
    if (!queryTopic.trim()) return;
    setIsLoading(true);
    setError(null);
    setFlippedIndex(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: queryTopic }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Generation failed');
      }

      const data = await response.json();
      if (data.cards && Array.isArray(data.cards) && data.cards.length > 0) {
        setCards(data.cards);
      } else {
        throw new Error('No flashcards returned for this topic');
      }
    } catch (err: any) {
      console.error("Flashcard generation failed", err);
      setError(err.message || "Failed to generate memory cards. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetClick = (preset: string) => {
    setTopic(preset);
    generateCards(preset);
  };

  return (
    <div className="max-w-6xl mx-auto pt-6 pb-20 px-4 sm:px-6">
      
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-mono text-primary mb-2.5 uppercase tracking-[0.16em]">
            <BrainCircuit size={12} className="text-primary animate-pulse" />
            <span>Autonomous Active Recall Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-foreground">
            NEURAL <span className="text-primary">ARCHIVES</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground font-mono mt-1 leading-relaxed">
            Generative active recall memory artifacts grounded in verified autonomous course modules.
          </p>
        </div>

        {cards.length > 0 && (
          <div className="text-xs font-mono text-muted-foreground flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>{cards.length} Memory Artifacts Ready</span>
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="space-y-3 mb-8 max-w-3xl">
        <div className="bg-card border border-border rounded-2xl p-2 flex items-center gap-2 shadow-sm focus-within:border-primary/50 transition-colors">
          <div className="p-2.5 text-muted-foreground">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generateCards()}
            placeholder="Enter syllabus topic (e.g. 'Boundary Value Analysis', 'Whistleblowing NSPE', 'Cyclomatic Complexity')"
            className="flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground/60 text-xs sm:text-sm font-mono"
          />
          <motion.button 
            onClick={() => generateCards()}
            disabled={isLoading || !topic.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-primary text-black px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm shadow-primary/20 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={15} />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles size={15} />
                <span>Synthesize</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] font-mono text-muted-foreground mr-1 uppercase tracking-wider flex items-center gap-1">
            <BookOpen size={11} className="text-primary" /> Recommended:
          </span>
          {PRESET_TOPICS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-white/[0.03] hover:bg-white/[0.08] text-muted-foreground hover:text-foreground border border-white/10 hover:border-primary/40 transition-all cursor-pointer"
            >
              {preset}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {cards.map((card, idx) => (
            <FlashCard 
              key={`${idx}-${card.question.substring(0, 15)}`} 
              data={card} 
              index={idx} 
              isFlipped={flippedIndex === idx} 
              onFlip={() => setFlippedIndex(flippedIndex === idx ? null : idx)} 
            />
          ))}
        </AnimatePresence>
        
        {/* Empty State */}
        {!isLoading && cards.length === 0 && (
          <div className="col-span-full border border-dashed border-border rounded-2xl h-64 flex flex-col items-center justify-center text-muted-foreground p-6 text-center space-y-2">
            <BrainCircuit size={40} className="text-primary/40 mb-2" />
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
              No Memory Artifacts Active
            </p>
            <p className="font-mono text-[11px] text-muted-foreground max-w-sm">
              Enter any curricular concept above or choose a recommended unit to generate flashcard memory artifacts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: FlashCard ---
const FlashCard: React.FC<{ data: Flashcard, index: number, isFlipped: boolean, onFlip: () => void }> = ({ data, index, isFlipped, onFlip }) => {
  return (
    <div 
      className="h-64 cursor-pointer group perspective-1000 select-none" 
      onClick={onFlip} 
      style={{ perspective: "1000px" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1, rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 280, damping: 24 }}
        className="w-full h-full relative"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front Side */}
        <div 
          className="absolute inset-0 bg-card rounded-2xl border border-border p-6 flex flex-col justify-between hover:border-primary/50 transition-colors duration-300 shadow-sm"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
        >
          <div className="flex justify-between items-start">
            <span className="text-primary font-mono text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
              Artifact #{String(index + 1).padStart(2, '0')}
            </span>
            <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground group-hover:text-primary transition-colors">
              <span>Click to Flip</span>
              <RotateCw size={12} />
            </div>
          </div>

          <h3 className="text-base sm:text-lg font-mono font-semibold text-foreground leading-snug tracking-tight">
            {data.question}
          </h3>

          <div className="w-full space-y-1.5 pt-2 border-t border-border/60">
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
              <span>Active Recall Card</span>
              <span className="text-primary font-bold">Concept Prompt</span>
            </div>
          </div>
        </div>

        {/* Back Side */}
        <div 
          className="absolute inset-0 bg-[#0d0e12] rounded-2xl border border-primary/40 text-foreground p-6 flex flex-col justify-between shadow-lg shadow-primary/5"
          style={{ 
            backfaceVisibility: "hidden", 
            WebkitBackfaceVisibility: "hidden", 
            transform: "rotateY(180deg)" 
          }}
        >
          <div className="flex justify-between items-start">
            <span className="text-primary font-mono text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-primary/15 border border-primary/30">
              Verified Solution
            </span>
            <Layers size={13} className="text-primary" />
          </div>

          <p className="text-xs sm:text-sm font-mono text-foreground leading-relaxed">
            {data.answer}
          </p>

          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground pt-2 border-t border-white/10">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <CheckCircle2 size={11} /> Autonomous Syllabus Verified
            </span>
            <span className="text-primary font-bold">Click to Revert</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
