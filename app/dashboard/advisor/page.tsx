'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Sparkles, Lock, AlertTriangle, Cpu, Info } from 'lucide-react';

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

// --- MOCK DATA (Since we aren't passing props in Next.js pages) ---
const MOCK_USER: UserProfile = {
  name: "Rohan Das",
  currentCGPA: 8.42,
  totalCredits: 86
};

const MOCK_GRADES: GradeRecord[] = [
  { semester: 1, subjectName: "Calculus", subjectCode: "MA1001", grade: "E", credits: 4 },
  { semester: 1, subjectName: "Physics", subjectCode: "PH1002", grade: "A", credits: 4 },
  { semester: 2, subjectName: "Data Structures", subjectCode: "CS2001", grade: "O", credits: 4 },
  { semester: 3, subjectName: "Algorithms", subjectCode: "CS2002", grade: "A", credits: 3 },
  { semester: 3, subjectName: "Digital Logic", subjectCode: "EC2001", grade: "B", credits: 3 },
];

export default function AIAdvisorPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'init', 
      role: 'model', 
      text: `Greetings, ${MOCK_USER.name}. I am Kaizen Lite (v1.0). \n\nI have read-only access to your academic transcript (${MOCK_USER.totalCredits} Credits, CGPA: ${MOCK_USER.currentCGPA}). I can assist with:\n\n1. Analyzing performance trends in specific semesters.\n2. Explaining concepts from your subject list.\n3. Suggesting study schedules based on difficulty.\n\n⚠️ PREDICTIVE MODELING IS LOCKED. I cannot forecast future grades.` 
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

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare Context String
      const gradeContext = MOCK_GRADES.length > 0 
        ? MOCK_GRADES.map(g => `- Sem ${g.semester}: ${g.subjectName} (${g.subjectCode}) | Grade: ${g.grade} | Credits: ${g.credits}`).join('\n')
        : "No grades uploaded yet.";

      // Call Server API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input, 
          userContext: MOCK_USER,
          gradeContext: gradeContext 
        }),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: data.text || "No response received." 
      }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: "Error: Neural Link Severed. Please check your connection.", 
        isError: true 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col pt-2 md:pt-4">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end mb-4 md:mb-6 shrink-0 gap-2">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-medium mb-1">
            KAIZEN <span className="text-primary">ADVISOR</span>
          </h2>
          <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[10px] md:text-xs font-mono text-muted-foreground">
             <span className="flex items-center gap-1 text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">
               <Cpu size={12} /> GEMINI 1.5 FLASH: ONLINE
             </span>
             <span className="flex items-center gap-1 text-muted-foreground">
               <Lock size={12} /> PREDICTIVE CORE: LOCKED
             </span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-card border border-border rounded-lg overflow-hidden flex flex-col relative">
        {/* Background Decor */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none" />
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 scroll-smooth custom-scrollbar">
          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 md:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 border ${
                msg.role === 'user' ? 'bg-muted border-input' : 'bg-primary border-primary text-black'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={18} />}
              </div>
              
              <div className={`max-w-[85%] md:max-w-[70%] p-3 md:p-4 rounded-sm text-sm leading-relaxed shadow-lg ${
                msg.role === 'user' 
                  ? 'bg-accent text-foreground border border-input' 
                  : msg.isError 
                    ? 'bg-red-900/20 text-red-200 border border-red-900/50'
                    : 'bg-primary/5 text-foreground border border-primary/10'
              }`}>
                <p className="whitespace-pre-wrap">{msg.text}</p>
                {msg.role === 'model' && !msg.isError && (
                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-widest">
                    <Sparkles size={10} /> Generated by AI • Lite Mode
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
               <div className="w-8 h-8 rounded-sm flex items-center justify-center bg-primary/50 border border-primary text-black">
                 <Bot size={18} />
               </div>
               <div className="flex items-center gap-1 h-10 px-4">
                 <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
                 <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
                 <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
               </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 md:p-4 border-t border-border bg-muted">
          <div className="relative flex items-center gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about your grades..."
              className="flex-1 bg-[#050507] border border-input p-3 md:p-4 pr-12 text-foreground focus:border-primary outline-none transition-colors placeholder-[#444] font-mono text-sm"
              disabled={isLoading}
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 p-2 bg-primary text-black rounded-sm hover:bg-[#b3e600] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
          <div className="flex justify-between items-center mt-2 px-1">
             <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1 truncate max-w-[50%]">
               <Info size={10} /> Context: {MOCK_GRADES.length} Grades
             </span>
             <span className="text-[10px] text-muted-foreground flex items-center gap-1 truncate max-w-[50%] justify-end">
               <AlertTriangle size={10} /> Lite Mode may hallucinate.
             </span>
          </div>
        </div>
      </div>
    </div>
  );
}