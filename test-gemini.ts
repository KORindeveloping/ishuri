import { chatTutor } from './backend/src/services/ai.service.ts';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from the backend directory
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

async function testGemini() {
  console.log("--- Starting Gemini Integration Test ---");
  const testMessage = "Hello AI Tutor! Can you tell me one quick safety tip for a TVET student?";
  const context = { trade: "General", level: "TVET" };
  
  try {
    const response = await chatTutor(testMessage, context);
    console.log("\n--- AI Response ---");
    console.log(response);
    console.log("\n-------------------");
    
    if (response.includes("Simulated Tutor Mode") || response.includes("Offline Developer Mode")) {
      console.error("\n❌ TEST FAILED: Still receiving simulated response.");
    } else {
      console.log("\n✅ TEST PASSED: Received a live response from Gemini!");
    }
  } catch (error) {
    console.error("\n❌ TEST FAILED with error:", error);
  }
}

testGemini();
