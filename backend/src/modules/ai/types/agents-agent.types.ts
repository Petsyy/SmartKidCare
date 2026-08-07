import type { AIResponseLanguage } from "./core-ai-chat.types";
export type AgentContext = {
  childId: string;
  role: string;
  language: AIResponseLanguage;
  requesterId?: string;
  conversationId?: string;
  suppressFollowUp?: boolean;
};
