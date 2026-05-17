import { Router, Response, Request } from 'express';

const router = Router();

router.post('/chat', async (req: Request, res: Response) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const HF_API_KEY = process.env.HF_API_KEY;
    // Use the user's recommended Mistral-7B-Instruct or fallback Llama model
    const HF_URL = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct';
    
    console.log('[AI Chat] Forwarding request to Hugging Face...');
    const response = await fetch(HF_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HF_API_KEY}`
      },
      body: JSON.stringify({
        inputs: message,
        parameters: {
          max_new_tokens: 300
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HF API error: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    console.log('[AI Chat] Hugging Face raw response:', data);

    let reply = '';
    if (Array.isArray(data)) {
      const genText = data[0]?.generated_text || '';
      // Clean up prompt prefix from the generated text if present
      if (genText.startsWith(message)) {
        reply = genText.substring(message.length).trim();
      } else {
        reply = genText;
      }
      
      // Clean up common chat prefixes if the model generated them (like "Assistant:", "AI:")
      reply = reply.replace(/^(Assistant:|AI:|Tutor:)\s*/i, '');
    } else {
      reply = data.choices?.[0]?.message?.content || data.reply || JSON.stringify(data);
    }

    res.status(200).json({ reply });
  } catch (error: any) {
    console.error('HF Chat error:', error);
    res.status(500).json({ 
      error: 'AI Chat failed', 
      details: error.message 
    });
  }
});

export default router;
