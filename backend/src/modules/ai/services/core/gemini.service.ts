import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";
import type {
  GeminiResponseMode,
  AskGeminiOptions,
} from "../../types/core-gemini.types";

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

type GeminiKeyEntry = { key: string; fingerprint: string };
const keyCooldowns = new Map<string, number>();

const configuredGeminiKeys = (): GeminiKeyEntry[] => {
  const pooled = String(process.env.GEMINI_API_KEYS || "").split(",");
  const legacy = String(process.env.GEMINI_API_KEY || "");
  const unique = [
    ...new Set(
      [...pooled, legacy]
        .map((key) => key.trim())
        .filter((key) => key && key !== "undefined"),
    ),
  ];
  return unique.map((key) => ({
    key,
    fingerprint: crypto
      .createHash("sha256")
      .update(key)
      .digest("hex")
      .slice(0, 10),
  }));
};

const rawErrorStatus = (error: unknown) =>
  Number((error as { status?: unknown })?.status || 0);
const isInvalidKeyError = (error: unknown) => {
  const status = rawErrorStatus(error);
  const message = String(
    (error as { message?: unknown })?.message || "",
  ).toLowerCase();
  return (
    status === 401 ||
    status === 403 ||
    (status === 400 &&
      (message.includes("api key") || message.includes("api_key_invalid")))
  );
};

export const resetGeminiKeyPoolForTests = () => {
  keyCooldowns.clear();
};

export async function executeWithGeminiKeyPool<T>(
  operation: (apiKey: string, fingerprint: string) => Promise<T>,
  options: { keys?: string[]; now?: () => number } = {},
): Promise<T> {
  const entries = options.keys
    ? [...new Set(options.keys.map((key) => key.trim()).filter(Boolean))].map(
        (key) => ({
          key,
          fingerprint: crypto
            .createHash("sha256")
            .update(key)
            .digest("hex")
            .slice(0, 10),
        }),
      )
    : configuredGeminiKeys();
  if (!entries.length)
    throw new AIServiceError({
      message: "No Gemini API key is configured.",
      status: 503,
      code: "missing_api_key",
    });
  const now = options.now || Date.now;
  const start = 0;
  let lastRetryable: unknown;
  let attempted = 0;
  for (let offset = 0; offset < entries.length; offset += 1) {
    const index = (start + offset) % entries.length;
    const entry = entries[index];
    if ((keyCooldowns.get(entry.fingerprint) || 0) > now()) continue;
    attempted += 1;
    try {
      const result = await operation(entry.key, entry.fingerprint);
      return result;
    } catch (error) {
      const quotaLimited =
        rawErrorStatus(error) === 429 ||
        (error instanceof AIServiceError && error.code === "quota_exceeded");
      const invalidKey = isInvalidKeyError(error);
      if (!quotaLimited && !invalidKey) throw error;
      const retrySeconds = quotaLimited
        ? (error as { retryAfterSeconds?: number })?.retryAfterSeconds ||
          parseRetryDelaySeconds(error) ||
          Number(process.env.GEMINI_KEY_QUOTA_COOLDOWN_SECONDS) ||
          60
        : Number(process.env.GEMINI_KEY_AUTH_COOLDOWN_SECONDS) || 900;
      keyCooldowns.set(
        entry.fingerprint,
        now() + Math.max(1, retrySeconds) * 1000,
      );
      lastRetryable = error;
    }
  }
  const quota =
    lastRetryable &&
    (rawErrorStatus(lastRetryable) === 429 ||
      (lastRetryable instanceof AIServiceError &&
        lastRetryable.code === "quota_exceeded"));
  throw new AIServiceError({
    message:
      attempted === 0
        ? "All Gemini API keys are temporarily cooling down."
        : "All available Gemini API keys are unavailable.",
    status: quota || attempted === 0 ? 429 : 503,
    code: quota || attempted === 0 ? "quota_exceeded" : "api_keys_unavailable",
  });
}

function parseRetryDelaySeconds(err: any): number | undefined {
  const details = Array.isArray(err?.errorDetails) ? err.errorDetails : [];
  const retryInfo = details.find(
    (d: any) =>
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
  try {
    // UPDATED: Using gemini-2.5-flash which is the 2026 stable version
    const responseMode: GeminiResponseMode = options?.mode ?? "text";
    const generationConfig = buildGenerationConfig(options);
    return await executeWithGeminiKeyPool(async (apiKey) => {
      const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig,
      });
      const request =
        responseMode === "json"
          ? {
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: {
                ...generationConfig,
                responseMimeType: "application/json",
              },
            }
          : prompt;
      const result = await model.generateContent(request as any);
      return (await result.response).text() || "I can't answer that right now.";
    });
  } catch (err: any) {
    if (err instanceof AIServiceError) throw err;

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

export async function observeDocumentImage(params: {
  prompt: string;
  image: Buffer;
  mimeType: "image/jpeg" | "image/png";
  modelName: string;
}): Promise<string> {
  try {
    const configuredMaxTokens = Number(
      process.env.GEMINI_DOCUMENT_MAX_OUTPUT_TOKENS,
    );
    const maxOutputTokens =
      Number.isFinite(configuredMaxTokens) &&
      configuredMaxTokens >= 512 &&
      configuredMaxTokens <= 4096
        ? configuredMaxTokens
        : 2048;
    const responseSchema = {
      type: "object",
      properties: {
        documentVisible: { type: "boolean" },
        detectedType: {
          type: "string",
          enum: [
            "birth_certificate",
            "government_id",
            "other_document",
            "person_photo",
            "unrelated_image",
            "unknown",
          ],
        },
        readable: { type: "boolean" },
        cropped: { type: "boolean" },
        glare: { type: "boolean" },
        blurred: { type: "boolean" },
        rotated: { type: "boolean" },
        confidence: { type: "number" },
        extractedFields: {
          type: "object",
          properties: {
            childFullName: { type: "string", nullable: true },
            dateOfBirth: { type: "string", nullable: true },
            parentFullName: { type: "string", nullable: true },
            parentFirstName: { type: "string", nullable: true },
            parentMiddleName: { type: "string", nullable: true },
            parentLastName: { type: "string", nullable: true },
          },
        },
        reasonCodes: { type: "array", items: { type: "string" } },
      },
      required: [
        "documentVisible",
        "detectedType",
        "readable",
        "cropped",
        "glare",
        "blurred",
        "rotated",
        "confidence",
        "extractedFields",
        "reasonCodes",
      ],
    };
    return await executeWithGeminiKeyPool(async (apiKey) => {
      const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
        model: params.modelName,
        generationConfig: {
          temperature: 0,
          maxOutputTokens,
          responseMimeType: "application/json",
          responseSchema,
          thinkingConfig: { thinkingBudget: 0 },
        } as any,
      });
      const result = await model.generateContent([
        { text: params.prompt },
        {
          inlineData: {
            data: params.image.toString("base64"),
            mimeType: params.mimeType,
          },
        },
      ]);
      return (await result.response).text();
    });
  } catch (err: any) {
    if (err instanceof AIServiceError) throw err;
    if (err?.status === 429) {
      throw new AIServiceError({
        message: "AI quota exceeded",
        status: 429,
        code: "quota_exceeded",
        retryAfterSeconds: parseRetryDelaySeconds(err),
      });
    }
    throw new AIServiceError({
      message: "Document analysis is temporarily unavailable.",
      status: 502,
      code: err?.status === 404 ? "model_not_found" : "ai_service_error",
    });
  }
}
