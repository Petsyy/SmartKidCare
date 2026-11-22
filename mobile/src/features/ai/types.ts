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

export interface AIChatPayload {
  message: string;
  childId: string;
  language?: AIResponseLanguage;
  languageMode?: AILanguageMode;
  resetContext?: boolean;
  contextId?: string;
  requestId?: string;
}

export interface AIChatResponse {
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
  intent: string;
  followUp?: {
    type: "confirmation" | "domain_selection";
    action: "show_details" | "choose_domain";
    expiresAt: string;
  };
}
