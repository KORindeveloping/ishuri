import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User as UserIcon, 
  Loader2, 
  BookOpen, 
  ChevronRight,
  GraduationCap,
  Layout,
  Target
} from 'lucide-react';
import { api } from '../lib/api';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { User } from '../types';

interface LessonPlan {
  courseName: string;
  chapters: string[];
  recommendation: string;
}

export const CourseLessonsAI = ({ user, onClose }: { user: User; onClose: () => void }) => {
  const [messages, setMessages] = useState<{ id: string, text: string, sender: 'user' | 'ai', options?: string[] }[]>([
    {
      id: 'ai-initial',
      text: `Hello ${user?.name?.split(' ')?.[0] || 'Student'}! I'm your Course Consultant. Which course or subject would you like to study today? Based on your level (${user.educationLevel || 'General'}), I can help you find the best path.`,
      sender: 'ai',
      options: (user.subjects || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 4)
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (overrideText?: string) => {
    const messageText = overrideText || input;
    if (!messageText.trim()) return;
    
    const userMessage = { id: `user-${Date.now()}`, text: messageText, sender: 'user' as const };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput('');
    setIsLoading(true);

    // Gemini REQUIRES the first message in history to be from the 'user'.
    const firstUserIndex = currentMessages.findIndex(m => m.sender === 'user');
    const history = (firstUserIndex === -1 ? [] : currentMessages.slice(firstUserIndex, -1)).map(msg => ({
      role: msg.sender === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: msg.text }]
    }));

    try {
      const prompt = `The student wants to study: "${messageText}". 
      Student context: Level ${user.educationLevel || 'General'}, Trade: ${user.trade || 'General'}.
      
      Act as an expert TVET instructor.
      If the student hasn't picked a specific course yet, help them pick one from their trade.
      If they have picked a course, list 4-6 key chapters/modules they should focus on at their level.
      
      Format your response as a friendly message. If you are listing chapters, include them in a clear list.
      
      CRITICAL: If you have identified a clear course and its chapters, also provide a JSON block at the end of your message (within markdown code blocks) like this:
      \`\`\`json
      {
        "courseName": "Name of the course",
        "chapters": ["Chapter 1", "Chapter 2", ...],
        "recommendation": "Why this is good for them"
      }
      \`\`\`
      `;

      const response = await api.sendChatMessage(`${prompt}\n\nStudent: ${messageText}`, history);
      
      // Try to parse JSON from response
      const jsonMatch = response.reply.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          const plan = JSON.parse(jsonMatch[1]);
          setLessonPlan(plan);
        } catch (e) {
          console.error("Failed to parse lesson plan JSON");
        }
      }

      setMessages(prev => [...prev, { id: `ai-${Date.now()}`, text: response.reply.replace(/```json\s*[\s\S]*?\s*```/, ''), sender: 'ai' }]);
    } catch (error) {
      setMessages(prev => [...prev, { id: `ai-err-${Date.now()}`, text: "I'm having trouble connecting. Please try again.", sender: 'ai' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-5xl h-[85vh] bg-white dark:bg-zinc-950 rounded-[3rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col md:flex-row"
      >
        {/* Left: Chat Side */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-zinc-200 dark:border-zinc-800">
          <header className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-black/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white dark:text-black" />
              </div>
              <div>
                <h3 className="font-black text-zinc-900 dark:text-white uppercase tracking-tight">AI Lesson Planner</h3>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Mastery Engine Active</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors">
              <X className="w-5 h-5 text-zinc-500" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-zinc-50/50 dark:bg-black/10">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex flex-col", msg.sender === 'user' ? "items-end" : "items-start")}>
                <div className={cn(
                  "max-w-[85%] p-5 rounded-3xl text-sm leading-relaxed",
                  msg.sender === 'user' 
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-black rounded-tr-none shadow-xl shadow-black/5" 
                    : "bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 rounded-tl-none border border-zinc-200 dark:border-zinc-800 shadow-sm"
                )}>
                  <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/5 dark:prose-pre:bg-white/5 prose-pre:rounded-2xl">
                    {msg.text}
                  </ReactMarkdown>
                  
                  {msg.options && msg.id === messages[messages.length - 1].id && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {msg.options.map(opt => (
                        <button 
                          key={opt}
                          onClick={() => handleSend(opt)}
                          className="px-4 py-2 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-zinc-900 dark:hover:border-white transition-all shadow-sm"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-3 text-zinc-500 text-[10px] font-black uppercase tracking-widest animate-pulse ml-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Consulting Syllabus...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <footer className="p-6 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex gap-4">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Pick a course or tell me your study goals..."
                className="flex-1 bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-zinc-900/5 dark:focus:ring-white/5 transition-all outline-none"
              />
              <button 
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="p-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl disabled:opacity-50 hover:scale-105 active:scale-95 transition-all shadow-xl"
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
          </footer>
        </div>

        {/* Right: Plan Side */}
        <div className="hidden md:flex w-96 bg-zinc-50 dark:bg-black/40 flex-col p-8 overflow-y-auto border-l border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3 mb-10">
            <Target className="w-5 h-5 text-zinc-400" />
            <h4 className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.3em]">Learning Roadmap</h4>
          </div>
          
          <AnimatePresence mode="wait">
            {lessonPlan ? (
              <motion.div 
                key="plan"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-10"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-widest">{lessonPlan.courseName}</span>
                    <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded uppercase tracking-widest">Optimized</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5">
                    <motion.div initial={{ width: 0 }} animate={{ width: '35%' }} className="h-full bg-zinc-900 dark:bg-white rounded-full" />
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Curriculum Highlights</p>
                  {lessonPlan.chapters.map((chapter, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-5 bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 flex items-center justify-between group cursor-pointer hover:border-zinc-900 dark:hover:border-white transition-all shadow-sm hover:shadow-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-xl bg-zinc-50 dark:bg-black flex items-center justify-center text-[10px] font-black text-zinc-400 group-hover:bg-zinc-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-all">
                          {String(i + 1).padStart(2, '0')}
                        </div>
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">{chapter}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-all" />
                    </motion.div>
                  ))}
                </div>

                <div className="p-6 bg-zinc-900 dark:bg-white rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 dark:bg-black/5 blur-2xl rounded-full -mt-10 -mr-10 transition-all group-hover:scale-150" />
                  <div className="flex items-center gap-3 mb-4 relative z-10">
                    <Sparkles className="w-4 h-4 text-white/60 dark:text-black/60" />
                    <span className="text-[10px] font-black text-white/60 dark:text-black/60 uppercase tracking-widest">Tutor Tip</span>
                  </div>
                  <p className="text-xs font-bold text-white dark:text-black leading-relaxed relative z-10">
                    {lessonPlan.recommendation}
                  </p>
                </div>

                <button 
                  onClick={() => window.location.reload()}
                  className="w-full py-5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-900 dark:hover:bg-white hover:text-white dark:hover:text-black transition-all shadow-lg flex items-center justify-center gap-3"
                >
                  Confirm Learning Path <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center space-y-6 opacity-30"
              >
                <div className="w-24 h-24 rounded-[2.5rem] border-4 border-dashed border-zinc-400 flex items-center justify-center">
                  <Layout className="w-10 h-10 text-zinc-400" />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Ready to Start?
                  </p>
                  <p className="text-[10px] font-bold text-zinc-400 max-w-[150px] mx-auto leading-relaxed">
                    Select a course in the chat to generate your personalized study plan
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
