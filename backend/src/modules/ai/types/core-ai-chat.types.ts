export type AIResponseLanguage = "en" | "tl";

export type AuthContext = { id?: string; role?: string };

export type AiChatRequestContext = {
  body: unknown;
  user?: AuthContext;
};

export type AiChatResult = {
  status: number;
  body: { message?: string; reply?: string };
};

export type FollowUpChoice = "attendance" | "feeding" | "both";

export type PendingTimeframe = "today" | "week" | "last_week" | "month" | "recent";

export type PendingFollowUpState = {
  kind: "detailed_review_confirmation" | "domain_selection";
  timeframe: PendingTimeframe;
  domain: FollowUpChoice;
  expiresAt: number;
};
