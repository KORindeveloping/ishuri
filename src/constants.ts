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
