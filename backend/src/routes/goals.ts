import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Add new goal
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { text } = req.body;
  const userId = req.user?.id;

  if (!userId || !text) {
    return res.status(400).json({ error: 'User ID and goal text required' });
  }

  try {
    const goal = await prisma.goal.create({
      data: {
        userId,
        text,
        completed: false
      }
    });

    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// Update goal status
router.patch('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const { completed } = req.body;

  try {
    const goal = await prisma.goal.update({
      where: { id: req.params.id },
      data: { completed }
    });

    res.status(200).json(goal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// Fetch user goals
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  try {
    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(goals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

export default router;
