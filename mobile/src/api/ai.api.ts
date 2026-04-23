import { apiClient } from "./client";
import {
  AI_INPUT_LIMITS,
  sanitizeAIChildId,
  sanitizeAIMessageInput,
} from "../utils/ai-input-sanitizer";

export type { AIRole, AIChatPayload } from "./api.types";
import type { AIChatPayload } from "./api.types";

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
): Promise<string> => {
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

  const data = await apiClient<{ reply?: string }>("/api/ai/chat", {
    method: "POST",
    body: {
      ...payload,
      message: sanitizedMessage,
      childId: sanitizedChildId,
    },
  });

  const reply = data.reply ?? "No response.";
  return normalizeAIReply(reply);
};
