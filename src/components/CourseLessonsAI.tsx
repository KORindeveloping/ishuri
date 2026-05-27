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
  CheckCircle2,
  Lock,
  Unlock,
  AlertTriangle,
  Zap,
  MessageSquare,
  FileEdit,
  RefreshCw,
  AlertCircle,
  Layers
} from 'lucide-react';
import { api } from '../lib/api';
import ReactMarkdown from 'react-markdown';
import { Book, User } from '../types';
import { cn } from '../lib/utils';
import { BLACKLIST_SUBJECTS } from '../constants';

// Helper to extract unit number from title
function getUnitNumber(title?: string): number {
  if (!title) return 999;
  const match = title.match(/unit\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : 999;
}

// ─── AI Study Workspace (Interactive Tutor) ────────────────────────────────
function PdfViewer({ book, onClose, user }: { book: Book; onClose: () => void; user: User }) {
  const [activeTab, setActiveTab] = useState<'tutor' | 'notes' | 'chat'>('tutor');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [notes, setNotes] = useState<string>(() => localStorage.getItem(`notes_${book.id}`) || '');
  
  // Structured AI Content
  const [aiData, setAiData] = useState<{
    topic?: string;
    summary?: string;
    keyPoints?: string[];
    examHints?: { type: string; content: string }[];
    quiz?: { question: string; options: string[]; answer: string; explanation: string }[];
  }>({});

  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [revealedQuiz, setRevealedQuiz] = useState<number | null>(null);
  const [studyMode, setStudyMode] = useState<'standard' | 'simple' | 'exam' | 'flashcards'>('standard');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(`notes_${book.id}`, notes);
  }, [notes, book.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const generateAIInsights = async (mode = studyMode, page = currentPage) => {
    setIsAnalyzing(true);
    setRevealedQuiz(null);
    try {
      const prompt = `Act as an Elite TVET Tutor. The student is reading "${book.title}" on Page ${page}.
      Mode: ${mode.toUpperCase()}
      
      Requirements:
      - Topic: Identify the core concept of this page.
      - Summary: One powerful, simple sentence.
      - Key Points: 4-5 high-impact bullet points.
      - Exam Hints: 2 critical "traps" or "orders of operations".
      - Quiz: 1 high-quality MCQ with 4 options, the correct answer index (0-3), and a brief explanation.

      Format your response ONLY as a JSON object:
      {
        "topic": "string",
        "summary": "string",
        "keyPoints": ["string"],
        "examHints": [{"type": "string", "content": "string"}],
        "quiz": [{"question": "string", "options": ["string"], "answer": "index_as_string", "explanation": "string"}]
      }`;

      const response = await api.sendChatMessage(prompt, []);
      const cleanJson = response.reply.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      setAiData(parsed);
    } catch (e) {
      console.error("AI Insight generation failed", e);
      setAiData({
        topic: "Analysis Interrupted",
        summary: "I couldn't sync with the current page. Please try again.",
        keyPoints: ["Check your connection", "Try a different page number"]
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    generateAIInsights('standard', 1);
  }, [book.id]);

  const handleChatSend = async (customMsg?: string) => {
    const userMsg = customMsg || chatInput;
    if (!userMsg.trim()) return;
    
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsAnalyzing(true);
    setActiveTab('chat');

    try {
      const response = await api.sendChatMessage(userMsg, chatMessages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      })));
      setChatMessages(prev => [...prev, { role: 'ai', text: response.reply }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'ai', text: "Sorry, I'm having trouble connecting." }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center overflow-hidden font-sans" role="dialog" aria-modal="true">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full h-full flex flex-col bg-[#050505] text-white"
      >
        {/* Workspace Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0a0a0a] shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-tight leading-none">{book.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.2em]">Mastery Workspace</span>
                  <span className="w-1 h-1 bg-white/20 rounded-full" />
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{book.subject}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
             <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Page</span>
                <input 
                  type="number" 
                  value={currentPage}
                  onChange={(e) => {
                    const p = parseInt(e.target.value);
                    setCurrentPage(p);
                    generateAIInsights(studyMode, p);
                  }}
                  className="w-12 bg-transparent text-center font-black text-sm outline-none border-b border-indigo-500"
                />
             </div>
             <button 
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-500 transition-all border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Side: PDF Viewer (70%) */}
          <div className="flex-[0.7] bg-zinc-900 relative flex flex-col">
            <iframe
              src={`${book.pdfUrl}#page=${currentPage}&toolbar=1&navpanes=0&scrollbar=1`}
              title={book.title}
              className="w-full h-full border-none"
              allow="fullscreen"
            />
            {/* Contextual Progress Bar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-black/80 backdrop-blur-xl rounded-full border border-white/10 flex items-center gap-4 shadow-2xl">
               <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Current Progress</span>
               <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '45%' }} />
               </div>
               <span className="text-[10px] font-black text-white">45%</span>
            </div>
          </div>

          {/* Right Side: AI Tutor Sidebar (30%) */}
          <div className="flex-[0.3] flex flex-col bg-[#0a0a0a] border-l border-white/5 overflow-hidden">
            {/* Interaction Modes */}
            <div className="p-4 grid grid-cols-4 gap-2 bg-[#050505] border-b border-white/5">
              {[
                { id: 'tutor', icon: Bot, label: 'Tutor' },
                { id: 'chat', icon: MessageSquare, label: 'Chat' },
                { id: 'notes', icon: FileEdit, label: 'Notes' },
                { id: 'sync', icon: RefreshCw, label: 'Sync' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => tab.id === 'sync' ? generateAIInsights() : setActiveTab(tab.id as any)}
                  className={cn(
                    "flex flex-col items-center py-2 rounded-xl transition-all border",
                    activeTab === tab.id 
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20" 
                      : "bg-white/5 border-transparent text-zinc-500 hover:bg-white/10 hover:text-zinc-300"
                  )}
                >
                  <tab.icon className="w-4 h-4 mb-1" />
                  <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-12 scrollbar-hide bg-[#0a0a0a]">
              <AnimatePresence mode="wait">
                {activeTab === 'tutor' && (
                  <motion.div
                    key="tutor"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-12 pb-10"
                  >
                    {/* Active Topic Section */}
                    <div className="space-y-4">
                       <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500/80">Current Topic</p>
                       <h4 className="text-3xl font-black tracking-tight leading-[1.1] uppercase">
                         {aiData.topic || "Reviewing content..."}
                       </h4>
                       <div className="p-6 bg-white/[0.03] border-l-4 border-indigo-500 rounded-r-2xl">
                          <p className="text-sm font-medium text-zinc-300 leading-relaxed italic">
                            "{aiData.summary || "Generating a quick breakdown for this page..."}"
                          </p>
                       </div>
                    </div>

                    {/* Key Ideas Section */}
                    <div className="space-y-6">
                       <div className="flex items-center justify-between px-1">
                          <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Key Ideas to Remember</h5>
                          <span className="text-[10px] font-bold text-zinc-700">Page {currentPage}</span>
                       </div>
                       <div className="space-y-4">
                          {aiData.keyPoints?.map((point, i) => (
                            <motion.div 
                              key={i}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="p-5 bg-white/[0.02] border border-white/5 rounded-3xl flex items-start gap-5 hover:bg-white/[0.04] transition-colors"
                            >
                               <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center shrink-0 border border-white/5">
                                  <span className="text-xs font-black text-zinc-500">{i + 1}</span>
                               </div>
                               <p className="text-[13px] font-medium text-zinc-300 leading-relaxed">{point}</p>
                            </motion.div>
                          ))}
                       </div>
                    </div>

                    {/* Common Mistakes Section */}
                    <div className="space-y-6">
                       <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500/60 px-1">Common Exam Mistakes</h5>
                       <div className="grid grid-cols-1 gap-4">
                          {aiData.examHints?.map((hint, i) => (
                            <div key={i} className="p-6 bg-red-500/[0.02] border border-red-500/10 rounded-[2rem] relative overflow-hidden">
                               <div className="flex items-center gap-3 mb-3">
                                  <AlertCircle className="w-4 h-4 text-red-500/50" />
                                  <p className="text-[10px] font-black uppercase tracking-widest text-red-400">{hint.type}</p>
                               </div>
                               <p className="text-sm font-bold text-zinc-200 leading-relaxed">{hint.content}</p>
                            </div>
                          ))}
                       </div>
                    </div>

                    {/* Quick Check Section */}
                    {aiData.quiz && aiData.quiz.length > 0 && (
                      <div className="space-y-6">
                         <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 px-1">Quick Check</h5>
                         <div className="bg-[#111] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl">
                            <h6 className="text-lg font-black text-white mb-8 leading-tight">
                               {aiData.quiz[0].question}
                            </h6>
                            <div className="space-y-3">
                               {aiData.quiz[0].options.map((opt, i) => (
                                 <button 
                                   key={i}
                                   onClick={() => setRevealedQuiz(i)}
                                   className={cn(
                                     "w-full p-5 rounded-[1.5rem] text-[13px] font-bold text-left transition-all border",
                                     revealedQuiz === i 
                                       ? (i === parseInt(aiData.quiz![0].answer) ? "bg-emerald-500 border-transparent text-white" : "bg-red-500 border-transparent text-white")
                                       : "bg-white/5 border-transparent text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
                                   )}
                                 >
                                    <div className="flex items-center gap-4">
                                       <span className="w-8 h-8 rounded-xl bg-black/20 flex items-center justify-center shrink-0 font-black text-xs">{String.fromCharCode(65 + i)}</span>
                                       {opt}
                                    </div>
                                 </button>
                               ))}
                            </div>
                            <AnimatePresence>
                               {revealedQuiz !== null && (
                                 <motion.div 
                                   initial={{ opacity: 0, height: 0 }}
                                   animate={{ opacity: 1, height: 'auto' }}
                                   className="mt-8 pt-8 border-t border-white/10"
                                 >
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-3">Expert Explanation</p>
                                    <p className="text-sm text-zinc-400 leading-relaxed italic">
                                       {aiData.quiz[0].explanation}
                                    </p>
                                 </motion.div>
                               )}
                            </AnimatePresence>
                         </div>
                      </div>
                    )}

                    {/* Smart Actions */}
                    <div className="space-y-4">
                       <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 px-1">Study Tools</p>
                       <div className="grid grid-cols-2 gap-4">
                          <button 
                            onClick={() => { setStudyMode('simple'); generateAIInsights('simple'); }}
                            className="p-6 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 hover:border-indigo-500 transition-all flex flex-col items-center gap-3 group"
                          >
                             <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Sparkles className="w-5 h-5 text-indigo-400" />
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Explain Like Beginner</span>
                          </button>
                          <button 
                            onClick={() => handleChatSend("Generate 5 flashcards for this page.")}
                            className="p-6 rounded-[2rem] bg-purple-500/5 border border-purple-500/10 hover:border-purple-500 transition-all flex flex-col items-center gap-3 group"
                          >
                             <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Layers className="w-5 h-5 text-purple-400" />
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Flashcards</span>
                          </button>
                       </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'chat' && (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full flex flex-col"
                  >
                    <div className="flex-1 space-y-8 pb-20">
                      {chatMessages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-8 opacity-20">
                           <div className="w-24 h-24 rounded-[3rem] bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                              <MessageSquare className="w-10 h-10 text-indigo-400" />
                           </div>
                           <div className="space-y-3">
                              <p className="text-[11px] font-black uppercase tracking-[0.5em] text-white">Assistant Sync</p>
                              <p className="text-xs font-bold text-zinc-500 max-w-[200px] mx-auto leading-relaxed">
                                Need a deeper explanation? Ask anything about the current section.
                              </p>
                           </div>
                        </div>
                      )}
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={cn(
                          "flex flex-col gap-3",
                          msg.role === 'user' ? "items-end" : "items-start"
                        )}>
                          <div className={cn(
                            "px-6 py-5 rounded-[2rem] text-[13px] max-w-[90%] leading-relaxed",
                            msg.role === 'user' 
                              ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/10" 
                              : "bg-[#111] border border-white/5 text-zinc-200"
                          )}>
                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                          </div>
                        </div>
                      ))}
                      {isAnalyzing && (
                        <div className="flex items-center gap-3 text-[10px] font-black text-indigo-400 uppercase tracking-widest animate-pulse pl-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Reviewing page...
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  </motion.div>
                )}

                {activeTab === 'notes' && (
                  <motion.div
                    key="notes"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full flex flex-col"
                  >
                    <div className="flex-1 flex flex-col bg-[#080808] rounded-[3rem] border border-white/5 p-10 relative overflow-hidden">
                       <div className="relative z-10 flex flex-col h-full">
                          <div className="flex items-center gap-4 mb-8">
                             <FileEdit className="w-5 h-5 text-indigo-400" />
                             <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Study Notebook</h4>
                          </div>
                          <textarea 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Jot down your synthesis... I'll keep them safe for you."
                            className="flex-1 w-full bg-transparent border-none text-[15px] font-medium leading-relaxed outline-none resize-none text-zinc-300 placeholder:text-zinc-700 placeholder:italic scrollbar-hide"
                          />
                       </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sticky Input Area */}
            <div className="p-6 bg-[#0a0a0a] border-t border-white/5">
               <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-10 group-focus-within:opacity-30 transition" />
                  <div className="relative flex items-center bg-[#111] border border-white/10 rounded-2xl px-5 py-4 focus-within:border-indigo-500/50 transition-all">
                     <input 
                       type="text"
                       value={chatInput}
                       onChange={(e) => setChatInput(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                       placeholder="Explain this simply..."
                       className="flex-1 bg-transparent text-[11px] font-bold outline-none text-zinc-200 placeholder:text-zinc-600"
                     />
                     <button 
                       onClick={() => handleChatSend()}
                       disabled={isAnalyzing || !chatInput.trim()}
                       className="ml-3 p-2 bg-indigo-500 text-white rounded-xl disabled:opacity-50 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-500/20"
                     >
                       <Send className="w-4 h-4" />
                     </button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

interface LessonPlan {
  courseName: string;
  chapters: string[];
  recommendation: string;
}

type InteractionMode = 'EXPLORE' | 'EXPLAIN' | 'QUIZ' | 'TUTOR';

const SUBJECT_DOC_MAP: Record<string, string> = {
  'Biology': 'Biology S1 SB.pdf',
  'English': 'English S1 SB.pdf',
  'Maths': 'Maths S1 SB.pdf',
  'Physics': 'Physics S1 SB.pdf',
  'Entrepreneurship': 'Entrepreneurship S1 SB.pdf',
  'Geography': 'Geography S1 SB.pdf',
};

const CORE_SUBJECT_KEYWORDS: Record<string, string[]> = {
  'Chemistry': ['chemistry'],
  'Physics': ['physics'],
  'Biology': ['biology', 'health'],
  'Mathematics': ['math', 'mathematical'],
  'Maths': ['math', 'mathematical'],
  'English': ['english', 'literature'],
  'Geography': ['geography', 'environment'],
  'Entrepreneurship': ['entrepreneurship', 'business'],
  'ICT': ['ict', 'computer', 'technology'],
  'Ikinyarwanda': ['ikinyarwanda'],
  'Francais': ['francais', 'french'],
  'History': ['history', 'civics'],
  'Economics': ['economics'],
};

export const CourseLessonsAI = ({ user, onClose, initialCourse }: { user: User; onClose: () => void; initialCourse?: string | null }) => {
  const [activeMode, setActiveMode] = useState<InteractionMode>('EXPLORE');
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [interactionContent, setInteractionModeContent] = useState<string | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [stage, setStage] = useState<'BOOK_SELECTION' | 'LEVEL_SELECTION' | 'CONSULTING'>(initialCourse ? 'BOOK_SELECTION' : 'CONSULTING');
  
  const [books, setBooks] = useState<Book[]>([]);
  const [openBook, setOpenBook] = useState<Book | null>(null);
  const [loadingBooks, setLoadingBooks] = useState(true);

  const [maxUnlockedUnit, setMaxUnlockedUnit] = useState<number>(() => {
    return parseInt(localStorage.getItem(`maxUnlockedUnit_${initialCourse}`) || '1', 10);
  });

  const [messages, setMessages] = useState<{ id: string, text: string, sender: 'user' | 'ai', options?: string[] }[]>(
    initialCourse ? [] : [
      {
        id: 'ai-initial',
        text: `Hello ${user?.name?.split(' ')?.[0] || 'Student'}! I'm your Course Consultant. Which course or subject would you like to study today? Based on your level (${user.educationLevel || 'General'}), I can help you find the best path.`,
        sender: 'ai',
        options: (() => {
          const filtered = (user.subjects || '').split(',').map(s => s.trim()).filter(Boolean)
            .filter(s => !BLACKLIST_SUBJECTS.some(black => s.toLowerCase().includes(black.toLowerCase())));
          
          if (filtered.length > 0) return filtered.slice(0, 4);
          return ['Mathematics', 'Physics', 'Chemistry', 'Biology'];
        })()
      }
    ]
  );

  const getFilteredBooks = (courseName: string, allBooks: Book[]) => {
    const searchKey = courseName.split(' ')[0].toLowerCase();
    const keywords = CORE_SUBJECT_KEYWORDS[courseName] || [searchKey];
    
    return allBooks.filter(b => {
      const titleLower = b.title.toLowerCase();
      const subjectLower = (b.subject || '').toLowerCase();
      
      return keywords.some(key => 
        titleLower.includes(key) || 
        subjectLower.includes(key)
      );
    });
  };

  useEffect(() => {
    setLoadingBooks(true);
    api.getBooks()
      .then(fetchedBooks => {
        setBooks(fetchedBooks);
        if (initialCourse && stage === 'BOOK_SELECTION') {
          const matching = getFilteredBooks(initialCourse, fetchedBooks);
          
          if (messages.length === 0) {
            setMessages([{
              id: 'ai-initial',
              text: `Hello ${user?.name?.split(' ')?.[0] || 'Student'}! I see you want to study **${initialCourse}**. I have ${matching.length > 0 ? `found ${matching.length} books` : "searched our database"} for this subject. How can I help you today?`,
              sender: 'ai',
              options: ['Explain a concept', 'Generate a quiz', 'Build a study roadmap']
            }]);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoadingBooks(false));
  }, [initialCourse]);

  const handleOpenBook = (book: Book) => {
    const unitNum = getUnitNumber(book.title);
    if (unitNum !== 999 && unitNum > maxUnlockedUnit) {
      alert(`Unit Locked! Please read and complete Unit ${unitNum - 1} first to unlock this unit.`);
      return;
    }
    setOpenBook(book);
  };

  const handleCloseBook = () => {
    if (openBook) {
      const unitNum = getUnitNumber(openBook.title);
      if (unitNum !== 999) {
        const nextUnlocked = Math.max(maxUnlockedUnit, unitNum + 1);
        setMaxUnlockedUnit(nextUnlocked);
        localStorage.setItem(`maxUnlockedUnit_${initialCourse}`, nextUnlocked.toString());
      }
    }
    setOpenBook(null);
  };

  const courseBooks = initialCourse 
    ? getFilteredBooks(initialCourse, books)
    : books;
  
  const sortedCourseBooks = [...courseBooks].sort((a, b) => getUnitNumber(a.title) - getUnitNumber(b.title));

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

  const handleInteraction = async (mode: InteractionMode, chapter: string) => {
    setActiveMode(mode);
    setSelectedChapter(chapter);
    setIsInteracting(true);
    setInteractionModeContent(null);

    let systemPrompt = "";
    let userMsg = `Chapter Topic: ${chapter}`;

    if (mode === 'EXPLAIN') {
      systemPrompt = `You are a friendly study assistant helping a student understand a specific topic from their syllabus.
      You will be given the raw syllabus text for ONE topic. Your only job is to rewrite it in plain, simple language that a 13-year-old could understand — no jargon unless you immediately define it.
      Rules:
      - Use ONE clear analogy or real-world example to anchor the concept.
      - Keep your response under 120 words.
      - Do NOT add information beyond what is in the provided text.
      - Do NOT mention exams, grades, or study tips.
      - End with one sentence that summarises the core idea in the simplest possible terms.`;
    } else if (mode === 'QUIZ') {
      systemPrompt = `You are a professional Exam Generator. You will be given syllabus text for ONE topic.
      Generate exactly 4 Multiple Choice Questions (MCQs) from this text only.
      
      RULES:
      - All questions must be MCQ with 4 options (A, B, C, D).
      - Every question must be answerable using only the provided text.
      - Questions must match the learner's level.
      - Provide a brief explanation for each correct answer.

      STRUCTURE:
      1. Exam Title (Topic + Level)
      2. Instructions
      3. Questions (numbered)
      4. Answer Key (clearly separated with ---)
      5. Explanations (brief)`;
    } else if (mode === 'TUTOR') {
      systemPrompt = `You are a focused study tutor. A student is studying ONE specific topic and wants to go deeper.
      The topic is: ${chapter}
      Your rules:
      - Answer ONLY questions related to ${chapter}. If the student asks about anything else, politely redirect: "I'm locked in on [topic] for now — ask me anything about that."
      - Prioritise explanations grounded in technical accuracy.
      - Adjust your language to the student's level. If they seem confused, use a simpler analogy. If they are advanced, go deeper.
      - Never do their homework or write essays for them. Guide with questions when appropriate.
      - Keep responses concise (under 150 words) unless the student explicitly asks for more detail.`;
    }

    try {
      const response = await api.sendChatMessage(`${systemPrompt}\n\n${userMsg}`, []);
      setInteractionModeContent(response.reply);
    } catch (error) {
      setInteractionModeContent("Sorry, I encountered an error setting up this study session.");
    } finally {
      setIsInteracting(false);
    }
  };

  const handleSend = async (overrideText?: string) => {
    const messageText = overrideText || input;
    if (!messageText.trim()) return;
    
    const userMessage = { id: `user-${Date.now()}`, text: messageText, sender: 'user' as const };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput('');
    setIsLoading(true);

    const firstUserIndex = currentMessages.findIndex(m => m.sender === 'user');
    const normalizedText = messageText.trim().toLowerCase();

    if (stage === 'LEVEL_SELECTION') {
      const isLevel1 = normalizedText === '1' || normalizedText.includes('level 1') || normalizedText === 'one';
      
      if (isLevel1) {
        const level = (user.educationLevel || '').toLowerCase();
        const isChild = level === 'pre primary' || level.includes('primary');
        const isLowerSecondary = level.includes('senior 1') || level.includes('senior 2') || level.includes('senior 3') || level.includes('s1') || level.includes('s2') || level.includes('s3') || level.includes('senior 1-3');
        const searchName = (initialCourse || '').toLowerCase();

        // Only use SUBJECT_DOC_MAP (which contains S1 books) if the user is in Lower Secondary (S1-S3).
        const canUseS1Books = isLowerSecondary;
        
        const docFile = canUseS1Books ? (SUBJECT_DOC_MAP[initialCourse || ''] ||
                       SUBJECT_DOC_MAP[Object.keys(SUBJECT_DOC_MAP).find(k =>
                         k.toLowerCase().includes(searchName) || searchName.includes(k.toLowerCase())) || '']) : null;

        const aiResponse = {
          id: `ai-${Date.now()}`,
          text: docFile
            ? `Perfect choice! Here is the official **Student Book** for **${initialCourse}**:\n\n### 📄 [Click here to open ${docFile}](/Courselesson/${encodeURIComponent(docFile)})\n\nI can now generate a detailed study roadmap and syllabus based on these official materials. Shall we begin?`
            : `I've registered your interest in **${initialCourse}**. While I prepare the specific document link for your level (${user.educationLevel}), let me build your personalized study roadmap based on adapting national curriculum standards.`,
          sender: 'ai' as const,
          options: ['Yes, generate roadmap', 'Suggest another course']
        };        
        setMessages(prev => [...prev, aiResponse]);
        setStage('CONSULTING');
        setIsLoading(false);
        return;
      } else if (normalizedText.includes('suggest another')) {
        setStage('CONSULTING');
        // Continue to normal AI flow to suggest another course
      } else {
        setMessages(prev => [...prev, {
          id: `ai-${Date.now()}`,
          text: "Currently, our digital library has the most comprehensive materials for **Level 1**. Would you like to proceed with the Level 1 curriculum, or should I suggest a different subject?",
          sender: 'ai' as const,
          options: ['1', 'Suggest another course']
        }]);
        setIsLoading(false);
        return;
      }
    }

    // Special handling for functional selections to guide the AI
    let contextMessage = messageText;
    if (normalizedText.includes('generate roadmap') && initialCourse) {
      contextMessage = `I want to generate a study roadmap for my selected course: ${initialCourse}. Please list the key chapters.`;
    }

    const history = (firstUserIndex === -1 ? [] : currentMessages.slice(firstUserIndex, -1)).map(msg => ({
      role: msg.sender === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: msg.text }]
    }));

    try {
      const prompt = `The student wants to study: "${contextMessage}". 
      Student context: Level ${user.educationLevel || 'General'}, Trade: ${user.trade || 'General'}.
      
      Act as an expert TVET instructor.
      If the student hasn't picked a specific course yet, help them pick one from their trade.
      If they have picked a course, list 4-6 key chapters/modules they should focus on at their level.
      
      Format your response as a friendly message. If you are listing chapters, include them in a clear list.
      
      CRITICAL: If you have identified a clear course and its chapters, also provide a JSON block at the end of your message (within markdown code blocks).
      Keep the JSON concise to avoid truncation.
      
      JSON Structure Example:
      \`\`\`json
      {
        "courseName": "Name",
        "chapters": ["Ch1", "Ch2", "Ch3", "Ch4"],
        "recommendation": "Short reason"
      }
      \`\`\`
      `;

      const response = await api.sendChatMessage(`${prompt}\n\nStudent: ${messageText}`, history);
      
      // Improved JSON extraction that handles potential truncation or multiple blocks
      const jsonMatch = response.reply.match(/```json\s*([\s\S]*?)(\s*```|$)/);
      if (jsonMatch) {
        try {
          let jsonStr = jsonMatch[1].trim();
          // If the block is truncated (missing closing brace), try to close it
          if (jsonStr.startsWith('{') && !jsonStr.endsWith('}')) {
             if (!jsonStr.includes(']')) jsonStr += ']}';
             else jsonStr += '}';
          }
          const plan = JSON.parse(jsonStr);
          if (plan.courseName && plan.chapters) {
            setLessonPlan(plan);
          }
        } catch (e) {
          console.error("Failed to parse lesson plan JSON:", e);
        }
      }

      setMessages(prev => [...prev, { id: `ai-${Date.now()}`, text: response.reply.replace(/```json\s*[\s\S]*?(\s*```|$)/, ''), sender: 'ai' }]);
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
          <button 
            onClick={() => {
              if (selectedChapter) {
                setSelectedChapter(null);
                setActiveMode('EXPLORE');
              } else if (syllabus) {
                setSyllabus(null);
              } else if (stage === 'CONSULTING' && initialCourse) {
                setStage('BOOK_SELECTION');
              } else {
                onClose();
              }
            }} 
            className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-2xl transition-all group"
          >
            <ArrowLeft className="w-6 h-6 text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center shadow-lg">
              <GraduationCap className="w-6 h-6 text-white dark:text-black" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                {selectedChapter ? `Study Hub: ${selectedChapter}` : syllabus ? 'Course Syllabus' : 'AI Academic Planner'}
              </h2>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                {selectedChapter ? 'Locked in on Topic' : 'Full-Window Immersive View'}
              </p>
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
          {selectedChapter ? (
            <motion.div 
              key="study-hub"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col bg-zinc-50 dark:bg-[#020202] overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto p-6 md:p-12 scrollbar-hide">
                <div className="max-w-4xl mx-auto">
                  <div className="grid grid-cols-3 gap-6 mb-12">
                    {[
                      { id: 'EXPLAIN', label: 'Explain Simply', icon: BookOpen, desc: '13-year-old level' },
                      { id: 'QUIZ', label: 'Test Knowledge', icon: Target, desc: '4-question challenge' },
                      { id: 'TUTOR', label: 'Deep Dive', icon: Sparkles, desc: 'Topic-focused tutor' }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => handleInteraction(mode.id as InteractionMode, selectedChapter)}
                        className={cn(
                          "p-5 sm:p-6 md:p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center text-center gap-4 group shadow-sm",
                          activeMode === mode.id 
                            ? "bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white text-white dark:text-black shadow-2xl" 
                            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-900 dark:hover:border-white"
                        )}
                      >
                        <mode.icon className={cn("w-10 h-10 transition-transform group-hover:scale-110", activeMode === mode.id ? "text-indigo-400 dark:text-indigo-600" : "text-zinc-400")} />
                        <div>
                          <p className="text-sm font-black uppercase tracking-tight">{mode.label}</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">{mode.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 md:p-6 md:p-12 lg:p-16 rounded-[3.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl relative min-h-[400px]">
                    {isInteracting ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                        <Loader2 className="w-12 h-12 text-zinc-900 dark:text-white animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 animate-pulse">Consulting Study Assistant...</p>
                      </div>
                    ) : interactionContent ? (
                      <div className="prose prose-xl dark:prose-invert max-w-none">
                        <ReactMarkdown>{interactionContent}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center gap-6 py-20 opacity-30">
                        <Bot className="w-20 h-20" />
                        <p className="text-xl font-black uppercase tracking-tighter">Choose a study path above to begin</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : !syllabus ? (
            <motion.div 
              key="planner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex w-full h-full"
            >
              {/* Main Content Area */}
              <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-black">
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 md:p-8 space-y-8 scrollbar-hide">
                  <div className="max-w-4xl mx-auto space-y-8">
                    {stage === 'BOOK_SELECTION' && initialCourse ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-12 py-10"
                      >
                        <div className="text-center space-y-4">
                          <h3 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">
                            Select Study Material for {initialCourse}
                          </h3>
                          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-[0.2em]">
                            Choose a book to begin your mastery journey
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {loadingBooks ? (
                            <div className="col-span-full py-10 flex justify-center">
                              <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
                            </div>
                          ) : sortedCourseBooks.map((book) => {
                              const unitNum = getUnitNumber(book.title);
                              const isLocked = unitNum !== 999 && unitNum > maxUnlockedUnit;
                              return (
                                <motion.div
                                  key={book.id}
                                  whileHover={isLocked ? {} : { y: -5, scale: 1.02 }}
                                  className={`group relative bg-zinc-50 dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all overflow-hidden ${isLocked ? 'opacity-75 grayscale-[0.3] cursor-not-allowed' : 'cursor-pointer'}`}
                                  onClick={() => handleOpenBook(book)}
                                >
                                  <div className="absolute top-0 right-0 w-24 h-24 bg-zinc-900/5 dark:bg-white/5 blur-3xl -mr-12 -mt-12 group-hover:scale-150 transition-transform" />
                                  
                                  <div className="relative z-10 space-y-6">
                                    <div className="flex justify-between items-start">
                                      <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                                        {unitNum !== 999 ? `Unit ${unitNum}` : (book.subject || 'Resource')}
                                      </span>
                                      <div className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-full border ${isLocked ? 'bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-600 dark:text-green-500 border-green-500/20'}`}>
                                        {isLocked ? 'Locked' : 'Available'}
                                      </div>
                                    </div>

                                    <div>
                                      <h4 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-tight">
                                        {book.title}
                                      </h4>
                                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                                        {book.author}
                                      </p>
                                    </div>

                                    <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                                      <span className="text-[9px] font-black text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors uppercase tracking-widest">
                                        {isLocked ? 'Complete Previous Unit' : 'Read PDF'}
                                      </span>
                                      <div className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center shadow-lg group-hover:translate-x-1 transition-transform">
                                        {isLocked ? <Lock className="w-4 h-4 text-white dark:text-black" /> : <ChevronRight className="w-4 h-4 text-white dark:text-black" />}
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          {sortedCourseBooks.length === 0 && !loadingBooks && (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center gap-6">
                              <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                                <BookOpen className="w-10 h-10 text-zinc-400" />
                              </div>
                              <div className="space-y-2">
                                <p className="text-zinc-900 dark:text-white uppercase text-[10px] font-black tracking-widest">No matching books found</p>
                                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest max-w-xs mx-auto">We couldn't find any specific Level 1 materials for "{initialCourse}" in our library.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
                        <div className="w-32 h-32 rounded-[3rem] bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center shadow-inner">
                          <Bot className="w-12 h-12 text-zinc-300 dark:text-zinc-700" />
                        </div>
                        <div className="space-y-3">
                          <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">Academic Consultant Active</h3>
                          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-widest max-w-[320px] mx-auto leading-relaxed">
                            I'm analyzing your goals and the curriculum. Use the chat on the right to discuss your study path.
                          </p>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              </div>

              {/* Sidebar Chat View */}
              <div className="w-[450px] bg-zinc-50 dark:bg-[#050505] border-l border-zinc-200 dark:border-zinc-800 flex flex-col p-10 overflow-hidden hidden lg:flex">
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-black text-zinc-900 dark:text-white uppercase tracking-tight text-sm">Study Assistant</h3>
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Online
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar scrollbar-hide">
                    <AnimatePresence mode="popLayout">
                      {messages.map((msg) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={msg.id} 
                          className={cn(
                            "flex flex-col",
                            msg.sender === 'user' ? "items-end" : "items-start"
                          )}
                        >
                          <div className={cn(
                            "max-w-[90%] p-5 rounded-3xl text-xs leading-relaxed shadow-sm",
                            msg.sender === 'user' 
                              ? "bg-zinc-900 text-white dark:bg-white dark:text-black rounded-tr-sm" 
                              : "bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 rounded-tl-sm border border-zinc-200 dark:border-zinc-800"
                          )}>
                            <div className="prose prose-sm dark:prose-invert max-w-none text-[11px] leading-relaxed">
                              <ReactMarkdown>{msg.text}</ReactMarkdown>
                            </div>
                            
                            {msg.options && msg.id === messages[messages.length - 1].id && (
                              <div className="flex flex-wrap gap-2 mt-4">
                                {msg.options.map(opt => (
                                  <button 
                                    key={opt}
                                    onClick={() => handleSend(opt)}
                                    className="px-4 py-2 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-zinc-900 dark:hover:border-white transition-all shadow-sm"
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {isLoading && (
                      <div className="flex items-center gap-3 text-zinc-500 text-[10px] font-black uppercase tracking-widest animate-pulse ml-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Thinking...
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="relative">
                    <input 
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Ask about TVET topics..."
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-white rounded-2xl px-6 py-5 text-sm outline-none transition-all pr-16 shadow-sm"
                    />
                    <button 
                      onClick={() => handleSend()}
                      disabled={isLoading || !input.trim()}
                      className="absolute right-2 top-2 p-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl disabled:opacity-50 hover:scale-105 active:scale-95 transition-all shadow-lg"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
              <AnimatePresence>
                {openBook && <PdfViewer book={openBook} onClose={handleCloseBook} user={user} />}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div 
              key="syllabus"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col bg-zinc-50 dark:bg-[#020202] overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto p-6 md:p-12 scrollbar-hide">
                <div className="max-w-4xl mx-auto">
                  <header className="mb-16 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <FileText className="w-6 h-6 text-zinc-400" />
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Academic Syllabus</span>
                      </div>
                      <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tighter leading-[0.9]">{lessonPlan?.courseName}</h1>
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

                  <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 md:p-6 md:p-12 lg:p-16 rounded-[3.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl relative overflow-hidden">
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
