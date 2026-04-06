import React, { useState } from 'react';
import { FileText, Download, ExternalLink, Tag, Zap, X, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trade, Assessment } from '../types';
import { cn } from '../lib/utils';

interface Paper {
  id: string;
  title: string;
  trade: Trade;
  year: number;
  type: 'Theory' | 'Practical' | 'Marking Scheme';
}

const PAPERS: Paper[] = [
  { id: '1', title: 'Automotive Engines Level 4', trade: 'Automotive', year: 2023, type: 'Theory' },
  { id: '2', title: 'Hydraulic Systems Practical', trade: 'Automotive', year: 2023, type: 'Practical' },
  { id: '3', title: 'Basic Plumbing Principles', trade: 'Plumbing', year: 2022, type: 'Theory' },
  { id: '4', title: 'Network Infrastructure Design', trade: 'IT', year: 2023, type: 'Theory' },
  { id: '5', title: 'Electrical Wiring Standards', trade: 'Electrical', year: 2021, type: 'Marking Scheme' },
];

export const PastPapers = ({ onStartQuiz }: { onStartQuiz?: (quiz: Assessment) => void }) => {
  const [showGenerator, setShowGenerator] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [config, setConfig] = useState({
    trade: 'Automotive' as Trade,
    year: '2023',
    type: 'Theory' as any,
    questions: 10
  });

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate AI generation from library
    setTimeout(() => {
      const generatedQuiz: Assessment = {
        id: `custom-${Date.now()}`,
        title: `Custom ${config.trade} Quiz (${config.year})`,
        trade: config.trade,
        timeLimit: config.questions * 2,
        questions: Array.from({ length: config.questions }).map((_, i) => {
          const type = i % 2 === 0 ? 'MCQ' : 'ShortAnswer';
          return {
            id: `q-${i}`,
            type: type as any,
            text: type === 'MCQ' 
              ? `Sample question ${i + 1} for ${config.trade} based on ${config.year} ${config.type} paper.`
              : `Based on the ${config.year} ${config.trade} syllabus, explain the main purpose of ${config.type === 'Theory' ? 'theoretical' : 'practical'} documentation.`,
            options: type === 'MCQ' ? ['Standard Procedure', 'Safety First', 'Efficient Workflow', 'Quality Control'] : undefined,
            correctAnswer: type === 'MCQ' ? 'Standard Procedure' : 'To maintain accurate records and ensure compliance.',
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
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Past Papers Library</h1>
          <p className="text-zinc-400">Access thousands of categorized TVET trade papers.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowGenerator(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl text-sm font-bold hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10"
          >
            <Zap className="w-4 h-4" /> Generate Custom Quiz
          </button>
          <div className="flex gap-2">
            <select className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-white/20 outline-none text-white">
              <option>All Trades</option>
              <option>Automotive</option>
              <option>Plumbing</option>
              <option>IT</option>
            </select>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {PAPERS.map((paper) => (
          <div key={paper.id} className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:bg-white group-hover:text-black transition-colors">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white">{paper.title}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs font-medium text-zinc-500">
                    <Tag className="w-3 h-3" /> {paper.trade}
                  </span>
                  <span className="text-xs font-medium text-zinc-500">•</span>
                  <span className="text-xs font-medium text-zinc-500">{paper.year}</span>
                  <span className="text-xs font-medium text-zinc-500">•</span>
                  <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-[10px] font-bold uppercase tracking-wider">
                    {paper.type}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                <Download className="w-5 h-5" />
              </button>
              <button className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                <ExternalLink className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showGenerator && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden max-w-md w-full"
            >
              <div className="p-6 bg-zinc-950 text-white flex items-center justify-between border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <Zap className="w-6 h-6 text-white" />
                  <h3 className="font-bold text-lg">Custom Quiz Generator</h3>
                </div>
                <button onClick={() => setShowGenerator(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                {isGenerating ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
                    <div>
                      <h4 className="font-bold text-white">Digitizing Library Content...</h4>
                      <p className="text-sm text-zinc-500">Extracting questions from {config.year} {config.trade} papers.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Select Trade</label>
                        <select 
                          value={config.trade}
                          onChange={(e) => setConfig({...config, trade: e.target.value as Trade})}
                          className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-white/20 outline-none text-white"
                        >
                          <option>Automotive</option>
                          <option>Plumbing</option>
                          <option>IT</option>
                          <option>Electrical</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Year</label>
                          <select 
                            value={config.year}
                            onChange={(e) => setConfig({...config, year: e.target.value})}
                            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-white/20 outline-none text-white"
                          >
                            <option>2023</option>
                            <option>2022</option>
                            <option>2021</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Type</label>
                          <select 
                            value={config.type}
                            onChange={(e) => setConfig({...config, type: e.target.value})}
                            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-white/20 outline-none text-white"
                          >
                            <option>Theory</option>
                            <option>Practical</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Number of Questions</label>
                        <input 
                          type="range" min="5" max="50" step="5"
                          value={config.questions}
                          onChange={(e) => setConfig({...config, questions: parseInt(e.target.value)})}
                          className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                        />
                        <div className="flex justify-between mt-2 text-xs font-bold text-zinc-500">
                          <span>5</span>
                          <span className="text-white">{config.questions} Questions</span>
                          <span>50</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={handleGenerate}
                      className="w-full py-4 bg-white text-black rounded-2xl font-bold hover:bg-zinc-200 transition-colors shadow-xl shadow-white/10 flex items-center justify-center gap-2"
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
