import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { generateQuiz, gradeQuiz } from '../services/ai.service';

const router = Router();
const prisma = new PrismaClient();

// Grade a quiz via AI
router.post('/grade', requireAuth, async (req: AuthRequest, res: Response) => {
  const { quiz, userAnswers } = req.body;

  if (!quiz || !userAnswers) {
    return res.status(400).json({ error: 'Quiz and userAnswers required' });
  }

  try {
    const result = await gradeQuiz(quiz, userAnswers);
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Quiz grading error:', error);
    res.status(500).json({ 
      error: 'AI grading failed', 
      details: error.message 
    });
  }
});

// Generate a NEW practice quiz via AI
router.post('/generate', requireAuth, async (req: AuthRequest, res: Response) => {
  const { subject, trade: bodyTrade, level: bodyLevel, numQuestions } = req.body;
  const userId = req.user?.id;

  if (!subject) {
    return res.status(400).json({ error: 'Subject required for generation' });
  }

  try {
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      include: {
        quizHistory: {
          take: 5,
          orderBy: { completedAt: 'desc' },
          include: { quiz: true }
        }
      }
    });

    const trade = bodyTrade || user?.trade || 'General';
    const level = bodyLevel || user?.educationLevel || 'Beginner';
    
    // Create a performance summary for the AI
    let performanceSummary = "New user, no history.";
    if (user?.quizHistory && user.quizHistory.length > 0) {
      const avgScore = user.quizHistory.reduce((acc, curr) => acc + (curr.score / curr.totalPoints), 0) / user.quizHistory.length;
      performanceSummary = `User has completed ${user.quizHistory.length} recent quizzes. Average score: ${(avgScore * 100).toFixed(1)}%. Recent topics: ${user.quizHistory.map(h => h.quiz.title).join(', ')}.`;
    }

    const aiQuiz = await generateQuiz(
      subject, 
      trade, 
      level, 
      user?.combination || undefined,
      user?.subjects || undefined,
      performanceSummary,
      numQuestions || 10
    );
    
    // Save generated quiz to DB
    const quiz = await prisma.quiz.create({
      data: {
        title: aiQuiz.title || `${subject} Mastery`,
        trade: trade,
        questions: JSON.stringify(aiQuiz.questions || []),
        timeLimit: Math.round(Math.max(10, (numQuestions || 10) * 1.5)) // Approx 1.5 min per question
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
