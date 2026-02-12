import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export class AIServiceError extends Error {
  status: number;
  code: string;
  retryAfterSeconds?: number;

  constructor(params: {
    message: string;
    status: number;
    code: string;
    retryAfterSeconds?: number;
  }) {
    super(params.message);
    this.name = "AIServiceError";
    this.status = params.status;
    this.code = params.code;
    this.retryAfterSeconds = params.retryAfterSeconds;
  }
}

function parseRetryDelaySeconds(err: any): number | undefined {
  const details = Array.isArray(err?.errorDetails) ? err.errorDetails : [];
  const retryInfo = details.find((d: any) =>
    typeof d?.["@type"] === "string" &&
    d["@type"].includes("google.rpc.RetryInfo"),
  );

  const delay = retryInfo?.retryDelay;
  if (typeof delay !== "string") return undefined;

  const secondsMatch = delay.match(/(\d+)(?:\.\d+)?s/);
  if (!secondsMatch) return undefined;

  const seconds = Number(secondsMatch[1]);
  return Number.isFinite(seconds) ? seconds : undefined;
}

export async function askGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "undefined") {
    throw new AIServiceError({
      message: "GEMINI_API_KEY is not configured. Set it in your .env file.",
      status: 500,
      code: "missing_api_key",
    });
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

    if (err?.status === 429) {
      throw new AIServiceError({
        message: "AI quota exceeded",
        status: 429,
        code: "quota_exceeded",
        retryAfterSeconds: parseRetryDelaySeconds(err),
      });
    }

    // Check if it's still a 404 and suggest the fallback model
    if (err.status === 404) {
      throw new AIServiceError({
        message:
          "Model not found. Please check if 'gemini-2.5-flash' is enabled in your region.",
        status: 500,
        code: "model_not_found",
      });
    }

    throw new AIServiceError({
      message: "AI service error. Please try again.",
      status: 502,
      code: "ai_service_error",
    });
  }
}
