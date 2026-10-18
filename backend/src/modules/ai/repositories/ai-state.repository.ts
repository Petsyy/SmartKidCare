import type { PendingFollowUpState } from "../types/core-ai-chat.types";
import type { ConversationTurn } from "../types/generators-ai-writer.types";

const pendingFollowUpByConversation = new Map<string, PendingFollowUpState>();
const writerMemory = new Map<string, ConversationTurn[]>();
const conversationQueues = new Map<string, Promise<void>>();
const conversationTouchedAt = new Map<string, number>();
const HISTORY_LIMIT = 8;
const CONVERSATION_TTL_MS = 30 * 60_000;

const touchConversation = (conversationId: string) => {
  const now = Date.now();
  conversationTouchedAt.set(conversationId, now);
  for (const [id, touchedAt] of conversationTouchedAt) {
    if (now - touchedAt <= CONVERSATION_TTL_MS || conversationQueues.has(id)) {
      continue;
    }
    conversationTouchedAt.delete(id);
    pendingFollowUpByConversation.delete(id);
    writerMemory.delete(id);
  }
};

export const setPendingFollowUp = (
  conversationId: string,
  state: Omit<PendingFollowUpState, "expiresAt">,
) => {
  touchConversation(conversationId);
  pendingFollowUpByConversation.set(conversationId, {
    ...state,
    expiresAt: new Date(Date.now() + 5 * 60_000), // 5 minutes
  });
};

export const getPendingFollowUp = (
  conversationId: string,
): PendingFollowUpState | undefined => {
  const state = pendingFollowUpByConversation.get(conversationId);
  if (!state) return undefined;
  touchConversation(conversationId);

  if (new Date() > state.expiresAt) {
    pendingFollowUpByConversation.delete(conversationId);
    return undefined;
  }
  return state;
};

export const clearPendingFollowUp = (conversationId: string) => {
  pendingFollowUpByConversation.delete(conversationId);
};

export const clearConversationState = (conversationId: string) => {
  pendingFollowUpByConversation.delete(conversationId);
  writerMemory.delete(conversationId);
  conversationTouchedAt.delete(conversationId);
};

export const runInConversationScope = async <T>(
  conversationId: string,
  resetContext: boolean,
  operation: () => Promise<T>,
): Promise<T> => {
  touchConversation(conversationId);
  const previous = conversationQueues.get(conversationId) ?? Promise.resolve();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const tail = previous.then(() => gate);
  conversationQueues.set(conversationId, tail);

  await previous;
  try {
    if (resetContext) clearConversationState(conversationId);
    return await operation();
  } finally {
    release();
    if (conversationQueues.get(conversationId) === tail) {
      conversationQueues.delete(conversationId);
    }
  }
};

export const getHistory = (id: string): ConversationTurn[] => {
  return [...(writerMemory.get(id) ?? [])];
};

export const remember = (id: string, turn: ConversationTurn) => {
  touchConversation(id);
  const current = writerMemory.get(id) ?? [];
  writerMemory.set(id, [...current, turn].slice(-HISTORY_LIMIT));
};
