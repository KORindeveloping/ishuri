import { User, Assessment } from './types';

export const MOCK_USER: User = {
  id: 'std-001',
  name: 'Claudine Uwimana',
  email: 'claudine.u@tvet.edu',
  role: 'Student',
  trade: 'Sciences',
  streak: 1,
  educationLevel: 'Advanced Level',
  competencies: [
    {
      trade: 'Sciences',
      skills: [
        { id: 'sci-1', name: 'Mathematics', description: 'Advanced calculus and statistics.', status: 'Competent', progress: 100 },
        { id: 'sci-2', name: 'Biology', description: 'Cell biology and genetics.', status: 'Not Yet Competent', progress: 45 },
        { id: 'sci-3', name: 'Chemistry', description: 'Organic and inorganic chemistry.', status: 'Not Yet Competent', progress: 15 },
        { id: 'sci-4', name: 'Physics', description: 'Mechanics and thermodynamics.', status: 'Competent', progress: 85 },
      ]
    }
  ],
  goals: [
    { id: 'g1', title: 'Master Hybrid Engine Systems', targetDate: '2024-06-15', currentProgress: 35 },
    { id: 'g2', title: 'Complete Advanced Brake Certification', targetDate: '2024-05-20', currentProgress: 60 },
    { id: 'g3', title: 'IT Literacy for Automotive Techs', targetDate: '2024-08-10', currentProgress: 10 }
  ]
};

export const MOCK_ASSESSMENTS: Assessment[] = [
  {
    id: 'exam-001',
    title: 'Automotive Systems Final CBA',
    trade: 'Automotive',
    timeLimit: 60,
    questions: [
      {
        id: 'q1',
        type: 'MCQ',
        text: 'Identify the component shown in the video below and its primary failure symptom.',
        mediaUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=800',
        mediaType: 'image',
        options: ['Alternator - Dim lights', 'Starter Motor - No crank', 'Fuel Pump - Engine stalling', 'Radiator - Overheating'],
        correctAnswer: 'Alternator - Dim lights',
        points: 10
      },
      {
        id: 'q2',
        type: 'Practical',
        text: 'Perform a brake fluid pressure test. Use the digital checklist for verification.',
        points: 50
      },
      {
        id: 'q3',
        type: 'ShortAnswer',
        text: 'Explain the process of bleeding a hydraulic brake system.',
        correctAnswer: 'Open bleeder valve, pump pedal, close valve...',
        points: 20
      }
    ]
  },
  {
    id: 'exam-002',
    title: 'Engine Theory & Diagnostics',
    trade: 'Automotive',
    timeLimit: 45,
    questions: [
      { id: 'q1', type: 'MCQ', text: 'What is the primary function of a piston ring?', options: ['Sealing combustion chamber', 'Reducing friction', 'Cooling piston', 'All of above'], correctAnswer: 'Sealing combustion chamber', points: 10 },
      { id: 'q2', type: 'ShortAnswer', text: 'Define the four strokes of an internal combustion engine.', correctAnswer: 'Intake, Compression, Power, Exhaust', points: 20 }
    ]
  },
  {
    id: 'exam-003',
    title: 'Advanced Braking Systems (ABS)',
    trade: 'Automotive',
    timeLimit: 30,
    questions: [
      { id: 'q1', type: 'MCQ', text: 'Which component prevents wheel lockup during hard braking?', options: ['Brake Booster', 'ABS Control Module', 'Wheel Speed Sensor', 'Master Cylinder'], correctAnswer: 'ABS Control Module', points: 10 }
    ]
  },
  {
    id: 'exam-004',
    title: 'Workshop Safety & Ethics',
    trade: 'General',
    timeLimit: 20,
    questions: [
      { id: 'q1', type: 'MCQ', text: 'What does PPE stand for?', options: ['Personal Protective Equipment', 'Power Plant Energy', 'Primary Protection Element'], correctAnswer: 'Personal Protective Equipment', points: 10 }
    ]
  },
  {
    id: 'exam-005',
    title: 'Electrical Systems Fundamentals',
    trade: 'Automotive',
    timeLimit: 40,
    questions: [
      { id: 'q1', type: 'MCQ', text: 'What is the unit of electrical resistance?', options: ['Volt', 'Ampere', 'Ohm', 'Watt'], correctAnswer: 'Ohm', points: 10 }
    ]
  },
  {
    id: 'exam-006',
    title: 'Transmission & Drivetrain',
    trade: 'Automotive',
    timeLimit: 50,
    questions: [
      { id: 'q1', type: 'MCQ', text: 'What is the purpose of a torque converter?', options: ['Cooling', 'Fluid coupling', 'Gear reduction', 'Lubrication'], correctAnswer: 'Fluid coupling', points: 10 }
    ]
  }
];
