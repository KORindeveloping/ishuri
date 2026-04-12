import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { chatTutor } from '../services/ai.service';

const router = Router();
const prisma = new PrismaClient();

// Handle AI Chat
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { message, history } = req.body;
  const userId = req.user?.id;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const user = await prisma.user.findUnique({ 
      where: { id: userId }
    });

    const subjectsString = user?.subjects || '';

    const reply = await chatTutor(message, {
      trade: user?.trade || 'General',
      level: user?.educationLevel || 'General',
      competencies: subjectsString
    }, history);

    res.status(200).json({ reply });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'AI Chat failed', 
      details: error.message 
    });
  }
});

export default router;
