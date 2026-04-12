import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: './backend/.env' });

async function testDirect() {
  const key = process.env.GEMINI_API_KEY;
  console.log("Testing Key:", key ? `${key.substring(0, 5)}...` : "MISSING");
  
  if (!key || key.includes('your_gemini_api_key_here')) {
    console.error("❌ Key is missing or still placeholder!");
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    console.log("Sending message to Gemini...");
    const result = await model.generateContent("Say 'Gemini is connected!' if you can hear me.");
    const response = await result.response;
    console.log("Response:", response.text());
    
    if (response.text().includes("connected")) {
      console.log("\n✅ SUCCESS: Gemini is working with your key!");
    }
  } catch (error) {
    console.error("\n❌ ERROR:", error);
  }
}

testDirect();
