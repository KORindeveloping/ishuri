import { Router, Response, Request } from 'express';
import https from 'https';

const router = Router();

router.post('/chat', async (req: Request, res: Response) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const HF_API_KEY = process.env.HF_API_KEY;
    
    if (!HF_API_KEY) {
       console.warn('[AI Chat] No HF_API_KEY found in environment.');
       return res.status(500).json({ 
         error: 'AI Chat failed', 
         details: 'Hugging Face API Key is missing. Please check Render dashboard.' 
       });
    }
    
    // Using the original model ID
    const modelId = 'mistralai/Mistral-7B-Instruct';
    const postData = JSON.stringify({
      inputs: message,
      parameters: {
        max_new_tokens: 300,
        return_full_text: false
      }
    });

    const options = {
      hostname: 'api-inference.huggingface.co',
      path: `/models/${modelId}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log(`[AI Chat] Forwarding request to Hugging Face: ${modelId}`);

    const hfReq = https.request(options, (hfRes) => {
      let data = '';
      hfRes.on('data', (chunk) => { data += chunk; });
      hfRes.on('end', () => {
        try {
          if (hfRes.statusCode !== 200) {
            console.error(`[AI Chat] HF Error (${hfRes.statusCode}):`, data);
            
            // Handle loading state
            if (hfRes.statusCode === 503 || data.toLowerCase().includes('loading')) {
               return res.status(503).json({ error: 'AI is warming up', details: 'Model is loading. Try again in 30s.' });
            }
            
            return res.status(500).json({ error: 'AI Chat failed', details: `HF API error: ${hfRes.statusCode}` });
          }

          if (!data) {
            console.error('[AI Chat] Empty response from HF');
            return res.status(500).json({ error: 'AI Chat failed', details: 'Empty response from AI engine' });
          }

          console.log('[AI Chat] Raw HF Response:', data);

          const responseData = JSON.parse(data);
          let reply = '';
          if (Array.isArray(responseData)) {
            const genText = responseData[0]?.generated_text || '';
            reply = genText.startsWith(message) ? genText.substring(message.length).trim() : genText;
            reply = reply.replace(/^(Assistant:|AI:|Tutor:)\s*/i, '');
          } else {
            reply = responseData.choices?.[0]?.message?.content || responseData.reply || JSON.stringify(responseData);
          }
          res.status(200).json({ reply, version: '1.1-debug' });
        } catch (e: any) {
          console.error('[AI Chat] Parse error:', e);
          res.status(500).json({ error: 'Failed to parse AI response', details: e.message, version: '1.1-debug' });
        }
      });
    });

    hfReq.on('error', (error) => {
      console.error('[AI Chat] Request error:', error);
      res.status(500).json({ error: 'AI Chat connection failed' });
    });

    hfReq.write(postData);
    hfReq.end();

  } catch (error: any) {
    console.error('HF Chat error:', error);
    res.status(500).json({ error: 'AI Chat failed', details: error.message });
  }
});

export default router;
