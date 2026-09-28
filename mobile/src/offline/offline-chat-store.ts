import { getOfflineDatabase } from "./offline-database";

export type OfflineChatMessage = {
  id: string;
  childId?: string | null;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export const readOfflineChatMessages = async (userId: string) => {
  const database = await getOfflineDatabase();
  const rows = await database.getAllAsync<{
    message_id: string;
    child_id: string | null;
    role: "user" | "assistant";
    content: string;
    created_at: string;
  }>(
    "SELECT message_id, child_id, role, content, created_at FROM offline_chat_messages WHERE user_id = ? ORDER BY created_at",
    userId,
  );
  return rows.map((row) => ({
    id: row.message_id,
    childId: row.child_id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  }));
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
        "INSERT INTO offline_chat_messages (user_id, message_id, child_id, role, content, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        userId,
        message.id,
        message.childId ?? null,
        message.role,
        message.content,
        message.createdAt,
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
