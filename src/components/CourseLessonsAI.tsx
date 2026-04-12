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
  Target,
  ArrowLeft,
  FileText,
  Download,
  CheckCircle2
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

export const CourseLessonsAI = ({ user, onClose, initialCourse }: { user: User; onClose: () => void; initialCourse?: string | null }) => {
  const [messages, setMessages] = useState<{ id: string, text: string, sender: 'user' | 'ai', options?: string[] }[]>([
    {
      id: 'ai-initial',
      text: initialCourse 
        ? `Hello ${user?.name?.split(' ')?.[0] || 'Student'}! I see you want to study **${initialCourse}**. Based on your level (${user.educationLevel || 'General'}), let me prepare a lesson plan for you. Shall we begin?`
        : `Hello ${user?.name?.split(' ')?.[0] || 'Student'}! I'm your Course Consultant. Which course or subject would you like to study today? Based on your level (${user.educationLevel || 'General'}), I can help you find the best path.`,
      sender: 'ai',
      options: initialCourse ? ['Yes, generate roadmap', 'Suggest another course'] : (user.subjects || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 4)
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [syllabus, setSyllabus] = useState<string | null>(null);
  const [isGeneratingSyllabus, setIsGeneratingSyllabus] = useState(false);
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

  const generateFullSyllabus = async () => {
    if (!lessonPlan) return;
    setIsGeneratingSyllabus(true);
    
    const isChild = user.educationLevel === 'Pre Primary' || user.educationLevel?.includes('Primary');

    try {
      const prompt = `Generate a ${isChild ? 'fun, playful, and very simple child-friendly' : 'detailed, professional, and comprehensive'} syllabus for the course: "${lessonPlan.courseName}".
      The student is at the ${user.educationLevel || 'General'} level.
      
      ${isChild ? `
      TONE & STYLE FOR CHILDREN:
      - Use very simple words.
      - Use lots of fun emojis.
      - Instead of "Learning Objectives", use "What We Will Discover! 🌟".
      - Instead of "Detailed Breakdown", use "Our Fun Adventures! 🚀".
      - Focus on games, stories, and simple activities.
      - Keep it colorful and encouraging.
      ` : 'Use professional academic formatting with headings, bullet points, and technical terminology.'}

      Focus on these chapters: ${lessonPlan.chapters.join(', ')}.
      
      Structure:
      1. Course Overview
      2. Chapter-by-Chapter Breakdown
      3. What you need to bring (Tools/Toys)
      4. How we check what you've learned
      
      Return the content in beautiful Markdown.`;

      const response = await api.sendChatMessage(prompt, []);
      setSyllabus(response.reply);
    } catch (error) {
      console.error("Failed to generate syllabus");
    } finally {
      setIsGeneratingSyllabus(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white dark:bg-black overflow-hidden flex flex-col">
      {/* Top Navbar */}
      <header className="h-20 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-8 bg-white dark:bg-black z-10 shrink-0">
        <div className="flex items-center gap-6">
          <button onClick={onClose} className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-2xl transition-all group">
            <ArrowLeft className="w-6 h-6 text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center shadow-lg">
              <GraduationCap className="w-6 h-6 text-white dark:text-black" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">AI Academic Planner</h2>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Full-Window Immersive View</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Syllabus Engine Live</span>
          </div>
          <button onClick={onClose} className="p-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden relative">
        <AnimatePresence mode="wait">
          {!syllabus ? (
            <motion.div 
              key="planner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex w-full h-full"
            >
              {/* Chat Side */}
              <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-black">
                <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                  <div className="max-w-4xl mx-auto space-y-8">
                    {messages.map((msg) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={msg.id} 
                        className={cn("flex flex-col", msg.sender === 'user' ? "items-end" : "items-start")}
                      >
                        <div className={cn(
                          "max-w-[80%] p-6 rounded-[2.5rem] text-sm leading-relaxed shadow-sm",
                          msg.sender === 'user' 
                            ? "bg-zinc-900 dark:bg-white text-white dark:text-black rounded-tr-none" 
                            : "bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 rounded-tl-none border border-zinc-200 dark:border-zinc-800"
                        )}>
                          <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/5 dark:prose-pre:bg-white/5 prose-pre:rounded-2xl">
                            {msg.text}
                          </ReactMarkdown>
                          
                          {msg.options && msg.id === messages[messages.length - 1].id && (
                            <div className="flex flex-wrap gap-3 mt-6">
                              {msg.options.map(opt => (
                                <button 
                                  key={opt}
                                  onClick={() => handleSend(opt)}
                                  className="px-5 py-2.5 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-zinc-900 dark:hover:border-white transition-all shadow-sm hover:shadow-lg"
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    {isLoading && (
                      <div className="flex items-center gap-3 text-zinc-500 text-[10px] font-black uppercase tracking-widest animate-pulse ml-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating Roadmap...
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                <footer className="p-8 bg-white dark:bg-black border-t border-zinc-200 dark:border-zinc-800">
                  <div className="max-w-4xl mx-auto flex gap-4">
                    <input 
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Discuss your study goals with AI..."
                      className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 rounded-[2rem] px-8 py-5 text-sm focus:ring-4 focus:ring-zinc-900/5 dark:focus:ring-white/5 transition-all outline-none"
                    />
                    <button 
                      onClick={() => handleSend()}
                      disabled={isLoading || !input.trim()}
                      className="p-5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-[2rem] disabled:opacity-50 hover:scale-105 active:scale-95 transition-all shadow-xl"
                    >
                      <Send className="w-7 h-7" />
                    </button>
                  </div>
                </footer>
              </div>

              {/* Sidebar Plan View */}
              <div className="w-[450px] bg-zinc-50 dark:bg-[#050505] border-l border-zinc-200 dark:border-zinc-800 flex flex-col p-10 overflow-y-auto hidden lg:flex">
                <div className="flex items-center gap-4 mb-12">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center">
                    <Target className="w-5 h-5 text-white dark:text-black" />
                  </div>
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Learning Roadmap</h4>
                </div>
                
                <AnimatePresence mode="wait">
                  {lessonPlan ? (
                    <motion.div 
                      key="plan"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-12"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">{lessonPlan.courseName}</span>
                          <span className="text-[10px] font-black text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded uppercase tracking-widest">AI Generated</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5">
                          <motion.div initial={{ width: 0 }} animate={{ width: '40%' }} className="h-full bg-zinc-900 dark:bg-white rounded-full" />
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
                            className="p-6 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 flex items-center justify-between group cursor-pointer hover:border-zinc-900 dark:hover:border-white transition-all shadow-sm hover:shadow-2xl"
                          >
                            <div className="flex items-center gap-5">
                              <div className="w-9 h-9 rounded-xl bg-zinc-50 dark:bg-black flex items-center justify-center text-[10px] font-black text-zinc-400 group-hover:bg-zinc-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-all">
                                {String(i + 1).padStart(2, '0')}
                              </div>
                              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">{chapter}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-all" />
                          </motion.div>
                        ))}
                      </div>

                      <div className="p-8 bg-zinc-900 dark:bg-white rounded-[3rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 dark:bg-black/5 blur-3xl rounded-full -mt-16 -mr-16 transition-all group-hover:scale-150" />
                        <div className="flex items-center gap-3 mb-4 relative z-10">
                          <Sparkles className="w-5 h-5 text-indigo-400 group-hover:animate-pulse" />
                          <span className="text-[10px] font-black text-white/50 dark:text-black/50 uppercase tracking-widest">Counselor Strategy</span>
                        </div>
                        <p className="text-xs font-bold text-white dark:text-black leading-relaxed relative z-10">
                          {lessonPlan.recommendation}
                        </p>
                      </div>

                      <button 
                        onClick={generateFullSyllabus}
                        disabled={isGeneratingSyllabus}
                        className="w-full py-6 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-zinc-900 dark:hover:bg-white hover:text-white dark:hover:text-black transition-all shadow-lg flex items-center justify-center gap-4 group"
                      >
                        {isGeneratingSyllabus ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Drafting Syllabus...
                          </>
                        ) : (
                          <>
                            Prepare Full Syllabus <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex-1 flex flex-col items-center justify-center text-center space-y-8 opacity-20"
                    >
                      <div className="w-32 h-32 rounded-[3rem] border-4 border-dashed border-zinc-400 flex items-center justify-center">
                        <Layout className="w-12 h-12 text-zinc-400" />
                      </div>
                      <div className="space-y-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500">
                          Waiting for Selection
                        </p>
                        <p className="text-[10px] font-bold text-zinc-400 max-w-[200px] mx-auto leading-relaxed">
                          Tell the AI what you'd like to study to generate your personalized roadmap.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="syllabus"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col bg-zinc-50 dark:bg-[#020202] overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto p-12 scrollbar-hide">
                <div className="max-w-4xl mx-auto">
                  <header className="mb-16 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <FileText className="w-6 h-6 text-zinc-400" />
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Academic Syllabus</span>
                      </div>
                      <h1 className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter leading-[0.9]">{lessonPlan?.courseName}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setSyllabus(null)}
                        className="px-6 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-zinc-900 dark:hover:text-white transition-all shadow-sm"
                      >
                        Adjust Roadmap
                      </button>
                      <button 
                        onClick={() => window.print()}
                        className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-3 hover:scale-105 transition-all"
                      >
                        <Download className="w-4 h-4" /> Download PDF
                      </button>
                    </div>
                  </header>

                  <div className="bg-white dark:bg-zinc-900 p-12 md:p-16 rounded-[3.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-900/[0.02] dark:bg-white/[0.02] blur-3xl rounded-full -mt-32 -mr-32" />
                    <div className="prose prose-xl dark:prose-invert max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-p:font-medium prose-p:text-zinc-600 dark:prose-p:text-zinc-400 prose-li:text-zinc-600 dark:prose-li:text-zinc-400 prose-strong:text-zinc-900 dark:prose-strong:text-white">
                      <ReactMarkdown>{syllabus}</ReactMarkdown>
                    </div>
                    
                    <footer className="mt-20 pt-12 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        <div>
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Ready to Start</p>
                          <p className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">This syllabus is now active in your dashboard.</p>
                        </div>
                      </div>
                      <button 
                        onClick={onClose}
                        className="px-10 py-5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl hover:scale-105 active:scale-95 transition-all"
                      >
                        Start Learning Now
                      </button>
                    </footer>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
