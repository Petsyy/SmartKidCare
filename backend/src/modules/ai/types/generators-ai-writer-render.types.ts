import type { AIResponseLanguage } from "./core-ai-chat.types";
export type AIRole = "parent";

export type WriterRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type WriterResponseTemplate = "fact" | "advice" | "alert";

export type WriterFacts = {
  scenario:
    | "child_attendance"
    | "child_feeding"
    | "child_feeding_comparison"
    | "child_report"
    | "child_attendance_comparison"
    | "child_trend"
    | "class_attendance"
    | "class_feeding"
    | "class_report";
  role: AIRole;
  language: AIResponseLanguage;
  timeframe: string;
  childName?: string;
  metricLines: string[];
  riskLevel: WriterRiskLevel;
  observationLines: string[];
  recommendationLines: string[];
};

export type AttendanceComparisonResult = {
  tool: "summarize_attendance_comparison";
  timeframe: "week";
  childName?: string;
  currentWeek: any;
  lastWeek: any;
  deltaRate: number;
};

export type FeedingComparisonResult = {
  tool: "summarize_feeding_comparison";
  timeframe: "week";
  childName?: string;
  currentWeek: any;
  lastWeek: any;
  deltaRate: number;
};

export type WriterStructuredOutput = {
  responseTemplate: WriterResponseTemplate;
  headline: string;
  metricLines: string[];
  riskLevel: WriterRiskLevel;
  analysis: string;
  suggestedActions?: string[];
  followUp?: string;
};

export type WriterDisplayPolicy = {
  mode: "direct" | "structured";
  responseTemplate: WriterResponseTemplate;
  includeSuggestedActions: boolean;
  includeFollowUp: boolean;
  includeRiskLevel: boolean;
  detailMode: "compact" | "expanded";
};
