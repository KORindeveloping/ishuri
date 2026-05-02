import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
dotenv.config();

// Helpers to get API keys
const getGeminiKey = () => process.env.tvet || process.env.GEMINI_API_KEY || '';
const getDeepSeekKey = () => process.env.DEEPSEEK_API_KEY || '';
const getAnthropicKey = () => process.env.ANTHROPIC_API_KEY || '';

// Lazy-loaded OpenAI client
let _openai: OpenAI | null = null;
function getOpenAIClient() {
  if (!_openai) {
    const key = getDeepSeekKey();
    _openai = new OpenAI({
      apiKey: key,
      baseURL: 'https://api.deepseek.com',
    });
  }
  return _openai;
}

/**
 * Hybrid AI Wrapper: Attempts Gemini first, falls back to DeepSeek if Gemini fails.
 */
async function callHybridAI(logic: { 
  gemini: () => Promise<any>, 
  deepseek: () => Promise<any>,
  providerName?: string 
}) {
  const geminiKey = getGeminiKey();
  
  // 1. Try Gemini (Free Tier)
  if (geminiKey && !geminiKey.includes('placeholder')) {
    try {
      console.log(`[AI-Hybrid] Attempting ${logic.providerName || 'task'} with Gemini...`);
      return await logic.gemini();
    } catch (e: any) {
      console.warn(`[AI-Hybrid] Gemini failed: ${e.message}. Falling back to DeepSeek...`);
    }
  }

  // 2. Try DeepSeek (Reliable Backup)
  const deepseekKey = getDeepSeekKey();
  if (deepseekKey) {
    try {
      console.log(`[AI-Hybrid] Falling back to DeepSeek for ${logic.providerName || 'task'}...`);
      return await logic.deepseek();
    } catch (e: any) {
      console.error(`[AI-Hybrid] DeepSeek also failed: ${e.message}`);
      throw e;
    }
  }

  throw new Error("All AI providers failed or are unconfigured.");
}

/**
 * Generates a dynamic quiz using Hybrid AI (Gemini -> DeepSeek).
 */
export async function generateQuiz(
  subject: string, 
  trade: string, 
  level?: string, 
  combination?: string, 
  teachings?: string,
  performanceSummary?: string,
  numQuestions: number = 10
) {
  const systemPrompt = `You are a professional Exam Generator for a TVET learning app.
  Your task is to generate high-quality exams STRICTLY based on the provided Trade and Subject.

  RULES:
  - DO NOT include any content outside the given trade and subject.
  - All questions MUST be Multiple Choice Questions (MCQs).
  - Questions must match the learner's level: ${level || 'Beginner'}.
  - ADAPTIVITY: ${performanceSummary || 'No previous history'}. 
    If performance is low, generate easier questions. If high, increase difficulty and complexity.
  - Use clear, professional, and trade-specific language.
  - Ensure all questions are accurate and relevant to real-world applications.
  - Provide a brief explanation for each correct answer.

  EXAM STRUCTURE:
  - Title: ${trade} - ${subject} - ${level || 'General'}
  - Total Questions: ${numQuestions}
  - Include professional terminology specific to ${trade}.
  - Ensure Bloom's Taxonomy coverage (Knowledge, Application, Synthesis).
  - Include exactly one 'Scenario-Based' MCQ question.

  Return ONLY a valid JSON object. No markdown, no preamble.`;

  const userPrompt = `Generate a ${numQuestions}-question MCQ exam for:
  Trade: ${trade}
  Subject: ${subject}
  Level: ${level || 'Beginner'}
  
  JSON Structure:
  {
    "title": "${trade} - ${subject} - ${level || 'General'}",
    "instructions": "Please select the best answer for each question. All questions are multiple choice.",
    "questions": [
      {
        "id": "uuid-string",
        "type": "MCQ",
        "taxonomyLevel": "Knowledge" | "Application" | "Synthesis",
        "isScenarioBased": boolean,
        "text": "Question text using professional ${trade} terms",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "The exact text of the correct option",
        "explanation": "Brief explanation of why this is correct",
        "points": 10
      }
    ]
  }`;

  return await callHybridAI({
    providerName: "Quiz Generation",
    gemini: async () => {
      const genAI = new GoogleGenerativeAI(getGeminiKey());
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash', systemInstruction: systemPrompt });
      const result = await model.generateContent(userPrompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : text);
    },
    deepseek: async () => {
      const response = await getOpenAIClient().chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      });
      return JSON.parse(response.choices[0].message.content || '{}');
    }
  });
}

/**
 * Detects study level from document analysis.
 * Gemini remains primary for vision; DeepSeek is used as text-backup if image analysis fails.
 */
export async function detectStudyLevel(fileBuffer: Buffer, mimeType: string): Promise<string> {
  const geminiKey = getGeminiKey();
  
  try {
    if (geminiKey) {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent([
        "Analyze this certificate or educational document and identify the specific level of study (e.g., Primary, Senior 1-3, TVET Level 3-5, University, etc.). Return ONLY the level name.",
        { inlineData: { data: fileBuffer.toString('base64'), mimeType } }
      ]);
      return result.response.text().trim() || "Unknown Level";
    }
  } catch (e) {
    console.warn(`[AI-Hybrid] Gemini vision failed for level detection. Falling back to default.`);
  }

  return "Senior 1-3 (Estimated)";
}

/**
 * Grades a quiz using Hybrid AI.
 */
export async function gradeQuiz(quiz: any, userAnswers: Record<string, string>) {
  const prompt = `You are an expert TVET Instructor. Grade the following quiz results.
  
  QUIZ: ${quiz.title}
  QUESTIONS AND ANSWERS:
  ${quiz.questions.map((q: any) => `
    ID: ${q.id}
    Type: ${q.type}
    Question: ${q.text}
    Ideal Answer: ${q.correctAnswer}
    Points: ${q.points}
    User Answer: ${userAnswers[q.id] || "NO ANSWER PROVIDED"}
  `).join('\n')}

  GRADING RULES:
  1. For MCQ: Must match exactly (case-insensitive).
  2. For ShortAnswer: Grade based on technical accuracy and conceptual understanding. Be fair but firm.
  3. Provide a brief (1 sentence) critique for EACH question.
  4. Provide a global summary (2-3 sentences) of the student's performance and areas for improvement.
  
  RETURN JSON ONLY:
  {
    "totalScore": number,
    "maxScore": number,
    "globalFeedback": "string",
    "questionFeedback": {
       "question_id": {
         "isCorrect": boolean,
         "feedback": "1 sentence critique",
         "earnedPoints": number
       }
    }
  }`;

  return await callHybridAI({
    providerName: "Quiz Grading",
    gemini: async () => {
      const genAI = new GoogleGenerativeAI(getGeminiKey());
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : text);
    },
    deepseek: async () => {
      const response = await getOpenAIClient().chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });
      return JSON.parse(response.choices[0].message.content || '{}');
    }
  });
}

/**
 * Chat with the tutor using Hybrid AI.
 */
export async function chatTutor(
  message: string, 
  context: { trade?: string, level?: string, competencies?: string }, 
  history: { role: 'user' | 'model', parts: { text: string }[] }[] = []
) {
  const systemPrompt = `You are a friendly, highly intelligent AI TVET Tutor and Exam Generator for the TVET Mastery Pro platform. 
  Your job is to help a student who is studying ${context.trade || 'general topics'} at the ${context.level || 'General'} level.
  
  If the student asks for an exam or quiz:
  - You MUST strictly follow the trade and subject they specify.
  - All questions must be Multiple Choice.
  - Include brief explanations for correct answers.
  - Follow the format: Title, Instructions, Numbered Questions, Answer Key, Explanations.
  
  Keep your answers relatively concise, encouraging, and use formatting like bolding or bullet points where appropriate.
  If relevant, tie their question back to their listed competencies: ${context.competencies || 'N/A'}.
  Always maintain a professional yet supportive educational tone.`;

  return await callHybridAI({
    providerName: "Chat Tutor",
    gemini: async () => {
      const genAI = new GoogleGenerativeAI(getGeminiKey());
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash', systemInstruction: systemPrompt });
      const chat = model.startChat({ history: history, generationConfig: { maxOutputTokens: 2048 } });
      const result = await chat.sendMessage(message);
      return result.response.text();
    },
    deepseek: async () => {
      const formattedHistory: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = history.map(h => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.parts[0].text
      }));

      const response = await getOpenAIClient().chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          ...formattedHistory,
          { role: 'user', content: message }
        ],
        max_tokens: 2048,
      });
      return response.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
    }
  });
}
