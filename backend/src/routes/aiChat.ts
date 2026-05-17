import { Router, Response, Request } from 'express';

const router = Router();

router.post('/chat', async (req: Request, res: Response) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434/api/chat';
    
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemma3:4b',
        messages: [{ role: 'user', content: message }],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Ollama API error: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    res.status(200).json({ reply: data.message.content });
  } catch (error: any) {
    console.error('Ollama Chat error:', error);
    res.status(500).json({ 
      error: 'AI Chat failed', 
      details: error.message 
    });
  }
});

export default router;
