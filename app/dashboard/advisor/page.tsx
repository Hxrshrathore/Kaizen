'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Send, Bot, User, Sparkles, Lock, AlertTriangle, 
  Cpu, Info, CornerDownLeft, BookOpen, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// --- TYPES ---
interface UserProfile {
  name: string;
  currentCGPA: number;
  totalCredits: number;
}

interface GradeRecord {
  semester: number;
  subjectName: string;
  subjectCode: string;
  grade: string;
  credits: number;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

const MOCK_USER: UserProfile = {
  name: "Harsh Rathore",
  currentCGPA: 8.42,
  totalCredits: 86
};

const MOCK_GRADES: GradeRecord[] = [
  { semester: 7, subjectName: "Software Testing and Automation", subjectCode: "CS40003", grade: "O", credits: 4 },
  { semester: 7, subjectName: "Engineering Professional Practice", subjectCode: "EX40003", grade: "E", credits: 3 },
  { semester: 6, subjectName: "Compiler Design", subjectCode: "CS3004", grade: "A", credits: 4 },
  { semester: 6, subjectName: "Cloud Computing", subjectCode: "CS3006", grade: "O", credits: 3 },
];

const SUGGESTED_PROMPTS = [
  "How can I score 45+ marks in CS40003 End-Sem?",
  "Analyze my SGPA improvement curve",
  "Explain Cyclomatic Complexity with an example",
  "Summarize NSPE Code Fundamental Canons",
];

export default function AIAdvisorPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'init', 
      role: 'model', 
      text: `Greetings, ${MOCK_USER.name}. I am Kaizen Academic Co-Pilot.\n\nI have verified access to your curriculum transcript (${MOCK_USER.totalCredits} Credits, CGPA: ${MOCK_USER.currentCGPA}) and syllabus course outcomes for Semester 7.\n\nAsk me about:\n• Exam strategy & high-recurrence PYQ topics\n• Clarification of difficult engineering concepts\n• SGPA target trajectories & grading thresholds` 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = { id: String(Date.now()), role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          context: {
            user: MOCK_USER,
            grades: MOCK_GRADES
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Autonomous Co-Pilot is currently busy. Please try again.');
      }

      const data = await response.json();
      setMessages(prev => [
        ...prev, 
        { id: String(Date.now() + 1), role: 'model', text: data.reply }
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev, 
        { id: String(Date.now() + 1), role: 'model', text: err.message, isError: true }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] p-3 md:p-6 flex flex-col max-w-6xl mx-auto overflow-hidden">
      
      {/* Top Meta Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-3 shrink-0 gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-[10px] text-primary border-primary/30">
            <Cpu size={12} className="mr-1 text-primary animate-pulse" />
            NVIDIA NEMOTRON &amp; GEMINI FLASH
          </Badge>
          <Badge variant="secondary" className="font-mono text-[10px]">
            Academic Target: Sem 7
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
          <Info size={11} className="text-primary" />
          <span>Current CGPA: <strong className="text-foreground">{MOCK_USER.currentCGPA}</strong> ({MOCK_USER.totalCredits} Credits)</span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 min-h-0 bg-card border border-border rounded-2xl overflow-hidden flex flex-col relative shadow-sm">
        {/* Background Noise */}
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] pointer-events-none" />
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scroll-smooth custom-scrollbar">
          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 md:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                msg.role === 'user' 
                  ? 'bg-muted border-input text-foreground' 
                  : 'bg-primary/20 border-primary/40 text-primary shadow-[0_0_12px_rgba(204,255,0,0.2)]'
              }`}>
                {msg.role === 'user' ? <User size={15} /> : <Bot size={16} />}
              </div>
              
              <div className={`max-w-[85%] md:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm font-mono ${
                msg.role === 'user' 
                  ? 'bg-muted/80 text-foreground border border-input rounded-tr-xs' 
                  : msg.isError 
                    ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30 rounded-tl-xs'
                    : 'bg-white/[0.03] text-foreground border border-white/10 rounded-tl-xs'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                {msg.role === 'model' && !msg.isError && (
                  <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider">
                    <Sparkles size={11} className="text-primary" />
                    <span>Autonomous Grounded Response</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-primary/20 border border-primary/40 text-primary">
                <Bot size={16} className="animate-pulse" />
              </div>
              <div className="flex items-center gap-1.5 h-10 px-4 bg-white/[0.03] border border-white/10 rounded-2xl">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        {messages.length <= 3 && (
          <div className="px-4 py-2 border-t border-border/50 bg-background/50 flex flex-wrap gap-1.5 shrink-0">
            <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1 mr-1">
              <BookOpen size={11} className="text-primary" /> Prompt Starters:
            </span>
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(prompt)}
                className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-muted-foreground hover:text-foreground border border-white/10 hover:border-primary/40 transition-all cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="p-3 border-t border-border bg-card/80 shrink-0">
          <div className="relative flex items-center gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask academic advisor about syllabus topics, exam patterns, or grade optimization..."
              className="flex-1 bg-background border border-input rounded-xl px-4 py-2.5 pr-12 text-foreground focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all placeholder:text-muted-foreground font-mono text-xs sm:text-sm"
              disabled={isLoading}
            />
            <Button 
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              size="sm"
              className="absolute right-1.5 h-7 px-2.5 bg-primary text-black rounded-lg hover:bg-primary/90 disabled:opacity-40 transition-all cursor-pointer"
            >
              <Send size={13} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
