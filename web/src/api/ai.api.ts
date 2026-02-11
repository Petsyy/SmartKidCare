import { API_BASE } from "../components/config/config.api";

export type AIRole = "parent" | "teacher" | "admin";

export interface AIChatPayload {
  role: AIRole;
  message: string;
  attendanceSummary?: string;
  feedingSummary?: string;
  insights?: string[];
}

export interface AIChatResponse {
  reply: string;
}

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("authToken")}`,
});

export async function sendAIChat(payload: AIChatPayload): Promise<string> {
  const response = await fetch(`${API_BASE}/ai/chat`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      (data as { message?: string }).message || "AI chat request failed";
    throw new Error(message);
  }

  return (data as AIChatResponse).reply ?? "No response.";
}
