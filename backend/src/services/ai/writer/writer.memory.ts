export type MemoryRole = "user" | "assistant";

export type ConversationTurn = {
  role: MemoryRole;
  content: string;
};

const HISTORY_LIMIT = 8;
const writerMemory = new Map<string, ConversationTurn[]>();

export function getHistory(conversationId: string): ConversationTurn[] {
  return [...(writerMemory.get(conversationId) ?? [])];
}

export function getConversationHistory(
  conversationId: string,
): ConversationTurn[] {
  return getHistory(conversationId);
}

export function hasRecentAssistantFollowUp(history: ConversationTurn[]): boolean {
  const recentAssistantTurns = history
    .filter((turn) => turn.role === "assistant")
    .slice(-2);

  if (recentAssistantTurns.length === 0) return false;

  const followUpPattern =
    /(?:^|\n)\s*follow[- ]?up\s*:|would you like to|gusto mo bang/i;

  return recentAssistantTurns.some((turn) =>
    followUpPattern.test(turn.content),
  );
}

export function remember(conversationId: string, turn: ConversationTurn): void {
  const current = writerMemory.get(conversationId) ?? [];
  const next = [...current, turn].slice(-HISTORY_LIMIT);
  writerMemory.set(conversationId, next);
}
