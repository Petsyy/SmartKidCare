export type AIResponseLanguage = "en" | "fil";
export type AILanguageMode = "auto" | "explicit";
export type AIRiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type AIDataStatus =
  | "AVAILABLE"
  | "PARTIAL"
  | "NO_DATA"
  | "NOT_APPLICABLE";
export type AIContextStatus =
  | "active"
  | "superseded"
  | "expired"
  | "invalidated";

export type FollowUpChoice = "attendance" | "feeding" | "both";
export type PendingTimeframe =
  | "today"
  | "yesterday"
  | "week"
  | "last_week"
  | "month"
  | "last_month"
  | "recent";
export type AIDetailLevel = "summary" | "detailed";

export type AIIntent =
  | "greeting"
  | "acknowledgement"
  | "closure"
  | "confirmation"
  | "rejection"
  | "language_preference"
  | "attendance_summary"
  | "attendance_details"
  | "feeding_summary"
  | "feeding_details"
  | "combined_summary"
  | "combined_details"
  | "comparison"
  | "trend"
  | "clarification"
  | "unsupported";

export type AIMessageClassification = {
  intent: AIIntent;
  inputLanguage: "en" | "fil" | "mixed" | "unknown";
  requestedResponseLanguage: AIResponseLanguage | null;
  returnToAutomaticLanguage: boolean;
  domain: FollowUpChoice | null;
  primaryTimeframe: PendingTimeframe | null;
  comparisonTimeframe: PendingTimeframe | null;
  detailLevel: AIDetailLevel | null;
  confidence: number;
};

export type AIPendingAction = {
  type: "confirmation" | "domain_selection";
  action: "show_details" | "choose_domain";
  domain: FollowUpChoice;
  timeframe: PendingTimeframe;
  expiresAt: Date;
};

export type AIConversationTurn = {
  role: "user" | "assistant";
  content: string;
};

export type AIConversationStateRecord = {
  _id: unknown;
  parent: unknown;
  child: unknown;
  contextId: string;
  responseLanguage: AIResponseLanguage;
  languageMode: AILanguageMode;
  activeDomain: FollowUpChoice | null;
  timeframe: PendingTimeframe | null;
  detailLevel: AIDetailLevel | null;
  lastIntent: AIIntent | null;
  pendingAction: AIPendingAction | null;
  turns: AIConversationTurn[];
  generation: number;
  version: number;
  expiresAt: Date;
  invalidatedAt: Date | null;
};

export type AIFollowUpMetadata = {
  type: "confirmation" | "domain_selection";
  action: "show_details" | "choose_domain";
  expiresAt: string;
};

export type AIChatSuccessBody = {
  reply: string;
  language: AIResponseLanguage;
  languageMode: AILanguageMode;
  contextId: string;
  contextExpiresAt: string;
  contextStatus: AIContextStatus;
  requestId: string;
  replayed: boolean;
  riskLevel?: AIRiskLevel;
  dataStatus: AIDataStatus;
  intent: AIIntent;
  followUp?: AIFollowUpMetadata;
};

export type AuthContext = { id?: string; role?: string };
export type AiChatRequestContext = { body: unknown; user?: AuthContext };
export type AiChatResult = {
  status: number;
  headers?: Record<string, string>;
  body: Partial<AIChatSuccessBody> & { message?: string; code?: string };
};

export type AIChatReply = {
  reply: string;
  riskLevel?: AIRiskLevel;
  dataStatus?: AIDataStatus;
};

// Kept as an alias for older imports and tests.
export type PendingFollowUpState = AIPendingAction;
