import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Check, Sparkles, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';
import { cn } from '../lib/utils';

interface Task {
  text: string;
  category: 'Theory' | 'Practice' | 'Revision' | 'Portfolio';
  time: string;
  completed?: boolean;
}

interface ScheduleDay {
  date: string; // YYYY-MM-DD
  tasks: Task[];
}

export const PlannerView = ({ user, showToast }: { 
  user: User,
  showToast: (m: string, t?: 'success' | 'error' | 'info') => void
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [schedule, setSchedule] = useState<ScheduleDay[]>(() => {
    const saved = localStorage.getItem(`tvet_planner_${user.id}`);
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newTask, setNewTask] = useState<Task>({ 
    text: '', 
    category: 'Theory',
    time: '08:00'
  });

  useEffect(() => {
    localStorage.setItem(`tvet_planner_${user.id}`, JSON.stringify(schedule));
  }, [schedule, user.id]);

  const addTask = () => {
    if (!selectedDate || !newTask.text) return;
    
    setSchedule(prev => {
      const exists = prev.find(s => s.date === selectedDate);
      if (exists) {
        return prev.map(s => 
          s.date === selectedDate ? { ...s, tasks: [...s.tasks, { ...newTask, completed: false }] } : s
        );
      } else {
        return [...prev, { date: selectedDate, tasks: [{ ...newTask, completed: false }] }].sort((a, b) => a.date.localeCompare(b.date));
      }
    });
    setNewTask({ text: '', category: 'Theory', time: '08:00' });
  };

  const removeTask = (date: string, taskIdx: number) => {
    setSchedule(prev => prev.map(s => 
      s.date === date ? { ...s, tasks: s.tasks.filter((_, i) => i !== taskIdx) } : s
    ));
  };

  const toggleTask = (date: string, taskIdx: number) => {
    setSchedule(prev => prev.map(s => 
      s.date === date ? { 
        ...s, 
        tasks: s.tasks.map((t, i) => i === taskIdx ? { ...t, completed: !t.completed } : t)
      } : s
    ));
  };

  const categoryColors = {
    Theory: 'bg-blue-500',
    Practice: 'bg-emerald-500',
    Revision: 'bg-amber-500',
    Portfolio: 'bg-purple-500'
  };

  const generateAIPlan = () => {
    const isNursery = user.educationLevel === 'Pre Primary';
    const trade = user.trade || 'General';
    
    const tradeTasksMap: Record<string, string[]> = {
      'Automotive': ["Engine Diagnostics Lab", "Brake System Maintenance", "Shop Safety Audit"],
      'Hospitality': ["Front Desk Simulator", "Kitchen Safety Check", "Menu Planning"],
      'General': ["Review Past Papers", "Group Study Session", "Subject Module 1 Review"]
    };
    
    const tasksForTrade = tradeTasksMap[trade] || tradeTasksMap.General;

    // Generate for the currently viewed month
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const newSchedule = [...schedule];
    
    for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        if (d.getDay() === 0 || d.getDay() === 6) continue; // skip weekends
        if (Math.random() > 0.5) continue; // 50% chance to have tasks
        
        // Correctly format local date using padded month/day
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        let dailyTasks = [];
        if (isNursery) {
           dailyTasks = [
             { text: `Drawing Theme`, category: 'Practice' as any, time: '09:00' },
             { text: 'Counting and Games', category: 'Revision' as any, time: '11:00' }
           ];
        } else {
           dailyTasks = [
             { text: `${trade} Module Review`, category: 'Theory' as any, time: '08:00' },
             { text: tasksForTrade[Math.floor(Math.random() * tasksForTrade.length)], category: 'Practice' as any, time: '14:00' }
           ];
        }
        
        const existingIdx = newSchedule.findIndex(s => s.date === dateStr);
        if (existingIdx >= 0) {
            newSchedule[existingIdx] = { date: dateStr, tasks: dailyTasks };
        } else {
            newSchedule.push({ date: dateStr, tasks: dailyTasks });
        }
    }

    setSchedule(newSchedule.sort((a, b) => a.date.localeCompare(b.date)));
    showToast("AI has generated your optimal study plan for this month!", "success");
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar generation logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays = [];
  
  // Prev month days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      calendarDays.push({
          day: daysInPrevMonth - i,
          isCurrentMonth: false,
          date: new Date(year, month - 1, daysInPrevMonth - i)
      });
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push({
          day: i,
          isCurrentMonth: true,
          date: new Date(year, month, i)
      });
  }
  
  // Next month days to complete 42 cells (6 rows)
  const remainingDays = 42 - calendarDays.length;
  for (let i = 1; i <= remainingDays; i++) {
      calendarDays.push({
          day: i,
          isCurrentMonth: false,
          date: new Date(year, month + 1, i)
      });
  }

  const getTasksForDate = (date: Date) => {
      // Localize date formatting properly
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      return schedule.find(s => s.date === dateStr)?.tasks || [];
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 sm:p-6 md:p-8 bg-white dark:bg-zinc-900/40 rounded-[2.5rem] border border-zinc-200 dark:border-white/[0.05] shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-3">
             <div className="px-3 py-1 bg-zinc-900 dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-widest rounded-lg">
               Smart Study Engine
             </div>
             <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">v2.0 Professional</p>
          </div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase mb-2">Monthly Planner</h1>
          <p className="text-zinc-500 font-medium">Strategize your {user.trade || 'academic'} journey with precision.</p>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={generateAIPlan}
             className="relative px-6 py-3 bg-zinc-900 dark:bg-zinc-950 overflow-hidden text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-indigo-500/20 flex items-center gap-2 group border border-indigo-500/30"
           >
             <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 group-hover:opacity-40 transition-opacity" />
             <div className="relative z-10 flex items-center gap-2 text-white">
                <Sparkles className="w-4 h-4 text-indigo-400 group-hover:animate-pulse" /> AI Generate Month
             </div>
           </button>
        </div>
      </header>

      <div className="bg-white dark:bg-zinc-900/40 backdrop-blur-3xl rounded-[2.5rem] border border-zinc-200 dark:border-white/[0.05] shadow-xl overflow-hidden">
         {/* Calendar Header */}
         <div className="p-6 md:p-8 border-b border-zinc-200 dark:border-white/[0.05] flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
               <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                   {currentDate.toLocaleString('default', { month: 'long' })} {year}
               </h2>
               <button 
                  onClick={goToToday}
                  className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
               >
                   Today
               </button>
            </div>
            <div className="flex items-center gap-2">
               <button onClick={prevMonth} className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
               </button>
               <button onClick={nextMonth} className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                  <ChevronRight className="w-5 h-5" />
               </button>
            </div>
         </div>
         
         {/* Calendar Grid */}
         <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-white/[0.05]">
             {weekDays.map(day => (
                 <div key={day} className="py-4 text-center text-[10px] font-black text-zinc-500 uppercase tracking-widest border-r last:border-0 border-zinc-200 dark:border-white/[0.05]">
                     {day}
                 </div>
             ))}
         </div>
         <div className="grid grid-cols-7 auto-rows-[minmax(100px,auto)] md:auto-rows-[minmax(140px,auto)]">
             {calendarDays.map((calDay, idx) => {
                 const y = calDay.date.getFullYear();
                 const m = String(calDay.date.getMonth() + 1).padStart(2, '0');
                 const d = String(calDay.date.getDate()).padStart(2, '0');
                 const dateStr = `${y}-${m}-${d}`;
                 
                 const todayDate = new Date();
                 const isToday = dateStr === `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
                 
                 const tasks = getTasksForDate(calDay.date);
                 
                 return (
                     <div 
                        key={idx} 
                        onClick={() => setSelectedDate(dateStr)}
                        className={cn(
                            "p-2 md:p-3 border-r border-b border-zinc-200 dark:border-white/[0.05] transition-colors cursor-pointer group hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                            !calDay.isCurrentMonth && "bg-zinc-50/50 dark:bg-zinc-950/50",
                            idx % 7 === 6 && "border-r-0"
                        )}
                     >
                         <div className="flex justify-between items-start mb-2">
                            <span className={cn(
                                "w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full text-xs md:text-sm font-bold",
                                isToday ? "bg-indigo-500 text-white" : 
                                !calDay.isCurrentMonth ? "text-zinc-400 dark:text-zinc-600" : "text-zinc-900 dark:text-white"
                            )}>
                                {calDay.day}
                            </span>
                            <span className="opacity-0 group-hover:opacity-100 text-zinc-400 dark:text-zinc-600 transition-opacity">
                                <Plus className="w-3 h-3 md:w-4 md:h-4" />
                            </span>
                         </div>
                         
                         <div className="space-y-1 md:space-y-1.5 overflow-hidden">
                            {tasks.slice(0, 3).map((t, i) => (
                                <div key={i} className={cn(
                                    "px-1.5 py-0.5 md:px-2 md:py-1 rounded-[4px] md:rounded-md text-[8px] md:text-[11px] font-bold truncate transition-all",
                                    t.completed ? "opacity-50 line-through bg-zinc-100 dark:bg-zinc-800 text-zinc-500" :
                                    "bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200"
                                )}>
                                    <span className="opacity-70 mr-1">{t.time}</span> {t.text}
                                </div>
                            ))}
                            {tasks.length > 3 && (
                                <div className="text-[11px] md:text-[10px] font-black text-zinc-400 dark:text-zinc-500 px-1 mt-1">
                                    +{tasks.length - 3} more
                                </div>
                            )}
                         </div>
                     </div>
                 );
             })}
         </div>
      </div>

      {/* Task Manager Modal */}
      <AnimatePresence>
        {selectedDate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-zinc-950 p-6 md:p-10 rounded-[3rem] border border-zinc-200 dark:border-white/10 w-full max-w-2xl shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-purple-500" />
              
              <button 
                 onClick={() => setSelectedDate(null)}
                 className="absolute top-6 right-6 w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                  <X className="w-5 h-5" />
              </button>

              <div className="mb-8">
                  <h3 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter mb-2">
                      {/* Note: since selectedDate is YYYY-MM-DD, parsing it as Date in some browsers uses UTC. 
                          We should split and create local date to avoid timezone offset issues */}
                      {(() => {
                          const [y, m, d] = selectedDate.split('-').map(Number);
                          const dateObj = new Date(y, m - 1, d);
                          return dateObj.toLocaleDateString(undefined, { weekday: 'long' });
                      })()}
                  </h3>
                  <p className="text-zinc-500 text-sm font-medium">
                      {(() => {
                          const [y, m, d] = selectedDate.split('-').map(Number);
                          const dateObj = new Date(y, m - 1, d);
                          return dateObj.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
                      })()}
                  </p>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                  {/* Task List */}
                  {(() => {
                      const [y, m, d] = selectedDate.split('-').map(Number);
                      const tasks = getTasksForDate(new Date(y, m - 1, d));
                      if (tasks.length === 0) {
                          return (
                              <div className="py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
                                  <CalendarIcon className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-4" />
                                  <p className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">No tasks scheduled</p>
                              </div>
                          );
                      }
                      return (
                          <div className="space-y-3">
                              {tasks.map((t, i) => (
                                  <div 
                                    key={i} 
                                    className={cn(
                                      "group p-4 bg-zinc-50 dark:bg-black rounded-2xl border transition-all relative",
                                      t.completed 
                                        ? "border-emerald-500/20 opacity-60 bg-emerald-500/[0.02]" 
                                        : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 shadow-sm"
                                    )}
                                  >
                                    <div className="flex items-start gap-4">
                                       <button 
                                         onClick={() => toggleTask(selectedDate, i)}
                                         className={cn(
                                           "mt-1 w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center shrink-0",
                                           t.completed ? "bg-emerald-500 border-emerald-500" : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400"
                                         )}
                                       >
                                         {t.completed && <Check className="w-3.5 h-3.5 text-white" />}
                                       </button>
                                       <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-2">
                                            <div className={cn(
                                              "px-2 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-widest inline-block text-white shadow-lg shadow-black/5",
                                              categoryColors[t.category as keyof typeof categoryColors]
                                            )}>
                                              {t.category}
                                            </div>
                                            {t.time && (
                                              <div className="px-2 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-widest inline-block bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                                {t.time}
                                              </div>
                                            )}
                                          </div>
                                          <p className={cn(
                                            "text-sm font-bold",
                                            t.completed ? "text-zinc-400 line-through" : "text-zinc-900 dark:text-white"
                                          )}>{t.text}</p>
                                       </div>
                                       <button 
                                          onClick={() => removeTask(selectedDate, i)}
                                          className="p-2 text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                  </div>
                              ))}
                          </div>
                      );
                  })()}

                  {/* Add New Task Form */}
                  <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                      <h4 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4">Add New Task</h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <input 
                              value={newTask.text}
                              onChange={(e) => setNewTask({...newTask, text: e.target.value})}
                              onKeyDown={(e) => e.key === 'Enter' && addTask()}
                              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-4 px-6 text-zinc-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 text-sm"
                              placeholder="e.g. Complete Lab Report"
                            />
                          </div>
                          <div>
                            <input 
                              type="time"
                              value={newTask.time}
                              onChange={(e) => setNewTask({...newTask, time: e.target.value})}
                              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-4 px-6 text-zinc-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {['Theory', 'Practice', 'Revision', 'Portfolio'].map((cat) => (
                              <button 
                                key={cat}
                                onClick={() => setNewTask({...newTask, category: cat as any})}
                                className={cn(
                                  "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                  newTask.category === cat 
                                    ? "bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white shadow-lg" 
                                    : "bg-white dark:bg-zinc-950 text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400"
                                )}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                        </div>
                        <button 
                          onClick={addTask}
                          disabled={!newTask.text}
                          className="w-full py-4 bg-indigo-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-500/20"
                        >
                          Add to Schedule
                        </button>
                      </div>
                  </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
