import { AIResponseLanguage } from "../language.service";
import {
  ToolTimeframe,
  SummarizeAttendanceResult,
  SummarizeAttendanceClassResult,
  SummarizeFeedingClassResult,
  SummarizeFeedingResult,
  SummarizeChildTrendResult,
} from "../agent-tools.service";
import { AgentToolResult } from "../tools.service";

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
  timeframe: ToolTimeframe;
  childName?: string;
  metricLines: string[];
  riskLevel: WriterRiskLevel;
  observationLines: string[];
  recommendationLines: string[];
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

export type ClassReportResult = {
  tool: "generate_class_report";
  timeframe: ToolTimeframe;
  attendance: SummarizeAttendanceClassResult;
  feeding: SummarizeFeedingClassResult;
};

export type AttendanceComparisonResult = {
  tool: "summarize_attendance_comparison";
  timeframe: "week";
  childName?: string;
  currentWeek: SummarizeAttendanceResult;
  lastWeek: SummarizeAttendanceResult;
  deltaRate: number;
};

export type FeedingComparisonResult = {
  tool: "summarize_feeding_comparison";
  timeframe: "week";
  childName?: string;
  currentWeek: SummarizeFeedingResult;
  lastWeek: SummarizeFeedingResult;
  deltaRate: number;
};

export type WriterSupportedResult =
  | AgentToolResult
  | AttendanceComparisonResult
  | FeedingComparisonResult
  | SummarizeChildTrendResult
  | SummarizeAttendanceClassResult
  | SummarizeFeedingClassResult
  | ClassReportResult;
