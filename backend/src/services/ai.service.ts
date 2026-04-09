import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const anthropicKey = process.env.ANTHROPIC_API_KEY || '';
const geminiKey = process.env.GEMINI_API_KEY || '';

const anthropic = new Anthropic({ apiKey: anthropicKey });
const genAI = new GoogleGenerativeAI(geminiKey);

export async function generateQuiz(subject: string, trade: string, level?: string, combination?: string, teachings?: string) {
  // Enhanced "Robust" TVET Prompt with Age/Level Personalization
  const systemPrompt = `You are an expert ${level || 'TVET'} Curriculum Developer. 
  Your goal is to generate high-quality, competency-based assessment questions for the ${trade} trade${combination ? ` with a focus on ${combination}` : ''}.
  
  CRITICAL - Level Appropriateness:
  - The student is at the "${level || 'General'}" education level.
  ${teachings ? `- The student has been taught the following: ${teachings}. Use this context to focus questions on what they have learned.` : ''}
  - If the level is "Pre-Primary" or "Primary", use very simple language, focus on basic concepts, and ensure questions are extremely easy for children.
  - If the level is "TVET" or "Upper Secondary", focus on technical accuracy and industry standards.
  
  Focus on:
  - Technical accuracy for ${subject}.
  - Practical, scenario-based problem solving (e.g., "A customer reports X...", "A circuit shows Y voltage...").
  - Safety protocols and industry standards (ISO/ANSI/etc).
  - High-level 'distractor' options for MCQ (avoid obviously wrong answers).
  
  Return ONLY a valid JSON object. No markdown, no preamble.`;

  const userPrompt = `Generate a comprehensive 10-question practice quiz for a student at the "${level || 'General'}" level studying ${subject} in ${trade}.
  
  Requirements:
  1. Include 6 Multiple Choice (MCQ) and 4 Short Answer questions.
  2. For MCQ: provide 4 highly plausible options.
  3. For Short Answer: provide a concise but technically accurate correctAnswer.
  4. assign points: 10 for MCQ, 20 for Short Answer.
  
  ${(level?.toLowerCase().includes('primary')) ? 'NOTE: Keep vocabulary simple and focus on basic identification/understanding as the student is young.' : ''}
  
  JSON Structure:
  {
    "title": "${subject} Assessment",
    "questions": [
      {
        "id": "uuid-string",
        "type": "MCQ" | "ShortAnswer",
        "text": "Question here",
        "options": ["Option A", "Option B", "Option C", "Option D"], // Only for MCQ
        "correctAnswer": "Answer string",
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
