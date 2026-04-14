export type Trade = 'Automotive' | 'Plumbing' | 'IT' | 'Electrical' | 'Welding' | 'Sciences' | 'General' | 'Rwanda' | 'Uganda' | 'Kenya' | 'Tanzania' | 'Burundi' | 'Nigeria';

export type CompetencyStatus = 'Not Yet Competent' | 'Competent' | 'Advanced';

export interface Skill {
  id: string;
  name: string;
  description: string;
  status: CompetencyStatus;
  progress: number; // 0-100
}

export interface TradeCompetency {
  trade: Trade;
  skills: Skill[];
}

export interface Question {
  id: string;
  type: 'MCQ' | 'Matching' | 'ShortAnswer' | 'Practical';
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  options?: string[];
  correctAnswer?: string | string[];
  points: number;
}

export interface Assessment {
  id: string;
  title: string;
  trade: Trade;
  questions: Question[];
  timeLimit: number; // minutes
}

export interface SkillGoal {
  id: string;
  title: string;
  targetDate: string;
  currentProgress: number; // 0-100
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string; // Added field
  role: 'Student' | 'Instructor' | 'Verifier';
  trade?: Trade;
  educationLevel?: string;
  combination?: string;
  subjects?: string;
  duration?: string;
  studyTime?: string;
  restDay?: string; // Added field
  competencies: TradeCompetency[];
  goals?: SkillGoal[];
  streak?: number;
  lastSeen?: string;
}

export interface PortfolioItem {
  id: string;
  studentId: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  status: 'Pending' | 'Verified' | 'Needs Revision';
  verifierFeedback?: string;
  timestamp: string;
  type?: 'evidence' | 'certificate';
  category?: 'Workplace Observation' | 'Task Media' | 'Project Report' | 'Achievement';
  isPinned?: boolean; // For Showcase
}
export interface QuizHistoryItem {
  id: string;
  quizId: string;
  title: string;
  trade: Trade;
  score: number;
  totalPoints: number;
  dateCompleted: string;
  userAnswers: Record<string, string>;
  quiz: Assessment;
  aiFeedback?: string;
  questionFeedback?: Record<string, { isCorrect: boolean, feedback: string, earnedPoints: number }>;
}
