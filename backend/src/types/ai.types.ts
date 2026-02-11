export type AIRole = "parent" | "teacher" | "admin";

export interface AIChatRequest {
  role: AIRole;
  attendanceSummary?: string;
  feedingSummary?: string;
  insights?: string[];
  message: string;
}
