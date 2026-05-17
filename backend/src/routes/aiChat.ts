import { Router, Response, Request } from 'express';
import { chatTutor } from '../services/ai.service';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/chat', requireAuth, async (req: AuthRequest, res: Response) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const reply = await chatTutor(message, {}, history || []);
    res.status(200).json({ reply, provider: 'HybridAI' });
  } catch (error: any) {
    console.error('AI Chat error:', error);
    res.status(500).json({ error: 'AI Chat failed', details: error.message });
  }
});

export default router;
