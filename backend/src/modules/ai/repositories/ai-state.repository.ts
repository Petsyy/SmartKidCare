import { PendingFollowUpState } from "../services/core/ai-chat.service";
import type { ConversationTurn } from "../types/generators-ai-writer.types";

const pendingFollowUpByConversation = new Map<string, PendingFollowUpState>();
const writerMemory = new Map<string, ConversationTurn[]>();
const HISTORY_LIMIT = 8;

export const setPendingFollowUp = (
  conversationId: string,
  state: Omit<PendingFollowUpState, "expiresAt">,
) => {
  pendingFollowUpByConversation.set(conversationId, {
    ...state,
    expiresAt: Date.now() + 5 * 60_000, // 5 minutes
  });
};

export const getPendingFollowUp = (
  conversationId: string,
): PendingFollowUpState | undefined => {
  const state = pendingFollowUpByConversation.get(conversationId);
  if (!state) return undefined;

  if (Date.now() > state.expiresAt) {
    pendingFollowUpByConversation.delete(conversationId);
    return undefined;
  }
  return state;
};

export const clearPendingFollowUp = (conversationId: string) => {
  pendingFollowUpByConversation.delete(conversationId);
};

export const getHistory = (id: string): ConversationTurn[] => {
  return [...(writerMemory.get(id) ?? [])];
};

export const remember = (id: string, turn: ConversationTurn) => {
  const current = writerMemory.get(id) ?? [];
  writerMemory.set(id, [...current, turn].slice(-HISTORY_LIMIT));
};
