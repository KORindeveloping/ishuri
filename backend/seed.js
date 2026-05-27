
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const mockQuiz = await prisma.quiz.upsert({
    where: { id: 'exam-001' },
    update: {},
    create: {
      id: 'exam-001',
      title: 'Automotive Systems Final CBA (Mock)',
      trade: 'Automotive',
      timeLimit: 60,
      questions: JSON.stringify([
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
      ])
    }
  });

  const books = [
    {
      id: 'book-001',
      title: 'Biology S1 Student Book',
      author: 'REB',
      subject: 'Biology',
      grade: 'S1',
      pdfUrl: '/Courselesson/Biology S1 SB.pdf',
      coverUrl: 'https://images.unsplash.com/photo-1530210124550-912dc1381cb8?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 'book-002',
      title: 'Entrepreneurship S1 Student Book',
      author: 'REB',
      subject: 'Entrepreneurship',
      grade: 'S1',
      pdfUrl: '/Courselesson/Entrepreneurship S1 SB.pdf',
      coverUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 'book-003',
      title: 'Geography S1 Student Book',
      author: 'REB',
      subject: 'Geography',
      grade: 'S1',
      pdfUrl: '/Courselesson/Geography S1 SB.pdf',
      coverUrl: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 'book-p1-math',
      title: 'Mathematics P1 Student Book',
      author: 'REB',
      subject: 'Mathematics',
      grade: 'Primary',
      pdfUrl: '/Courselesson/Math P1.pdf',
      coverUrl: 'https://images.unsplash.com/photo-1509228468518-180dd48a5791?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 'book-p6-set',
      title: 'SET P6 Student Book',
      author: 'REB',
      subject: 'SET',
      grade: 'Primary',
      pdfUrl: '/Courselesson/SET P6.pdf',
      coverUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 'book-p1-english',
      title: 'English P1 Student Book',
      author: 'REB',
      subject: 'English',
      grade: 'Primary',
      pdfUrl: '/Courselesson/English P1.pdf',
      coverUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 'book-p6-english',
      title: 'English P6 Student Book',
      author: 'REB',
      subject: 'English',
      grade: 'Primary',
      pdfUrl: '/Courselesson/English P6.pdf',
      coverUrl: 'https://images.unsplash.com/photo-1544640808-32ca72ac7f37?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 'book-p4-social',
      title: 'Social Studies P4 Student Book',
      author: 'REB',
      subject: 'Social Studies',
      grade: 'Primary',
      pdfUrl: '/Courselesson/Social P4.pdf',
      coverUrl: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=400'
    }
  ];

  for (const book of books) {
    await prisma.book.upsert({
      where: { id: book.id },
      update: {},
      create: book
    });
  }

  console.log('Seed successful: Mock Quiz and Updated Books created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
