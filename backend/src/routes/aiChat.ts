import { Router, Response, Request } from 'express';

const router = Router();

router.post('/chat', async (req: Request, res: Response) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const HF_API_KEY = process.env.HF_API_KEY;
    const HF_URL = 'https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-3B-Instruct/v1/chat/completions';
    
    const response = await fetch(HF_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HF_API_KEY}`
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.2-3B-Instruct',
        messages: [{ role: 'user', content: message }],
        stream: false,
        max_tokens: 512
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HF API error: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    res.status(200).json({ reply: data.choices[0].message.content });
  } catch (error: any) {
    console.error('HF Chat error:', error);
    res.status(500).json({ 
      error: 'AI Chat failed', 
      details: error.message 
    });
  }
});

export default router;
