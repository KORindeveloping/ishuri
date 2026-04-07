import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  ClipboardCheck, 
  FolderOpen, 
  Settings, 
  LogOut, 
  Bell, 
  Search, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Camera, 
  Video, 
  ShieldCheck, 
  User as UserIcon,
  Menu,
  X,
  UserCheck,
  Target,
  Calendar,
  Plus,
  Flame,
  Trophy,
  BarChart3,
  Hourglass,
  AlertTriangle,
  CheckSquare,
  TrendingUp,
  Check,
  Zap,
  Award,
  FileText,
  Shield,
  ExternalLink,
  QrCode,
  GraduationCap,
  ListChecks,
  Timer,
  Sun,
  Type,
  Lock,
  Download,
  Trash2,
  Mail,
  History as HistoryIcon,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line
} from 'recharts';
import { cn } from './lib/utils';
import { MOCK_USER, MOCK_ASSESSMENTS } from './constants';
import { User, Trade, Skill, CompetencyStatus, Assessment, PortfolioItem, QuizHistoryItem } from './types';
import { VerificationChecklist } from './components/VerificationChecklist';
import { PastPapers } from './components/PastPapers';
import { api } from './lib/api';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center w-full px-4 py-3 mb-1 transition-all duration-200 rounded-xl group",
      active 
        ? "bg-white text-black shadow-lg shadow-white/10" 
        : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
    )}
  >
    <Icon className={cn("w-5 h-5 mr-3", active ? "text-black" : "text-zinc-500 group-hover:text-white")} />
    <span className="font-medium">{label}</span>
    {active && <motion.div layoutId="sidebar-active" className="ml-auto w-1.5 h-1.5 rounded-full bg-black" />}
  </button>
);

const RAGBadge = ({ status, progress }: { status: CompetencyStatus, progress: number }) => {
  let color = "bg-zinc-800 text-zinc-400 border-zinc-700";
  if (status === 'Competent') color = "bg-white text-black border-white";
  if (status === 'Not Yet Competent' && progress > 40) color = "bg-zinc-700 text-white border-zinc-600";

  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", color)}>
      {status}
    </span>
  );
};

// --- Views ---

const DashboardView = ({ user, onStartQuiz, onLogout, history, onNavigate }: { 
  user: User, 
  onStartQuiz: (quiz: Assessment) => void, 
  onLogout: () => void,
  history: QuizHistoryItem[],
  onNavigate: (tab: string) => void
}) => {
  const [tasks, setTasks] = useState<{ id: any, text: string, completed: boolean }[]>([]);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const goals = await api.getGoals();
        setTasks(goals);
      } catch (e: any) {
        if (e.status === 401) {
          onLogout();
        }
        console.error('Failed to fetch goals');
      }
    };
    fetchGoals();
  }, [onLogout]);

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    try {
      const updated = await api.updateGoal(id, !task.completed);
      setTasks(tasks.map(t => t.id === id ? updated : t));
    } catch (e) {
      alert('Failed to update task.');
    }
  };

  const [generatingQuiz, setGeneratingQuiz] = useState<string | null>(null);

  const startPracticeQuiz = async (subject: string) => {
    setGeneratingQuiz(subject);
    try {
      const quiz = await api.generateQuiz(subject, user.trade || 'General');
      onStartQuiz(quiz);
    } catch (error: any) {
      console.error('Quiz generation failed:', error);
      alert(`Failed to generate AI quiz: ${error.message || 'Check backend connection'}`);
    } finally {
      setGeneratingQuiz(null);
    }
  };

  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const tradeCompetency = user.competencies?.[0];
  const skills = tradeCompetency?.skills || [];

  const onboardingSubjects = (user.subjects || '').split(',').map(s => s.trim()).filter(Boolean);

  const subjects = (skills.length > 0 
    ? skills.map(skill => ({
        name: skill.name,
        progress: skill.progress
      }))
    : (onboardingSubjects.length > 0 
        ? onboardingSubjects.map(s => ({ name: s, progress: 0 }))
        : [
            { name: 'Numeracy Mastery (Offline Mode)', progress: 17 },
            { name: 'Discovery of the World Mastery (Offline Mode)', progress: 24 },
            { name: 'Core Theory & Vehicle Mechanics', progress: 38 },
            { name: 'Practical Skill Competency Portfolio', progress: 12 },
            { name: 'Safety & Ethics for Workshop Professionals', progress: 56 },
            { name: 'Applied Mathematics for Trade Excellence', progress: 9 },
            { name: 'Workshop Management & Business Logic', progress: 0 },
            { name: 'Internal Combustion Engine Diagnosis', progress: 0 },
            { name: 'Advanced Hydraulic Braking Systems', progress: 0 },
            { name: 'ICT Literacy & Digital Diagnostics', progress: 0 },
            { name: 'Trade Science & Material Properties', progress: 0 },
            { name: 'Entrepreneurship & TVET Financial Mastery', progress: 0 }
          ]
      )).filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const avgDashboardScore = history.length > 0 
    ? Math.round(history.reduce((a, b) => a + (b.score / b.totalPoints), 0) / history.length * 100)
    : 0;

  const stats = [
    { label: 'Study Streak', value: `${user.streak || 0} Days`, icon: Flame, color: 'text-white' },
    { label: 'Topics Mastered', value: skills.filter(s => s.status === 'Competent').length.toString(), icon: Trophy, color: 'text-white' },
    { label: 'Avg. Quiz Score', value: `${avgDashboardScore}%`, icon: BarChart3, color: 'text-white' },
    { label: 'Quizzes Taken', value: history.length.toString(), icon: Hourglass, color: 'text-white' },
  ];

  const upcomingExams = tasks
    .filter(t => !t.completed && (t.text.toLowerCase().includes('exam') || t.text.toLowerCase().includes('assessment') || t.text.toLowerCase().includes('test')))
    .map(t => ({
      id: t.id,
      title: t.text,
      date: (t as any).dueDate ? new Date((t as any).dueDate).toLocaleDateString() : 'Personal Goal',
      urgency: (t as any).urgency || 'soon',
      trade: user.trade || 'General'
    }));

  const [newGoalUrgency, setNewGoalUrgency] = useState<'critical' | 'soon' | 'later'>('soon');
  const [newGoalDate, setNewGoalDate] = useState('');

  return (
    <div className="space-y-8 pb-12">
      {/* Top Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-900 p-8 rounded-[2rem] border border-zinc-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[100px] -mr-32 -mt-32 rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-black text-white tracking-tight">{user.name}</h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-full">
              <Zap className="w-3 h-3 fill-current" /> Exam Prep Mode
            </div>
          </div>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        
        <div className="flex items-center gap-8 relative z-10">
          <div className="text-right">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Countdown to Finals</p>
            <div className="flex items-baseline gap-1 justify-end">
              <span className="text-4xl font-black text-white tabular-nums">14</span>
              <span className="text-sm font-bold text-zinc-500 uppercase">Days</span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-xl shadow-white/10">
            <Calendar className="w-7 h-7 text-black" />
          </div>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label} 
            className="p-6 bg-zinc-900 rounded-3xl border border-zinc-800 hover:border-zinc-700 transition-all group relative overflow-hidden"
          >
            <div className="absolute bottom-0 right-0 w-16 h-16 bg-white/5 blur-2xl rounded-full -mb-8 -mr-8" />
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center border border-zinc-700 group-hover:bg-white group-hover:text-black transition-all">
                <stat.icon className="w-5 h-5" />
              </div>
              <TrendingUp className="w-4 h-4 text-zinc-700" />
            </div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{stat.label}</p>
            <p className="text-3xl font-black text-white mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Subject Progress */}
          <section className="bg-zinc-900 p-8 rounded-[2rem] border border-zinc-800">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
                <BarChart3 className="w-6 h-6 text-zinc-500" /> Subject Progress
              </h2>
              <button 
                onClick={() => onNavigate('analytics')}
                className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors"
              >
                Detailed Analytics
              </button>
            </div>
            <div className="space-y-8">
              {subjects.map((subject) => (
                <div 
                  key={subject.name}
                  onClick={() => !generatingQuiz && startPracticeQuiz(subject.name)}
                  className={cn(
                    "p-4 rounded-2xl border border-transparent hover:bg-black/40 hover:border-zinc-800 transition-all cursor-pointer group/subject relative",
                    generatingQuiz === subject.name && "opacity-60 cursor-wait"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-zinc-300 uppercase tracking-wide group-hover/subject:text-white transition-colors">{subject.name}</span>
                      {generatingQuiz === subject.name ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <div className="px-2 py-0.5 rounded-full bg-white/10 text-[8px] font-black text-zinc-500 uppercase tracking-widest group-hover/subject:bg-white group-hover/subject:text-black transition-all">
                          Master Topic
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-black text-white tabular-nums">{subject.progress}%</span>
                  </div>
                  <div className="w-full h-3 bg-black rounded-full overflow-hidden border border-zinc-800 p-0.5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${subject.progress}%` }}
                      className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        subject.progress >= 80 ? "bg-white shadow-[0_0_15px_rgba(255,255,255,0.3)]" : 
                        subject.progress >= 40 ? "bg-zinc-500" : "bg-zinc-800"
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Upcoming Exams */}
          <section className="bg-zinc-900 p-8 rounded-[2rem] border border-zinc-800">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
                <AlertTriangle className="w-6 h-6 text-zinc-500" /> Upcoming Exams
              </h2>
            </div>
            <div className="space-y-4">
              {upcomingExams.map((exam) => (
                <div key={exam.id} className="flex items-center justify-between p-5 bg-black rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all group">
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "w-1.5 h-12 rounded-full",
                      exam.urgency === 'critical' ? "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]" : 
                      exam.urgency === 'soon' ? "bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]" : 
                      "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
                    )} />
                    <div>
                      <h3 className="font-black text-white text-lg tracking-tight">{exam.title}</h3>
                      <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">{exam.trade} • {exam.date}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                    exam.urgency === 'critical' ? "bg-red-500/10 text-red-500 border-red-500/20" : 
                    exam.urgency === 'soon' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" : 
                    "bg-green-500/10 text-green-500 border-green-500/20"
                  )}>
                    {exam.urgency === 'critical' ? 'Very Soon' : exam.urgency === 'soon' ? 'Coming Up' : 'Still Time'}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Practice Quizzes */}
          <section className="bg-zinc-900 p-8 rounded-[2rem] border border-zinc-800">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
                <Zap className="w-6 h-6 text-zinc-500" /> Practice Quizzes
              </h2>
              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-800 rounded-full border border-zinc-700">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">AI Engine Ready</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {subjects.map((subject) => (
                <button 
                  key={subject.name}
                  onClick={() => startPracticeQuiz(subject.name)}
                  disabled={generatingQuiz !== null}
                  className="flex flex-col items-center justify-center p-6 bg-black rounded-3xl border border-zinc-800 hover:bg-white hover:text-black transition-all group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute top-0 right-0 w-12 h-12 bg-white/5 -mr-6 -mt-6 rounded-full group-hover:bg-black/10" />
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center mb-4 group-hover:bg-black group-hover:text-white transition-colors border border-zinc-800">
                    {generatingQuiz === subject.name ? (
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      >
                        <Zap className="w-6 h-6 text-white" />
                      </motion.div>
                    ) : (
                      <BookOpen className="w-6 h-6" />
                    )}
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-center leading-tight">
                    {generatingQuiz === subject.name ? 'Generating...' : (
                      <>
                        {subject.name.split(' ')[0]}<br/>{subject.name.split(' ')[1] || 'Quiz'}
                      </>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Today's Tasks */}
          <section className="bg-zinc-900 p-8 rounded-[2rem] border border-zinc-800">
            <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tight mb-8">
              <CheckSquare className="w-6 h-6 text-zinc-500" /> Today's Tasks
            </h2>
            <div className="space-y-4">
              {tasks.map((task) => (
                <button 
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-black border border-zinc-800 hover:border-zinc-700 transition-all text-left group"
                >
                  <div className={cn(
                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                    task.completed ? "bg-white border-white" : "border-zinc-800 group-hover:border-zinc-600"
                  )}>
                    {task.completed && <Check className="w-4 h-4 text-black stroke-[4]" />}
                  </div>
                  <span className={cn(
                    "text-sm font-bold transition-all",
                    task.completed ? "text-zinc-600 line-through" : "text-zinc-200"
                  )}>
                    {task.text}
                  </span>
                </button>
              ))}
            </div>
            <button 
              onClick={() => setIsAddingGoal(true)}
              className="w-full mt-8 py-4 border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-600 text-[10px] font-black uppercase tracking-widest hover:border-zinc-600 hover:text-zinc-400 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add New Goal
            </button>
          </section>

          <AnimatePresence>
            {isAddingGoal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 w-full max-w-md shadow-2xl"
                >
                  <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight">New Study Goal / Exam</h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Title</label>
                      <input 
                        type="text" 
                        value={newGoal}
                        onChange={(e) => setNewGoal(e.target.value)}
                        placeholder="e.g. Final Theory Exam"
                        className="w-full bg-black border border-zinc-800 rounded-2xl py-4 px-6 text-white outline-none focus:ring-2 focus:ring-white/10"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Due Date</label>
                      <input 
                        type="date" 
                        value={newGoalDate}
                        onChange={(e) => setNewGoalDate(e.target.value)}
                        className="w-full bg-black border border-zinc-800 rounded-2xl py-4 px-6 text-white outline-none focus:ring-2 focus:ring-white/10 [color-scheme:dark]"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Priority</label>
                      <div className="grid grid-cols-3 gap-3">
                        {(['critical', 'soon', 'later'] as const).map((u) => (
                          <button
                            key={u}
                            onClick={() => setNewGoalUrgency(u)}
                            className={cn(
                              "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                              newGoalUrgency === u 
                                ? "bg-white text-black border-white" 
                                : "bg-black text-zinc-500 border-zinc-800 hover:border-zinc-700"
                            )}
                          >
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-4 pt-2">
                      <button 
                        onClick={() => {
                          setIsAddingGoal(false);
                          setNewGoal('');
                          setNewGoalDate('');
                        }}
                        className="flex-1 py-4 bg-zinc-800 text-white rounded-2xl font-bold hover:bg-zinc-700 transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={async () => {
                          if (newGoal) {
                            try {
                              const goal = await api.createGoal(newGoal, newGoalUrgency, newGoalDate);
                              setTasks([goal, ...tasks]);
                              setNewGoal('');
                              setNewGoalDate('');
                              setIsAddingGoal(false);
                            } catch (e) {
                              alert('Failed to save goal.');
                            }
                          }
                        }}
                        className="flex-1 py-4 bg-white text-black rounded-2xl font-bold hover:bg-zinc-100 transition-all"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Streak Tracker */}
          <section className="bg-zinc-900 p-8 rounded-[2rem] border border-zinc-800">
            <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tight mb-8">
              <Flame className="w-6 h-6 text-zinc-500" /> Consistency
            </h2>
            <div className="flex justify-between mb-10">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
                // Calculate if this day should be marked as "complete"
                // 0 for Mon, 6 for Sun
                const todayIndex = (new Date().getDay() + 6) % 7; 
                const isToday = i === todayIndex;
                const isPastInStreak = i < todayIndex && i >= (todayIndex - ((user.streak || 1) - 1));
                const isActive = isToday || isPastInStreak;

                return (
                  <div key={i} className="flex flex-col items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black transition-all",
                      isActive ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]" : "bg-zinc-800 text-zinc-600"
                    )}>
                      {isActive ? <Check className="w-5 h-5 stroke-[3]" /> : day}
                    </div>
                    <span className={cn("text-[10px] font-black uppercase", isActive ? "text-white" : "text-zinc-700")}>{day}</span>
                  </div>
                );
              })}
            </div>
            
            <div className="space-y-6">
              <div className="p-5 bg-black rounded-3xl border border-zinc-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1 h-full bg-zinc-700" />
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Subject Concentration</p>
                <p className="text-lg font-black text-white tracking-tight">{user.subjects?.split(',')[0] || 'Core Theory'}</p>
                <p className="text-xs font-bold text-zinc-500 mt-1">Mastery: 42%</p>
              </div>

              <div className="p-6 bg-white text-black rounded-3xl shadow-xl shadow-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Recommended Focus</p>
                </div>
                <p className="text-sm font-black leading-tight">Mastering {user.subjects?.split(',')[1] || 'Practical Fundamentals'}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
const AnalyticsView = ({ history, user, onStartQuiz }: { 
  history: QuizHistoryItem[], 
  user: User,
  onStartQuiz: (quiz: Assessment) => void
}) => {
  const [generatingQuiz, setGeneratingQuiz] = useState<string | null>(null);

  const startPracticeQuiz = async (subject: string) => {
    setGeneratingQuiz(subject);
    try {
      const quiz = await api.generateQuiz(subject, user.trade || 'General');
      onStartQuiz(quiz);
    } catch (error: any) {
      console.error('Quiz generation failed:', error);
      alert(`Failed to generate AI quiz: ${error.message || 'Check backend connection'}`);
    } finally {
      setGeneratingQuiz(null);
    }
  };

  const tradeCompetency = user.competencies?.[0];
  const skills = tradeCompetency?.skills || [];
  const onboardingSubjects = (user.subjects || '').split(',').map(s => s.trim()).filter(Boolean);

  const subjects = skills.length > 0 
    ? skills.map(skill => ({ name: skill.name, progress: skill.progress }))
    : onboardingSubjects.length > 0 
      ? onboardingSubjects.map(s => ({ name: s, progress: 0 }))
      : [
          { name: 'Numeracy Mastery (Offline Mode)', progress: 17 },
          { name: 'Discovery of the World Mastery (Offline Mode)', progress: 24 },
          { name: 'Core Theory & Vehicle Mechanics', progress: 0 },
          { name: 'Practical Skill Competency Portfolio', progress: 0 },
          { name: 'Safety & Ethics for Workshop Professionals', progress: 0 },
          { name: 'Applied Mathematics for Trade Excellence', progress: 0 },
          { name: 'Workshop Management & Business Logic', progress: 0 },
          { name: 'Internal Combustion Engine Diagnosis', progress: 0 },
          { name: 'Advanced Hydraulic Braking Systems', progress: 0 },
          { name: 'ICT Literacy & Digital Diagnostics', progress: 0 },
          { name: 'Trade Science & Material Properties', progress: 0 },
          { name: 'Entrepreneurship & TVET Financial Mastery', progress: 0 }
        ];

  const chartData = subjects.map(s => ({
    name: s.name.split(' ')[0],
    mastery: s.progress,
    points: Math.floor(s.progress * 1.5)
  }));

  const avgMastery = history.length > 0 
    ? Math.round(history.reduce((a, b) => a + (b.score / b.totalPoints), 0) / history.length * 100)
    : 0;

  return (
    <div className="space-y-8 pb-12">
      <header>
        <h1 className="text-3xl font-black text-white tracking-tight">Learning Analytics</h1>
        <p className="text-zinc-500 font-medium">Deep dive into your mastery and exam readiness.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800">
          <h2 className="text-xl font-black text-white mb-8 uppercase tracking-tight">Skill Mastery Breakdown</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Bar dataKey="mastery" fill="#fff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 flex flex-col items-center justify-center text-center">
          <div className="w-32 h-32 rounded-full border-8 border-white/10 flex items-center justify-center relative mb-6">
            <div className="absolute inset-0 border-8 border-white border-t-transparent rounded-full animate-[spin_3s_linear_infinite]" />
            <span className="text-3xl font-black text-white">{avgMastery}%</span>
          </div>
          <h3 className="text-lg font-black text-white mb-2 uppercase">Exam Readiness</h3>
          <p className="text-sm text-zinc-500 font-medium leading-relaxed">
            Based on your recent {history.length} quizzes and learning history, you are projected to score a <b>{avgMastery >= 75 ? 'Distinction' : avgMastery >= 60 ? 'First Class' : 'Pass'}</b> in the upcoming finals.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {subjects.map((subject) => (
          <div 
            key={subject.name}
            onClick={() => !generatingQuiz && startPracticeQuiz(subject.name)}
            className={cn(
              "p-8 bg-zinc-900 rounded-[2.5rem] border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer group flex items-center justify-between",
              generatingQuiz === subject.name && "opacity-60 cursor-wait"
            )}
          >
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Mastery for {subject.name}</p>
              <h4 className="text-xl font-black text-white mb-4 line-clamp-1">{subject.name}</h4>
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-widest group-hover:bg-zinc-200">
                  {generatingQuiz === subject.name ? 'Generating...' : 'Master Topic'}
                </div>
                <span className="text-xs font-bold text-zinc-500 uppercase">Progress: {subject.progress}%</span>
              </div>
            </div>
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 relative overflow-hidden">
               <div 
                 className="absolute bottom-0 left-0 w-full bg-white/10 transition-all duration-1000" 
                 style={{ height: `${subject.progress}%` }} 
               />
               <Target className="w-6 h-6 text-white relative z-10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FlashcardsView = () => {
  const cards = [
    { q: "What is the stoichiometric ratio for gasoline?", a: "14.7:1" },
    { q: "What does ABS stand for?", a: "Anti-lock Braking System" },
    { q: "What is the unit of electrical resistance?", a: "Ohm (Ω)" },
    { q: "What is the primary function of a thermostat?", a: "Regulate engine temperature" },
  ];
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="space-y-8 flex flex-col items-center p-4">
      <header className="w-full text-left">
        <h1 className="text-3xl font-black text-white tracking-tight">Active Recall Flashcards</h1>
        <p className="text-zinc-500 font-medium">Master key concepts through spaced repetition.</p>
      </header>

      <div 
        onClick={() => setFlipped(!flipped)}
        className="w-full max-w-lg aspect-[4/3] relative cursor-pointer perspective-1000 group mt-12"
      >
        <motion.div 
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
          className="w-full h-full relative preserve-3d"
        >
          <div className="absolute inset-0 bg-zinc-900 border-2 border-zinc-800 rounded-[3rem] p-12 flex flex-col items-center justify-center text-center backface-hidden">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-8">Question</p>
            <h2 className="text-2xl font-black text-white leading-tight">{cards[index].q}</h2>
            <p className="text-xs text-zinc-600 mt-12 font-bold uppercase tracking-widest">Tap to reveal answer</p>
          </div>
          <div className="absolute inset-0 bg-white border-2 border-white rounded-[3rem] p-12 flex flex-col items-center justify-center text-center backface-hidden rotate-y-180">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-8">Answer</p>
            <h2 className="text-2xl font-black text-black leading-tight">{cards[index].a}</h2>
            <p className="text-xs text-zinc-300 mt-12 font-bold uppercase tracking-widest">Tap to flip back</p>
          </div>
        </motion.div>
      </div>

      <div className="flex gap-6 mt-8">
        <button 
          onClick={(e) => { e.stopPropagation(); setIndex((index - 1 + cards.length) % cards.length); setFlipped(false); }}
          className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-white hover:text-black transition-all"
        >
          <ChevronRight className="w-6 h-6 rotate-180" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); setIndex((index + 1) % cards.length); setFlipped(false); }}
          className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-white hover:text-black transition-all"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

const PlannerView = () => {
  const schedule = [
    { day: "Monday", tasks: ["Engine Theory", "Wiring Diagrams"] },
    { day: "Tuesday", tasks: ["Brake Systems Practice", "Safety Quiz"] },
    { day: "Wednesday", tasks: ["Hydraulics Lab", "Technical Report"] },
    { day: "Thursday", tasks: ["Final Review", "Past Papers"] },
    { day: "Friday", tasks: ["Mock Exam", "Portfolio Cleanup"] },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-white tracking-tight">Study Schedule</h1>
        <p className="text-zinc-500 font-medium">Your personalized roadmap to exam success.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {schedule.map(s => (
          <div key={s.day} className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
            <h3 className="font-black text-white uppercase tracking-widest text-[10px] mb-4">{s.day}</h3>
            <div className="space-y-3">
              {s.tasks.map(t => (
                <div key={t} className="p-3 bg-black rounded-xl border border-zinc-800 text-[10px] font-bold text-zinc-400">
                  {t}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const QuizHistoryView = ({ history, onReviewQuiz }: { history: QuizHistoryItem[], onReviewQuiz: (historyItem: QuizHistoryItem) => void }) => {
  return (
    <div className="space-y-8 pb-12">
      <header>
        <h1 className="text-3xl font-black text-white tracking-tight">Quiz History</h1>
        <p className="text-zinc-500 font-medium">Review your previous attempts and track improvement.</p>
      </header>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/50 rounded-[2.5rem] border border-zinc-800 border-dashed">
          <HistoryIcon className="w-16 h-16 text-zinc-700 mb-4" />
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">No quizzes completed yet.</p>
          <p className="text-zinc-600 text-xs mt-2">Finish a practice quiz to see it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {history.map((item) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-zinc-900 rounded-3xl border border-zinc-800 hover:border-zinc-700 transition-all group relative overflow-hidden"
            >
               <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center border border-zinc-700">
                     <FileText className="w-5 h-5 text-zinc-400" />
                   </div>
                   <div>
                     <h3 className="font-bold text-white tracking-tight">{item.title}</h3>
                     <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{item.dateCompleted}</p>
                   </div>
                 </div>
                 <div className="flex flex-col items-end">
                   <div className="flex items-baseline gap-1">
                     <span className="text-2xl font-black text-white">{item.score}</span>
                     <span className="text-xs text-zinc-500 font-bold">/{item.totalPoints}</span>
                   </div>
                   <div className={cn(
                     "mt-1 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                     (item.score / item.totalPoints >= 0.7) ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                   )}>
                     {(item.score / item.totalPoints * 100).toFixed(0)}% Mastery
                   </div>
                 </div>
               </div>

               <div className="flex items-center gap-2 mt-6">
                 <button 
                  onClick={() => onReviewQuiz(item)}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-white hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                 >
                   <Search className="w-3 h-3" /> Review Answers
                 </button>
                 <button 
                  onClick={() => (window as any).refreshQuiz(item.quiz)}
                  className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-all"
                 >
                   <RotateCcw className="w-4 h-4" />
                 </button>
               </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

const checkAnswer = (userAnswer: string | undefined, correctAnswer: string | string[] | undefined): boolean => {
  if (!userAnswer || !correctAnswer) return false;
  const normalizedUser = userAnswer.toLowerCase().trim();
  if (typeof correctAnswer === 'string') {
    return normalizedUser === correctAnswer.toLowerCase().trim();
  }
  if (Array.isArray(correctAnswer)) {
    return correctAnswer.some(a => a.toLowerCase().trim() === normalizedUser);
  }
  return false;
};

const AssessmentView = ({ 
  assessments, 
  customQuiz, 
  onClearCustomQuiz,
  onComplete,
  reviewHistoryItem
}: { 
  assessments: Assessment[], 
  customQuiz?: Assessment | null, 
  onClearCustomQuiz?: () => void,
  onComplete?: (historyItem: QuizHistoryItem) => void,
  reviewHistoryItem?: QuizHistoryItem | null
}) => {
  const [activeExam, setActiveExam] = useState<Assessment | null>(reviewHistoryItem?.quiz || customQuiz || null);
  const [showChecklist, setShowChecklist] = useState(false);
  const [practicalScore, setPracticalScore] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>(reviewHistoryItem?.userAnswers || {});
  const [submitted, setSubmitted] = useState(!!reviewHistoryItem);
  const [timeLeft, setTimeLeft] = useState((reviewHistoryItem?.quiz.timeLimit || customQuiz?.timeLimit || 60) * 60);

  useEffect(() => {
    if (reviewHistoryItem) {
      setActiveExam(reviewHistoryItem.quiz);
      setAnswers(reviewHistoryItem.userAnswers);
      setSubmitted(true);
      setTimeLeft(0);
    } else if (customQuiz) {
      setActiveExam(customQuiz);
      setAnswers({});
      setSubmitted(false);
      setTimeLeft(customQuiz.timeLimit * 60);
    }
  }, [customQuiz, reviewHistoryItem]);

  useEffect(() => {
    if (!activeExam || submitted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeExam, submitted, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExit = () => {
    setActiveExam(null);
    if (onClearCustomQuiz) onClearCustomQuiz();
  };

  const handleSubmit = () => {
    if (!activeExam) return;

    let totalPoints = 0;
    let earnedPoints = 0;

      activeExam.questions.forEach(q => {
        totalPoints += q.points;
        const userAnswer = answers[q.id]?.toLowerCase().trim();
        const correctAns = q.correctAnswer;
        
        let isCorrect = false;
        if (typeof correctAns === 'string') {
          isCorrect = userAnswer === correctAns.toLowerCase().trim();
        } else if (Array.isArray(correctAns)) {
          isCorrect = correctAns.some(a => a.toLowerCase().trim() === userAnswer);
        }

        if (q.type !== 'Practical' && isCorrect) {
          earnedPoints += q.points;
        }
      });

    setSubmitted(true);

    const historyItem: QuizHistoryItem = {
      id: `history-${Date.now()}`,
      quizId: activeExam.id,
      title: activeExam.title,
      trade: activeExam.trade,
      score: earnedPoints,
      totalPoints: totalPoints,
      dateCompleted: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      userAnswers: answers,
      quiz: activeExam
    };

    if (onComplete) onComplete(historyItem);
  };

  if (!activeExam) {
    return (
      <div className="space-y-8 pb-12">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Assessment Library</h1>
            <p className="text-zinc-500 font-medium">Choose a practice exam or certification simulation.</p>
          </div>
          <div className="flex items-center gap-3 bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800">
            <Search className="w-4 h-4 text-zinc-500" />
            <input type="text" placeholder="Search assessments..." className="bg-transparent border-none text-xs focus:ring-0 text-white w-48" />
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessments.map((exam) => (
            <motion.div 
              key={exam.id}
              whileHover={{ y: -5 }}
              className="bg-zinc-900 rounded-[2.5rem] border border-zinc-800 p-8 flex flex-col group hover:border-zinc-700 transition-all cursor-pointer overflow-hidden relative"
              onClick={() => setActiveExam(exam)}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl -mr-16 -mt-16 rounded-full" />
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center border border-zinc-700 group-hover:bg-white group-hover:text-black transition-all">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="px-3 py-1 rounded-full bg-black/40 text-[10px] font-black text-zinc-500 uppercase tracking-widest border border-zinc-800">
                  {exam.timeLimit} Min
                </div>
              </div>
              <h3 className="text-xl font-black text-white mb-2 leading-tight">{exam.title}</h3>
              <p className="text-xs text-zinc-500 font-medium mb-8 uppercase tracking-widest">{exam.trade} Certification</p>
              
              <div className="mt-auto flex items-center justify-between">
                <div className="flex -space-x-2">
                   {[1,2,3].map(i => (
                     <div key={i} className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center text-[10px] font-black text-white overflow-hidden">
                       <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="user" />
                     </div>
                   ))}
                   <div className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center text-[10px] font-black text-zinc-500">
                     +12
                   </div>
                </div>
                <div className="flex items-center gap-2 text-white font-black text-[10px] uppercase tracking-widest">
                  Start Exam <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <header className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950 text-white">
          <div className="flex items-center gap-4">
            <ShieldCheck className="w-6 h-6 text-white" />
            <div>
              <h2 className="font-bold">{activeExam.title}</h2>
              <p className="text-xs text-zinc-500">Proctored Session • Browser Locked</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-lg">
              <Clock className="w-4 h-4 text-zinc-400" />
              <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
            </div>
            <button 
              onClick={handleExit}
              className="px-4 py-1.5 bg-zinc-100 text-black hover:bg-white rounded-lg text-sm font-bold transition-colors"
            >
              Exit Exam
            </button>
          </div>
        </header>
        
        <div className="flex-1 flex overflow-hidden">
          <aside className="w-64 border-r border-zinc-800 p-6 bg-zinc-950 overflow-y-auto hidden lg:block">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Questions</h3>
            <div className="grid grid-cols-4 gap-2">
              {activeExam.questions.map((_, i) => (
                <button 
                  key={i}
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold border transition-all",
                    i === 0 ? "bg-white text-black border-white" : "bg-black text-zinc-400 border-zinc-800 hover:border-zinc-500"
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            
            <div className="mt-8 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <Camera className="w-4 h-4 text-white" />
                <span className="text-xs font-bold text-white">AI Proctoring Active</span>
              </div>
              <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-white animate-pulse" />
                <img src="https://i.pravatar.cc/100?img=12" className="w-full h-full object-cover opacity-50" alt="proctor" />
              </div>
              <p className="text-[10px] text-zinc-500 mt-2">Face detected. Eye tracking enabled.</p>
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto p-8 bg-black">
            <div className="max-w-3xl mx-auto space-y-8">
              {activeExam.questions.map((q, i) => (
                <div key={q.id} className={cn(
                  "p-8 rounded-2xl border transition-all duration-500",
                  submitted 
                    ? (q.type !== 'Practical' && checkAnswer(answers[q.id], q.correctAnswer))
                      ? "bg-green-500/10 border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.1)]"
                      : "bg-red-500/10 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.1)]"
                    : "bg-zinc-900 border-zinc-800"
                )}>
                  <div className="flex items-start justify-between mb-6">
                    <span className="px-3 py-1 bg-zinc-800 rounded-lg text-xs font-bold text-zinc-400">Question {i + 1}</span>
                    <span className="text-sm font-medium text-zinc-500">{q.points} Points</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-6">{q.text}</h3>
                  
                  {q.mediaUrl && (
                    <div className="mb-6 rounded-xl overflow-hidden border border-zinc-800">
                      <img src={q.mediaUrl} className="w-full h-auto" alt="Question Media" referrerPolicy="no-referrer" />
                    </div>
                  )}

                  {q.type === 'MCQ' && (
                    <div className="space-y-3">
                      {q.options?.map((opt, idx) => (
                        <label key={idx} className={cn(
                          "flex items-center p-4 border rounded-xl cursor-pointer transition-all group",
                          answers[q.id] === opt 
                            ? "bg-white text-black border-white" 
                            : "border-zinc-800 hover:bg-zinc-800 text-zinc-300"
                        )}>
                          <input 
                            type="radio" 
                            name={`q-${q.id}`} 
                            checked={answers[q.id] === opt}
                            onChange={() => !submitted && setAnswers({...answers, [q.id]: opt})}
                            className="hidden" 
                          />
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 transition-all",
                            answers[q.id] === opt ? "border-black bg-black" : "border-zinc-700"
                          )}>
                            {answers[q.id] === opt && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                          </div>
                          <span className="font-medium">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === 'Practical' && (
                    <div className="p-6 bg-zinc-950 rounded-xl border border-zinc-800">
                      <div className="flex items-center gap-3 mb-4">
                        <Video className="w-5 h-5 text-zinc-400" />
                        <h4 className="font-bold text-white">Practical Verification Required</h4>
                      </div>
                      <p className="text-sm text-zinc-400 mb-4">This task requires a supervisor to verify your performance using the digital checklist.</p>
                      {practicalScore !== null ? (
                        <div className="flex items-center gap-2 text-white font-bold">
                          <CheckCircle2 className="w-5 h-5" /> Verified Score: {practicalScore}%
                        </div>
                      ) : (
                        <button 
                          onClick={() => setShowChecklist(true)}
                          className="px-6 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors"
                        >
                          Trigger Supervisor Verification
                        </button>
                      )}
                    </div>
                  )}

                  {q.type === 'ShortAnswer' && (
                    <div className="space-y-4">
                      <input 
                        type="text"
                        value={answers[q.id] || ''}
                        disabled={submitted}
                        onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                        className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:ring-2 focus:ring-white/20 focus:border-transparent text-white outline-none"
                        placeholder="Type your answer here..."
                      />
                      {submitted && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="p-4 bg-zinc-800 rounded-xl border border-zinc-700"
                        >
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Correct Answer</p>
                          <p className="text-sm font-bold text-white">{q.correctAnswer}</p>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {submitted && q.type !== 'Practical' && (
                    <div className="mt-6 flex items-center gap-2">
                       {checkAnswer(answers[q.id], q.correctAnswer) ? (
                         <>
                           <CheckCircle2 className="w-5 h-5 text-green-500" />
                           <span className="text-sm font-bold text-green-500 uppercase tracking-widest">Correct Answer</span>
                         </>
                       ) : (
                         <>
                           <AlertCircle className="w-5 h-5 text-red-500" />
                           <span className="text-sm font-bold text-red-500 uppercase tracking-widest">Incorrect</span>
                         </>
                       )}
                    </div>
                  )}
                </div>
              ))}
              
              <div className="flex justify-end gap-4 pt-8">
                {!submitted ? (
                  <>
                    <button className="px-8 py-3 bg-zinc-900 text-zinc-400 rounded-xl font-bold hover:bg-zinc-800 transition-colors">Save Draft</button>
                    <button 
                      onClick={handleSubmit}
                      className="px-8 py-3 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10"
                    >
                      Submit & Review
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={handleExit}
                    className="px-8 py-3 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 transition-colors"
                  >
                    Return to Dashboard
                  </button>
                )}
              </div>
            </div>
          </main>
        </div>

        <AnimatePresence>
          {showChecklist && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <VerificationChecklist onComplete={(score) => {
                  setPracticalScore(score);
                  setShowChecklist(false);
                }} />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
};

const PortfolioView = ({ user }: { user: User }) => {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const data = await api.getPortfolio();
        setItems(data);
      } catch (e) {
        console.error('Failed to fetch portfolio');
      }
    };
    fetchPortfolio();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('media', file);
    formData.append('title', `Assessment Evidence: ${file.name}`);
    formData.append('description', `Work evidence uploaded on ${new Date().toLocaleDateString()}`);
    formData.append('type', 'evidence');

    try {
      const newItem = await api.uploadEvidence(formData);
      setItems(prev => [newItem, ...prev]);
      alert('Portfolio item uploaded successfully!');
    } catch (e) {
      console.error('Upload failed:', e);
      alert('Failed to upload portfolio item.');
    } finally {
      setLoading(false);
    }
  };

  const [selectedCertificate, setSelectedCertificate] = useState<boolean>(false);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">E-Portfolio</h1>
          <p className="text-zinc-500 font-medium">Your verified evidence and academic credentials.</p>
        </div>
        <label className="px-6 py-2.5 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-lg shadow-white/10 cursor-pointer">
          <Plus className="w-4 h-4" /> 
          <span>{loading ? 'Uploading...' : 'Upload Evidence'}</span>
          <input 
            type="file" 
            className="hidden" 
            onChange={handleFileUpload}
            disabled={loading}
          />
        </label>
      </header>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-zinc-500" /> Portfolio Items
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div 
              key={item.id} 
              className={cn(
                "bg-zinc-900 rounded-2xl border border-zinc-800 shadow-sm overflow-hidden group cursor-pointer transition-all hover:border-zinc-700",
                item.type === 'certificate' && "ring-2 ring-[#c8b97a]/20 border-[#c8b97a]/30"
              )}
              onClick={() => {
                if (item.type === 'certificate') {
                  setSelectedCertificate(true);
                }
              }}
            >
              <div className="aspect-video relative overflow-hidden">
                <img src={item.mediaUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.title} referrerPolicy="no-referrer" />
                <div className="absolute top-3 right-3 flex gap-2">
                  {item.type === 'certificate' && (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-[#c8b97a] text-[#1a1a2e] shadow-lg">
                      Certificate
                    </span>
                  )}
                  <span className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm",
                    item.status === 'Verified' ? "bg-white text-black" : "bg-zinc-700 text-white"
                  )}>
                    {item.status}
                  </span>
                </div>
                {item.mediaType === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                      <Video className="w-6 h-6 text-white" />
                    </div>
                  </div>
                )}
                {item.type === 'certificate' && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="px-4 py-2 bg-[#c8b97a] text-[#1a1a2e] rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                      <Award className="w-4 h-4" /> View Certificate
                    </div>
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className={cn(
                  "font-bold mb-1",
                  item.type === 'certificate' ? "text-[#c8b97a]" : "text-white"
                )}>{item.title}</h3>
                <p className="text-sm text-zinc-400 line-clamp-2 mb-4">{item.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  <span className="text-xs text-zinc-500 font-medium">{item.timestamp}</span>
                  <button className="text-sm font-bold text-white hover:text-zinc-300">
                    {item.type === 'certificate' ? 'View Certificate' : 'View Details'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Certificate Modal */}
      <AnimatePresence>
        {selectedCertificate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCertificate(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setSelectedCertificate(false)}
                className="absolute top-4 right-4 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              <CertificateView user={user} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Certificate View ---

const CertificateView = ({ user }: { user: User }) => {
  const certificate = {
    schoolName: "Metropolitan Technical Institute",
    location: "London, United Kingdom",
    type: "Certificate of Technical Competence",
    recipientName: user.name,
    programme: "Automotive Engineering & Diagnostics",
    yearLevel: "Level 3 Advanced",
    academicYear: "2023 - 2024",
    bodyText: "This is to certify that the above named student has successfully completed the prescribed course of study and has demonstrated high proficiency in the technical competencies listed below, meeting all institutional standards for professional practice.",
    subjects: ["Engine Diagnostics", "Brake Systems", "Electrical Systems", "Transmission", "Hybrid Tech"],
    signatures: [
      { name: "Dr. Sarah Miller", title: "Head of Academics" },
      { name: "Prof. Robert Chen", title: "Principal" }
    ],
    gradeBand: {
      gpa: "3.85",
      overallGrade: "Distinction",
      distinctionLevel: "High Honors",
      projectCount: 12
    },
    id: "CERT-MTI-2024-0892",
    verificationUrl: "https://mti.edu/verify/CERT-MTI-2024-0892"
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl bg-[#1a1a2e] border-[12px] border-[#c8b97a] shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden text-[#c8b97a] font-serif">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(#c8b97a 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        {/* Header */}
        <div className="pt-16 pb-10 text-center px-12 relative z-10">
          <h1 className="text-2xl font-bold uppercase tracking-[0.3em] mb-2">{certificate.schoolName}</h1>
          <p className="text-xs uppercase tracking-[0.2em] opacity-80 mb-8">{certificate.location}</p>
          <div className="w-32 h-px bg-[#c8b97a] mx-auto mb-8 opacity-40" />
          <h2 className="text-4xl font-bold uppercase tracking-[0.15em] italic">{certificate.type}</h2>
        </div>

        {/* Recipient */}
        <div className="py-8 text-center px-12 relative z-10">
          <p className="text-sm uppercase tracking-widest mb-6 opacity-70">This certificate is proudly awarded to</p>
          <h3 className="text-7xl font-black text-white tracking-tight mb-8 font-sans">{certificate.recipientName}</h3>
          <div className="w-full max-w-md h-px bg-gradient-to-r from-transparent via-[#c8b97a] to-transparent mx-auto opacity-30" />
        </div>

        {/* Programme Details */}
        <div className="py-6 text-center px-12 relative z-10">
          <p className="text-xl font-bold tracking-wide mb-2">
            {certificate.programme}
          </p>
          <p className="text-sm uppercase tracking-[0.2em] opacity-80">
            {certificate.yearLevel} • Academic Year {certificate.academicYear}
          </p>
        </div>

        {/* Skills Strip */}
        <div className="py-6 flex flex-wrap justify-center gap-3 px-12 relative z-10">
          {certificate.subjects.map(subject => (
            <span key={subject} className="px-3 py-1 bg-[#c8b97a]/10 border border-[#c8b97a]/30 rounded-full text-[10px] uppercase font-bold tracking-widest">
              {subject}
            </span>
          ))}
        </div>

        {/* Body Text */}
        <div className="py-8 text-center px-24 relative z-10">
          <p className="text-sm leading-relaxed italic opacity-90 max-w-2xl mx-auto">
            {certificate.bodyText}
          </p>
        </div>

        {/* Triple Footer */}
        <div className="pt-12 pb-20 px-16 flex items-end justify-between relative z-10">
          <div className="text-center w-48">
            <div className="h-12 mb-2 flex items-center justify-center italic text-2xl font-serif text-white opacity-80">
              {certificate.signatures[0].name.split(' ').pop()}
            </div>
            <div className="w-full h-px bg-[#c8b97a] mb-2 opacity-40" />
            <p className="text-[10px] font-bold uppercase tracking-widest">{certificate.signatures[0].name}</p>
            <p className="text-[8px] uppercase tracking-widest opacity-60">{certificate.signatures[0].title}</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full border-4 border-[#c8b97a]/40 flex items-center justify-center relative">
              <div className="w-20 h-20 rounded-full border border-[#c8b97a]/20 flex items-center justify-center">
                <Shield className="w-10 h-10 opacity-40" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-full rounded-full border-2 border-dashed border-[#c8b97a]/20 animate-[spin_20s_linear_infinite]" />
              </div>
            </div>
            <p className="text-[8px] uppercase tracking-[0.3em] mt-4 font-bold">Official Seal</p>
          </div>

          <div className="text-center w-48">
            <div className="h-12 mb-2 flex items-center justify-center italic text-2xl font-serif text-white opacity-80">
              {certificate.signatures[1].name.split(' ').pop()}
            </div>
            <div className="w-full h-px bg-[#c8b97a] mb-2 opacity-40" />
            <p className="text-[10px] font-bold uppercase tracking-widest">{certificate.signatures[1].name}</p>
            <p className="text-[8px] uppercase tracking-widest opacity-60">{certificate.signatures[1].title}</p>
          </div>
        </div>

        {/* Grade Band */}
        <div className="bg-[#0a0a1a] py-4 px-12 flex items-center justify-between border-t border-[#c8b97a]/20 relative z-10">
          <div className="flex gap-8">
            <div>
              <p className="text-[8px] uppercase tracking-widest opacity-50 mb-1">Cumulative GPA</p>
              <p className="text-sm font-bold text-white">{certificate.gradeBand.gpa}</p>
            </div>
            <div>
              <p className="text-[8px] uppercase tracking-widest opacity-50 mb-1">Overall Grade</p>
              <p className="text-sm font-bold text-white">{certificate.gradeBand.overallGrade}</p>
            </div>
            <div>
              <p className="text-[8px] uppercase tracking-widest opacity-50 mb-1">Distinction</p>
              <p className="text-sm font-bold text-white">{certificate.gradeBand.distinctionLevel}</p>
            </div>
            <div>
              <p className="text-[8px] uppercase tracking-widest opacity-50 mb-1">Projects Verified</p>
              <p className="text-sm font-bold text-white">{certificate.gradeBand.projectCount}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[8px] uppercase tracking-widest opacity-50 mb-1">Certificate ID</p>
            <p className="text-[10px] font-mono text-white">{certificate.id}</p>
          </div>
        </div>

        {/* Verification Link */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-30 hover:opacity-100 transition-opacity cursor-pointer">
          <QrCode className="w-4 h-4" />
          <span className="text-[8px] uppercase tracking-widest font-bold">Verify Authenticity</span>
          <ExternalLink className="w-3 h-3" />
        </div>
      </div>

      <div className="mt-12 flex gap-4">
        <button 
          onClick={() => {
            alert("Generating high-resolution PDF certificate with cryptographic signature...");
            window.print();
          }}
          className="px-8 py-3 bg-[#c8b97a] text-[#1a1a2e] rounded-xl font-bold flex items-center gap-2 hover:bg-[#d9cc91] transition-colors shadow-xl shadow-[#c8b97a]/10"
        >
          <FileText className="w-5 h-5" /> Download PDF
        </button>
        <button className="px-8 py-3 bg-zinc-900 text-white border border-zinc-800 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-colors">
          <ExternalLink className="w-5 h-5" /> Share Link
        </button>
      </div>
    </div>
  );
};

const SettingsView = ({ user, setUser }: { user: User, setUser: (u: User) => void }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <header>
        <h1 className="text-4xl font-black text-white tracking-tight mb-2">Settings</h1>
        <p className="text-zinc-500 font-medium">Exam prep app — student preferences</p>
      </header>

      {/* Profile Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 text-zinc-400 font-bold uppercase tracking-widest text-xs">
          <UserIcon className="w-4 h-4" /> Profile
        </div>
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 divide-y divide-zinc-800 overflow-hidden">
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Student name</p>
              <input 
                type="text"
                value={user.name}
                onChange={(e) => setUser({...user, name: e.target.value})}
                className="bg-transparent text-white font-bold border-none p-0 focus:ring-0 w-full"
              />
            </div>
            <button 
              onClick={async () => {
                try {
                  await api.updateProfile({ name: user.name });
                  alert('Profile updated!');
                } catch (e) {
                  alert('Failed to update profile');
                }
              }}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Save Name
            </button>
          </div>
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Class / year level</p>
              <p className="text-white font-bold">{user.educationLevel} {user.combination ? `(${user.combination})` : ''}</p>
            </div>
            <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors">Change</button>
          </div>
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Target grade</p>
              <p className="text-white font-bold">A — Distinction</p>
            </div>
            <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors">Set</button>
          </div>
        </div>
      </section>

      {/* Subjects & exams Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 text-zinc-400 font-bold uppercase tracking-widest text-xs">
          <GraduationCap className="w-4 h-4" /> Subjects & exams
        </div>
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 divide-y divide-zinc-800 overflow-hidden">
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">My subjects</p>
              <p className="text-white font-bold">{user.subjects || 'Maths, Biology, Chemistry, English, History'}</p>
            </div>
            <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors">Edit</button>
          </div>
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Exam dates</p>
              <p className="text-white font-bold">5 exams scheduled</p>
            </div>
            <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors">Manage</button>
          </div>
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Syllabus topics</p>
              <p className="text-white font-bold">Track covered vs. remaining topics</p>
            </div>
            <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors">View</button>
          </div>
        </div>
      </section>

      {/* Study schedule Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 text-zinc-400 font-bold uppercase tracking-widest text-xs">
          <Calendar className="w-4 h-4" /> Study schedule
        </div>
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 divide-y divide-zinc-800 overflow-hidden">
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Study reminders</p>
              <p className="text-white font-bold">{user.studyTime ? `Study in the ${user.studyTime}` : 'Daily at 7:00 AM & 5:00 PM'}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-5 bg-white rounded-full relative">
                <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-black rounded-full" />
              </div>
            </div>
          </div>
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Smart scheduling</p>
              <p className="text-white font-bold">Auto-prioritise weak subjects before exams</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-5 bg-white rounded-full relative">
                <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-black rounded-full" />
              </div>
            </div>
          </div>
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Rest day</p>
              <p className="text-white font-bold">Sunday — no tasks assigned</p>
            </div>
            <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors">Change</button>
          </div>
        </div>
      </section>

      {/* Quizzes & practice Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 text-zinc-400 font-bold uppercase tracking-widest text-xs">
          <ListChecks className="w-4 h-4" /> Quizzes & practice
        </div>
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 divide-y divide-zinc-800 overflow-hidden">
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Quiz difficulty</p>
              <p className="text-white font-bold">Adaptive — adjusts to performance</p>
            </div>
            <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors">Set</button>
          </div>
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Questions per quiz</p>
              <p className="text-white font-bold">10 questions</p>
              <div className="flex gap-2 mt-2">
                {['5', '10', '20'].map(n => (
                  <button key={n} className={cn("px-3 py-1 rounded-lg text-[10px] font-bold", n === '10' ? "bg-white text-black" : "bg-zinc-800 text-zinc-500")}>{n}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Show answers after quiz</p>
              <p className="text-white font-bold">Review explanations for wrong answers</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-5 bg-white rounded-full relative">
                <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-black rounded-full" />
              </div>
            </div>
          </div>
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Quiz timer</p>
              <p className="text-white font-bold">Timed mode — simulate exam conditions</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-5 bg-zinc-800 rounded-full relative">
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-zinc-600 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Notifications Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 text-zinc-400 font-bold uppercase tracking-widest text-xs">
          <Bell className="w-4 h-4" /> Notifications
        </div>
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 divide-y divide-zinc-800 overflow-hidden">
          <div className="p-6">
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Exam countdown alerts</p>
            <p className="text-white font-bold">7 days, 3 days, 1 day before</p>
          </div>
          <div className="p-6">
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Streak reminders</p>
            <p className="text-white font-bold">Alert if streak is at risk by 8 PM</p>
          </div>
          <div className="p-6">
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Weekly progress report</p>
            <p className="text-white font-bold">Sent every Sunday morning</p>
          </div>
        </div>
      </section>

      {/* Appearance Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 text-zinc-400 font-bold uppercase tracking-widest text-xs">
          <Sun className="w-4 h-4" /> Appearance
        </div>
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 divide-y divide-zinc-800 overflow-hidden">
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Theme</p>
              <p className="text-white font-bold">System default</p>
              <div className="flex gap-2 mt-2">
                {['Light', 'Dark', 'Auto'].map(t => (
                  <button 
                    key={t} 
                    onClick={() => {
                      if (t === 'Dark') document.documentElement.classList.add('dark');
                      else document.documentElement.classList.remove('dark');
                    }}
                    className={cn("px-3 py-1 rounded-lg text-[10px] font-bold", t === 'Dark' ? "bg-white text-black" : "bg-zinc-800 text-zinc-500")}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Font size</p>
              <p className="text-white font-bold">Medium</p>
              <div className="flex gap-2 mt-2">
                {['S', 'M', 'L'].map(s => (
                  <button key={s} className={cn("px-3 py-1 rounded-lg text-[10px] font-bold", s === 'M' ? "bg-white text-black" : "bg-zinc-800 text-zinc-500")}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy & data Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 text-zinc-400 font-bold uppercase tracking-widest text-xs">
          <Lock className="w-4 h-4" /> Privacy & data
        </div>
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 divide-y divide-zinc-800 overflow-hidden">
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Change password</p>
              <p className="text-white font-bold">Last changed 30 days ago</p>
            </div>
            <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors">Update</button>
          </div>
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Export my data</p>
              <p className="text-white font-bold">Download progress & quiz history</p>
            </div>
            <button className="px-4 py-2 bg-white text-black rounded-xl text-xs font-bold transition-colors flex items-center gap-2">
              <Download className="w-3 h-3" /> Export
            </button>
          </div>
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-red-500 font-bold uppercase tracking-wider mb-1">Delete account</p>
              <p className="text-zinc-400 text-sm">Permanently remove all data</p>
            </div>
            <button className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-xs font-bold transition-colors flex items-center gap-2">
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
        </div>
      </section>

      {/* Progress Snapshot Card */}
      <div className="bg-white rounded-[2.5rem] p-8 text-black relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-black/5 blur-3xl rounded-full -mr-16 -mt-16" />
        <h2 className="text-2xl font-black tracking-tight mb-8">My progress snapshot</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Quizzes taken</p>
            <p className="text-3xl font-black">47</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Avg score</p>
            <p className="text-3xl font-black">74%</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Current streak</p>
            <p className="text-3xl font-black">12 <span className="text-sm">days</span></p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Certificates</p>
            <p className="text-3xl font-black">3 <span className="text-sm">earned</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

const OnboardingPrompt = ({ user, onComplete }: { user: User, onComplete: (updatedUser: User) => void }) => {
  const [step, setStep] = useState(1);
  const [educationLevel, setEducationLevel] = useState('');
  const [combination, setCombination] = useState('');
  const [subjects, setSubjects] = useState('');
  const [duration, setDuration] = useState('2 years');
  const [studyTime, setStudyTime] = useState('Afternoon');
  const [loading, setLoading] = useState(false);

  const educationLevels = [
    'Pre Primary',
    'Primary One to Primary 6',
    'Lower Secondary (Senior 1-3)',
    'Upper Secondary (S4-S6)',
    'TVET'
  ];

  const upperSecondaryOptions = {
    'STEM': ['PCB', 'PCM', 'MPC'],
    'Humanities': ['HEGL', 'HLP'],
    'Languages': ['LFK'],
    'Economics': ['MEG', 'MCE']
  };

  const tvetOptions = ['SOD', 'MMP', 'NIT', 'BDC', 'Landsurvey'];

  const subjectMapping: Record<string, string> = {
    'Pre Primary': 'Discovery of the World, Numeracy, Language and Literacy, Creative Arts and Culture, Physical Development and Health, Social and Emotional Development',
    'Primary One to Primary 6': 'Kinyarwanda, English, Mathematics, Science and Elementary Technology (SET), Social and Religious Studies, Creative Arts, Physical Education',
    'Lower Secondary (Senior 1-3)': 'Sciences (Maths, Physics, Chemistry, Biology, ICT), Humanities (History, Geography, Religion & Ethics), Languages (Kinyarwanda, English, French, Kiswahili), Entrepreneurship, Agriculture, Home Science, Music, Fine Arts',
  };

  useEffect(() => {
    if (educationLevel === 'Primary One to Primary 6') {
      setSubjects('Kinyarwanda, English, Mathematics, Science & Tech, Social Studies, Creative Arts, Physical Education');
    } else if (subjectMapping[educationLevel]) {
      setSubjects(subjectMapping[educationLevel]);
    }
  }, [educationLevel]);

  const steps = [
    { title: "Education Level", icon: GraduationCap },
    { title: "Subjects to learn?", icon: BookOpen },
    { title: "Best study time?", icon: Clock },
  ];

  const handleFinish = async () => {
    setLoading(true);
    try {
      const res = await api.updateOnboarding({
        userId: user.id,
        educationLevel,
        combination,
        trade: combination || educationLevel, 
        subjects,
        studyTime
      });
      onComplete(res.user);
    } catch (e) {
      console.error(e);
      // Fallback: update locally if backend failed due to prisma sync issues
      onComplete({ ...user, educationLevel, combination, trade: (combination || educationLevel) as Trade, subjects, studyTime });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-xl bg-zinc-900 rounded-[3rem] border border-zinc-800 p-10 shadow-2xl relative overflow-hidden"
      >
        {/* Progress Bar */}
        <div className="flex gap-2 mb-12">
          {steps.map((s, i) => (
            <div 
              key={i} 
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-500",
                step > i ? "bg-white shadow-[0_0_15px_rgba(255,255,255,0.3)]" : "bg-zinc-800"
              )} 
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center border border-zinc-700">
                {React.createElement(steps[step-1].icon, { className: "w-6 h-6 text-white" })}
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">{steps[step-1].title}</h2>
            </div>

            {step === 1 && (
              <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 gap-3">
                  {educationLevels.map((l) => (
                    <button 
                      key={l}
                      onClick={() => {
                        setEducationLevel(l);
                        if (l !== 'Upper Secondary (S4-S6)' && l !== 'TVET') setCombination('');
                      }}
                      className={cn(
                        "p-5 rounded-2xl border text-left flex items-center justify-between transition-all group",
                        educationLevel === l ? "bg-white text-black border-white shadow-xl shadow-white/10" : "bg-black/40 text-zinc-500 border-zinc-800 hover:border-zinc-700"
                      )}
                    >
                      <span className="font-black uppercase tracking-widest text-xs">{l}</span>
                      {educationLevel === l && <Check className="w-4 h-4 text-black stroke-[3]" />}
                    </button>
                  ))}
                </div>

                <AnimatePresence>
                  {educationLevel === 'Upper Secondary (S4-S6)' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 pt-4 border-t border-zinc-800"
                    >
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Select Combination</p>
                      {Object.entries(upperSecondaryOptions).map(([category, opts]) => (
                        <div key={category} className="space-y-2">
                          <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest ml-1">{category}</p>
                          <div className="flex flex-wrap gap-2">
                            {opts.map(opt => (
                              <button 
                                key={opt}
                                onClick={() => setCombination(opt)}
                                className={cn(
                                  "px-4 py-2 rounded-xl border text-[10px] font-black tracking-widest transition-all",
                                  combination === opt ? "bg-white text-black border-white" : "bg-zinc-800 text-zinc-500 border-zinc-700 hover:border-zinc-600"
                                )}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {educationLevel === 'TVET' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 pt-4 border-t border-zinc-800"
                    >
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Select Level / Trade</p>
                      <div className="flex flex-wrap gap-2">
                        {tvetOptions.map(opt => (
                          <button 
                            key={opt}
                            onClick={() => setCombination(opt)}
                            className={cn(
                              "px-4 py-2 rounded-xl border text-[10px] font-black tracking-widest transition-all",
                              combination === opt ? "bg-white text-black border-white" : "bg-zinc-800 text-zinc-500 border-zinc-700 hover:border-zinc-600"
                            )}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest leading-loose">Enter the subjects you need to master for your trade certification.</p>
                <textarea 
                  value={subjects}
                  onChange={(e) => setSubjects(e.target.value)}
                  placeholder="e.g. Engine Theory, Hydraulics, Vehicle Dynamics..."
                  className="w-full h-32 bg-black/40 border border-zinc-800 rounded-3xl p-6 text-white outline-none focus:ring-2 focus:ring-white/10 transition-all resize-none font-medium"
                />
              </div>
            )}

            {step === 3 && (
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Morning', icon: Sun },
                  { label: 'Afternoon', icon: Clock },
                  { label: 'Night', icon: Lock }
                ].map((t) => (
                  <button 
                    key={t.label}
                    onClick={() => setStudyTime(t.label)}
                    className={cn(
                      "flex flex-col items-center justify-center p-6 bg-black/40 border border-zinc-800 rounded-3xl gap-4 transition-all hover:border-white/20",
                      studyTime === t.label ? "bg-white text-black border-white shadow-xl shadow-white/10" : "text-zinc-500"
                    )}
                  >
                    <t.icon className="w-8 h-8" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-12 flex gap-4">
          {step > 1 && (
            <button 
              onClick={() => setStep(step - 1)}
              className="px-8 py-5 bg-zinc-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-700 transition-all"
            >
              Back
            </button>
          )}
          <button 
            onClick={() => {
              if (step === 1 && !educationLevel) return;
              if (step === 1 && (educationLevel === 'Upper Secondary (S4-S6)' || educationLevel === 'TVET') && !combination) return;
              step < 3 ? setStep(step + 1) : handleFinish();
            }}
            disabled={loading || (step === 1 && !educationLevel) || (step === 1 && (educationLevel === 'Upper Secondary (S4-S6)' || educationLevel === 'TVET') && !combination)}
            className="flex-1 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-white/10 hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                {step < 3 ? 'Continue' : 'Start Mastery'}
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[100px] -mr-32 -mt-32 rounded-full pointer-events-none" />
      </motion.div>
    </div>
  );
};

const AuthView = ({ onLogin }: { onLogin: (userData: any, token?: string, isSignup?: boolean) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [trade, setTrade] = useState<Trade>('Sciences');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    try {
      setLoading(true);
      const res = isLogin 
        ? await api.login({ email, password })
        : await api.signup({ name, email, password, trade });
      
      onLogin(res.user, res.token, !isLogin);
    } catch (error: any) {
      const message = error.message || (isLogin ? 'Login failed. Check your data.' : 'Signup failed. Email might exist.');
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 blur-[120px] rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/5 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex items-center gap-3 mb-12 justify-center">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl shadow-white/20">
            <ShieldCheck className="w-8 h-8 text-black" />
          </div>
          <div>
            <h2 className="font-black text-3xl tracking-tighter text-white">TVET<span className="text-zinc-500">PRO</span></h2>
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em]">Mastery Platform</p>
          </div>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-zinc-800 shadow-2xl">
          <div className="flex gap-4 mb-8 p-1 bg-black/50 rounded-2xl border border-zinc-800">
            <button 
              onClick={() => setIsLogin(true)}
              className={cn(
                "flex-1 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all",
                isLogin ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-white"
              )}
            >
              Login
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={cn(
                "flex-1 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all",
                !isLogin ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-white"
              )}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative group">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-white transition-colors" />
                      <input 
                        type="text" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Claudine Uwimana"
                        className="w-full bg-black/50 border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Trade / Class</label>
                    <div className="relative group">
                      <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-white transition-colors" />
                      <select 
                        value={trade}
                        onChange={(e) => setTrade(e.target.value as Trade)}
                        className="w-full bg-black/50 border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all outline-none appearance-none"
                      >
                        <option value="Sciences">Sciences</option>
                        <option value="Automotive">Automotive</option>
                        <option value="IT">IT</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Plumbing">Plumbing</option>
                        <option value="Welding">Welding</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-white transition-colors" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@tvet.edu"
                  className="w-full bg-black/50 border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-white transition-colors" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/50 border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all outline-none"
                />
              </div>
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <button type="button" className="text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-colors">Forgot Password?</button>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-white text-black font-black uppercase tracking-[0.2em] py-5 rounded-2xl hover:bg-zinc-200 transition-all shadow-xl shadow-white/10 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-zinc-600 font-medium">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-white font-bold hover:underline underline-offset-4"
              >
                {isLogin ? 'Sign Up Now' : 'Login Instead'}
              </button>
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-[0.4em]">© 2026 TVETPRO Systems</p>
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('tvet_auth') === 'true');
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('tvet_user');
    return saved ? JSON.parse(saved) : MOCK_USER;
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [customQuiz, setCustomQuiz] = useState<Assessment | null>(null);
  const [history, setHistory] = useState<QuizHistoryItem[]>(() => {
    const saved = localStorage.getItem('tvet_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [reviewHistoryItem, setReviewHistoryItem] = useState<QuizHistoryItem | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const notifications = [
    { id: 1, title: 'Exam Reminder', text: 'Final Theory Exam in 3 days!', type: 'critical' },
    { id: 2, title: 'Achievement', text: 'You reached a 12-day study streak!', type: 'success' },
    { id: 3, title: 'New Content', text: 'New past papers uploaded for Automotive.', type: 'info' },
  ];

  useEffect(() => {
    if (isAuthenticated) {
      const fetchData = async () => {
        try {
          const [dbHistory, profileRes] = await Promise.all([
            api.getHistory(),
            api.getProfile()
          ]);
          setHistory(dbHistory);
          if (profileRes.user) setUser(profileRes.user);
        } catch (e) {
          console.error('Failed to sync history or profile with backend');
        }
      };
      fetchData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('tvet_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('tvet_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('tvet_auth', isAuthenticated.toString());
  }, [isAuthenticated]);

  // Expose setActiveTab globally for simple linking between components if needed
  useEffect(() => {
    (window as any).setActiveTab = setActiveTab;
    (window as any).refreshQuiz = (quiz: Assessment) => {
      setCustomQuiz(quiz);
      setReviewHistoryItem(null);
      setActiveTab('assessments');
    };
  }, []);

  const handleQuizComplete = async (historyItem: QuizHistoryItem) => {
    try {
      const { historyItem: savedItem, user: updatedUser } = await api.saveHistory({
        quizId: historyItem.quizId,
        score: historyItem.score,
        totalPoints: historyItem.totalPoints,
        userAnswers: historyItem.userAnswers
      });
      setHistory(prev => [savedItem, ...prev]);
      if (updatedUser) setUser(updatedUser);
      
      // Directly return to dashboard as requested
      setCustomQuiz(null);
      setReviewHistoryItem(null);
      setActiveTab('dashboard');
    } catch (e) {
      console.error('Failed to save quiz history to backend, using local state as fallback');
      setHistory(prev => [historyItem, ...prev]);
      setCustomQuiz(null);
      setReviewHistoryItem(null);
      setActiveTab('dashboard');
    }
  };

  const handleReviewHistoryQuiz = (historyItem: QuizHistoryItem) => {
    setReviewHistoryItem(historyItem);
    setActiveTab('assessments');
  };

  const handleLogin = (userData: any, token?: string, isSignup?: boolean) => {
    if (token) localStorage.setItem('tvet_token', token);
    setUser(userData);
    setIsAuthenticated(true);
    if (isSignup) setShowOnboarding(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('tvet_token');
    localStorage.removeItem('tvet_auth');
    localStorage.removeItem('tvet_user');
    setIsAuthenticated(false);
  };

  const handleStartCustomQuiz = (quiz: Assessment) => {
    setCustomQuiz(quiz);
    setActiveTab('assessments');
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView user={user} onStartQuiz={handleStartCustomQuiz} onLogout={handleLogout} history={history} onNavigate={handleTabChange} />;
      case 'assessments': return (
        <AssessmentView 
          assessments={MOCK_ASSESSMENTS} 
          customQuiz={customQuiz} 
          onClearCustomQuiz={() => {
            setCustomQuiz(null);
            setReviewHistoryItem(null);
          }}
          onComplete={handleQuizComplete}
          reviewHistoryItem={reviewHistoryItem}
        />
      );
      case 'history': return <QuizHistoryView history={history} onReviewQuiz={handleReviewHistoryQuiz} />;
      case 'analytics': return <AnalyticsView history={history} user={user} onStartQuiz={handleStartCustomQuiz} />;
      case 'flashcards': return <FlashcardsView />;
      case 'planner': return <PlannerView />;
      case 'portfolio': return <PortfolioView user={user} />;
      case 'papers': return <PastPapers onStartQuiz={handleStartCustomQuiz} />;
      case 'settings': return <SettingsView user={user} setUser={setUser} />;
      default: return <DashboardView user={user} onStartQuiz={handleStartCustomQuiz} onLogout={handleLogout} history={history} onNavigate={handleTabChange} />;
    }
  };

  if (!isAuthenticated) {
    return <AuthView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-black font-sans text-white flex">
      {showOnboarding && (
        <OnboardingPrompt 
          user={user} 
          onComplete={(updatedUser) => {
            setUser(updatedUser);
            setShowOnboarding(false);
          }} 
        />
      )}

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-zinc-950 border-r border-zinc-900 transition-transform duration-300 lg:static lg:translate-x-0",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-white/10">
              <ShieldCheck className="w-6 h-6 text-black" />
            </div>
            <div>
              <h2 className="font-black text-xl tracking-tight text-white">TVET<span className="text-zinc-500">PRO</span></h2>
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Mastery Platform</p>
            </div>
          </div>

          <nav className="flex-1">
            <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-4 px-2">Main Menu</div>
            <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => handleTabChange('dashboard')} />
            <SidebarItem icon={BookOpen} label="Assessments" active={activeTab === 'assessments'} onClick={() => handleTabChange('assessments')} />
            <SidebarItem icon={HistoryIcon} label="Quiz History" active={activeTab === 'history'} onClick={() => handleTabChange('history')} />
            <SidebarItem icon={BarChart3} label="Analytics" active={activeTab === 'analytics'} onClick={() => handleTabChange('analytics')} />
            <SidebarItem icon={Type} label="Flashcards" active={activeTab === 'flashcards'} onClick={() => handleTabChange('flashcards')} />
            <SidebarItem icon={Calendar} label="Planner" active={activeTab === 'planner'} onClick={() => handleTabChange('planner')} />
            <SidebarItem icon={FolderOpen} label="E-Portfolio" active={activeTab === 'portfolio'} onClick={() => handleTabChange('portfolio')} />
            <SidebarItem icon={ClipboardCheck} label="Past Papers" active={activeTab === 'papers'} onClick={() => handleTabChange('papers')} />
            
            <div className="mt-10 text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-4 px-2">System</div>
            <SidebarItem icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => handleTabChange('settings')} />
          </nav>

          <div className="mt-auto pt-6 border-t border-zinc-900">
            <div className="flex items-center gap-3 px-2 mb-6">
              <div className="w-10 h-10 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                <img src="https://i.pravatar.cc/100?img=12" alt="profile" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{user.name}</p>
                <p className="text-xs text-zinc-500 truncate">{user.trade} Student</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-zinc-500 hover:bg-zinc-900 hover:text-white transition-colors rounded-xl font-medium group"
            >
              <LogOut className="w-5 h-5 mr-3 text-zinc-600 group-hover:text-white" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between px-6 sticky top-0 z-30">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 text-zinc-400 hover:bg-zinc-900 rounded-xl"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className="hidden md:flex items-center bg-zinc-900 rounded-xl px-4 py-2 w-96 border border-zinc-800 focus-within:ring-2 focus-within:ring-white/20 transition-all">
            <Search className="w-4 h-4 text-zinc-500 mr-2" />
            <input 
              type="text" 
              placeholder="Search subjects or tasks..." 
              onChange={(e) => {
                // This is a simple bridge to get search into the dashboard view
                const dashboardSearchInput = document.getElementById('dashboard-search-proxy');
                if (dashboardSearchInput && activeTab === 'dashboard') {
                  // In a real app we'd use a shared context or global state, 
                  // but for this MVP we'll lift the state properly if needed.
                  // For now, let's just make it work.
                }
              }}
              className="bg-transparent border-none text-sm focus:ring-0 w-full placeholder:text-zinc-600 text-white"
            />
          </div>

          <div className="flex items-center gap-4 relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-zinc-400 hover:bg-zinc-900 rounded-xl relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full border-2 border-black" />
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-zinc-900 rounded-[2rem] border border-zinc-800 shadow-2xl p-6 z-50 overflow-hidden"
                >
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Recent Alerts</h3>
                  <div className="space-y-4">
                    {notifications.map(n => (
                      <div key={n.id} className="flex gap-4 p-3 bg-black/40 rounded-2xl border border-zinc-800">
                        <div className={cn(
                          "w-1.5 h-full rounded-full shrink-0",
                          n.type === 'critical' ? "bg-red-500" : n.type === 'success' ? "bg-green-500" : "bg-blue-500"
                        )} />
                        <div>
                          <p className="text-xs font-bold text-white">{n.title}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">{n.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-6 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-colors border-t border-zinc-800 pt-4">Clear All</button>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="w-px h-6 bg-zinc-800 mx-1 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-900 text-zinc-300 rounded-lg border border-zinc-800">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Secure Mode</span>
            </div>
          </div>
        </header>

        {/* View Container */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-black">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
