import { WriterFacts, WriterResponseTemplate } from "./types";

export type DirectQuestionKind =
  | "attendance_presence"
  | "attendance_absence_count"
  | "attendance_absence_dates"
  | "attendance_rate"
  | "attendance_comparison"
  | "feeding_meals"
  | "feeding_missed"
  | "feeding_rate"
  | "feeding_comparison"
  | "risk_level"
  | "recommendations"
  | "trend_snapshot"
  | "detail_lookup"
  | null;

export type WriterDisplayPolicy = {
  mode: "direct" | "structured";
  responseTemplate: WriterResponseTemplate;
  includeSuggestedActions: boolean;
  includeFollowUp: boolean;
  includeRiskLevel: boolean;
  detailMode: "compact" | "expanded";
};

function normalizedQuestion(question: string): string {
  return question.toLowerCase().replace(/\s+/g, " ").trim();
}

function isBroadSummaryIntent(question: string): boolean {
  const lower = normalizedQuestion(question);
  return /\b(summary|summarize|overall|status|report|update|overview|risk|why|recommend|recommendation|suggest|advice|next step|tips?|strategy|plan|trend|how is|how are|kamusta|kumusta|kalagayan)\b/.test(
    lower,
  );
}

export function inferDirectQuestionKind(
  question: string,
  facts: WriterFacts,
): DirectQuestionKind {
  const lower = normalizedQuestion(question);
  const isAttendanceScenario =
    facts.scenario === "child_attendance" ||
    facts.scenario === "class_attendance";
  const isFeedingScenario =
    facts.scenario === "child_feeding" || facts.scenario === "class_feeding";

  if (
    facts.scenario === "child_attendance_comparison" &&
    /\b(improv\w*|compar\w*|versus|vs)\b/.test(lower)
  ) {
    return "attendance_comparison";
  }

  if (
    facts.scenario === "child_feeding_comparison" &&
    /\b(improv\w*|compar\w*|versus|vs)\b/.test(lower)
  ) {
    return "feeding_comparison";
  }

  if (
    facts.scenario === "child_trend" &&
    /\b(trend|last 30 days|30 days|history)\b/.test(lower)
  ) {
    return "trend_snapshot";
  }

  if (
    /\b(risk|risk level|high risk|medium risk|low risk)\b/.test(lower) &&
    (facts.scenario === "child_report" ||
      facts.scenario === "class_report" ||
      facts.scenario === "child_trend")
  ) {
    return "risk_level";
  }

  if (
    /\b(recommend|recommendation|suggest|advice|actions?|what should|next step|tips?|improve|strategy|plan)\b/.test(
      lower,
    )
  ) {
    return "recommendations";
  }

  if (isBroadSummaryIntent(lower)) return null;

  if (
    isAttendanceScenario &&
    /\b(was|is)\b/.test(lower) &&
    /\b(present|here|pumasok|pasok)\b/.test(lower)
  ) {
    return "attendance_presence";
  }

  if (
    isAttendanceScenario &&
    (/\bhow many\b/.test(lower) || /\bcount|number|total|ilan\b/.test(lower)) &&
    /\b(absences?|absent|lumiban|pagliban)\b/.test(lower)
  ) {
    return "attendance_absence_count";
  }

  if (
    isAttendanceScenario &&
    (/\bwhich dates?\b/.test(lower) ||
      /\bon which dates?\b/.test(lower) ||
      /\bwhat dates?\b/.test(lower) ||
      /\bwhen\b/.test(lower)) &&
    /\b(absent|absence|absences|lumiban|pagliban)\b/.test(lower)
  ) {
    return "attendance_absence_dates";
  }

  if (
    isAttendanceScenario &&
    /\b(rate|percentage|percent)\b/.test(lower) &&
    /\b(attendance|present|absence)\b/.test(lower)
  ) {
    return "attendance_rate";
  }

  if (
    isFeedingScenario &&
    (/\bwhat\b/.test(lower) ||
      /\bwhich\b/.test(lower) ||
      /\b(show|list)\b/.test(lower)) &&
    /\b(meals?|food|eat|ate|served|kinain|pagkain|ulam)\b/.test(lower)
  ) {
    return "feeding_meals";
  }

  if (
    isFeedingScenario &&
    (/\bmissed\b/.test(lower) ||
      /\bskip|skipped\b/.test(lower) ||
      lower.includes("didn't eat") ||
      lower.includes("did not eat") ||
      /\bhindi kumain|di kumain\b/.test(lower))
  ) {
    return "feeding_missed";
  }

  if (
    isFeedingScenario &&
    /\b(rate|percentage|percent|completion rate)\b/.test(lower) &&
    /\b(feed|feeding|meal|meals)\b/.test(lower)
  ) {
    return "feeding_rate";
  }

  if (
    (isAttendanceScenario || isFeedingScenario) &&
    (/\b(show|list|give me|tell me)\b/.test(lower) ||
      /\bdetail|details|specific|exact\b/.test(lower))
  ) {
    return "detail_lookup";
  }

  return null;
}

function shouldUseDirectAnswer(
  question: string,
  facts: WriterFacts,
): boolean {
  return inferDirectQuestionKind(question, facts) !== null;
}

function shouldIncludeGuidanceByIntent(question: string): boolean {
  const lower = question.toLowerCase();
  return /\b(recommend|recommendation|suggest|advice|what should|next step|tips?|improve|strategy|plan)\b/.test(
    lower,
  );
}

function shouldOfferFollowUpByIntent(question: string): boolean {
  const lower = question.toLowerCase();

  const asksSpecificDetail =
    /\b(detail|details|date[- ]by[- ]date|by date|specific|exact|which dates?|what food|meal history|attendance details|feeding details)\b/.test(
      lower,
    ) ||
    (/\b(show|list|give me|tell me)\b/.test(lower) &&
      /\b(attendance|feeding|absence|absences|meals?|food|dates?)\b/.test(
        lower,
      ));

  if (asksSpecificDetail) return false;

  const asksExplicitDeliverable =
    /\b(summary|summarize|summarise|report|overview|risk|recommend|recommendation|suggest|advice|actions?|trend|compare|comparison)\b/.test(
      lower,
    );

  if (asksExplicitDeliverable) return false;

  const asksBroadSummary =
    /\b(how is|how are|overall|status|update|kamusta|kumusta|kalagayan)\b/.test(
      lower,
    );

  if (asksBroadSummary) return true;

  return false;
}

function shouldExpandDetailsByIntent(question: string): boolean {
  const lower = question.toLowerCase();
  return (
    /\b(detail|details|date[- ]by[- ]date|by date|specific|exact|which dates?|what food|meal history|attendance details|feeding details)\b/.test(
      lower,
    ) ||
    (/\b(show|list|give me|tell me)\b/.test(lower) &&
      /\b(attendance|feeding|absence|absences|meals?|food|dates?)\b/.test(
        lower,
      ))
  );
}

export function buildWriterDisplayPolicy(params: {
  question: string;
  facts: WriterFacts;
  suppressFollowUp?: boolean;
  hasRecentFollowUp?: boolean;
}): WriterDisplayPolicy {
  const {
    question,
    facts,
    suppressFollowUp = false,
    hasRecentFollowUp = false,
  } = params;
  const mode = shouldUseDirectAnswer(question, facts) ? "direct" : "structured";
  const guidanceIntent = shouldIncludeGuidanceByIntent(question);
  const followUpIntent = shouldOfferFollowUpByIntent(question);
  const detailMode = shouldExpandDetailsByIntent(question)
    ? "expanded"
    : "compact";
  const responseTemplate: WriterResponseTemplate =
    facts.riskLevel === "HIGH"
      ? "alert"
      : guidanceIntent
        ? "advice"
        : "fact";

  const includeSuggestedActions = mode === "structured" && guidanceIntent;
  const includeFollowUp =
    mode === "structured" &&
    followUpIntent &&
    !guidanceIntent &&
    !suppressFollowUp &&
    !hasRecentFollowUp;

  return {
    mode,
    responseTemplate,
    includeSuggestedActions,
    includeFollowUp,
    includeRiskLevel: mode === "structured",
    detailMode,
  };
}
