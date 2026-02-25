import { z } from "zod";
import { askGemini } from "./gemini.service";
import { AIResponseLanguage } from "./language.service";
import {
  ToolTimeframe,
  SummarizeAttendanceResult,
  SummarizeAttendanceClassResult,
  SummarizeFeedingClassResult,
  SummarizeChildTrendResult,
} from "./mongoAgentTools.service";
import { AgentToolResult } from "./tools.service";
import {
  analyzeAttendanceInsight,
  analyzeChildReportInsight,
  analyzeFeedingInsight,
  InsightBlock,
  InsightLevel,
} from "./insights.service";
import {
  recommendForAttendance,
  recommendForChildReport,
  recommendForFeeding,
} from "./recommendations.service";
import { buildConversationClosureReply } from "./chatReply.service";

type AIRole = "parent" | "teacher" | "admin";
type WriterRiskLevel = "LOW" | "MEDIUM" | "HIGH";
type MemoryRole = "user" | "assistant";

type ConversationTurn = {
  role: MemoryRole;
  content: string;
};

type WriterFacts = {
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

const HISTORY_LIMIT = 8;
const writerMemory = new Map<string, ConversationTurn[]>();

const WriterOutputSchema = z.object({
  headline: z.string().min(1),
  metricLines: z.array(z.string().min(1)).min(1),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
  analysis: z.string().min(1),
  suggestedActions: z.array(z.string().min(1)).min(1).max(3),
  followUp: z.string().min(1),
});

function normalizeRole(role: string): AIRole {
  const normalized = String(role).trim().toLowerCase();
  if (normalized === "teacher") return "teacher";
  if (normalized === "admin") return "admin";
  return "parent";
}

function timeframeLabel(
  timeframe: ToolTimeframe,
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

function metricLabel(
  key: "attendance" | "feeding" | "childrenIncluded",
  language: AIResponseLanguage,
): string {
  if (language === "tl") {
    if (key === "attendance") return "Attendance";
    if (key === "feeding") return "Feeding Completion";
    return "Mga Batang Kasama";
  }

  if (key === "attendance") return "Attendance";
  if (key === "feeding") return "Feeding Completion";
  return "Children Included";
}

function riskFromInsight(level: InsightLevel): WriterRiskLevel {
  if (level === "critical") return "HIGH";
  if (level === "watch") return "MEDIUM";
  return "LOW";
}

function riskFromRate(rate: number): WriterRiskLevel {
  if (rate < 80) return "HIGH";
  if (rate < 90) return "MEDIUM";
  return "LOW";
}

function formatAbsentDatesLine(
  absentDates: string[],
  language: AIResponseLanguage,
): string | undefined {
  if (!absentDates.length) return undefined;
  if (language === "tl") {
    if (absentDates.length === 1) return `Pagliban: ${absentDates[0]}.`;
    return `Mga araw ng pagliban: ${absentDates.join(", ")}.`;
  }
  if (absentDates.length === 1) return `Absence date: ${absentDates[0]}.`;
  return `Absence dates: ${absentDates.join(", ")}.`;
}

function formatFoodsLine(
  foods: string[],
  language: AIResponseLanguage,
): string | undefined {
  if (!foods.length) return undefined;
  return language === "tl"
    ? `Mga inihain na pagkain: ${foods.join(", ")}.`
    : `Meals served: ${foods.join(", ")}.`;
}

function classAttendanceActions(
  insight: InsightBlock,
  language: AIResponseLanguage,
): string[] {
  if (language === "tl") {
    if (insight.level === "critical") {
      return [
        "I-monitor nang mas malapitan ang attendance ngayong linggo.",
        "Suriin ang posibleng health o schedule issues.",
        "Makipag-coordinate sa mga magulang kung magpapatuloy ang absences.",
      ];
    }
    if (insight.level === "watch") {
      return [
        "I-review ang attendance trend kada araw.",
        "Mag-set ng mabilis na follow-up para sa mga absent entries.",
      ];
    }
    return [
      "Panatilihin ang kasalukuyang attendance routine.",
      "Ikumpara muli sa susunod na linggo para sa trend checking.",
    ];
  }

  if (insight.level === "critical") {
    return [
      "Monitor class attendance closely this week.",
      "Check for health or schedule barriers.",
      "Coordinate with parents if absences continue.",
    ];
  }
  if (insight.level === "watch") {
    return [
      "Review class attendance trend by date.",
      "Set quick follow-ups for absent entries.",
    ];
  }
  return [
    "Maintain the current attendance routine.",
    "Compare again next week to track trend stability.",
  ];
}

function classFeedingActions(
  insight: InsightBlock,
  language: AIResponseLanguage,
): string[] {
  if (language === "tl") {
    if (insight.level === "critical") {
      return [
        "I-monitor nang mas malapitan ang meal completion ngayong linggo.",
        "Suriin ang pattern ng missed meals.",
        "Makipag-coordinate sa mga magulang tungkol sa feeding concerns.",
      ];
    }
    if (insight.level === "watch") {
      return [
        "I-review ang meal history kada araw.",
        "Mag-set ng follow-up sa paulit-ulit na missed meals.",
      ];
    }
    return [
      "Panatilihin ang kasalukuyang feeding routine.",
      "Dagdagan ang meal variety kung posible.",
    ];
  }

  if (insight.level === "critical") {
    return [
      "Monitor class meal completion closely this week.",
      "Review missed meal patterns.",
      "Coordinate with parents about ongoing feeding concerns.",
    ];
  }
  if (insight.level === "watch") {
    return [
      "Review class meal history by date.",
      "Set follow-ups for repeated missed meals.",
    ];
  }
  return [
    "Maintain the current feeding routine.",
    "Add more meal variety where possible.",
  ];
}

function trendActions(
  risk: WriterRiskLevel,
  language: AIResponseLanguage,
): string[] {
  if (language === "tl") {
    if (risk === "HIGH") {
      return [
        "I-review ang daily routine para mabawasan ang absences at missed meals.",
        "Makipag-coordinate sa teacher para sa regular follow-up ngayong linggo.",
      ];
    }
    if (risk === "MEDIUM") {
      return [
        "I-track ang weekly trend para makita kung consistent ang improvement.",
        "Panatilihin ang routines sa attendance at feeding.",
      ];
    }
    return [
      "Panatilihin ang kasalukuyang routines para manatiling stable ang trend.",
      "I-check muli ang trend sa susunod na linggo.",
    ];
  }

  if (risk === "HIGH") {
    return [
      "Review daily routines to reduce absences and missed meals.",
      "Coordinate with the teacher for close weekly follow-up.",
    ];
  }
  if (risk === "MEDIUM") {
    return [
      "Track weekly trend changes to confirm steady improvement.",
      "Maintain consistent attendance and feeding routines.",
    ];
  }
  return [
    "Maintain the current routines to keep trend stability.",
    "Check trend again next week for consistency.",
  ];
}

function sanitizeAction(text: string): string {
  return text
    .replace(/^[\-\u2022\s]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getHistory(conversationId: string): ConversationTurn[] {
  return [...(writerMemory.get(conversationId) ?? [])];
}

function remember(conversationId: string, turn: ConversationTurn): void {
  const current = writerMemory.get(conversationId) ?? [];
  const next = [...current, turn].slice(-HISTORY_LIMIT);
  writerMemory.set(conversationId, next);
}

function parseFirstJSONObject(rawText: string): unknown {
  const trimmed = rawText
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("invalid_writer_json");
  }
}

function safeJoinLines(lines: string[]): string {
  return lines.filter(Boolean).join("\n");
}

function labelsForLanguage(language: AIResponseLanguage): {
  riskLabel: string;
  suggestedActionsLabel: string;
  followUpLabel: string;
} {
  if (language === "tl") {
    return {
      riskLabel: "Antas ng Panganib",
      suggestedActionsLabel: "Mga Mungkahing Hakbang",
      followUpLabel: "Follow-up",
    };
  }
  return {
    riskLabel: "Risk Level",
    suggestedActionsLabel: "Suggested Actions",
    followUpLabel: "Follow-up",
  };
}

function fallbackNarrative(facts: WriterFacts): string {
  const labels = labelsForLanguage(facts.language);
  const headline =
    facts.language === "tl"
      ? facts.scenario === "class_report"
        ? `Narito ang class summary ${timeframeLabel(facts.timeframe, facts.language)}.`
        : facts.childName
          ? `Narito ang update ni ${facts.childName} ${timeframeLabel(facts.timeframe, facts.language)}.`
          : `Narito ang update ${timeframeLabel(facts.timeframe, facts.language)}.`
      : facts.scenario === "class_report"
        ? `Here is the class summary ${timeframeLabel(facts.timeframe, facts.language)}.`
        : facts.childName
          ? `Here is ${facts.childName}'s update ${timeframeLabel(facts.timeframe, facts.language)}.`
          : `Here is the update ${timeframeLabel(facts.timeframe, facts.language)}.`;

  return [
    headline,
    "",
    safeJoinLines(facts.metricLines),
    "",
    `${labels.riskLabel}: ${facts.riskLevel}`,
    "",
    safeJoinLines(facts.observationLines),
    "",
    `${labels.suggestedActionsLabel}:`,
    ...facts.recommendationLines.slice(0, 3).map((line) => `- ${line}`),
    "",
    facts.language === "tl"
      ? `${labels.followUpLabel}: Gusto mo bang magpatuloy sa mas detalyadong review?`
      : `${labels.followUpLabel}: Would you like to continue with a more detailed review?`,
  ]
    .filter(Boolean)
    .join("\n");
}

function validateWriterOutput(
  output: z.infer<typeof WriterOutputSchema>,
  facts: WriterFacts,
): boolean {
  if (output.riskLevel !== facts.riskLevel) return false;
  if (output.metricLines.length !== facts.metricLines.length) return false;
  const allMetricsMatch = output.metricLines.every(
    (line, index) => line.trim() === facts.metricLines[index].trim(),
  );
  return allMetricsMatch;
}

function renderWriterOutput(
  output: z.infer<typeof WriterOutputSchema>,
  language: AIResponseLanguage,
): string {
  const labels = labelsForLanguage(language);
  return [
    output.headline.trim(),
    "",
    safeJoinLines(output.metricLines.map((line) => line.trim())),
    "",
    `${labels.riskLabel}: ${output.riskLevel}`,
    "",
    output.analysis.trim(),
    "",
    `${labels.suggestedActionsLabel}:`,
    ...output.suggestedActions.map((line) => `- ${sanitizeAction(line)}`),
    "",
    `${labels.followUpLabel}: ${output.followUp.trim()}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildWriterPrompt(params: {
  facts: WriterFacts;
  role: AIRole;
  language: AIResponseLanguage;
  question: string;
  history: ConversationTurn[];
}): string {
  const { facts, role, language, question, history } = params;
  const historyText =
    history.length === 0
      ? "None"
      : history
          .slice(-8)
          .map((item) => `${item.role.toUpperCase()}: ${item.content}`)
          .join("\n");

  return `
You are SmartKidCare's narrative AI layer.
Generate a fully structured response based ONLY on deterministic facts.

Return ONLY one valid JSON object with this exact shape:
{
  "headline":"string",
  "metricLines":["string"],
  "riskLevel":"LOW|MEDIUM|HIGH",
  "analysis":"string",
  "suggestedActions":["string"],
  "followUp":"string"
}

Hard constraints:
- Response language: ${language === "tl" ? "Filipino/Tagalog" : "English"}.
- Audience role: ${role}.
- Use FACTS as source of truth. Never invent or modify numbers, percentages, dates, or counts.
- metricLines must be copied EXACTLY from FACTS.metricLines, same order, same text.
- riskLevel must be exactly FACTS.riskLevel.
- analysis should be concise, practical, and grounded in FACTS.
- suggestedActions must be 1-3 concise actionable lines.
- followUp must be one contextual question.
- Plain text values only. No markdown/code fences.

Recent conversation memory:
${historyText}

Current user question:
${question}

FACTS:
${JSON.stringify(facts, null, 2)}
`.trim();
}

function buildFactsFromClassAttendance(
  result: SummarizeAttendanceClassResult,
  role: AIRole,
  language: AIResponseLanguage,
): WriterFacts {
  const insight = analyzeAttendanceInsight({
    tool: "summarize_attendance",
    timeframe: result.timeframe,
    present: result.present,
    absent: result.absent,
    totalDays: result.totalRecords,
    attendanceRate: result.attendanceRate,
    absentDates: result.absentDates,
  });

  return {
    scenario: "class_attendance",
    role,
    language,
    timeframe: result.timeframe,
    metricLines: [
      `${metricLabel("attendance", language)}: ${result.present}/${result.totalRecords} records (${result.attendanceRate}%)`,
      `${metricLabel("childrenIncluded", language)}: ${result.totalChildren}`,
    ],
    riskLevel: riskFromInsight(insight.level),
    observationLines: [
      insight.interpretation,
      formatAbsentDatesLine(result.absentDates, language),
    ].filter((line): line is string => Boolean(line)),
    recommendationLines: classAttendanceActions(insight, language),
  };
}

function buildFactsFromClassFeeding(
  result: SummarizeFeedingClassResult,
  role: AIRole,
  language: AIResponseLanguage,
): WriterFacts {
  const insight = analyzeFeedingInsight({
    tool: "summarize_feeding",
    timeframe: result.timeframe,
    completed: result.completed,
    missed: result.missed,
    totalMeals: result.totalRecords,
    feedingRate: result.feedingRate,
    foods: result.foods,
  });

  return {
    scenario: "class_feeding",
    role,
    language,
    timeframe: result.timeframe,
    metricLines: [
      `${metricLabel("feeding", language)}: ${result.completed}/${result.totalRecords} records (${result.feedingRate}%)`,
      `${metricLabel("childrenIncluded", language)}: ${result.totalChildren}`,
    ],
    riskLevel: riskFromInsight(insight.level),
    observationLines: [
      insight.interpretation,
      formatFoodsLine(result.foods, language),
    ].filter((line): line is string => Boolean(line)),
    recommendationLines: classFeedingActions(insight, language),
  };
}

function buildFacts(params: {
  result: WriterSupportedResult;
  role: AIRole;
  language: AIResponseLanguage;
}): Promise<WriterFacts> {
  const { result, role, language } = params;

  if (result.tool === "summarize_attendance_class") {
    return Promise.resolve(buildFactsFromClassAttendance(result, role, language));
  }

  if (result.tool === "summarize_feeding_class") {
    return Promise.resolve(buildFactsFromClassFeeding(result, role, language));
  }

  if (result.tool === "generate_class_report") {
    const attendanceFacts = buildFactsFromClassAttendance(
      result.attendance,
      role,
      language,
    );
    const feedingFacts = buildFactsFromClassFeeding(
      result.feeding,
      role,
      language,
    );

    const overallRisk: WriterRiskLevel =
      attendanceFacts.riskLevel === "HIGH" || feedingFacts.riskLevel === "HIGH"
        ? "HIGH"
        : attendanceFacts.riskLevel === "MEDIUM" ||
            feedingFacts.riskLevel === "MEDIUM"
          ? "MEDIUM"
          : "LOW";

    return Promise.resolve({
      scenario: "class_report",
      role,
      language,
      timeframe: result.timeframe,
      metricLines: [
        attendanceFacts.metricLines[0],
        feedingFacts.metricLines[0],
        `${metricLabel("childrenIncluded", language)}: ${Math.max(
          result.attendance.totalChildren,
          result.feeding.totalChildren,
        )}`,
      ],
      riskLevel: overallRisk,
      observationLines: [
        ...attendanceFacts.observationLines,
        ...feedingFacts.observationLines,
      ].filter((line): line is string => Boolean(line)),
      recommendationLines: [
        ...attendanceFacts.recommendationLines,
        ...feedingFacts.recommendationLines,
      ].slice(0, 3),
    });
  }

  if (result.tool === "summarize_attendance_comparison") {
    const currentInsight = analyzeAttendanceInsight(result.currentWeek);
    return recommendForAttendance(result.currentWeek, currentInsight, language, {
      deterministic: true,
    }).then((recommendationLines) => ({
      scenario: "child_attendance_comparison",
      role,
      language,
      timeframe: result.timeframe,
      childName:
        result.childName ??
        result.currentWeek.childName ??
        result.lastWeek.childName,
      metricLines: [
        `${metricLabel("attendance", language)} This Week: ${result.currentWeek.present}/${result.currentWeek.totalDays} days (${result.currentWeek.attendanceRate}%)`,
        `${metricLabel("attendance", language)} Last Week: ${result.lastWeek.present}/${result.lastWeek.totalDays} days (${result.lastWeek.attendanceRate}%)`,
        language === "tl"
          ? `Pagbabago: ${result.deltaRate > 0 ? "+" : ""}${result.deltaRate}%`
          : `Change: ${result.deltaRate > 0 ? "+" : ""}${result.deltaRate}%`,
      ],
      riskLevel: riskFromInsight(currentInsight.level),
      observationLines: [
        currentInsight.interpretation,
        language === "tl"
          ? result.deltaRate > 0
            ? `May pagbuti na ${result.deltaRate}% kumpara sa nakaraang linggo.`
            : result.deltaRate < 0
              ? `May pagbaba na ${Math.abs(result.deltaRate)}% kumpara sa nakaraang linggo.`
              : "Walang pagbabago kumpara sa nakaraang linggo."
          : result.deltaRate > 0
            ? `Attendance improved by ${result.deltaRate}% versus last week.`
            : result.deltaRate < 0
              ? `Attendance declined by ${Math.abs(result.deltaRate)}% versus last week.`
              : "Attendance is unchanged versus last week.",
        formatAbsentDatesLine(result.currentWeek.absentDates, language),
      ].filter((line): line is string => Boolean(line)),
      recommendationLines,
    }));
  }

  if (result.tool === "summarize_child_trend") {
    const combinedRate = Number(
      ((result.attendanceRate + result.feedingRate) / 2).toFixed(2),
    );
    const riskLevel = riskFromRate(combinedRate);

    const trendLines = result.points.map((point) =>
      language === "tl"
        ? `${point.periodStart}: attendance ${point.attendanceRate}%, feeding ${point.feedingRate}%`
        : `${point.periodStart}: attendance ${point.attendanceRate}%, feeding ${point.feedingRate}%`,
    );

    return Promise.resolve({
      scenario: "child_trend",
      role,
      language,
      timeframe: "recent",
      childName: result.childName,
      metricLines: [
        `${metricLabel("attendance", language)}: ${result.attendanceTotal} records (${result.attendanceRate}%)`,
        `${metricLabel("feeding", language)}: ${result.feedingTotal} records (${result.feedingRate}%)`,
      ],
      riskLevel,
      observationLines: [
        language === "tl"
          ? "Trend snapshot sa nakaraang 30 araw:"
          : "Trend snapshot for the last 30 days:",
        ...trendLines,
      ],
      recommendationLines: trendActions(riskLevel, language),
    });
  }

  if (result.tool === "summarize_attendance") {
    const insight = analyzeAttendanceInsight(result);
    return recommendForAttendance(result, insight, language, {
      deterministic: true,
    }).then((recommendationLines) => ({
      scenario: "child_attendance",
      role,
      language,
      timeframe: result.timeframe,
      childName: result.childName,
      metricLines: [
        `${metricLabel("attendance", language)}: ${result.present}/${result.totalDays} days (${result.attendanceRate}%)`,
      ],
      riskLevel: riskFromInsight(insight.level),
      observationLines: [
        insight.interpretation,
        formatAbsentDatesLine(result.absentDates, language),
      ].filter((line): line is string => Boolean(line)),
      recommendationLines,
    }));
  }

  if (result.tool === "summarize_feeding") {
    const insight = analyzeFeedingInsight(result);
    return recommendForFeeding(result, insight, language, {
      deterministic: true,
    }).then((recommendationLines) => ({
      scenario: "child_feeding",
      role,
      language,
      timeframe: result.timeframe,
      childName: result.childName,
      metricLines: [
        `${metricLabel("feeding", language)}: ${result.completed}/${result.totalMeals} meals (${result.feedingRate}%)`,
      ],
      riskLevel: riskFromInsight(insight.level),
      observationLines: [
        insight.interpretation,
        formatFoodsLine(result.foods, language),
      ].filter((line): line is string => Boolean(line)),
      recommendationLines,
    }));
  }

  const insight = analyzeChildReportInsight(result);
  return recommendForChildReport(result, insight, language, {
    deterministic: true,
  }).then((recommendationLines) => ({
    scenario: "child_report",
    role,
    language,
    timeframe: result.timeframe,
    childName: result.childName ?? result.attendance.childName ?? result.feeding.childName,
    metricLines: [
      `${metricLabel("attendance", language)}: ${result.attendance.present}/${result.attendance.totalDays} days (${result.attendance.attendanceRate}%)`,
      `${metricLabel("feeding", language)}: ${result.feeding.completed}/${result.feeding.totalMeals} meals (${result.feeding.feedingRate}%)`,
    ],
    riskLevel: riskFromInsight(insight.overallLevel),
    observationLines: [
      result.attendance.totalDays === 0 && result.feeding.totalMeals === 0
        ? language === "tl"
          ? "Wala pang sapat na records para sa napiling timeframe."
          : "There are not enough records for the selected timeframe yet."
        : undefined,
      insight.attendance.interpretation,
      insight.feeding.interpretation,
      formatAbsentDatesLine(result.attendance.absentDates, language),
      formatFoodsLine(result.feeding.foods, language),
    ].filter((line): line is string => Boolean(line)),
    recommendationLines,
  }));
}

export async function writeToolNarrative(params: {
  result: WriterSupportedResult;
  role: string;
  question: string;
  language: AIResponseLanguage;
  conversationId: string;
}): Promise<string> {
  const role = normalizeRole(params.role);
  const facts = await buildFacts({
    result: params.result,
    role,
    language: params.language,
  });

  const history = getHistory(params.conversationId);
  const prompt = buildWriterPrompt({
    facts,
    role,
    language: params.language,
    question: params.question,
    history,
  });

  let finalReply = "";
  try {
    const raw = await askGemini(prompt);
    const parsedUnknown = parseFirstJSONObject(raw);
    const validated = WriterOutputSchema.parse(parsedUnknown);

    if (!validateWriterOutput(validated, facts)) {
      finalReply = fallbackNarrative(facts);
    } else {
      finalReply = renderWriterOutput(validated, params.language);
    }
  } catch {
    finalReply = fallbackNarrative(facts);
  }

  remember(params.conversationId, { role: "user", content: params.question });
  remember(params.conversationId, { role: "assistant", content: finalReply });
  return finalReply;
}

export async function writeConversationClosure(params: {
  role: string;
  language: AIResponseLanguage;
  message: string;
  conversationId: string;
}): Promise<string> {
  const role = normalizeRole(params.role);
  const history = getHistory(params.conversationId);

  const historyText =
    history.length === 0
      ? "None"
      : history
          .slice(-8)
          .map((item) => `${item.role.toUpperCase()}: ${item.content}`)
          .join("\n");

  const prompt = `
You are SmartKidCare's assistant.
Write a polite conversation-closing response.

Rules:
- Language: ${params.language === "tl" ? "Filipino/Tagalog" : "English"}.
- Audience role: ${role}.
- Keep it to 1-2 concise sentences.
- Thank the user and invite them to ask again anytime about attendance/feeding.
- Plain text only. No markdown/code fences.

Recent conversation memory:
${historyText}

User closing message:
${params.message}
`.trim();

  let reply = "";
  try {
    reply = (await askGemini(prompt)).trim();
  } catch {
    reply = "";
  }

  if (!reply) {
    reply = buildConversationClosureReply(role, params.language);
  }

  remember(params.conversationId, { role: "user", content: params.message });
  remember(params.conversationId, { role: "assistant", content: reply });
  return reply;
}

export function buildConversationId(params: {
  requesterId?: string;
  role: string;
  childId?: string;
  language: AIResponseLanguage;
}): string {
  const requester = String(params.requesterId ?? "anonymous").trim() || "anonymous";
  const child = String(params.childId ?? "global").trim() || "global";
  const role = normalizeRole(params.role);
  return `${requester}:${role}:${child}:${params.language}`;
}
