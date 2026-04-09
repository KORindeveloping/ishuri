import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { generateQuiz } from '../services/ai.service';

const router = Router();
const prisma = new PrismaClient();

// Generate a NEW practice quiz via AI
router.post('/generate', requireAuth, async (req: AuthRequest, res: Response) => {
  const { subject, trade: bodyTrade } = req.body;
  const userId = req.user?.id;

  if (!subject) {
    return res.status(400).json({ error: 'Subject required for generation' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const trade = bodyTrade || user?.trade || 'General';
    
    const aiQuiz = await generateQuiz(
      subject, 
      trade, 
      user?.educationLevel || undefined, 
      user?.combination || undefined,
      user?.subjects || undefined
    );
    
    // Save generated quiz to DB
    const quiz = await prisma.quiz.create({
      data: {
        title: aiQuiz.title || `${subject} Mastery`,
        trade: trade,
        questions: JSON.stringify(aiQuiz.questions || []),
        timeLimit: 15
      }
    });

    res.status(201).json({
      ...quiz,
      questions: JSON.parse(quiz.questions)
    });
  } catch (error: any) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ 
      error: 'AI generation failed', 
      details: error.message 
    });
  }
});

// Fetch a specific quiz
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: req.params.id }
    });
    
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.status(200).json({
      ...quiz,
      questions: JSON.parse(quiz.questions)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

export default router;
