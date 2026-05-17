import { Router, Response, Request } from 'express';
import https from 'https';

const router = Router();

router.post('/chat', async (req: Request, res: Response) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // GROQ_API_KEY from environment
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    
    if (!GROQ_API_KEY) {
       console.warn('[AI Chat] No GROQ_API_KEY found in environment.');
       return res.status(500).json({ 
         error: 'AI Chat failed', 
         details: 'Groq API Key is missing. Please set it in Render dashboard.' 
       });
    }
    const postData = JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are a helpful TVET education assistant.' },
        { role: 'user', content: message }
      ],
      max_tokens: 500
    });

    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('[AI Chat] Forwarding request to Groq (Llama 3.3)...');

    const groqReq = https.request(options, (groqRes) => {
      let data = '';
      groqRes.on('data', (chunk) => { data += chunk; });
      groqRes.on('end', () => {
        try {
          if (groqRes.statusCode !== 200) {
            console.error(`[AI Chat] Groq Error (${groqRes.statusCode}):`, data);
            return res.status(500).json({ error: 'Groq AI Chat failed', details: `Status: ${groqRes.statusCode}` });
          }

          const responseData = JSON.parse(data);
          const reply = responseData.choices?.[0]?.message?.content || 'No response from AI.';
          
          res.status(200).json({ reply, provider: 'Groq', version: '2.0-GROQ' });
        } catch (e: any) {
          console.error('[AI Chat] Parse error:', e);
          res.status(500).json({ error: 'Failed to parse Groq response', details: e.message });
        }
      });
    });

    groqReq.on('error', (error) => {
      console.error('[AI Chat] Groq connection error:', error);
      res.status(500).json({ error: 'Groq connection failed' });
    });

    groqReq.write(postData);
    groqReq.end();

  } catch (error: any) {
    console.error('Groq Chat error:', error);
    res.status(500).json({ error: 'AI Chat failed', details: error.message });
  }
});

export default router;
