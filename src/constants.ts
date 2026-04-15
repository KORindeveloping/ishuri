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
    id: 'exam-sci-001',
    title: 'Advanced Calculus & Logic',
    trade: 'Sciences',
    timeLimit: 60,
    questions: [
      { id: 'q1', type: 'MCQ', text: 'What is the derivative of sin(x)?', options: ['cos(x)', '-cos(x)', 'tan(x)', 'sec(x)'], correctAnswer: 'cos(x)', points: 10 }
    ]
  },
  {
    id: 'exam-sci-002',
    title: 'Cell Biology & Genetics',
    trade: 'Sciences',
    timeLimit: 45,
    questions: [
      { id: 'q1', type: 'MCQ', text: 'Which organelle is known as the powerhouse of the cell?', options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi Apparatus'], correctAnswer: 'Mitochondria', points: 10 }
    ]
  },
  {
    id: 'exam-sci-003',
    title: 'Organic Chemistry Principles',
    trade: 'Sciences',
    timeLimit: 50,
    questions: [
      { id: 'q1', type: 'MCQ', text: 'What is the functional group of an alcohol?', options: ['-OH', '-CHO', '-COOH', '-NH2'], correctAnswer: '-OH', points: 10 }
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
  },
  {
    id: 'exam-007',
    title: 'Precision Measurement Tools',
    trade: 'General',
    timeLimit: 30,
    questions: [
      { id: 'q1', type: 'MCQ', text: 'Which tool is best for measuring shaft diameter to 0.01mm?', options: ['Steel Rule', 'Vernier Caliper', 'Micrometer', 'Feeler Gauge'], correctAnswer: 'Micrometer', points: 10 }
    ]
  },
  {
    id: 'exam-008',
    title: 'Advanced Diagnostic Scanning',
    trade: 'Automotive',
    timeLimit: 45,
    questions: [
      { id: 'q2', type: 'MCQ', text: 'What does a "P0300" OBD-II code typically indicate?', options: ['Oxygen Sensor Fault', 'Random Misfire', 'Evap Leak', 'Low Oil Pressure'], correctAnswer: 'Random Misfire', points: 10 }
    ]
  },
  {
    id: 'exam-009',
    title: 'Blueprint Reading & CAD',
    trade: 'Construction',
    timeLimit: 60,
    questions: [
      { id: 'q1', type: 'MCQ', text: 'What does a hidden line represent in a technical drawing?', options: ['Center axis', 'Edge not visible', 'Section cut', 'Dimension boundary'], correctAnswer: 'Edge not visible', points: 10 }
    ]
  },
  {
    id: 'exam-010',
    title: 'Renewable Energy Integration',
    trade: 'Electrical',
    timeLimit: 50,
    questions: [
      { id: 'q1', type: 'MCQ', text: 'What is the primary function of an inverter in a solar PV system?', options: ['Store DC power', 'Convert DC to AC', 'Regulate battery voltage', 'Increase current flow'], correctAnswer: 'Convert DC to AC', points: 10 }
    ]
  },
  {
    id: 'exam-011',
    title: 'Hydraulic System Maintenance',
    trade: 'Mechanical',
    timeLimit: 40,
    questions: [
      { id: 'q1', type: 'MCQ', text: 'What causes "spongy" operation in a hydraulic actuator?', options: ['High oil viscosity', 'Air in the system', 'Low pump speed', 'Worn piston seals'], correctAnswer: 'Air in the system', points: 10 }
    ]
  },
  {
    id: 'exam-012',
    title: 'Occupational Health & Safety (Advanced)',
    trade: 'General',
    timeLimit: 30,
    questions: [
      { id: 'q1', type: 'MCQ', text: 'Which class of fire extinguisher is used for electrical fires?', options: ['Class A', 'Class B', 'Class C', 'Class D'], correctAnswer: 'Class C', points: 10 }
    ]
  }
];
