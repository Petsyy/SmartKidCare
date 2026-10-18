import { getOfflineDatabase } from "./offline-database";
import type { AIResponseLanguage, AIRiskLevel } from "../api/api.types";

export type OfflineChatMessage = {
  id: string;
  childId?: string | null;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  language?: AIResponseLanguage;
  riskLevel?: AIRiskLevel;
};

export const readOfflineChatMessages = async (userId: string) => {
  const database = await getOfflineDatabase();
  const rows = await database.getAllAsync<{
    message_id: string;
    child_id: string | null;
    role: "user" | "assistant";
    content: string;
    created_at: string;
    language: string | null;
    risk_level: string | null;
  }>(
    "SELECT message_id, child_id, role, content, created_at, language, risk_level FROM offline_chat_messages WHERE user_id = ? ORDER BY created_at",
    userId,
  );
  return rows.map((row): OfflineChatMessage => {
    const language: AIResponseLanguage | undefined =
      row.language === "fil" || row.language === "en"
        ? row.language
        : undefined;
    const riskLevel: AIRiskLevel | undefined =
      row.risk_level === "LOW" ||
      row.risk_level === "MEDIUM" ||
      row.risk_level === "HIGH"
        ? row.risk_level
        : undefined;
    return {
      id: row.message_id,
      childId: row.child_id,
      role: row.role,
      content: row.content,
      createdAt: row.created_at,
      language,
      riskLevel,
    };
  });
};

export const replaceOfflineChatMessages = async (
  userId: string,
  messages: OfflineChatMessage[],
) => {
  const database = await getOfflineDatabase();
  await database.withTransactionAsync(async () => {
    await database.runAsync(
      "DELETE FROM offline_chat_messages WHERE user_id = ?",
      userId,
    );
    for (const message of messages.slice(-200)) {
      if (!message.content.trim()) continue;
      await database.runAsync(
        "INSERT INTO offline_chat_messages (user_id, message_id, child_id, role, content, created_at, language, risk_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        userId,
        message.id,
        message.childId ?? null,
        message.role,
        message.content,
        message.createdAt,
        message.language ?? null,
        message.riskLevel ?? null,
      );
    }
  });
};

export const clearOfflineChatMessages = async (userId: string) => {
  const database = await getOfflineDatabase();
  await database.runAsync(
    "DELETE FROM offline_chat_messages WHERE user_id = ?",
    userId,
  );
};
