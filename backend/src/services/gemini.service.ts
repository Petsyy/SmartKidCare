import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function askGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "undefined") {
    throw new Error("GEMINI_API_KEY is not configured. Set it in your .env file.");
  }

  try {
    // UPDATED: Using gemini-2.5-flash which is the 2026 stable version
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text || "I can't answer that right now.";
  } catch (err: any) {
    console.error("Gemini SDK Error:", err);
    
    // Check if it's still a 404 and suggest the fallback model
    if (err.status === 404) {
       throw new Error("Model not found. Please check if 'gemini-2.5-flash' is enabled in your region.");
    }

    throw new Error("AI service error. Please try again.");
  }
}