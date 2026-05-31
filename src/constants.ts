import { Assessment, User } from './types';

export const BLACKLIST_SUBJECTS = [
  'Humanities', 'Religion', 'Languages', 'French', 'Kiswahili', 
  'Agriculture', 'Home Economics', 'Home Science', 'Music', 'Fine Arts', 'Social and Religious Studies',
  'Philosophy', 'Sciences'
];

export const MOCK_USER: User = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'Student',
  trade: 'IT',
  competencies: [
    {
      trade: 'IT',
      skills: [
        {
          id: '1',
          name: 'React',
          description: 'Frontend library',
          status: 'Competent',
          progress: 80
        }
      ]
    }
  ],
  goals: [],
  streak: 5,
  lastSeen: new Date().toISOString()
};

export const MOCK_ASSESSMENTS: Assessment[] = [];

export const MOCK_ACHIEVEMENTS: any[] = [
  { id: 'streak-3', title: 'Consistent Learner', description: 'Maintain a 3-day study streak', icon: '🔥', category: 'Streaks', requirement: 3 },
  { id: 'streak-7', title: 'Week Warrior', description: 'Maintain a 7-day study streak', icon: '🛡️', category: 'Streaks', requirement: 7 },
  { id: 'mastery-50', title: 'Rising Star', description: 'Reach 50% average mastery', icon: '⭐', category: 'Mastery', requirement: 50 },
  { id: 'mastery-80', title: 'Subject Expert', description: 'Reach 80% average mastery', icon: '🎓', category: 'Mastery', requirement: 80 },
  { id: 'quiz-10', title: 'Quiz Enthusiast', description: 'Complete 10 quizzes', icon: '🧠', category: 'Knowledge', requirement: 10 },
  { id: 'quiz-50', title: 'Grandmaster', description: 'Complete 50 quizzes', icon: '🏆', category: 'Knowledge', requirement: 50 },
];
