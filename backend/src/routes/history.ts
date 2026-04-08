import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Save quiz result to history
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { quizId, score, totalPoints, userAnswers } = req.body;
  const userId = req.user?.id;

  if (!userId || !quizId) {
    return res.status(400).json({ error: 'Quiz and user IDs required' });
  }

  try {
    const historyItem = await prisma.quizHistory.create({
      data: {
        userId,
        quizId,
        score,
        totalPoints,
        userAnswers: JSON.stringify(userAnswers || {}),
        completedAt: new Date()
      },
      include: {
        quiz: true
      }
    });

    // --- Update Streak and Competencies ---
    const user = (await prisma.user.findUnique({ where: { id: userId } })) as any;
    if (user) {
      // --- Robust Streak Logic ---
      let newStreak = user.streak || 0;
      const now = new Date();
      const last = user.lastLogin ? new Date(user.lastLogin) : null;

      const today = now.toISOString().split('T')[0];
      const lastDay = last ? last.toISOString().split('T')[0] : null;

      if (!last || isNaN(last.getTime())) {
        newStreak = 1;
      } else if (today !== lastDay) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDay = yesterday.toISOString().split('T')[0];

        if (lastDay === yesterdayDay) {
          newStreak++;
        } else {
          newStreak = 1;
        }
      }
      // 2. Competency Logic (Simplified mastery update)
      let compArray = [];
      try {
        compArray = user.competencies ? JSON.parse(user.competencies) : [];
      } catch (e) {
        compArray = [];
      }
      
      const newScorePercent = (score / totalPoints) * 100;
      const historyItemWithQuiz = historyItem as any;
      const topicName = historyItemWithQuiz.quiz?.title?.split(':')[0]?.trim() || 'General';
      
      // Find or create competency for this topic
      let topic = compArray[0]; // For now, assume top level trade competency has skills
      if (!topic) {
        topic = { trade: user.trade, skills: [] };
        compArray.push(topic);
      }
      
      let skill = (topic.skills as any[]).find((s: any) => s.name === topicName);
      if (!skill) {
        skill = { id: `sk-${Date.now()}`, name: topicName, progress: 0, status: 'Not Yet Competent' };
        topic.skills.push(skill);
      }
      
      // Improve progress (moving halfway toward 100 if they did well)
      if (newScorePercent > skill.progress) {
        skill.progress = Math.round(skill.progress + (newScorePercent - skill.progress) / 2);
      }
      if (skill.progress >= 80) skill.status = 'Competent';
      if (skill.progress >= 95) skill.status = 'Advanced';

      await prisma.user.update({
        where: { id: userId },
        data: {
          streak: newStreak,
          lastLogin: now,
          competencies: JSON.stringify(compArray)
        }
      });
    }

    const updatedUser = await prisma.user.findUnique({ where: { id: userId } });
    const userData = (updatedUser || {}) as any;
    
    let competencies = [];
    try {
      competencies = userData.competencies ? JSON.parse(userData.competencies) : [];
    } catch (e) {
      console.error('Failed to parse competencies in history response:', e);
      competencies = [];
    }

    res.status(201).json({
      historyItem: {
        ...historyItem,
        userAnswers: historyItem.userAnswers ? JSON.parse(historyItem.userAnswers) : {},
        quiz: (historyItem as any).quiz ? {
          ...(historyItem as any).quiz,
          questions: (historyItem as any).quiz.questions ? JSON.parse((historyItem as any).quiz.questions) : []
        } : null
      },
      user: updatedUser ? {
        ...userData,
        competencies
      } : null
    });
  } catch (error) {
    console.error('History save error:', error);
    res.status(500).json({ error: 'Failed to save quiz history', details: error instanceof Error ? error.message : String(error) });
  }
});

// Fetch all quiz history for logged-in user
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  try {
    const history = await prisma.quizHistory.findMany({
      where: { userId },
      include: {
        quiz: true
      },
      orderBy: {
        completedAt: 'desc'
      }
    });

    res.status(200).json(history.map(item => ({
      ...item,
      userAnswers: JSON.parse(item.userAnswers),
      quiz: item.quiz ? {
        ...item.quiz,
        questions: JSON.parse(item.quiz.questions)
      } : null
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export default router;
