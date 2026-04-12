import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const anthropicKey = process.env.ANTHROPIC_API_KEY || '';
const geminiKey = process.env.GEMINI_API_KEY || '';

const anthropic = new Anthropic({ apiKey: anthropicKey });
const genAI = new GoogleGenerativeAI(geminiKey);

export async function generateQuiz(subject: string, trade: string, level?: string, combination?: string, teachings?: string) {
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
  if (geminiKey) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const quiz = JSON.parse(jsonMatch ? jsonMatch[0] : text);

      console.log(`[AI] Successfully generated fallback Gemini quiz: ${quiz.title}`);
      return quiz;
    } catch (e: any) {
      console.error(`[AI] Gemini fallback failed: ${e.message}`);
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
  if (!geminiKey) return "Level detection unavailable (no AI key)";

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent([
      "Analyze this certificate or educational document and identify the specific level of study (e.g., Primary, Senior 1-3, TVET Level 3-5, University, etc.). Return ONLY the level name.",
      {
        inlineData: {
          data: fileBuffer.toString('base64'),
          mimeType
        }
      }
    ]);
    return result.response.text().trim() || "Unknown Level";
  } catch (e: any) {
    console.error(`[AI] Level detection failed: ${e.message}`);
    return "Detection Failed";
  }
}

export async function chatTutor(message: string, context: { trade?: string, level?: string, competencies?: string }) {
  if (!geminiKey && !anthropicKey) {
    return "Hello! I am your AI Tutor. Since I'm running in offline/mock mode, I can just cheer you on. Keep up the great work in your studies!";
  }

  const systemPrompt = `You are a friendly, highly intelligent AI TVET Tutor. 
  Your job is to help a student who is studying ${context.trade || 'general topics'} at the ${context.level || 'General'} level.
  Keep your answers relatively concise, encouraging, and use formatting like bolding or bullet points where appropriate.
  If relevant, tie their question back to their listed competencies: ${context.competencies || 'N/A'}.`;

  // Prefer Gemini for chat as it's often faster for conversational stuff
  if (geminiKey) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', systemInstruction: systemPrompt });
      const result = await model.generateContent(message);
      return result.response.text();
    } catch (e: any) {
      console.error(`[AI-Chat] Gemini failed: ${e.message}`);
    }
  }

  if (anthropicKey && !anthropicKey.includes('xxx')) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1000,
        messages: [{ role: 'user', content: message }],
        system: systemPrompt,
      });
      return (response.content[0] as any).text;
    } catch (e: any) {
      console.error(`[AI-Chat] Claude failed: ${e.message}`);
    }
  }

  return `Hello there! I'm currently running in **Offline Developer Mode** 🛠️.
  
I can see you're studying **${context.trade || 'your trade'}** at the **${context.level || 'current'}** level. 

Since I don't have an active API key connected right now, I can't generate live AI responses. However, I'm fully built and ready to go once you add a valid \`GEMINI_API_KEY\` to the backend! Keep up the great work!`;
}

