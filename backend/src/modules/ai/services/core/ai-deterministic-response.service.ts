import {
  attendanceDetailsTool,
  feedingDetailsTool,
  generateChildReportTool,
  summarizeAttendanceTool,
  summarizeChildTrendTool,
  summarizeFeedingTool,
} from "../agents/agent-tools.service";
import { timeframeLabel } from "../../constants/chat-language.constants";
import type {
  AIConversationStateRecord,
  AIDataStatus,
  AIDetailLevel,
  AIIntent,
  AIMessageClassification,
  AIPendingAction,
  AIRiskLevel,
  AIResponseLanguage,
  FollowUpChoice,
  PendingTimeframe,
} from "../../types/core-ai-chat.types";

const PENDING_TTL_MS = 30 * 60_000;

export type DeterministicResponse = {
  reply: string;
  intent: AIIntent;
  dataStatus: AIDataStatus;
  riskLevel?: AIRiskLevel;
  activeDomain: FollowUpChoice | null;
  timeframe: PendingTimeframe | null;
  detailLevel: AIDetailLevel | null;
  pendingAction: AIPendingAction | null;
};

const riskFromRates = (
  rates: Array<{ rate: number; total: number }>,
): AIRiskLevel | undefined => {
  const valid = rates.filter((item) => item.total > 0);
  if (!valid.length) return undefined;
  return Math.min(...valid.map((item) => item.rate)) < 80 ? "HIGH" : "LOW";
};

const coverageLine = (language: AIResponseLanguage, count: number) =>
  language === "fil"
    ? `${count} explicit record${count === 1 ? "" : "s"} ang nakita. Ang mga petsang walang entry ay hindi binilang na absent o missed.`
    : `${count} explicit record${count === 1 ? "" : "s"} found. Dates without an entry were not counted as absent or missed.`;

const noData = (
  language: AIResponseLanguage,
  domain: FollowUpChoice,
  timeframe: PendingTimeframe,
) => {
  const period = timeframeLabel(timeframe, language);
  if (language === "fil") {
    const label =
      domain === "attendance"
        ? "attendance"
        : domain === "feeding"
          ? "feeding"
          : "attendance o feeding";
    return `Walang explicit na ${label} record para sa iyong anak ${period}. Ang kawalan ng record ay hindi nangangahulugang absent o missed.`;
  }
  const label = domain === "both" ? "attendance or feeding" : domain;
  return `No explicit ${label} record was found for your child ${period}. A missing record does not mean absent or missed.`;
};

const clarification = (
  language: AIResponseLanguage,
  pending: AIPendingAction | null,
) => {
  if (pending?.action === "show_details") {
    return language === "fil"
      ? "Gusto mo bang makita ang mas detalyadong records? Maaari mong sabihing oo o hindi."
      : "Would you like to see the detailed records? You can say yes or no.";
  }
  return language === "fil"
    ? "Maaari mong itanong ang attendance o pagkain ng iyong anak at sabihin kung anong panahon ang gusto mong tingnan."
    : "Ask about your child's attendance or meals and include the period you want to check.";
};

const languageAcknowledgement = (
  language: AIResponseLanguage,
  automatic: boolean,
) => {
  if (automatic) {
    return language === "fil"
      ? "Sige. Awtomatiko kong susundan ang wikang ginagamit mo."
      : "Okay. I will automatically follow the language you use.";
  }
  return language === "fil"
    ? "Sige. Sasagot ako sa Filipino."
    : "Okay. I will answer in English.";
};

const pendingDetails = (
  domain: FollowUpChoice,
  timeframe: PendingTimeframe,
  now: Date,
): AIPendingAction => ({
  type: "confirmation",
  action: "show_details",
  domain,
  timeframe,
  expiresAt: new Date(now.getTime() + PENDING_TTL_MS),
});

const detailsPrompt = (language: AIResponseLanguage) =>
  language === "fil"
    ? "Gusto mo bang makita ang mas detalyadong records?"
    : "Would you like to see the detailed records?";

const truncationLine = (
  language: AIResponseLanguage,
  shown: number,
  total: number,
) =>
  language === "fil"
    ? `Ipinapakita ang pinakabagong ${shown} sa ${total} records. Magbigay ng mas maikling timeframe para makita ang iba.`
    : `Showing the latest ${shown} of ${total} records. Ask for a narrower timeframe to see others.`;

async function renderDetails(params: {
  childId: string;
  domain: FollowUpChoice;
  timeframe: PendingTimeframe;
  language: AIResponseLanguage;
}): Promise<DeterministicResponse> {
  const { childId, domain, timeframe, language } = params;
  const [attendance, feeding] = await Promise.all([
    domain !== "feeding" ? attendanceDetailsTool(childId, timeframe) : null,
    domain !== "attendance" ? feedingDetailsTool(childId, timeframe) : null,
  ]);
  const attendanceCount = attendance?.totalEntries ?? 0;
  const feedingCount = feeding?.totalEntries ?? 0;
  const total = attendanceCount + feedingCount;
  if (!total) {
    return {
      reply: noData(language, domain, timeframe),
      intent:
        domain === "attendance"
          ? "attendance_details"
          : domain === "feeding"
            ? "feeding_details"
            : "combined_details",
      dataStatus: "NO_DATA",
      activeDomain: domain,
      timeframe,
      detailLevel: "detailed",
      pendingAction: null,
    };
  }

  const parts: string[] = [
    language === "fil"
      ? `Narito ang mga explicit records ${timeframeLabel(timeframe, language)}.`
      : `Here are the explicit records ${timeframeLabel(timeframe, language)}.`,
  ];
  if (attendance) {
    parts.push(
      language === "fil" ? "Attendance:" : "Attendance:",
      ...attendance.entries.map(
        (entry) =>
          `- ${entry.date}: ${
            language === "fil"
              ? entry.status === "present"
                ? "Present"
                : entry.status === "excused"
                  ? "Excused"
                  : "Absent"
              : entry.status === "present"
                ? "Present"
                : entry.status === "excused"
                  ? "Excused"
                  : "Absent"
          }`,
      ),
    );
    if (attendance.truncated) {
      parts.push(
        truncationLine(language, attendance.entries.length, attendance.totalEntries),
      );
    }
  }
  if (feeding) {
    parts.push(
      language === "fil" ? "Pagkain:" : "Meals:",
      ...feeding.entries.map((entry) => {
        const status =
          entry.status === "completed"
            ? language === "fil"
              ? "Nakumpleto"
              : "Completed"
            : language === "fil"
              ? "Hindi nakumpleto"
              : "Missed";
        const note = entry.notes ? ` — ${entry.notes}` : "";
        return `- ${entry.date}: ${status}; ${entry.foodServed || (language === "fil" ? "walang food description" : "no food description")}${note}`;
      }),
    );
    if (feeding.truncated) {
      parts.push(
        truncationLine(language, feeding.entries.length, feeding.totalEntries),
      );
    }
  }
  parts.push(coverageLine(language, total));
  return {
    reply: parts.join("\n\n"),
    intent:
      domain === "attendance"
        ? "attendance_details"
        : domain === "feeding"
          ? "feeding_details"
          : "combined_details",
    dataStatus:
      domain === "both" && (!attendanceCount || !feedingCount)
        ? "PARTIAL"
        : "AVAILABLE",
    activeDomain: domain,
    timeframe,
    detailLevel: "detailed",
    pendingAction: null,
  };
}

async function renderSummary(params: {
  childId: string;
  domain: FollowUpChoice;
  timeframe: PendingTimeframe;
  language: AIResponseLanguage;
  now: Date;
}): Promise<DeterministicResponse> {
  const { childId, domain, timeframe, language, now } = params;
  const period = timeframeLabel(timeframe, language);
  if (domain === "attendance") {
    const result = await summarizeAttendanceTool(childId, timeframe);
    if (!result.totalDays) {
      return {
        reply: noData(language, domain, timeframe),
        intent: "attendance_summary",
        dataStatus: "NO_DATA",
        activeDomain: domain,
        timeframe,
        detailLevel: "summary",
        pendingAction: null,
      };
    }
    return {
      reply: [
        language === "fil"
          ? `Narito ang attendance update para sa iyong anak ${period}.`
          : `Here is your child's attendance update ${period}.`,
        language === "fil"
          ? `Present: ${result.present}; Absent: ${result.absent}; Excused: ${result.excused}; Attendance rate: ${result.attendanceRate}%`
          : `Present: ${result.present}; Absent: ${result.absent}; Excused: ${result.excused}; Attendance rate: ${result.attendanceRate}%`,
        coverageLine(language, result.totalDays),
        detailsPrompt(language),
      ].join("\n\n"),
      intent: "attendance_summary",
      dataStatus: "AVAILABLE",
      riskLevel: riskFromRates([
        { rate: result.attendanceRate, total: result.totalDays },
      ]),
      activeDomain: domain,
      timeframe,
      detailLevel: "summary",
      pendingAction: pendingDetails(domain, timeframe, now),
    };
  }
  if (domain === "feeding") {
    const result = await summarizeFeedingTool(childId, timeframe);
    if (!result.totalMeals) {
      return {
        reply: noData(language, domain, timeframe),
        intent: "feeding_summary",
        dataStatus: "NO_DATA",
        activeDomain: domain,
        timeframe,
        detailLevel: "summary",
        pendingAction: null,
      };
    }
    return {
      reply: [
        language === "fil"
          ? `Narito ang feeding update para sa iyong anak ${period}.`
          : `Here is your child's feeding update ${period}.`,
        language === "fil"
          ? `Completed: ${result.completed}; Missed: ${result.missed}; Feeding rate: ${result.feedingRate}%`
          : `Completed: ${result.completed}; Missed: ${result.missed}; Feeding rate: ${result.feedingRate}%`,
        result.foods.length
          ? `${language === "fil" ? "Pagkaing inihain" : "Food served"}: ${result.foods.join(", ")}`
          : "",
        coverageLine(language, result.totalMeals),
        detailsPrompt(language),
      ]
        .filter(Boolean)
        .join("\n\n"),
      intent: "feeding_summary",
      dataStatus: "AVAILABLE",
      riskLevel: riskFromRates([
        { rate: result.feedingRate, total: result.totalMeals },
      ]),
      activeDomain: domain,
      timeframe,
      detailLevel: "summary",
      pendingAction: pendingDetails(domain, timeframe, now),
    };
  }

  const result = await generateChildReportTool(childId, timeframe);
  const attendanceTotal = result.attendance.totalDays;
  const feedingTotal = result.feeding.totalMeals;
  if (!attendanceTotal && !feedingTotal) {
    return {
      reply: noData(language, domain, timeframe),
      intent: "combined_summary",
      dataStatus: "NO_DATA",
      activeDomain: domain,
      timeframe,
      detailLevel: "summary",
      pendingAction: null,
    };
  }
  const lines = [
    language === "fil"
      ? `Narito ang attendance at feeding update ${period}.`
      : `Here is the attendance and feeding update ${period}.`,
  ];
  if (attendanceTotal) {
    lines.push(
      `Attendance: ${result.attendance.present}/${attendanceTotal} (${result.attendance.attendanceRate}%)`,
    );
  } else {
    lines.push(language === "fil" ? "Attendance: walang explicit record" : "Attendance: no explicit record");
  }
  if (feedingTotal) {
    lines.push(
      `${language === "fil" ? "Pagkain" : "Feeding"}: ${result.feeding.completed}/${feedingTotal} (${result.feeding.feedingRate}%)`,
    );
  } else {
    lines.push(language === "fil" ? "Pagkain: walang explicit record" : "Feeding: no explicit record");
  }
  lines.push(coverageLine(language, attendanceTotal + feedingTotal));
  lines.push(detailsPrompt(language));
  return {
    reply: lines.join("\n\n"),
    intent: "combined_summary",
    dataStatus: attendanceTotal && feedingTotal ? "AVAILABLE" : "PARTIAL",
    riskLevel: riskFromRates([
      { rate: result.attendance.attendanceRate, total: attendanceTotal },
      { rate: result.feeding.feedingRate, total: feedingTotal },
    ]),
    activeDomain: domain,
    timeframe,
    detailLevel: "summary",
    pendingAction: pendingDetails(domain, timeframe, now),
  };
}

const supportedComparison = (
  primary: PendingTimeframe | null,
  comparison: PendingTimeframe | null,
) =>
  (primary === "today" && comparison === "yesterday") ||
  (primary === "week" && comparison === "last_week") ||
  (primary === "month" && comparison === "last_month");

async function renderComparison(params: {
  childId: string;
  domain: FollowUpChoice;
  primary: PendingTimeframe | null;
  comparison: PendingTimeframe | null;
  language: AIResponseLanguage;
}): Promise<DeterministicResponse> {
  const { childId, domain, primary, comparison, language } = params;
  if (!supportedComparison(primary, comparison)) {
    return {
      reply:
        language === "fil"
          ? "Maaari kong ihambing ang ngayon at kahapon, ngayong linggo at nakaraang linggo, o ngayong buwan at nakaraang buwan."
          : "I can compare today with yesterday, this week with last week, or this month with last month.",
      intent: "clarification",
      dataStatus: "NOT_APPLICABLE",
      activeDomain: domain,
      timeframe: primary,
      detailLevel: "summary",
      pendingAction: null,
    };
  }
  const current = primary!;
  const previous = comparison!;
  const attendance =
    domain !== "feeding"
      ? await Promise.all([
          summarizeAttendanceTool(childId, current),
          summarizeAttendanceTool(childId, previous),
        ])
      : null;
  const feeding =
    domain !== "attendance"
      ? await Promise.all([
          summarizeFeedingTool(childId, current),
          summarizeFeedingTool(childId, previous),
        ])
      : null;
  const totals = [
    ...(attendance?.map((item) => item.totalDays) ?? []),
    ...(feeding?.map((item) => item.totalMeals) ?? []),
  ];
  if (!totals.some(Boolean)) {
    return {
      reply: noData(language, domain, current),
      intent: "comparison",
      dataStatus: "NO_DATA",
      activeDomain: domain,
      timeframe: current,
      detailLevel: "summary",
      pendingAction: null,
    };
  }
  const lines = [
    language === "fil" ? "Narito ang paghahambing:" : "Here is the comparison:",
  ];
  if (attendance) {
    lines.push(
      `Attendance — ${timeframeLabel(current, language)}: ${attendance[0].attendanceRate}%; ${timeframeLabel(previous, language)}: ${attendance[1].attendanceRate}%`,
    );
  }
  if (feeding) {
    lines.push(
      `${language === "fil" ? "Pagkain" : "Feeding"} — ${timeframeLabel(current, language)}: ${feeding[0].feedingRate}%; ${timeframeLabel(previous, language)}: ${feeding[1].feedingRate}%`,
    );
  }
  const rates = [
    ...(attendance?.map((item) => ({ rate: item.attendanceRate, total: item.totalDays })) ?? []),
    ...(feeding?.map((item) => ({ rate: item.feedingRate, total: item.totalMeals })) ?? []),
  ];
  return {
    reply: lines.join("\n\n"),
    intent: "comparison",
    dataStatus: totals.every(Boolean) ? "AVAILABLE" : "PARTIAL",
    riskLevel: riskFromRates(rates),
    activeDomain: domain,
    timeframe: current,
    detailLevel: "summary",
    pendingAction: null,
  };
}

async function renderTrend(params: {
  childId: string;
  domain: FollowUpChoice;
  language: AIResponseLanguage;
}): Promise<DeterministicResponse> {
  const result = await summarizeChildTrendTool(params.childId);
  const relevantPoints = result.points.filter((point) =>
    params.domain === "attendance"
      ? point.attendanceTotal > 0
      : params.domain === "feeding"
        ? point.feedingTotal > 0
        : point.attendanceTotal > 0 || point.feedingTotal > 0,
  );
  if (!relevantPoints.length) {
    return {
      reply: noData(params.language, params.domain, "recent"),
      intent: "trend",
      dataStatus: "NO_DATA",
      activeDomain: params.domain,
      timeframe: "recent",
      detailLevel: "summary",
      pendingAction: null,
    };
  }
  const lines = [
    params.language === "fil"
      ? "Narito ang 30-day trend. Nagsisimula sa Lunes ang bawat calendar week."
      : "Here is the 30-day trend. Each calendar week starts on Monday.",
    ...relevantPoints.map((point) => {
      const label = `${point.periodStart}${point.periodEnd ? ` to ${point.periodEnd}` : ""}${point.partial ? params.language === "fil" ? " (bahagyang linggo)" : " (partial week)" : ""}`;
      if (params.domain === "attendance") return `- ${label}: Attendance ${point.attendanceRate}%`;
      if (params.domain === "feeding") return `- ${label}: ${params.language === "fil" ? "Pagkain" : "Feeding"} ${point.feedingRate}%`;
      return `- ${label}: Attendance ${point.attendanceRate}%; ${params.language === "fil" ? "Pagkain" : "Feeding"} ${point.feedingRate}%`;
    }),
  ];
  return {
    reply: lines.join("\n"),
    intent: "trend",
    dataStatus: "AVAILABLE",
    riskLevel: riskFromRates([
      { rate: result.attendanceRate, total: result.attendanceTotal },
      { rate: result.feedingRate, total: result.feedingTotal },
    ]),
    activeDomain: params.domain,
    timeframe: "recent",
    detailLevel: "summary",
    pendingAction: null,
  };
}

export async function buildDeterministicChatResponse(params: {
  childId: string;
  classification: AIMessageClassification;
  language: AIResponseLanguage;
  languageModeIsAutomatic: boolean;
  context: AIConversationStateRecord;
  now?: Date;
}): Promise<DeterministicResponse> {
  const now = params.now ?? new Date();
  const { classification, context, language } = params;
  const pending =
    context.pendingAction && context.pendingAction.expiresAt > now
      ? context.pendingAction
      : null;

  if (
    classification.requestedResponseLanguage ||
    classification.returnToAutomaticLanguage
  ) {
    const hasRecordIntent = Boolean(classification.domain);
    if (!hasRecordIntent) {
      return {
        reply: languageAcknowledgement(
          language,
          classification.returnToAutomaticLanguage,
        ),
        intent: "language_preference",
        dataStatus: "NOT_APPLICABLE",
        activeDomain: context.activeDomain,
        timeframe: context.timeframe,
        detailLevel: context.detailLevel,
        pendingAction: pending,
      };
    }
  }

  if (classification.intent === "confirmation") {
    if (pending?.action === "show_details") {
      return renderDetails({
        childId: params.childId,
        domain: pending.domain,
        timeframe: pending.timeframe,
        language,
      });
    }
    return {
      reply: clarification(language, null),
      intent: "clarification",
      dataStatus: "NOT_APPLICABLE",
      activeDomain: context.activeDomain,
      timeframe: context.timeframe,
      detailLevel: context.detailLevel,
      pendingAction: null,
    };
  }

  if (classification.intent === "rejection") {
    return {
      reply:
        language === "fil"
          ? "Sige. Maaari kang magtanong tungkol sa ibang attendance o feeding record."
          : "Okay. You can ask about another attendance or feeding record.",
      intent: "rejection",
      dataStatus: "NOT_APPLICABLE",
      activeDomain: context.activeDomain,
      timeframe: context.timeframe,
      detailLevel: context.detailLevel,
      pendingAction: null,
    };
  }

  if (classification.intent === "greeting") {
    return {
      reply:
        language === "fil"
          ? "Kumusta! Maaari kang magtanong tungkol sa attendance o pagkain ng iyong anak."
          : "Hello! You can ask about your child's attendance or meals.",
      intent: "greeting",
      dataStatus: "NOT_APPLICABLE",
      activeDomain: context.activeDomain,
      timeframe: context.timeframe,
      detailLevel: context.detailLevel,
      pendingAction: pending,
    };
  }
  if (classification.intent === "acknowledgement") {
    return {
      reply:
        language === "fil"
          ? "Walang anuman. Maaari kang magtanong muli anumang oras."
          : "You're welcome. You can ask another question anytime.",
      intent: "acknowledgement",
      dataStatus: "NOT_APPLICABLE",
      activeDomain: context.activeDomain,
      timeframe: context.timeframe,
      detailLevel: context.detailLevel,
      pendingAction: pending,
    };
  }
  if (classification.intent === "closure") {
    return {
      reply:
        language === "fil"
          ? "Salamat! Maaari kang bumalik anumang oras."
          : "Thank you! You can come back anytime.",
      intent: "closure",
      dataStatus: "NOT_APPLICABLE",
      activeDomain: context.activeDomain,
      timeframe: context.timeframe,
      detailLevel: context.detailLevel,
      pendingAction: null,
    };
  }

  const domain = classification.domain ?? context.activeDomain;
  const timeframe = classification.primaryTimeframe ?? context.timeframe ?? "recent";
  if (classification.intent === "comparison" && domain) {
    return renderComparison({
      childId: params.childId,
      domain,
      primary: classification.primaryTimeframe,
      comparison: classification.comparisonTimeframe,
      language,
    });
  }
  if (classification.intent === "trend") {
    return renderTrend({ childId: params.childId, domain: domain ?? "both", language });
  }
  if (domain) {
    const detailed =
      classification.detailLevel === "detailed" ||
      classification.intent.endsWith("_details");
    return detailed
      ? renderDetails({ childId: params.childId, domain, timeframe, language })
      : renderSummary({ childId: params.childId, domain, timeframe, language, now });
  }

  return {
    reply: clarification(language, pending),
    intent: "clarification",
    dataStatus: "NOT_APPLICABLE",
    activeDomain: context.activeDomain,
    timeframe: context.timeframe,
    detailLevel: context.detailLevel,
    pendingAction: pending,
  };
}
