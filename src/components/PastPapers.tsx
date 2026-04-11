import React, { useState, useRef, useEffect } from 'react';
import { FileText, Download, ExternalLink, Tag, Zap, X, CheckCircle2, Camera, Loader2, Search, Video, Award, FolderOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trade, Assessment, PortfolioItem } from '../types'; // Import PortfolioItem
import { cn } from '../lib/utils';
import { jsPDF } from 'jspdf';
import { api } from '../lib/api';

import { PaperMetadata, PAST_PAPERS_DATA } from '../data/pastPapersData';
import { User } from '../types';

export const PastPapers = ({ user, onStartQuiz }: { user: User, onStartQuiz?: (quiz: Assessment) => void }) => {
  const [showGenerator, setShowGenerator] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<PaperMetadata | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('All Years');
  
  const [config, setConfig] = useState({
    subject: 'General',
    year: '2023',
    type: 'Theory' as any,
    questions: 10
  });
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getDisplayLevel = (eduLevel?: string): 'Nursery' | 'Primary' | 'S3' | 'S6' => {
    if (!eduLevel) return 'S6';
    const level = eduLevel.toLowerCase();
    if (level.includes('nursery') || level.includes('pre primary') || level.includes('preprimary')) return 'Nursery';
    if (level.includes('primary')) return 'Primary';
    if (level.includes('ordinary') || level.includes('s3')) return 'S3';
    return 'S6';
  };

  const displayLevel = getDisplayLevel(user.educationLevel);
  
  const filteredPapers = PAST_PAPERS_DATA.filter(paper => {
    // 1. Level Filter
    const matchesLevel = paper.level === displayLevel;
    if (!matchesLevel) return false;

    // 2. Primary Subject Restriction (Specific to your request)
    if (displayLevel === 'Primary') {
      const allowedSubjects = ['Mathematics', 'Integrated Sciences', 'SET', 'English', 'Ikinyarwanda', 'Social Religious Studies', 'SRE'];
      if (!allowedSubjects.includes(paper.subject)) return false;
    }

    // 3. Search & Year Filter
    const matchesSearch = paper.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         paper.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesYear = selectedYear === 'All Years' || paper.year.toString() === selectedYear;
    
    return matchesSearch && matchesYear;
  });

  const years = ['All Years', ...Array.from(new Set(PAST_PAPERS_DATA.filter(p => p.level === displayLevel).map(p => p.year.toString())))].sort().reverse();

  const handleScanPaper = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { text } = await (api as any).ocrPaper(formData);
      
      const doc = new jsPDF();
      doc.text("Scanned Paper Content:", 10, 10);
      doc.text(text.substring(0, 1000), 10, 20);
      doc.save("scanned-paper.pdf");
      
      alert('Paper scanned and PDF generated successfully!');
    } catch (e) {
      alert('OCR Scan failed.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleViewOnline = (paper: PaperMetadata) => {
    setSelectedPaper(paper);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const generatedQuiz: Assessment = {
        id: `custom-${Date.now()}`,
        title: `AI generated: ${config.subject} (${config.year})`,
        trade: 'General',
        timeLimit: config.questions * 2,
        questions: Array.from({ length: config.questions }).map((_, i) => {
          const type = i % 2 === 0 ? 'MCQ' : 'ShortAnswer';
          return {
            id: `q-${i}`,
            type: type as any,
            text: `Sample AI-extracted question ${i + 1} for ${config.subject}...`,
            options: type === 'MCQ' ? ['Option A', 'Option B', 'Option C', 'Option D'] : undefined,
            correctAnswer: 'Option A',
            points: 10
          };
        })
      };
      setIsGenerating(false);
      setShowGenerator(false);
      if (onStartQuiz) onStartQuiz(generatedQuiz);
    }, 2000);
  };

  return (
    <div className="space-y-8 pb-24">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
             <div className="px-3 py-1 bg-zinc-900 dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-widest rounded-lg">
               {displayLevel} Library
             </div>
             <div className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/20 flex items-center gap-1.5">
               <CheckCircle2 className="w-3 h-3" /> Official Board Repository
             </div>
             <div className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-zinc-200 dark:border-zinc-700">
               {filteredPapers.length} Papers Available
             </div>
          </div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase mb-2">Past Papers Library</h1>
          <p className="text-zinc-500 font-medium">Access official board exams tailored to your level.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search subjects..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-6 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-zinc-900/10 outline-none w-64"
            />
          </div>
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-6 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-zinc-900/10 outline-none"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            onClick={() => setShowGenerator(true)}
            className="flex items-center gap-2 px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-xl shadow-black/10 dark:shadow-white/10"
          >
            <Zap className="w-4 h-4" /> AI Study Mode
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredPapers.map((paper, idx) => (
            <motion.div 
              key={paper.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-zinc-900/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-zinc-200 dark:border-white/[0.05] hover:border-zinc-300 dark:hover:border-white/[0.1] transition-all group relative overflow-hidden shadow-sm"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-black/5 dark:bg-white/5 blur-3xl rounded-full -mr-12 -mt-12" />
              
              <div className="flex items-start justify-between mb-8">
                <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-black/40 flex items-center justify-center border border-zinc-200 dark:border-white/[0.05] group-hover:bg-zinc-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-all duration-500">
                  <FileText className="w-7 h-7" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-1">{paper.year}</p>
                  <div className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-[8px] font-black text-zinc-500 uppercase tracking-widest rounded-lg">Official</div>
                </div>
              </div>

              <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight mb-2 line-clamp-1">{paper.subject}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-8 font-medium italic">Level {paper.level} National Examination</p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleViewOnline(paper)}
                  className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-900 dark:hover:bg-white hover:text-white dark:hover:text-black transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" /> View Online
                </button>
                <a
                  href={`/past-papers/${paper.fileName}`}
                  download={paper.fileName}
                  className="p-4 bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/[0.05] rounded-2xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 transition-all"
                >
                  <Download className="w-5 h-5" />
                </a>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredPapers.length === 0 && (
          <div className="col-span-full py-24 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[3rem]">
            <Search className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest">No papers found</p>
            <p className="text-zinc-300 dark:text-zinc-700 text-xs mt-1">Try a different year or subject search.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedPaper && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full h-full max-w-6xl bg-white dark:bg-zinc-900 rounded-[3rem] overflow-hidden flex flex-col relative"
            >
              <header className="p-8 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">{selectedPaper.title}</h3>
                  <p className="text-xs text-zinc-500 font-medium">{selectedPaper.year} • {selectedPaper.level} Examination</p>
                </div>
                <button 
                  onClick={() => setSelectedPaper(null)}
                  className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </header>
              <div className="flex-1 bg-zinc-100 dark:bg-black relative">
                 <iframe 
                   src={`/past-papers/${selectedPaper.fileName}#toolbar=0`} 
                   className="w-full h-full border-none"
                   title="PDF Preview"
                 />
                 {/* Watermark */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-5 select-none rotate-45">
                    <p className="text-9xl font-black uppercase text-zinc-500 tracking-widest">TVET MASTERY PRO</p>
                 </div>
              </div>
              <footer className="p-8 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-4">
                 <a
                    href={`/past-papers/${selectedPaper.fileName}`}
                    download={selectedPaper.fileName}
                    className="px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </a>
              </footer>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGenerator && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden max-w-md w-full"
            >
              <div className="p-6 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <Zap className="w-6 h-6 text-zinc-900 dark:text-white" />
                  <h3 className="font-bold text-lg uppercase tracking-tight">Custom Quiz Generator</h3>
                </div>
                <button onClick={() => setShowGenerator(false)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                {isGenerating ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-zinc-900 dark:border-white border-t-transparent rounded-full animate-spin" />
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-white">Digitizing Library Content...</h4>
                      <p className="text-sm text-zinc-500">Extracting questions from {config.year} {config.subject} papers.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Select Subject</label>
                        <select
                          value={config.subject}
                          onChange={(e) => setConfig({...config, subject: e.target.value})}
                          className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/20 outline-none text-zinc-900 dark:text-white"
                        >
                          {Array.from(new Set(PAST_PAPERS_DATA.filter(p => p.level === displayLevel).map(p => p.subject))).sort().map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                          {PAST_PAPERS_DATA.filter(p => p.level === displayLevel).length === 0 && (
                            <option value="General">General Study</option>
                          )}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Year</label>
                          <select
                            value={config.year}
                            onChange={(e) => setConfig({...config, year: e.target.value})}
                            className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/20 outline-none text-zinc-900 dark:text-white"
                          >
                            <option>2023</option>
                            <option>2022</option>
                            <option>2021</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Type</label>
                          <select
                            value={config.type}
                            onChange={(e) => setConfig({...config, type: e.target.value})}
                            className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/20 outline-none text-zinc-900 dark:text-white"
                          >
                            <option>Theory</option>
                            <option>Practical</option>
                            <option>Marking Scheme</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Number of Questions</label>
                        <input
                          type="range" min="5" max="50" step="5"
                          value={config.questions}
                          onChange={(e) => setConfig({...config, questions: parseInt(e.target.value)})}
                          className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-white"
                        />
                        <div className="flex justify-between mt-2 text-xs font-bold text-zinc-400 dark:text-zinc-500">
                          <span>5</span>
                          <span className="text-zinc-900 dark:text-white">{config.questions} Questions</span>
                          <span>50</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleGenerate}
                      className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-xl shadow-black/10 dark:shadow-white/10 flex items-center justify-center gap-2"
                    >
                      <Zap className="w-5 h-5" /> Generate & Start Quiz
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


    </div>
  );
};
