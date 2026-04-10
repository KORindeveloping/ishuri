import React, { useState, useRef } from 'react';
import { FileText, Download, ExternalLink, Tag, Zap, X, CheckCircle2, Camera, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trade, Assessment, PortfolioItem } from '../types'; // Import PortfolioItem
import { cn } from '../lib/utils';
import { jsPDF } from 'jspdf';
import { api } from '../lib/api';

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
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null); // State to hold selected paper for viewing
  const [config, setConfig] = useState({
    trade: 'Automotive' as Trade,
    year: '2023',
    type: 'Theory' as any,
    questions: 10
  });
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleScanPaper = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      // In a real app, send this to a backend OCR service
      const formData = new FormData();
      formData.append('file', file);
      // Assuming api.ocrPaper(formData) returns { text: string }
      const { text } = await (api as any).ocrPaper(formData);
      
      // Convert to PDF
      const doc = new jsPDF();
      doc.text("Scanned Paper Content:", 10, 10);
      doc.text(text.substring(0, 1000), 10, 20); // Simplified PDF content
      doc.save("scanned-paper.pdf");
      
      alert('Paper scanned and PDF generated successfully!');
    } catch (e) {
      alert('OCR Scan failed.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleViewOnline = (paper: Paper) => {
    console.log(`Viewing paper online: ${paper.title}`);
    setSelectedPaper(paper); // Set selected paper for display
    // In a real app, this would navigate to a viewer or open a modal
    // For now, we'll just log it.
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate AI generation from library
    setTimeout(() => {
      const generatedQuiz: Assessment = {
        id: `custom-${Date.now()}`,
        title: `Custom ${config.trade} Quiz (${config.year}) - ${config.type}`, // More descriptive title
        trade: config.trade,
        timeLimit: config.questions * 2, // Assuming 2 mins per question
        questions: Array.from({ length: config.questions }).map((_, i) => {
          const type = i % 2 === 0 ? 'MCQ' : 'ShortAnswer';
          return {
            id: `q-${i}`,
            type: type as any, // Cast to appropriate type
            text: type === 'MCQ'
              ? `Sample question ${i + 1} for ${config.trade} - ${config.type}.`
              : `Explain the core concepts relevant to ${config.trade} in the ${config.year} ${config.type} paper.`,
            options: type === 'MCQ' ? ['Option A', 'Option B', 'Option C', 'Option D'] : undefined, // Placeholder options
            correctAnswer: type === 'MCQ' ? 'Option A' : 'Relevant explanation...', // Placeholder answer
            points: 10 // Default points per question
          };
        })
      };
      setIsGenerating(false);
      setShowGenerator(false);
      setConfig({ // Reset config after generation
        trade: 'Automotive',
        year: '2023',
        type: 'Theory',
        questions: 10
      });
      if (onStartQuiz) onStartQuiz(generatedQuiz);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-tight">Past Papers Library</h1>
          <p className="text-zinc-400">Access and practice with thousands of TVET trade papers.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleScanPaper} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-700 text-white rounded-xl text-sm font-bold hover:border-zinc-500 transition-colors"
          >
            {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />} Scan-to-Study
          </button>
          <button
            onClick={() => setShowGenerator(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl text-sm font-bold hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10"
          >
            <Zap className="w-4 h-4" /> Generate Custom Quiz
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {PAPERS.map((paper) => (
          <div key={paper.id} className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between group">
            <div className="flex items-center gap-4 flex-grow">
              <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:bg-white group-hover:text-black transition-colors">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white">{paper.title}</h3>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
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
            <div className="flex items-center gap-2 mt-4 md:mt-0 md:ml-4">
              <button
                onClick={() => handleViewOnline(paper)}
                className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
              </button>
              <button className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                <Download className="w-5 h-5" />
              </button>
              {/* Option to start a quiz directly from a paper */}
              <button
                onClick={() => {
                  // Construct a basic Assessment object from the paper for starting a quiz
                  if (onStartQuiz) {
                    const assessment: Assessment = {
                      id: paper.id,
                      title: `${paper.title} (${paper.type})`,
                      trade: paper.trade,
                      timeLimit: 60, // Default time limit, can be made dynamic
                      questions: [ // Placeholder questions, would need to be fetched/generated
                        { id: 'p1', type: 'MCQ', text: `Sample question for ${paper.title}?`, options: ['A', 'B', 'C', 'D'], correctAnswer: 'A', points: 10 }
                      ]
                    };
                    onStartQuiz(assessment);
                  }
                }}
                className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <CheckCircle2 className="w-5 h-5" /> {/* Icon for starting quiz */}
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
                            <option>Marking Scheme</option>
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

      {/* Placeholder for selected paper details */}
      {selectedPaper && (
        <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 shadow-sm">
          <h3 className="font-bold text-white mb-3">Viewing: {selectedPaper.title}</h3>
          <p className="text-zinc-400 text-sm">
            Trade: {selectedPaper.trade}, Year: {selectedPaper.year}, Type: {selectedPaper.type}
          </p>
          <p className="text-zinc-400 text-sm mt-1">
            (In a real app, this would display the actual paper content or link to it.)
          </p>
          <button onClick={() => setSelectedPaper(null)} className="mt-3 px-3 py-1 bg-zinc-800 text-white rounded-lg text-xs">Close</button>
        </div>
      )}
    </div>
  );
};
