import { API_BASE_URL } from "../config/config";

export type AIRole = "parent" | "teacher" | "admin";

export interface AIChatPayload {
  role: AIRole;
  message: string;
  attendanceSummary?: string;
  feedingSummary?: string;
  insights?: string[];
}

export const sendAIChat = async (
  token: string,
  payload: AIChatPayload,
): Promise<string> => {
  if (!token) throw new Error("No authentication token");

  const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      (data as { message?: string }).message || "AI chat request failed";
    throw new Error(message);
  }

  return (data as { reply?: string }).reply ?? "No response.";
};
