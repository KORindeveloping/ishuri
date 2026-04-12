import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

async function listModels() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return;
  const genAI = new GoogleGenerativeAI(key);
  try {
    // Note: The SDK might not have a direct listModels method on the genAI instance 
    // depending on version, but we can try to fetch it via the REST endpoint 
    // or check common ones. Let's try gemini-pro which is very standard.
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("test");
    console.log("Gemini Pro Response:", result.response.text());
  } catch (e: any) {
    console.error("Error with gemini-pro:", e.message);
  }
}

listModels();
