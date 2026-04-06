
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
  console.log('Seed successful:', mockQuiz.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
