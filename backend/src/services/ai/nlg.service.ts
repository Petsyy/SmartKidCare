import {
  GenerateChildReportResult,
  ToolTimeframe,
  SummarizeAttendanceResult,
  SummarizeAttendanceClassResult,
  SummarizeFeedingResult,
  SummarizeFeedingClassResult,
} from "./mongoAgentTools.service";
import { AIResponseLanguage } from "./language.service";
import {
  ChildReportInsight,
  InsightBlock,
  analyzeAttendanceInsight,
  analyzeChildReportInsight,
  analyzeFeedingInsight,
} from "./insights.service";
import {
  recommendForAttendance,
  recommendForChildReport,
  recommendForFeeding,
} from "./recommendations.service";

type ReplyAudienceRole = "parent" | "teacher" | "admin";
type InsightLevel = InsightBlock["level"];
type OverallLevel = ChildReportInsight["overallLevel"];

const TIMEFRAME_LABELS: Record<
  AIResponseLanguage,
  Record<ToolTimeframe, string>
> = {
  en: {
    today: "today",
    week: "this week",
    last_week: "last week",
    recent: "recently",
  },
  tl: {
    today: "ngayong araw",
    week: "ngayong linggo",
    last_week: "nakaraang linggo",
    recent: "kamakailan",
  },
};

const ATTENDANCE_RATE_TEXT: Record<
  AIResponseLanguage,
  Record<InsightLevel, (rate: number) => string>
> = {
  en: {
    excellent: (rate) =>
      `Attendance is excellent at ${rate}%, with very consistent participation.`,
    good: (rate) =>
      `Attendance remains strong at ${rate}%, showing consistent participation.`,
    watch: (rate) => `Attendance is ${rate}%, and may need closer monitoring.`,
    critical: (rate) =>
      `Attendance is ${rate}%, and needs immediate attention.`,
  },
  tl: {
    excellent: (rate) =>
      `Napakahusay ng attendance sa ${rate}%, at napaka-konsistent ng pagpasok.`,
    good: (rate) =>
      `Maganda ang attendance sa ${rate}%, at konsistent ang pagpasok.`,
    watch: (rate) =>
      `Ang attendance ay ${rate}%, at kailangan ng mas malapit na pag-monitor.`,
    critical: (rate) =>
      `Ang attendance ay ${rate}%, at nangangailangan ng agarang aksyon.`,
  },
};

const FEEDING_RATE_TEXT: Record<
  AIResponseLanguage,
  Record<InsightLevel, (rate: number) => string>
> = {
  en: {
    excellent: (rate) => `Feeding consistency is excellent at ${rate}%.`,
    good: (rate) => `Feeding consistency remains strong at ${rate}%.`,
    watch: (rate) =>
      `Feeding consistency is ${rate}%, and may need closer monitoring.`,
    critical: (rate) =>
      `Feeding consistency is ${rate}%, and needs immediate attention.`,
  },
  tl: {
    excellent: (rate) => `Napakahusay ng feeding consistency sa ${rate}%.`,
    good: (rate) => `Maganda ang feeding consistency sa ${rate}%.`,
    watch: (rate) =>
      `Ang feeding consistency ay ${rate}%, at kailangan ng mas malapit na pag-monitor.`,
    critical: (rate) =>
      `Ang feeding consistency ay ${rate}%, at nangangailangan ng agarang aksyon.`,
  },
};

const OVERALL_TEXT: Record<AIResponseLanguage, Record<OverallLevel, string>> = {
  en: {
    excellent: "Overall performance is excellent this period.",
    good: "Overall performance is good with minor areas to monitor.",
    watch: "Overall performance is moderate and should be monitored.",
    critical: "Overall performance needs attention right now.",
  },
  tl: {
    excellent: "Napakahusay ng overall performance sa panahong ito.",
    good: "Maganda ang overall performance, may kaunting bahagi lang na dapat bantayan.",
    watch: "Katamtaman ang overall performance at dapat bantayan.",
    critical: "Kailangan ng agarang atensyon ang overall performance.",
  },
};

function normalizeAudienceRole(role: string): ReplyAudienceRole {
  const normalized = String(role).trim().toLowerCase();
  if (normalized === "teacher") return "teacher";
  if (normalized === "admin") return "admin";
  return "parent";
}

function joinReplyLines(lines: Array<string | undefined>): string {
  return lines.filter((line): line is string => Boolean(line)).join("\n");
}

function roleAwareLine(params: {
  language: AIResponseLanguage;
  isParentAudience: boolean;
  enParent: string;
  enOther: string;
  tlParent: string;
  tlOther: string;
}): string {
  const { language, isParentAudience, enParent, enOther, tlParent, tlOther } =
    params;

  if (language === "tl") {
    return isParentAudience ? tlParent : tlOther;
  }
  return isParentAudience ? enParent : enOther;
}

function timeframeLabel(
  timeframe: ToolTimeframe,
  language: AIResponseLanguage,
): string {
  return TIMEFRAME_LABELS[language][timeframe];
}

function formatAbsentDatesSentence(
  absentDates: string[],
  language: AIResponseLanguage,
): string {
  if (!absentDates.length) return "";

  if (language === "tl") {
    if (absentDates.length === 1) {
      return `Ang pagliban ay noong ${absentDates[0]}.`;
    }
    return `Naitala ang pagliban noong ${absentDates.join(", ")}.`;
  }

  if (absentDates.length === 1) {
    return `The absence was on ${absentDates[0]}.`;
  }
  return `Absences were recorded on ${absentDates.join(", ")}.`;
}

function topRecommendationSentence(recommendations: string[]): string {
  if (!recommendations.length) return "";
  return recommendations[0];
}

function classCountLabel(count: number, language: AIResponseLanguage): string {
  if (language === "tl") {
    return `${count} bata`;
  }
  return `${count} ${count === 1 ? "child" : "children"}`;
}

function englishToBe(count: number): "was" | "were" {
  return count === 1 ? "was" : "were";
}

function attendanceRateSentence(
  rate: number,
  level: InsightLevel,
  language: AIResponseLanguage,
): string {
  return ATTENDANCE_RATE_TEXT[language][level](rate);
}

function feedingRateSentence(
  rate: number,
  level: InsightLevel,
  language: AIResponseLanguage,
): string {
  return FEEDING_RATE_TEXT[language][level](rate);
}

function overallSentence(
  level: OverallLevel,
  language: AIResponseLanguage,
): string {
  return OVERALL_TEXT[language][level];
}

export function composeAttendanceClassReply(
  result: SummarizeAttendanceClassResult,
  language: AIResponseLanguage = "en",
): string {
  const rangeText = timeframeLabel(result.timeframe, language);

  if (result.totalRecords === 0) {
    return language === "tl"
      ? `Wala pang class attendance records ${rangeText}.`
      : `No class attendance records are available ${rangeText}.`;
  }

  const summaryLine =
    language === "tl"
      ? result.timeframe === "today"
        ? `Ngayong araw, ${classCountLabel(result.present, language)} ang present at ${classCountLabel(result.absent, language)} ang absent.`
        : `Para sa ${rangeText}, may ${result.present} present records at ${result.absent} absent records sa ${classCountLabel(result.totalChildren, language)}.`
      : result.timeframe === "today"
        ? `Today, ${classCountLabel(result.present, language)} ${englishToBe(result.present)} marked present and ${classCountLabel(result.absent, language)} ${englishToBe(result.absent)} marked absent.`
        : `For ${rangeText}, attendance shows ${result.present} present records and ${result.absent} absent records across ${classCountLabel(result.totalChildren, language)}.`;

  const rateLine =
    language === "tl"
      ? `Ang class attendance rate ay ${result.attendanceRate}%.`
      : `Class attendance rate is ${result.attendanceRate}%.`;

  const absentDatesLine = formatAbsentDatesSentence(
    result.absentDates,
    language,
  );

  return joinReplyLines([summaryLine, rateLine, absentDatesLine]);
}

export function composeFeedingClassReply(
  result: SummarizeFeedingClassResult,
  language: AIResponseLanguage = "en",
): string {
  const rangeText = timeframeLabel(result.timeframe, language);

  if (result.totalRecords === 0) {
    return language === "tl"
      ? `Wala pang class feeding records ${rangeText}.`
      : `No class feeding records are available ${rangeText}.`;
  }

  const summaryLine =
    language === "tl"
      ? result.timeframe === "today"
        ? `Ngayong araw, ${result.completed} feeding records ang completed at ${result.missed} ang missed para sa ${classCountLabel(result.totalChildren, language)}.`
        : `Para sa ${rangeText}, may ${result.completed} completed feeding records at ${result.missed} missed records sa ${classCountLabel(result.totalChildren, language)}.`
      : result.timeframe === "today"
        ? `Today, feeding shows ${result.completed} completed records and ${result.missed} missed records across ${classCountLabel(result.totalChildren, language)}.`
        : `For ${rangeText}, feeding shows ${result.completed} completed records and ${result.missed} missed records across ${classCountLabel(result.totalChildren, language)}.`;

  const rateLine =
    language === "tl"
      ? `Ang class feeding consistency ay ${result.feedingRate}%.`
      : `Class feeding consistency is ${result.feedingRate}%.`;

  const foodsLine =
    result.foods.length === 0
      ? ""
      : language === "tl"
        ? `Mga naihain na pagkain: ${result.foods.join(", ")}.`
        : `Meals served included ${result.foods.join(", ")}.`;

  return joinReplyLines([summaryLine, rateLine, foodsLine]);
}

export async function composeAttendanceReply(
  result: SummarizeAttendanceResult,
  insight: InsightBlock = analyzeAttendanceInsight(result),
  language: AIResponseLanguage = "en",
  role: string = "parent",
): Promise<string> {
  const audienceRole = normalizeAudienceRole(role);
  const isParentAudience = audienceRole === "parent";
  const recommendations = await recommendForAttendance(
    result,
    insight,
    language,
  );
  const rangeText = timeframeLabel(result.timeframe, language);

  if (result.timeframe === "today" && result.totalDays > 0) {
    const statusText =
      result.absent > 0
        ? roleAwareLine({
            language,
            isParentAudience,
            enParent: "Your child was absent today.",
            enOther: "This child was absent today.",
            tlParent: "Absent ang anak mo ngayong araw.",
            tlOther: "Absent ang batang ito ngayong araw.",
          })
        : roleAwareLine({
            language,
            isParentAudience,
            enParent: "Yes, your child was present today.",
            enOther: "Yes, this child was present today.",
            tlParent: "Oo, present ang anak mo ngayong araw.",
            tlOther: "Oo, present ang batang ito ngayong araw.",
          });

    return joinReplyLines([
      statusText,
      attendanceRateSentence(result.attendanceRate, insight.level, language),
      topRecommendationSentence(recommendations),
    ]);
  }

  if (result.totalDays === 0) {
    const noDataMessage =
      language === "tl"
        ? "Wala pang attendance records para sa napiling timeframe."
        : insight.interpretation;

    return joinReplyLines([
      noDataMessage,
      topRecommendationSentence(recommendations),
    ]);
  }

  const summaryLine = roleAwareLine({
    language,
    isParentAudience,
    enParent: `Your child attended ${result.present} out of ${result.totalDays} school days ${rangeText}, with ${result.absent} absence${result.absent === 1 ? "" : "s"}.`,
    enOther: `This child attended ${result.present} out of ${result.totalDays} school days ${rangeText}, with ${result.absent} absence${result.absent === 1 ? "" : "s"}.`,
    tlParent: `Present ang anak mo sa ${result.present} sa ${result.totalDays} araw ng klase ${rangeText}, na may ${result.absent} pagliban.`,
    tlOther: `Present ang batang ito sa ${result.present} sa ${result.totalDays} araw ng klase ${rangeText}, na may ${result.absent} pagliban.`,
  });

  return joinReplyLines([
    summaryLine,
    attendanceRateSentence(result.attendanceRate, insight.level, language),
    formatAbsentDatesSentence(result.absentDates, language),
    topRecommendationSentence(recommendations),
  ]);
}

export async function composeFeedingReply(
  result: SummarizeFeedingResult,
  insight: InsightBlock = analyzeFeedingInsight(result),
  language: AIResponseLanguage = "en",
  role: string = "parent",
): Promise<string> {
  const audienceRole = normalizeAudienceRole(role);
  const isParentAudience = audienceRole === "parent";
  const recommendations = await recommendForFeeding(result, insight, language);
  const rangeText = timeframeLabel(result.timeframe, language);
  const foodsText =
    result.foods.length === 0
      ? ""
      : language === "tl"
        ? `Kasama sa mga inihain na pagkain ang ${result.foods.join(", ")}.`
        : `Meals served included ${result.foods.join(", ")}.`;

  if (result.totalMeals === 0) {
    const noDataMessage =
      language === "tl"
        ? "Wala pang feeding records para sa napiling timeframe."
        : insight.interpretation;

    return joinReplyLines([
      noDataMessage,
      topRecommendationSentence(recommendations),
    ]);
  }

  const summaryLine = roleAwareLine({
    language,
    isParentAudience,
    enParent: `Your child completed ${result.completed} out of ${result.totalMeals} meals ${rangeText}, with ${result.missed} missed.`,
    enOther: `This child completed ${result.completed} out of ${result.totalMeals} meals ${rangeText}, with ${result.missed} missed.`,
    tlParent: `Nakumpleto ng anak mo ang ${result.completed} sa ${result.totalMeals} meals ${rangeText}, at may ${result.missed} na hindi nakumpleto.`,
    tlOther: `Nakumpleto ng batang ito ang ${result.completed} sa ${result.totalMeals} meals ${rangeText}, at may ${result.missed} na hindi nakumpleto.`,
  });

  return joinReplyLines([
    summaryLine,
    feedingRateSentence(result.feedingRate, insight.level, language),
    foodsText,
    topRecommendationSentence(recommendations),
  ]);
}

export async function composeChildReportReply(
  result: GenerateChildReportResult,
  insight: ChildReportInsight = analyzeChildReportInsight(result),
  language: AIResponseLanguage = "en",
  role: string = "parent",
): Promise<string> {
  const audienceRole = normalizeAudienceRole(role);
  const isParentAudience = audienceRole === "parent";
  const recommendations = await recommendForChildReport(
    result,
    insight,
    language,
  );
  const rangeText = timeframeLabel(result.timeframe, language);

  const introLine = roleAwareLine({
    language,
    isParentAudience,
    enParent: `Here is your child's update ${rangeText}.`,
    enOther: `Here is this child's update ${rangeText}.`,
    tlParent: `Narito ang update ng anak mo ${rangeText}.`,
    tlOther: `Narito ang update ng batang ito ${rangeText}.`,
  });

  const attendanceLine =
    language === "tl"
      ? `Attendance: ${result.attendance.present}/${result.attendance.totalDays} araw na present (${result.attendance.attendanceRate}%).`
      : `Attendance: ${result.attendance.present}/${result.attendance.totalDays} days present (${result.attendance.attendanceRate}%).`;

  const feedingLine =
    language === "tl"
      ? `Feeding: ${result.feeding.completed}/${result.feeding.totalMeals} meals na nakumpleto (${result.feeding.feedingRate}%).`
      : `Feeding: ${result.feeding.completed}/${result.feeding.totalMeals} meals completed (${result.feeding.feedingRate}%).`;

  const mealsLine =
    result.feeding.foods.length === 0
      ? ""
      : language === "tl"
        ? `Kasama sa mga inihain na pagkain ang ${result.feeding.foods.join(", ")}.`
        : `Meals served included ${result.feeding.foods.join(", ")}.`;

  return joinReplyLines([
    introLine,
    attendanceLine,
    feedingLine,
    overallSentence(insight.overallLevel, language),
    formatAbsentDatesSentence(result.attendance.absentDates, language),
    mealsLine,
    topRecommendationSentence(recommendations),
  ]);
}
