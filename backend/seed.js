
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
    }
  ];

  for (const book of books) {
    await prisma.book.upsert({
      where: { id: book.id },
      update: {},
      create: book
    });
  }

  console.log('Seed successful: Mock Quiz and 3 Books created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
