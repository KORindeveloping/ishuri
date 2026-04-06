import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Save, UserCheck } from 'lucide-react';
import { cn } from '../lib/utils';

interface ChecklistItem {
  id: string;
  task: string;
  criteria: string;
  status: 'Pass' | 'Not Yet Competent' | 'Pending';
}

export const VerificationChecklist = ({ onComplete }: { onComplete: (score: number) => void }) => {
  const [items, setItems] = useState<ChecklistItem[]>([
    { id: '1', task: 'Safety Gear', criteria: 'Student is wearing correct PPE (Gloves, Goggles).', status: 'Pending' },
    { id: '2', task: 'Tool Selection', criteria: 'Correct wrenches and pressure gauge selected.', status: 'Pending' },
    { id: '3', task: 'Execution', criteria: 'Fluid pressure test performed without leaks.', status: 'Pending' },
    { id: '4', task: 'Cleanup', criteria: 'Work area cleaned and tools returned.', status: 'Pending' },
  ]);

  const updateStatus = (id: string, status: 'Pass' | 'Not Yet Competent') => {
    setItems(items.map(item => item.id === id ? { ...item, status } : item));
  };

  const calculateScore = () => {
    const passed = items.filter(i => i.status === 'Pass').length;
    const total = items.length;
    onComplete((passed / total) * 100);
  };

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden max-w-2xl w-full">
      <div className="p-6 bg-zinc-950 text-white flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <UserCheck className="w-6 h-6 text-white" />
          <h3 className="font-bold text-lg">Practical Verification Checklist</h3>
        </div>
        <span className="text-[10px] font-bold bg-white text-black px-2 py-1 rounded uppercase tracking-widest">External Verifier Mode</span>
      </div>
      
      <div className="p-6 space-y-4 bg-black">
        {items.map((item) => (
          <div key={item.id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-white">{item.task}</h4>
                <p className="text-sm text-zinc-500">{item.criteria}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => updateStatus(item.id, 'Pass')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    item.status === 'Pass' ? "bg-white text-black" : "bg-zinc-800 text-zinc-500 border border-zinc-700 hover:border-white hover:text-white"
                  )}
                >
                  Pass
                </button>
                <button 
                  onClick={() => updateStatus(item.id, 'Not Yet Competent')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    item.status === 'Not Yet Competent' ? "bg-zinc-500 text-white" : "bg-zinc-800 text-zinc-500 border border-zinc-700 hover:border-zinc-400 hover:text-zinc-300"
                  )}
                >
                  NYC
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-zinc-950 border-t border-zinc-800 flex justify-end gap-3">
        <button className="px-6 py-2 text-zinc-500 font-bold hover:text-white hover:bg-zinc-900 rounded-xl transition-colors">Cancel</button>
        <button 
          onClick={calculateScore}
          disabled={items.some(i => i.status === 'Pending')}
          className="px-6 py-2 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-white/10"
        >
          <Save className="w-4 h-4" /> Finalize Score
        </button>
      </div>
    </div>
  );
};
