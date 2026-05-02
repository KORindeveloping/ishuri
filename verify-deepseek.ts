import { chatTutor } from './backend/src/services/ai.service.ts';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

async function verifyDeepSeek() {
  console.log("Verifying DeepSeek integration...");
  try {
    const reply = await chatTutor("Hello, are you DeepSeek?", { trade: "Verification", level: "Test" });
    console.log("\n🤖 DeepSeek Reply:", reply);
    if (reply && !reply.includes("Simulated") && !reply.includes("rate-limited")) {
      console.log("\n✅ SUCCESS: DeepSeek is fully integrated and responding!");
    } else {
      console.log("\n❌ FAILURE: Response is suspicious. Check logs.");
    }
  } catch (e: any) {
    console.error("\n❌ ERROR:", e.message);
  }
}

verifyDeepSeek();
