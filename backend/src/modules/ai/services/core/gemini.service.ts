import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GeminiResponseMode, AskGeminiOptions } from "../../types/core-gemini.types";

// Initialize the SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_TOP_P = 0.95;
const DEFAULT_TOP_K = 40;
const DEFAULT_MAX_OUTPUT_TOKENS = 512;

function parseNumberEnv(
  value: string | undefined,
  fallback: number,
  min?: number,
  max?: number,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (typeof min === "number" && parsed < min) return fallback;
  if (typeof max === "number" && parsed > max) return fallback;
  return parsed;
}

function buildGenerationConfig(options?: AskGeminiOptions) {
  const temperature = parseNumberEnv(
    process.env.GEMINI_TEMPERATURE,
    options?.temperature ?? DEFAULT_TEMPERATURE,
    0,
    1,
  );
  const topP = parseNumberEnv(
    process.env.GEMINI_TOP_P,
    options?.topP ?? DEFAULT_TOP_P,
    0,
    1,
  );
  const topK = parseNumberEnv(
    process.env.GEMINI_TOP_K,
    options?.topK ?? DEFAULT_TOP_K,
    1,
    100,
  );
  const maxOutputTokens = parseNumberEnv(
    process.env.GEMINI_MAX_OUTPUT_TOKENS,
    options?.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
    32,
    2048,
  );

  return {
    temperature,
    topP,
    topK,
    maxOutputTokens,
  };
}

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

export async function askGemini(
  prompt: string,
  options?: AskGeminiOptions,
): Promise<string> {
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
    const responseMode: GeminiResponseMode = options?.mode ?? "text";
    const generationConfig = buildGenerationConfig(options);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig,
    });

    const request =
      responseMode === "json"
        ? { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { ...generationConfig, responseMimeType: "application/json" } }
        : prompt;

    const result = await model.generateContent(request as any);
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
