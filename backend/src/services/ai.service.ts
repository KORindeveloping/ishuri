import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const getGeminiKey = () => process.env.GEMINI_API_KEY || '';
const getAnthropicKey = () => process.env.ANTHROPIC_API_KEY || '';

export async function generateQuiz(subject: string, trade: string, level?: string, combination?: string, teachings?: string) {
  const geminiKey = getGeminiKey();
  const anthropicKey = getAnthropicKey();
  const genAI = new GoogleGenerativeAI(geminiKey);
  const anthropic = new Anthropic({ apiKey: anthropicKey });
  // Enhanced "Robust" TVET Prompt with Bloom's Taxonomy and Trade-Specific Terminology
  const systemPrompt = `You are an expert ${level || 'TVET'} Curriculum Developer and Subject Matter Expert in ${trade}. 
  Your goal is to generate high-quality, competency-based assessment questions for the ${trade} trade${combination ? ` with a focus on ${combination}` : ''}.
  
  CRITICAL - Educational Standards:
  - Use professional terminology specific to ${trade} (e.g., if Masonry, use terms like "pointing," "course," "mortar mix"; if Coding, use "refactoring," "concurrency," "asynchrony").
  - Ensure questions cover three levels of Bloom’s Taxonomy: Knowledge (recall), Application (using info in new situations), and Synthesis (drawing connections/creating).
  - Include exactly one 'Scenario-Based' question in the set (e.g., "A client reports X problem, what is the first step?").
  
  CRITICAL - Level Appropriateness:
  - The student is at the "${level || 'General'}" education level.
  ${teachings ? `- The student has been taught the following: ${teachings}. Use this context to focus questions on what they have learned.` : ''}
  - If the level is "Pre-Primary" or "Primary", use simple language, focus on basic concepts, but still maintain technical relevance to the trade introductory concepts if applicable.
  
  Focus on:
  - Technical accuracy for ${subject}.
  - Practical, industry-standard safety protocols.
  - High-quality distractors for MCQ.
  
  Return ONLY a valid JSON object. No markdown, no preamble.`;

  const userPrompt = `Generate a quiz based on the following TVET course module: ${subject}. 
  The student is studying ${trade} at the "${level || 'General'}" level.
  
  Requirements:
  1. Generate 10 questions total.
  2. Mix of Multiple Choice (MCQ) and Short Answer questions.
  3. Ensure Bloom's Taxonomy coverage (Knowledge, Application, Synthesis).
  4. Include ONE 'Scenario-Based' question.
  5. Use professional ${trade} terminology.
  
  JSON Structure:
  {
    "title": "${subject} Mastery Assessment",
    "questions": [
      {
        "id": "uuid-string",
        "type": "MCQ" | "ShortAnswer",
        "taxonomyLevel": "Knowledge" | "Application" | "Synthesis",
        "isScenarioBased": boolean,
        "text": "Question text using professional ${trade} terms",
        "options": ["Option A", "Option B", "Option C", "Option D"], // Only for MCQ
        "correctAnswer": "Detailed answer",
        "points": number
      }
    ]
  }`;

  // 1. Claude Primary (Robust/Advanced)
  if (anthropicKey && !anthropicKey.includes('xxx')) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 3000,
        messages: [{ role: 'user', content: userPrompt }],
        system: systemPrompt,
      });

      const text = (response.content[0] as any).text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const quiz = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      
      console.log(`[AI] Successfully generated dynamic Claude quiz: ${quiz.title}`);
      return quiz;
    } catch (e: any) {
      console.error(`[AI] Claude primary failed: ${e.message}`);
    }
  }

  // 2. Gemini Fallback
  if (geminiKey && !geminiKey.includes('your_gemini_api_key_here')) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash-lite',
        systemInstruction: systemPrompt
      });
      const result = await model.generateContent(userPrompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const quiz = JSON.parse(jsonMatch ? jsonMatch[0] : text);

      console.log(`[AI] Successfully generated fallback Gemini quiz: ${quiz.title}`);
      return quiz;
    } catch (e: any) {
      console.error(`[AI] Gemini fallback failed: ${e.message}`);
      // Try even simpler if systemInstruction fails
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
        const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const quiz = JSON.parse(jsonMatch ? jsonMatch[0] : text);
        return quiz;
      } catch (e2: any) {
        console.error(`[AI] Gemini ultimate quiz fallback failed: ${e2.message}`);
      }
    }
  }

  // 3. Local Mock (Only if everything else fails)
  console.warn(`[AI] CRITICAL: Both AI providers failed. Using static mock fallback for ${subject}.`);
  
  return {
    title: `${subject} Mastery (Offline Mode)`,
    questions: level?.toLowerCase().includes('primary') ? [
      {
        id: "mock-1",
        type: "MCQ",
        text: `How do we usually stay safe when learning about ${subject}?`,
        options: ["Listen to teacher", "Run fast", "Shout loud", "Close eyes"],
        correctAnswer: "Listen to teacher",
        points: 10
      },
      {
        id: "mock-2",
        type: "ShortAnswer",
        text: `What is one thing you like about ${subject}?`,
        correctAnswer: "Learning new things",
        points: 20
      }
    ] : [
      {
        id: "mock-1",
        type: "MCQ",
        text: `What is the primary safety protocol when working with ${subject} in ${trade}?`,
        options: ["Wear PPE", "Ignore signs", "Work alone", "Use broken tools"],
        correctAnswer: "Wear PPE",
        points: 10
      },
      {
        id: "mock-2",
        type: "ShortAnswer",
        text: `Explain one key maintenance procedure for ${subject} systems.`,
        correctAnswer: "Regular inspection and cleaning",
        points: 20
      }
    ]
  };
}

export async function detectStudyLevel(fileBuffer: Buffer, mimeType: string): Promise<string> {
  const geminiKey = getGeminiKey();
  if (!geminiKey || geminiKey.includes('your_gemini_api_key_here')) {
    return "Level detection unavailable (no AI key)";
  }

  try {
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    const result = await model.generateContent([
      "Analyze this certificate or educational document and identify the specific level of study (e.g., Primary, Senior 1-3, TVET Level 3-5, University, etc.). Return ONLY the level name.",
      {
        inlineData: {
          data: fileBuffer.toString('base64'),
          mimeType
        }
      }
    ]);
    const response = await result.response;
    return response.text().trim() || "Unknown Level";
  } catch (e: any) {
    console.error(`[AI] Level detection failed: ${e.message}`);
    return "Detection Failed";
  }
}

export async function chatTutor(message: string, context: { trade?: string, level?: string, competencies?: string }, history: { role: 'user' | 'model', parts: { text: string }[] }[] = []) {
  const geminiKey = getGeminiKey();
  const anthropicKey = getAnthropicKey();
  console.log(`[AI-Chat] Debug - geminiKey status: ${!!geminiKey}, includes placeholder: ${geminiKey.includes('your_gemini_api_key_here')}`);
  
  if (!geminiKey && !anthropicKey) {
    return "Hello! I am your AI Tutor. Since I'm running in offline/mock mode, I can just cheer you on. Keep up the great work in your studies!";
  }

  const systemPrompt = `You are a friendly, highly intelligent AI TVET Tutor for the TVET Mastery Pro platform. 
  Your job is to help a student who is studying ${context.trade || 'general topics'} at the ${context.level || 'General'} level.
  Keep your answers relatively concise, encouraging, and use formatting like bolding or bullet points where appropriate.
  If relevant, tie their question back to their listed competencies: ${context.competencies || 'N/A'}.
  Always maintain a professional yet supportive educational tone.`;

  let lastError = '';

  // Prefer Gemini for chat
  if (geminiKey && !geminiKey.includes('your_gemini_api_key_here')) {
    const genAI = new GoogleGenerativeAI(geminiKey);
    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash-lite',
        systemInstruction: systemPrompt
      });

      // Use chat with history if provided
      const chat = model.startChat({
        history: history,
        generationConfig: {
          maxOutputTokens: 1000,
        },
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      return response.text();
    } catch (e: any) {
      console.error(`[AI-Chat] Gemini primary failed: ${e.message}`);
      lastError = `Gemini: ${e.message}`;
      
      // If it's a quota error, DO NOT retry to save user's remaining quota
      if (e.message.includes('429') || e.message.toLowerCase().includes('quota')) {
        lastError = '429 Quota Exceeded';
      } else {
        // Only try fallback for other types of errors
        try {
          const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
          const result = await model.generateContent(`${systemPrompt}\n\nStudent Message: ${message}`);
          const response = await result.response;
          return response.text();
        } catch (e2: any) {
          console.error(`[AI-Chat] Gemini fallback failed: ${e2.message}`);
          lastError += ` | Fallback: ${e2.message}`;
        }
      }
    }
  }

  if (anthropicKey && !anthropicKey.includes('xxx')) {
    const anthropic = new Anthropic({ apiKey: anthropicKey });
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1000,
        messages: [
          ...history.map(h => ({ role: h.role === 'model' ? 'assistant' as const : 'user' as const, content: h.parts[0].text })),
          { role: 'user' as const, content: message }
        ],
        system: systemPrompt,
      });
      return (response.content[0] as any).text;
    } catch (e: any) {
      console.error(`[AI-Chat] Claude failed: ${e.message}`);
      lastError += ` | Claude: ${e.message}`;
    }
  }

  if (lastError.includes('429') || lastError.toLowerCase().includes('quota')) {
    return `Hello! I'm currently on a short break because my **API Quota has been reached** 📊. 

This usually happens on the free tier when there are too many requests in a short time. Please **try again in about 30-60 seconds**, and I should be back to help you with your studies!`;
  }

  const debugInfo = lastError ? `\n\n**Debug Error:** ${lastError}` : '';

  return `Hello there! I'm currently in **Simulated Tutor Mode** 🛠️.
  
I can see you're studying **${context.trade || 'your trade'}** at the **${context.level || 'current'}** level. 

To give you real AI responses, please ensure a valid \`GEMINI_API_KEY\` is set in the backend environment. ${debugInfo} 

Once connected, I'll be able to help you with specific technical questions, exam prep, and competency mastery!`;
}

