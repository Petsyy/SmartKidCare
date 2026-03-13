import { AIResponseLanguage } from "../language.service";
import {
  ToolTimeframe,
  SummarizeAttendanceResult,
  SummarizeAttendanceClassResult,
  SummarizeFeedingClassResult,
  SummarizeChildTrendResult,
} from "../mongoAgentTools.service";
import { AgentToolResult } from "../tools.service";

export type AIRole = "parent" | "teacher" | "admin";
export type WriterRiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type WriterResponseTemplate = "fact" | "advice" | "alert";

export type WriterFacts = {
  scenario:
    | "child_attendance"
    | "child_feeding"
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

export type WriterSupportedResult =
  | AgentToolResult
  | AttendanceComparisonResult
  | SummarizeChildTrendResult
  | SummarizeAttendanceClassResult
  | SummarizeFeedingClassResult
  | ClassReportResult;
