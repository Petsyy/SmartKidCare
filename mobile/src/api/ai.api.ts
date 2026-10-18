import { apiClient } from "./client";
import {
  AI_INPUT_LIMITS,
  sanitizeAIChildId,
  sanitizeAIMessageInput,
} from "../utils/ai-input-sanitizer";
import type {
  AIChatPayload,
  AIChatResponse,
  AIRiskLevel,
  AILanguageMode,
  AIDataStatus,
  AIContextStatus,
} from "./api.types";
import { ApiError } from "./client";

export type {
  AIChatPayload,
  AIChatResponse,
  AIResponseLanguage,
  AIRiskLevel,
  AILanguageMode,
  AIDataStatus,
  AIContextStatus,
} from "./api.types";

function toShortDate(year: string, month: string, day: string): string {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const monthIndex = Number(month) - 1;
  const monthName = monthNames[monthIndex] ?? month;
  return `${monthName} ${Number(day)} ${year}`;
}

function normalizeAIReply(text: string): string {
  const cleaned = text
    .replace(/\r\n/g, "\n")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^\s*\d+\.\s+/gm, "- ")
    .replace(/^\s*\*\s+/gm, "- ")
    .replace(/^\s*>\s+/gm, "")
    .replace(/^(\d{4}-\d{2}-\d{2}:\s.*)$/gm, "- $1")
    .replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (_, y, m, d) =>
      toShortDate(y, m, d),
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  let hasQuestion = false;
  const lines = cleaned.split("\n").filter((line) => {
    if (!line.trim()) return true;
    if (!/[?]\s*$/.test(line.trim())) return true;
    if (!hasQuestion) {
      hasQuestion = true;
      return true;
    }
    return false;
  });

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export const sendAIChat = async (
  payload: AIChatPayload,
): Promise<AIChatResponse> => {
  const sanitizedMessage = sanitizeAIMessageInput(
    payload.message,
    AI_INPUT_LIMITS.messageMaxLength,
  );
  if (!sanitizedMessage) {
    throw new Error("Please enter a valid message.");
  }

  const sanitizedChildId = sanitizeAIChildId(payload.childId);
  if (!sanitizedChildId) {
    throw new Error("Invalid child reference.");
  }

  const request = () => apiClient<{
    reply?: unknown;
    language?: unknown;
    languageMode?: unknown;
    contextId?: unknown;
    contextExpiresAt?: unknown;
    contextStatus?: unknown;
    requestId?: unknown;
    replayed?: unknown;
    riskLevel?: unknown;
    dataStatus?: unknown;
    intent?: unknown;
    followUp?: unknown;
  }>("/api/ai/chat", {
    method: "POST",
    body: {
      ...payload,
      message: sanitizedMessage,
      childId: sanitizedChildId,
    },
  });

  let data: Awaited<ReturnType<typeof request>>;
  try {
    data = await request();
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 409 &&
      error.code === "AI_REQUEST_IN_PROGRESS"
    ) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      data = await request();
    } else {
      throw error;
    }
  }

  const reply =
    typeof data.reply === "string" ? normalizeAIReply(data.reply) : "No response.";
  const language =
    data.language === "fil" || data.language === "en"
      ? data.language
      : payload.language ?? "en";
  const languageMode: AILanguageMode =
    data.languageMode === "explicit" ? "explicit" : "auto";
  const contextId =
    typeof data.contextId === "string"
      ? data.contextId
      : payload.contextId ?? "";
  const contextExpiresAt =
    typeof data.contextExpiresAt === "string"
      ? data.contextExpiresAt
      : new Date(0).toISOString();
  const contextStatus: AIContextStatus =
    data.contextStatus === "superseded" ||
    data.contextStatus === "expired" ||
    data.contextStatus === "invalidated"
      ? data.contextStatus
      : "active";
  const dataStatus: AIDataStatus =
    data.dataStatus === "AVAILABLE" ||
    data.dataStatus === "PARTIAL" ||
    data.dataStatus === "NO_DATA"
      ? data.dataStatus
      : "NOT_APPLICABLE";
  const riskLevel: AIRiskLevel | undefined =
    data.riskLevel === "LOW" ||
    data.riskLevel === "MEDIUM" ||
    data.riskLevel === "HIGH"
      ? data.riskLevel
      : undefined;
  const followUp =
    typeof data.followUp === "object" &&
    data.followUp !== null &&
    ((data.followUp as { type?: unknown }).type === "confirmation" ||
      (data.followUp as { type?: unknown }).type === "domain_selection") &&
    ((data.followUp as { action?: unknown }).action === "show_details" ||
      (data.followUp as { action?: unknown }).action === "choose_domain") &&
    typeof (data.followUp as { expiresAt?: unknown }).expiresAt === "string"
      ? (data.followUp as AIChatResponse["followUp"])
      : undefined;
  return {
    reply,
    language,
    languageMode,
    contextId,
    contextExpiresAt,
    contextStatus,
    requestId:
      typeof data.requestId === "string"
        ? data.requestId
        : payload.requestId ?? "",
    replayed: data.replayed === true,
    riskLevel,
    dataStatus,
    intent: typeof data.intent === "string" ? data.intent : "unsupported",
    followUp,
  };
};

export const invalidateAIChatContext = async (
  contextId: string,
): Promise<void> => {
  await apiClient(`/api/ai/chat/contexts/${encodeURIComponent(contextId)}`, {
    method: "DELETE",
  });
};
