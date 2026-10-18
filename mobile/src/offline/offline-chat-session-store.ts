import { getOfflineDatabase } from "./offline-database";
import type { AILanguageMode, AIResponseLanguage } from "../api/api.types";

export type OfflineChatSession = {
  contextId: string;
  contextExpiresAt: string;
  responseLanguage: AIResponseLanguage;
  languageMode: AILanguageMode;
};

export const readOfflineChatSession = async (
  userId: string,
  childId: string,
): Promise<OfflineChatSession | null> => {
  const database = await getOfflineDatabase();
  const row = await database.getFirstAsync<{
    context_id: string;
    context_expires_at: string;
    response_language: string;
    language_mode: string;
  }>(
    `SELECT context_id, context_expires_at, response_language, language_mode
     FROM offline_chat_sessions WHERE user_id = ? AND child_id = ?`,
    userId,
    childId,
  );
  if (!row) return null;
  const expiresAt = Date.parse(row.context_expires_at);
  const valid =
    Number.isFinite(expiresAt) &&
    expiresAt > Date.now() &&
    (row.response_language === "en" || row.response_language === "fil") &&
    (row.language_mode === "auto" || row.language_mode === "explicit");
  if (!valid) {
    await database.runAsync(
      "DELETE FROM offline_chat_sessions WHERE user_id = ? AND child_id = ?",
      userId,
      childId,
    );
    return null;
  }
  return {
    contextId: row.context_id,
    contextExpiresAt: row.context_expires_at,
    responseLanguage: row.response_language as AIResponseLanguage,
    languageMode: row.language_mode as AILanguageMode,
  };
};

export const saveOfflineChatSession = async (
  userId: string,
  childId: string,
  session: OfflineChatSession,
) => {
  const database = await getOfflineDatabase();
  await database.runAsync(
    `INSERT INTO offline_chat_sessions
       (user_id, child_id, context_id, context_expires_at, response_language, language_mode, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, child_id) DO UPDATE SET
       context_id = excluded.context_id,
       context_expires_at = excluded.context_expires_at,
       response_language = excluded.response_language,
       language_mode = excluded.language_mode,
       updated_at = excluded.updated_at`,
    userId,
    childId,
    session.contextId,
    session.contextExpiresAt,
    session.responseLanguage,
    session.languageMode,
    new Date().toISOString(),
  );
};

export const deleteOfflineChatSession = async (
  userId: string,
  childId: string,
) => {
  const database = await getOfflineDatabase();
  await database.runAsync(
    "DELETE FROM offline_chat_sessions WHERE user_id = ? AND child_id = ?",
    userId,
    childId,
  );
};

export const queueOfflineChatInvalidation = async (
  userId: string,
  contextId: string,
) => {
  const database = await getOfflineDatabase();
  await database.runAsync(
    `INSERT OR IGNORE INTO offline_chat_invalidations
       (user_id, context_id, created_at) VALUES (?, ?, ?)`,
    userId,
    contextId,
    new Date().toISOString(),
  );
};

export const readOfflineChatInvalidations = async (userId: string) => {
  const database = await getOfflineDatabase();
  return database.getAllAsync<{ context_id: string }>(
    "SELECT context_id FROM offline_chat_invalidations WHERE user_id = ? ORDER BY created_at",
    userId,
  );
};

export const deleteOfflineChatInvalidation = async (
  userId: string,
  contextId: string,
) => {
  const database = await getOfflineDatabase();
  await database.runAsync(
    "DELETE FROM offline_chat_invalidations WHERE user_id = ? AND context_id = ?",
    userId,
    contextId,
  );
};
