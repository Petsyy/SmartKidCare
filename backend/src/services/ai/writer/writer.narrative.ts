import { AIResponseLanguage } from "../language.service";
import {
  buildWriterDisplayPolicy,
  WriterDisplayPolicy,
  inferDirectQuestionKind,
} from "./writer.policy";
import {
  WriterFacts,
  WriterStructuredOutput,
} from "./types";

function timeframeLabel(
  timeframe: WriterFacts["timeframe"],
  language: AIResponseLanguage,
): string {
  if (language === "tl") {
    if (timeframe === "today") return "ngayong araw";
    if (timeframe === "week") return "ngayong linggo";
    if (timeframe === "last_week") return "nakaraang linggo";
    if (timeframe === "month") return "ngayong buwan";
    return "kamakailan";
  }
  if (timeframe === "today") return "today";
  if (timeframe === "week") return "this week";
  if (timeframe === "last_week") return "last week";
  if (timeframe === "month") return "this month";
  return "recently";
}

function sanitizeAction(text: string): string {
  return text
    .replace(/^[\-\u2022\s]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeAnalysis(analysis: string): string {
  const trimmed = analysis.trim();
  const cleaned = trimmed
    .replace(/([.!?])\1{2,}/g, "$1")
    .replace(/\n{3,}/g, "\n");
  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => sentence.trim())
    .slice(0, 4);
  const result = sentences.join(" ").trim();
  const words = result.split(/\s+/);

  if (words.length > 150) {
    return `${words.slice(0, 150).join(" ")}.`;
  }

  return result;
}

function ensureSentenceStartsUppercase(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  return trimmed.replace(/^[a-z]/, (char) => char.toUpperCase());
}

function sanitizeFollowUp(text: string): string {
  return text
    .trim()
    .replace(/^(?:follow[- ]?up|followup)\s*:\s*/i, "")
    .slice(0, 200);
}

function parseMetricFraction(
  line: string,
): { numerator: number; denominator: number; rate: number | null } | null {
  const match = line.match(/(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\D+\((\d+(?:\.\d+)?)%\)/);
  if (!match) return null;

  const numerator = Number(match[1]);
  const denominator = Number(match[2]);
  const rate = Number(match[3]);

  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) return null;

  return {
    numerator,
    denominator,
    rate: Number.isFinite(rate) ? rate : null,
  };
}

function firstMetricLine(
  facts: WriterFacts,
  prefixes: string[],
): string | undefined {
  return facts.metricLines.find((line) =>
    prefixes.some((prefix) => line.startsWith(prefix)),
  );
}

function firstDetailLine(
  detailLines: string[],
  prefixes: string[],
): string | undefined {
  return detailLines.find((line) =>
    prefixes.some((prefix) => line.startsWith(prefix)),
  );
}

function safeJoinLines(lines: string[]): string {
  return lines.filter(Boolean).join("\n");
}

function labelsForLanguage(language: AIResponseLanguage): {
  riskLabel: string;
  summaryLabel: string;
  keyDetailsLabel: string;
  suggestedActionsLabel: string;
  followUpLabel: string;
} {
  if (language === "tl") {
    return {
      riskLabel: "Antas ng Panganib",
      summaryLabel: "Buod",
      keyDetailsLabel: "Mahahalagang Detalye",
      suggestedActionsLabel: "Mga Mungkahing Hakbang",
      followUpLabel: "Follow-up",
    };
  }

  return {
    riskLabel: "Risk Level",
    summaryLabel: "Summary",
    keyDetailsLabel: "Key Details",
    suggestedActionsLabel: "Suggested Actions",
    followUpLabel: "Follow-up",
  };
}

function childReference(facts: WriterFacts): string | undefined {
  if (facts.role === "parent") {
    return facts.language === "tl" ? "anak mo" : "your child";
  }

  return facts.childName;
}

function deterministicHeadline(facts: WriterFacts): string {
  const subject = childReference(facts);
  const timeframe = timeframeLabel(facts.timeframe, facts.language);

  if (facts.language === "tl") {
    if (facts.scenario === "class_report") {
      return `Narito ang class summary ${timeframe}.`;
    }
    if (subject) return `Narito ang update ng ${subject} ${timeframe}.`;
    return `Narito ang update ${timeframe}.`;
  }

  if (facts.scenario === "class_report") {
    return `Here is the class summary ${timeframe}.`;
  }
  if (subject) return `Here is ${subject}'s update ${timeframe}.`;
  return `Here is the update ${timeframe}.`;
}

function isObservationDetailLine(line: string): boolean {
  const normalized = line.trim().toLowerCase();
  if (!normalized) return false;

  return (
    normalized.startsWith("absence date:") ||
    normalized.startsWith("absence dates:") ||
    normalized.startsWith("pagliban:") ||
    normalized.startsWith("mga araw ng pagliban:") ||
    normalized.startsWith("meals served:") ||
    normalized.startsWith("mga inihain na pagkain:") ||
    normalized.startsWith("trend snapshot") ||
    /^\d{4}-\d{2}-\d{2}\b/.test(normalized)
  );
}

function splitObservationLines(facts: WriterFacts): {
  summaryLines: string[];
  detailLines: string[];
} {
  if (facts.scenario === "child_trend") {
    return {
      summaryLines: [],
      detailLines: facts.observationLines
        .map((line) => line.trim())
        .filter(Boolean),
    };
  }

  const summaryLines: string[] = [];
  const detailLines: string[] = [];

  for (const line of facts.observationLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (isObservationDetailLine(trimmed)) {
      detailLines.push(trimmed);
      continue;
    }

    summaryLines.push(trimmed);
  }

  return { summaryLines, detailLines };
}

function genericSummaryFromFacts(facts: WriterFacts): string {
  const timeframe = timeframeLabel(facts.timeframe, facts.language);
  const combinedScenario =
    facts.scenario === "child_report" ||
    facts.scenario === "class_report" ||
    facts.scenario === "child_trend";
  const attendanceScenario =
    facts.scenario === "child_attendance" ||
    facts.scenario === "class_attendance" ||
    facts.scenario === "child_attendance_comparison";
  const feedingScenario =
    facts.scenario === "child_feeding" || facts.scenario === "class_feeding";

  if (facts.language === "tl") {
    if (combinedScenario) {
      if (facts.riskLevel === "HIGH") {
        return `Kailangan ng mas agarang pagtingin sa attendance at feeding ${timeframe}.`;
      }
      if (facts.riskLevel === "MEDIUM") {
        return `May mga bahagi sa attendance at feeding na dapat bantayan ${timeframe}.`;
      }
      return `Mukhang stable ang attendance at feeding ${timeframe}.`;
    }

    if (attendanceScenario) {
      if (facts.riskLevel === "HIGH") {
        return `Kailangan ng agarang follow-up sa attendance ${timeframe}.`;
      }
      if (facts.riskLevel === "MEDIUM") {
        return `Dapat bantayan nang mas malapitan ang attendance ${timeframe}.`;
      }
      return `Mukhang stable ang attendance ${timeframe}.`;
    }

    if (facts.riskLevel === "HIGH") {
      return `Kailangan ng agarang atensyon sa feeding consistency ${timeframe}.`;
    }
    if (facts.riskLevel === "MEDIUM") {
      return `Dapat bantayan nang mas malapitan ang feeding consistency ${timeframe}.`;
    }
    return `Mukhang stable ang feeding consistency ${timeframe}.`;
  }

  if (combinedScenario) {
    if (facts.riskLevel === "HIGH") {
      return `Attendance and feeding need prompt review ${timeframe}.`;
    }
    if (facts.riskLevel === "MEDIUM") {
      return `Attendance and feeding should be monitored more closely ${timeframe}.`;
    }
    return `Attendance and feeding look stable ${timeframe}.`;
  }

  if (attendanceScenario) {
    if (facts.riskLevel === "HIGH") {
      return `Attendance needs prompt follow-up ${timeframe}.`;
    }
    if (facts.riskLevel === "MEDIUM") {
      return `Attendance should be monitored more closely ${timeframe}.`;
    }
    return `Attendance looks stable ${timeframe}.`;
  }

  if (facts.riskLevel === "HIGH") {
    return `Feeding consistency needs prompt attention ${timeframe}.`;
  }
  if (facts.riskLevel === "MEDIUM") {
    return `Feeding consistency should be monitored more closely ${timeframe}.`;
  }
  return `Feeding consistency looks stable ${timeframe}.`;
}

function detailScopeForNarrative(facts: WriterFacts): string {
  const timeframe = timeframeLabel(facts.timeframe, facts.language);
  const isParent = facts.role === "parent";

  if (facts.language === "tl") {
    if (facts.timeframe === "recent") {
      return isParent
        ? " mula sa recent records ng anak mo"
        : " mula sa recent records";
    }
    return isParent ? ` para sa anak mo ${timeframe}` : ` para sa ${timeframe}`;
  }

  if (facts.timeframe === "recent") {
    return isParent
      ? " from your child's recent records"
      : " from the recent records";
  }

  return isParent ? ` for your child ${timeframe}` : ` for ${timeframe}`;
}

function buildFollowUp(
  policy: WriterDisplayPolicy,
  facts: WriterFacts,
): string | undefined {
  if (!policy.includeFollowUp) return undefined;

  const labels = labelsForLanguage(facts.language);
  const detailScope = detailScopeForNarrative(facts);

  if (facts.language === "tl") {
    if (
      facts.scenario === "child_attendance" ||
      facts.scenario === "class_attendance" ||
      facts.scenario === "child_attendance_comparison"
    ) {
      return `${labels.followUpLabel}: Gusto mo bang makita ang date-by-date attendance details${detailScope}?`;
    }

    if (
      facts.scenario === "child_feeding" ||
      facts.scenario === "class_feeding" ||
      facts.scenario === "child_feeding_comparison"
    ) {
      return `${labels.followUpLabel}: Gusto mo bang makita ang feeding details${detailScope}?`;
    }

    return `${labels.followUpLabel}: Gusto mo bang makita ang attendance details, feeding details, o pareho${detailScope}?`;
  }

  if (
    facts.scenario === "child_attendance" ||
    facts.scenario === "class_attendance" ||
    facts.scenario === "child_attendance_comparison"
  ) {
    return `${labels.followUpLabel}: Would you like date-by-date attendance details${detailScope}?`;
  }

  if (
    facts.scenario === "child_feeding" ||
    facts.scenario === "class_feeding" ||
    facts.scenario === "child_feeding_comparison"
  ) {
    return `${labels.followUpLabel}: Would you like feeding details${detailScope}?`;
  }

  return `${labels.followUpLabel}: Would you like attendance details, feeding details, or both${detailScope}?`;
}

function ensureActions(
  recommendationLines: string[],
  language: AIResponseLanguage,
  required: boolean,
): string[] {
  const cleaned = recommendationLines
    .map((line) => sanitizeAction(line))
    .filter(Boolean)
    .slice(0, 3);

  if (cleaned.length || !required) return cleaned;

  if (language === "tl") {
    return [
      "I-record ang attendance at feeding nang tuloy-tuloy para makita ang trend.",
      "Mag-follow up sa daycare center kung may na-miss na araw o pagkain.",
    ];
  }

  return [
    "Keep logging attendance and meals consistently to track trends.",
    "Follow up with the daycare center on any missed days or meals.",
  ];
}

function buildAnalysisFromFacts(facts: WriterFacts): string {
  const { summaryLines } = splitObservationLines(facts);
  const summaryText =
    summaryLines.join(" ").trim() || genericSummaryFromFacts(facts);
  return ensureSentenceStartsUppercase(sanitizeAnalysis(summaryText));
}

function truncateNamedListLine(params: {
  line: string;
  prefixes: string[];
  maxItems: number;
}): string {
  const { line, prefixes, maxItems } = params;
  const matchedPrefix = prefixes.find((prefix) => line.startsWith(prefix));
  if (!matchedPrefix) return line;

  const rawContent = line.slice(matchedPrefix.length).trim();
  const suffix = rawContent.endsWith(".") ? "." : "";
  const normalizedContent = rawContent.replace(/\.$/, "");
  const items = normalizedContent
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (items.length <= maxItems) return line;

  const shown = items.slice(0, maxItems).join(", ");
  const remaining = items.length - maxItems;
  return `${matchedPrefix} ${shown}, +${remaining} more${suffix}`;
}

function formatDetailLineForQuestion(
  line: string,
  policy: WriterDisplayPolicy,
  language: AIResponseLanguage,
): string {
  if (policy.detailMode === "expanded") return line;

  if (language === "tl") {
    return truncateNamedListLine({
      line: truncateNamedListLine({
        line,
        prefixes: ["Mga araw ng pagliban:"],
        maxItems: 3,
      }),
      prefixes: ["Mga inihain na pagkain:"],
      maxItems: 4,
    });
  }

  return truncateNamedListLine({
    line: truncateNamedListLine({
      line,
      prefixes: ["Absence dates:"],
      maxItems: 3,
    }),
    prefixes: ["Meals served:"],
    maxItems: 4,
  });
}

function buildDetailLines(
  facts: WriterFacts,
  policy: WriterDisplayPolicy,
): string[] {
  return splitObservationLines(facts).detailLines.map((line) =>
    formatDetailLineForQuestion(line, policy, facts.language),
  );
}

function directSubject(facts: WriterFacts): string {
  return childReference(facts) ?? (facts.language === "tl" ? "ang bata" : "the child");
}

function sentenceSubject(facts: WriterFacts): string {
  return ensureSentenceStartsUppercase(directSubject(facts));
}

function possessiveSubject(facts: WriterFacts): string {
  const subject = directSubject(facts);
  if (facts.language === "tl") return subject;
  if (subject === "your child") return "Your child's";
  return `${ensureSentenceStartsUppercase(subject)}'s`;
}

function recommendationFocus(facts: WriterFacts): string {
  if (
    facts.scenario === "child_attendance" ||
    facts.scenario === "class_attendance" ||
    facts.scenario === "child_attendance_comparison"
  ) {
    return "attendance";
  }

  if (
    facts.scenario === "child_feeding" ||
    facts.scenario === "class_feeding" ||
    facts.scenario === "child_feeding_comparison"
  ) {
    return "feeding";
  }

  return facts.language === "tl" ? "attendance at feeding" : "attendance and feeding";
}

function parseSignedRate(line: string): number | null {
  const match = line.match(/([+-]?\d+(?:\.\d+)?)%/);
  if (!match) return null;

  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function buildDirectAnswerNarrative(params: {
  question: string;
  facts: WriterFacts;
  policy: WriterDisplayPolicy;
}): string {
  const { question, facts, policy } = params;
  const kind = inferDirectQuestionKind(question, facts);
  const timeframe = timeframeLabel(facts.timeframe, facts.language);
  const subject = directSubject(facts);
  const detailLines = buildDetailLines(facts, policy);
  const attendanceLine = firstMetricLine(facts, ["Attendance"]);
  const feedingLine = firstMetricLine(facts, ["Feeding Completion"]);
  const changeLine = firstMetricLine(facts, ["Change:", "Pagbabago:"]);
  const summaryLine = buildAnalysisFromFacts(facts);
  const actions = ensureActions(facts.recommendationLines, facts.language, false);

  if (
    kind === "attendance_presence" ||
    kind === "attendance_absence_count" ||
    kind === "attendance_absence_dates" ||
    kind === "attendance_rate" ||
    kind === "detail_lookup"
  ) {
    const metricLine = attendanceLine;
    const metric = metricLine ? parseMetricFraction(metricLine) : null;
    const absences =
      metric && Number.isFinite(metric.denominator - metric.numerator)
        ? metric.denominator - metric.numerator
        : null;
    const absenceLine = firstDetailLine(detailLines, [
      "Absence date:",
      "Absence dates:",
      "Pagliban:",
      "Mga araw ng pagliban:",
    ]);

    if (facts.language === "tl") {
      const noRecord = `Walang available na attendance record para sa ${subject} ${timeframe}.`;

      if (kind === "attendance_presence") {
        const lead =
          !metric || metric.denominator === 0
            ? noRecord
            : metric.numerator > 0
              ? `Oo, present ang ${subject} ${timeframe}.`
              : `Hindi, absent ang ${subject} ${timeframe}.`;
        return [lead, metricLine].filter(Boolean).join("\n");
      }

      if (kind === "attendance_absence_count") {
        const lead =
          absences === null
            ? noRecord
            : `May ${absences} absence ang ${subject} ${timeframe}.`;
        return [lead, metricLine, absenceLine].filter(Boolean).join("\n");
      }

      if (kind === "attendance_absence_dates") {
        const lead = absenceLine
          ? `Ito ang recorded absence dates ng ${subject} ${timeframe}.`
          : `Walang recorded absences ang ${subject} ${timeframe}.`;
        return [lead, metricLine, absenceLine].filter(Boolean).join("\n");
      }

      const lead =
        !metricLine || !metric
          ? noRecord
          : kind === "attendance_rate"
            ? `Ang attendance rate ng ${subject} ${timeframe} ay ${metricLine.replace(/^Attendance:\s*/, "")}.`
            : `Narito ang attendance details ng ${subject} ${timeframe}.`;
      return [lead, metricLine, absenceLine].filter(Boolean).join("\n");
    }

    const noRecord = `There is no recorded attendance data for ${subject} ${timeframe}.`;

    if (kind === "attendance_presence") {
      const lead =
        !metric || metric.denominator === 0
          ? noRecord
          : metric.numerator > 0
            ? `Yes, ${subject} was present ${timeframe}.`
            : `No, ${subject} was absent ${timeframe}.`;
      return [lead, metricLine].filter(Boolean).join("\n");
    }

    if (kind === "attendance_absence_count") {
      const lead =
        absences === null
          ? noRecord
          : `${sentenceSubject(facts)} had ${absences} absence${absences === 1 ? "" : "s"} ${timeframe}.`;
      return [lead, metricLine, absenceLine].filter(Boolean).join("\n");
    }

    if (kind === "attendance_absence_dates") {
      const lead = absenceLine
        ? `These are the recorded absence dates for ${subject} ${timeframe}.`
        : `${sentenceSubject(facts)} had no recorded absences ${timeframe}.`;
      return [lead, metricLine, absenceLine].filter(Boolean).join("\n");
    }

    const lead =
      !metricLine || !metric
        ? noRecord
        : kind === "attendance_rate"
          ? `${possessiveSubject(facts)} attendance rate ${timeframe} was ${metricLine.replace(/^Attendance:\s*/, "")}.`
          : `Here are the attendance details for ${subject} ${timeframe}.`;
    return [lead, metricLine, absenceLine].filter(Boolean).join("\n");
  }

  if (
    kind === "feeding_meals" ||
    kind === "feeding_missed" ||
    kind === "feeding_rate"
  ) {
    const metricLine = feedingLine;
    const metric = metricLine ? parseMetricFraction(metricLine) : null;
    const missed =
      metric && Number.isFinite(metric.denominator - metric.numerator)
        ? metric.denominator - metric.numerator
        : null;
    const mealsLine = firstDetailLine(detailLines, [
      "Meals served:",
      "Mga inihain na pagkain:",
    ]);

    if (facts.language === "tl") {
      const noRecord = `Walang available na feeding record para sa ${subject} ${timeframe}.`;

      if (kind === "feeding_meals") {
        const lead = metric
          ? missed === 0
            ? `${subject} completed all ${metric.numerator}/${metric.denominator} recorded meals ${timeframe}.`
            : `${subject} completed ${metric.numerator}/${metric.denominator} recorded meals ${timeframe}.`
          : noRecord;
        const limitation =
          mealsLine && missed !== null && missed > 0
            ? "Ipinapakita ng meal list kung ano ang inihain, pero hindi nito tinutukoy kung aling partikular na meal ang na-miss."
            : undefined;
        return [lead, metricLine, mealsLine, limitation].filter(Boolean).join("\n");
      }

      if (kind === "feeding_missed") {
        const lead =
          missed === null
            ? noRecord
            : missed === 0
              ? `Walang recorded missed meals ang ${subject} ${timeframe}.`
              : `May ${missed} missed meal${missed === 1 ? "" : "s"} ang ${subject} ${timeframe}.`;
        return [lead, metricLine, mealsLine].filter(Boolean).join("\n");
      }

      const lead =
        !metricLine || !metric
          ? noRecord
          : `Ang feeding completion rate ng ${subject} ${timeframe} ay ${metricLine.replace(/^Feeding Completion:\s*/, "")}.`;
      return [lead, metricLine, mealsLine].filter(Boolean).join("\n");
    }

    const noRecord = `There is no recorded feeding data for ${subject} ${timeframe}.`;

    if (kind === "feeding_meals") {
      const lead = metric
        ? missed === 0
          ? `${sentenceSubject(facts)} completed all ${metric.numerator}/${metric.denominator} recorded meals ${timeframe}.`
          : `${sentenceSubject(facts)} completed ${metric.numerator}/${metric.denominator} recorded meals ${timeframe}.`
        : noRecord;
      const limitation =
        mealsLine && missed !== null && missed > 0
          ? "The meal list shows what was served, but the records do not identify which specific meal was missed."
          : undefined;
      return [lead, metricLine, mealsLine, limitation].filter(Boolean).join("\n");
    }

    if (kind === "feeding_missed") {
      const lead =
        missed === null
          ? noRecord
          : missed === 0
            ? `${sentenceSubject(facts)} did not miss any recorded meals ${timeframe}.`
            : `${sentenceSubject(facts)} missed ${missed} meal${missed === 1 ? "" : "s"} ${timeframe}.`;
      return [lead, metricLine, mealsLine].filter(Boolean).join("\n");
    }

    const lead =
      !metricLine || !metric
        ? noRecord
        : `${possessiveSubject(facts)} feeding completion rate ${timeframe} was ${metricLine.replace(/^Feeding Completion:\s*/, "")}.`;
    return [lead, metricLine, mealsLine].filter(Boolean).join("\n");
  }

  if (kind === "risk_level") {
    if (facts.language === "tl") {
      return [
        `Ang kasalukuyang risk level ng ${subject} ay ${facts.riskLevel}.`,
        ...facts.metricLines,
        `Dahilan: ${summaryLine}`,
        ...detailLines.slice(0, 2),
      ]
        .filter(Boolean)
        .join("\n");
    }

    return [
      `${possessiveSubject(facts)} current risk level is ${facts.riskLevel}.`,
      ...facts.metricLines,
      `Reason: ${summaryLine}`,
      ...detailLines.slice(0, 2),
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (kind === "recommendations") {
    const actionLines = actions.map((line) => `- ${line}`);

    if (facts.language === "tl") {
      return [
        `Narito ang mga inirerekomendang hakbang para mapabuti ang ${recommendationFocus(facts)} para kay ${subject}.`,
        ...actionLines,
        `Batayan: ${summaryLine}`,
        ...facts.metricLines,
      ]
        .filter(Boolean)
        .join("\n");
    }

    return [
      `Here are the recommended actions to improve ${recommendationFocus(facts)} for ${subject}.`,
      ...actionLines,
      `Reason: ${summaryLine}`,
      ...facts.metricLines,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (kind === "trend_snapshot") {
    if (facts.language === "tl") {
      return [
        `Narito ang maikling trend para kay ${subject} sa nakaraang 30 araw.`,
        ...facts.metricLines,
        ...detailLines,
      ]
        .filter(Boolean)
        .join("\n");
    }

    return [
      `Here is a short trend for ${subject} over the last 30 days.`,
      ...facts.metricLines,
      ...detailLines,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (kind === "attendance_comparison" || kind === "feeding_comparison") {
    const comparisonLines = facts.metricLines;
    const delta = changeLine ? parseSignedRate(changeLine) : null;

    if (facts.language === "tl") {
      const lead =
        delta === null
          ? `Narito ang comparison para kay ${subject} ${timeframe}.`
          : delta > 0
            ? `Mas bumuti ng ${delta}% ang ${kind === "attendance_comparison" ? "attendance" : "feeding"} kumpara sa nakaraang linggo.`
            : delta < 0
              ? `Bumaba ng ${Math.abs(delta)}% ang ${kind === "attendance_comparison" ? "attendance" : "feeding"} kumpara sa nakaraang linggo.`
              : `Walang pagbabago sa ${kind === "attendance_comparison" ? "attendance" : "feeding"} kumpara sa nakaraang linggo.`;
      const comparisonDetail =
        kind === "feeding_comparison"
          ? firstDetailLine(detailLines, ["Meals served:", "Mga inihain na pagkain:"])
          : firstDetailLine(detailLines, [
              "Absence date:",
              "Absence dates:",
              "Pagliban:",
              "Mga araw ng pagliban:",
            ]);
      return [lead, ...comparisonLines, comparisonDetail]
        .filter(Boolean)
        .join("\n");
    }

    const metricName =
      kind === "attendance_comparison" ? "Attendance" : "Feeding";
    const lead =
      delta === null
        ? `Here is the ${metricName.toLowerCase()} comparison for ${subject} ${timeframe}.`
        : delta > 0
          ? `${metricName} improved by ${delta}% compared with last week.`
          : delta < 0
            ? `${metricName} declined by ${Math.abs(delta)}% compared with last week.`
            : `${metricName} is unchanged compared with last week.`;
    const comparisonDetail =
      kind === "feeding_comparison"
        ? firstDetailLine(detailLines, ["Meals served:", "Mga inihain na pagkain:"])
        : firstDetailLine(detailLines, [
            "Absence date:",
            "Absence dates:",
            "Pagliban:",
            "Mga araw ng pagliban:",
          ]);
    return [lead, ...comparisonLines, comparisonDetail]
      .filter(Boolean)
      .join("\n");
  }

  return [deterministicHeadline(facts), ...facts.metricLines, ...detailLines]
    .filter(Boolean)
    .join("\n");
}

function buildGroundTruthFromFacts(facts: WriterFacts): string {
  const subject = facts.childName?.trim().length
    ? facts.childName.trim()
    : facts.scenario.includes("class")
      ? "Class"
      : "Child";
  const metricSummary = facts.metricLines.join("; ");
  const primaryObservation = facts.observationLines[0]?.trim();

  return [
    `${subject} summary (${facts.timeframe}).`,
    metricSummary,
    `Risk Level: ${facts.riskLevel}.`,
    primaryObservation,
  ]
    .filter((line): line is string => Boolean(line))
    .join(" ");
}

export function buildEvaluationArtifacts(params: {
  answer: string;
  facts: WriterFacts;
  policy: WriterDisplayPolicy;
}): { contexts: string[]; groundTruth: string } {
  const { facts, policy } = params;
  const detailLines = splitObservationLines(facts).detailLines.map((line) =>
    line.trim(),
  );
  const actions = ensureActions(facts.recommendationLines, facts.language, false);
  const followUp = buildFollowUp(policy, facts);
  const contexts = [
    facts.childName?.trim() ? `Child: ${facts.childName.trim()}` : undefined,
    `Timeframe: ${facts.timeframe}`,
    `Scenario: ${facts.scenario}`,
    ...facts.metricLines,
    `Risk Level: ${facts.riskLevel}`,
    `Summary: ${buildAnalysisFromFacts(facts)}`,
    ...detailLines.map((line) => `Key Detail: ${line}`),
    ...actions.map((line) => `Suggested Action: ${line}`),
    followUp ? `Follow-up Prompt: ${followUp}` : undefined,
  ].filter((line): line is string => Boolean(line));

  return {
    contexts,
    groundTruth: buildGroundTruthFromFacts(facts),
  };
}

export function buildDeterministicNarrative(
  question: string,
  facts: WriterFacts,
  policy: WriterDisplayPolicy,
): string {
  if (policy.mode === "direct") {
    return buildDirectAnswerNarrative({ question, facts, policy });
  }

  const labels = labelsForLanguage(facts.language);
  const headline = deterministicHeadline(facts);
  const metrics = safeJoinLines(facts.metricLines);
  const analysis = buildAnalysisFromFacts(facts);
  const detailLines = buildDetailLines(facts, policy);
  const actions = policy.includeSuggestedActions
    ? ensureActions(facts.recommendationLines, facts.language, true)
    : [];
  const followUp = buildFollowUp(policy, facts);

  return [
    headline,
    "",
    metrics,
    policy.includeRiskLevel ? "" : undefined,
    policy.includeRiskLevel ? `${labels.riskLabel}: ${facts.riskLevel}` : undefined,
    policy.includeRiskLevel ? "" : undefined,
    `${labels.summaryLabel}:`,
    analysis,
    detailLines.length ? "" : undefined,
    detailLines.length ? `${labels.keyDetailsLabel}:` : undefined,
    ...detailLines.map((line) => `- ${line}`),
    actions.length ? "" : undefined,
    actions.length ? `${labels.suggestedActionsLabel}:` : undefined,
    ...actions.map((line) => `- ${line}`),
    followUp ? "" : undefined,
    followUp,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

export function renderWriterOutput(
  output: WriterStructuredOutput,
  facts: WriterFacts,
  policy: WriterDisplayPolicy,
): string {
  const labels = labelsForLanguage(facts.language);
  const headline = output.headline.trim() || deterministicHeadline(facts);
  const analysis = ensureSentenceStartsUppercase(
    sanitizeAnalysis(output.analysis || buildAnalysisFromFacts(facts)),
  );
  const detailLines = buildDetailLines(facts, policy);
  const suggestedActions = policy.includeSuggestedActions
    ? ensureActions(facts.recommendationLines, facts.language, true)
    : [];
  const followUp =
    buildFollowUp(policy, facts) ||
    (policy.includeFollowUp && sanitizeFollowUp(output.followUp ?? "")
      ? `${labels.followUpLabel}: ${sanitizeFollowUp(output.followUp ?? "")}`
      : undefined);

  return [
    headline,
    "",
    safeJoinLines(facts.metricLines.map((line) => line.trim())),
    policy.includeRiskLevel ? "" : undefined,
    policy.includeRiskLevel ? `${labels.riskLabel}: ${facts.riskLevel}` : undefined,
    policy.includeRiskLevel ? "" : undefined,
    `${labels.summaryLabel}:`,
    analysis,
    detailLines.length ? "" : undefined,
    detailLines.length ? `${labels.keyDetailsLabel}:` : undefined,
    ...detailLines.map((line) => `- ${line}`),
    suggestedActions.length ? "" : undefined,
    suggestedActions.length ? `${labels.suggestedActionsLabel}:` : undefined,
    ...suggestedActions.map((line) => `- ${line}`),
    followUp ? "" : undefined,
    followUp,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

export function buildDeterministicNarrativeForFacts(params: {
  question: string;
  facts: WriterFacts;
  suppressFollowUp?: boolean;
  hasRecentFollowUp?: boolean;
}): string {
  const policy = buildWriterDisplayPolicy({
    question: params.question,
    facts: params.facts,
    suppressFollowUp: params.suppressFollowUp,
    hasRecentFollowUp: params.hasRecentFollowUp,
  });

  return buildDeterministicNarrative(params.question, params.facts, policy);
}

export function buildEvaluationArtifactsForFacts(params: {
  question: string;
  facts: WriterFacts;
  suppressFollowUp?: boolean;
  hasRecentFollowUp?: boolean;
}): { answer: string; contexts: string[]; groundTruth: string } {
  const policy = buildWriterDisplayPolicy({
    question: params.question,
    facts: params.facts,
    suppressFollowUp: params.suppressFollowUp,
    hasRecentFollowUp: params.hasRecentFollowUp,
  });
  const answer = buildDeterministicNarrative(params.question, params.facts, policy);
  const evaluation = buildEvaluationArtifacts({
    answer,
    facts: params.facts,
    policy,
  });

  return {
    answer,
    contexts: evaluation.contexts,
    groundTruth: evaluation.groundTruth,
  };
}
