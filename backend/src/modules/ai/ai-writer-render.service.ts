import { AIResponseLanguage } from "./ai-chat.service";

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

// ─── Rendering Logic ────────────────────────────────────────────────

export function renderWriterOutput(
  output: WriterStructuredOutput,
  facts: WriterFacts,
  policy: WriterDisplayPolicy,
): string {
  const parts: string[] = [];
  parts.push(output.headline);
  parts.push(...output.metricLines);

  if (policy.includeRiskLevel) {
    const label = facts.language === "tl" ? "Antas ng Panganib" : "Risk Level";
    parts.push(`${label}: ${output.riskLevel}`);
  }

  parts.push(output.analysis);

  if (policy.includeSuggestedActions && output.suggestedActions?.length) {
    const label =
      facts.language === "tl" ? "Mga Mungkahing Hakbang" : "Suggested Actions";
    parts.push(
      `${label}:\n${output.suggestedActions.map((s) => `- ${s}`).join("\n")}`,
    );
  }

  if (policy.includeFollowUp && output.followUp) {
    const label = facts.language === "tl" ? "Follow-up" : "Follow-up";
    parts.push(`${label}: ${output.followUp}`);
  }

  return parts.filter(Boolean).join("\n\n");
}

export function buildDeterministicNarrative(
  question: string,
  facts: WriterFacts,
  policy: WriterDisplayPolicy,
): string {
  // Simplification of the 31KB narrative file into a core deterministic generator
  const parts: string[] = [];
  const timeframe = facts.timeframe;
  const subject =
    facts.role === "parent"
      ? facts.language === "tl"
        ? "anak mo"
        : "your child"
      : facts.childName;

  // Headline
  if (facts.language === "tl") {
    parts.push(`Narito ang update ng ${subject} para sa ${timeframe}.`);
  } else {
    parts.push(`Here is the update for ${subject} ${timeframe}.`);
  }

  // Metrics
  parts.push(...facts.metricLines);

  // Analysis (Deterministic fallback)
  if (facts.observationLines.length > 0) {
    parts.push(facts.observationLines[0]);
  }

  // Actions
  if (policy.includeSuggestedActions && facts.recommendationLines.length > 0) {
    const label =
      facts.language === "tl" ? "Mga Mungkahing Hakbang" : "Suggested Actions";
    parts.push(
      `${label}:\n${facts.recommendationLines
        .slice(0, 3)
        .map((l) => `- ${l}`)
        .join("\n")}`,
    );
  }

  return parts.join("\n\n");
}
