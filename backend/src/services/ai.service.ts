import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const getGeminiKey = () => process.env.GEMINI_API_KEY || '';
const getAnthropicKey = () => process.env.ANTHROPIC_API_KEY || '';

export async function generateQuiz(
  subject: string, 
  trade: string, 
  level?: string, 
  combination?: string, 
  teachings?: string,
  performanceSummary?: string,
  numQuestions: number = 10
) {
  const geminiKey = getGeminiKey();
  const anthropicKey = getAnthropicKey();
  const genAI = new GoogleGenerativeAI(geminiKey);
  const anthropic = new Anthropic({ apiKey: anthropicKey });

  // Enhanced "Robust" TVET Prompt with Bloom's Taxonomy and Trade-Specific Terminology
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
        model: 'gemini-2.0-flash',
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
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const generationResult = await model.generateContent([
      "Analyze this certificate or educational document and identify the specific level of study (e.g., Primary, Senior 1-3, TVET Level 3-5, University, etc.). Return ONLY the level name.",
      {
        inlineData: {
          data: fileBuffer.toString('base64'),
          mimeType
        }
      }
    ]);
    const response = await generationResult.response;
    return response.text().trim() || "Unknown Level";
  } catch (e: any) {
    console.error(`[AI] Level detection failed: ${e.message}`);
    return "Detection Failed";
  }
}

export async function gradeQuiz(quiz: any, userAnswers: Record<string, string>) {
  const geminiKey = getGeminiKey();
  if (!geminiKey || geminiKey.includes('your_gemini_api_key_here')) {
    // Fallback basic grading if no AI
    let totalScore = 0;
    let maxScore = 0;
    const questionFeedback: any = {};
    
    quiz.questions.forEach((q: any) => {
      maxScore += q.points;
      const ua = userAnswers[q.id]?.toLowerCase().trim();
      const ca = q.correctAnswer?.toLowerCase().trim();
      const isCorrect = ua === ca;
      if (isCorrect) totalScore += q.points;
      questionFeedback[q.id] = {
        isCorrect,
        feedback: isCorrect ? "Correct!" : `Incorrect. The expected answer was: ${q.correctAnswer}`,
        earnedPoints: isCorrect ? q.points : 0
      };
    });

    return {
      totalScore,
      maxScore,
      globalFeedback: "Automated grading completed. Good effort!",
      questionFeedback
    };
  }

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

  try {
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch (e: any) {
    console.error(`[AI] Quiz grading failed: ${e.message}`);
    throw e;
  }
}

export async function chatTutor(message: string, context: { trade?: string, level?: string, competencies?: string }, history: { role: 'user' | 'model', parts: { text: string }[] }[] = []) {
  const geminiKey = getGeminiKey();
  const anthropicKey = getAnthropicKey();
  console.log(`[AI-Chat] Debug - geminiKey status: ${!!geminiKey}, includes placeholder: ${geminiKey.includes('your_gemini_api_key_here')}`);
  
  if (!geminiKey && !anthropicKey) {
    return "Hello! I am your AI Tutor. Since I'm running in offline/mock mode, I can just cheer you on. Keep up the great work in your studies!";
  }

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

  let lastError = '';

  // Prefer Gemini for chat
  if (geminiKey && !geminiKey.includes('your_gemini_api_key_here')) {
    const genAI = new GoogleGenerativeAI(geminiKey);
    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash',
        systemInstruction: systemPrompt
      });

      // Use chat with history if provided
      const chat = model.startChat({
        history: history,
        generationConfig: {
          maxOutputTokens: 2048,
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
          const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
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

