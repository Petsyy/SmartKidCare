import type { AIResponseLanguage } from "../../types/core-ai-chat.types";
import type {
  AIRole,
  WriterRiskLevel,
  WriterResponseTemplate,
  WriterFacts,
  AttendanceComparisonResult,
  FeedingComparisonResult,
  WriterStructuredOutput,
  WriterDisplayPolicy,
} from "../../types/generators-ai-writer-render.types";

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
        ? "anak io"
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

  // Analysms (Deterministic fallback)
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

export type {
  AIRole,
  WriterRiskLevel,
  WriterResponseTemplate,
  WriterFacts,
  AttendanceComparisonResult,
  FeedingComparisonResult,
  WriterStructuredOutput,
  WriterDisplayPolicy,
} from "../../types/generators-ai-writer-render.types";
