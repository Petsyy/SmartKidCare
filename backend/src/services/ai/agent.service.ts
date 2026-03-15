import {
  summarizeAttendanceTool,
  summarizeAttendanceClassTool,
  summarizeChildTrendTool,
  summarizeFeedingTool,
  summarizeFeedingClassTool,
  ToolTimeframe,
} from "./mongoAgentTools.service";
import { executeAgentTool, AgentToolName } from "./tools.service";
import { AIResponseLanguage, detectResponseLanguage } from "./language.service";
import {
  AttendanceComparisonResult,
  buildConversationId,
  ClassReportResult,
  FeedingComparisonResult,
  writeToolNarrative,
} from "./aiWriter.service";
import { inputIsGibberish } from "../../utils/aiInputSanitizer";

type AIRole = "parent" | "teacher" | "admin";

function normalizeRole(role: string): AIRole {
  const normalized = String(role).trim().toLowerCase();
  if (normalized === "teacher") return "teacher";
  if (normalized === "admin") return "admin";
  return "parent";
}

function isClassAggregateQuestion(question: string, role: AIRole): boolean {
  if (role !== "teacher" && role !== "admin") return false;
  const lower = question.toLowerCase();
  const classWords = /\b(children|class|students|pupils|kids)\b/.test(lower);
  const attendanceWords =
    /\b(attendance|present|absent|attendance rate|check[- ]?in)\b/.test(lower);
  const feedingWords =
    /\b(meals?|feeding|food|lunch|snack|breakfast|dinner)\b/.test(lower);
  const domainWords = attendanceWords || feedingWords;
  const explicitSingle =
    /\b(my child|anak ko|my kid|my student|this child)\b/.test(lower);
  const genericChildMention = /\b(child|anak|student|kid|bata)\b/.test(lower);

  return !explicitSingle && domainWords && (classWords || !genericChildMention);
}

function inferClassQuestionDomain(
  question: string,
): "attendance" | "feeding" | "both" {
  const lower = question.toLowerCase();
  const hasAttendance =
    /\b(attendance|present|absent|check[- ]?in|pumasok|lumiban|pagdalo|pasok|pagliban)\b/.test(
      lower,
    );
  const hasFeeding =
    /\b(feeding|feed|food|meal|meals|eat|ate|eaten|pagkain|kain|kumain|kinain|ulam)\b/.test(
      lower,
    );

  if (hasAttendance && hasFeeding) return "both";
  if (hasFeeding) return "feeding";
  return "attendance";
}

function inferClassTimeframe(question: string): ToolTimeframe {
  const lower = question.toLowerCase();
  if (
    lower.includes("last week") ||
    lower.includes("previous week") ||
    lower.includes("nakaraang linggo") ||
    lower.includes("huling linggo")
  ) {
    return "last_week";
  }
  if (lower.includes("today") || lower.includes("ngayon")) return "today";
  if (lower.includes("month") || lower.includes("buwan")) return "month";
  if (lower.includes("week") || lower.includes("linggo")) return "week";
  return "today";
}

function shouldTriggerAbsenceAgent(lower: string): boolean {
  const hasAbsenceWord = /\babsences?\b/.test(lower);
  const hasAbsentCountPattern =
    /\babsent\b/.test(lower) &&
    /\b(how many|count|number|total|any|have)\b/.test(lower);
  const hasTagalogAbsencePattern =
    /\b(absent|lumiban|pagliban)\b/.test(lower) &&
    /\b(ilan|gaano karami|may)\b/.test(lower);
  return hasAbsenceWord || hasAbsentCountPattern || hasTagalogAbsencePattern;
}

function shouldTriggerPresenceAgent(lower: string): boolean {
  const mentionsPresent = /\bpresent\b/.test(lower);
  const mentionsAttendance =
    /\battendance\b/.test(lower) ||
    /\bcheck[- ]?in\b/.test(lower) ||
    /\bpagdalo|pasok|pumasok\b/.test(lower);
  const mentionsTimeframe =
    /\btoday\b/.test(lower) ||
    /\bweek\b/.test(lower) ||
    /\brecent\b/.test(lower) ||
    /\bngayon|linggo|kamakailan\b/.test(lower);

  return (
    mentionsPresent &&
    (mentionsAttendance ||
      mentionsTimeframe ||
      /\bchild|anak|bata\b/.test(lower))
  );
}

function shouldTriggerMissedMealsAgent(lower: string): boolean {
  const mealDomain =
    /\b(meals?|feeding|feed|food|eat|ate|eaten|pagkain|pakain|kain|kumain)\b/.test(
      lower,
    );
  const missedIntent =
    /\b(missed|skip|skipped)\b/.test(lower) ||
    lower.includes("didn't eat") ||
    lower.includes("did not eat") ||
    lower.includes("not eat") ||
    lower.includes("hindi kumain") ||
    lower.includes("di kumain");

  return mealDomain && missedIntent;
}

function shouldTriggerReportAgent(lower: string): boolean {
  const explicitReportIntent =
    /\b(report|summary|summarize|summarise|overview|overall|status|ulat|buod|kabuuan|kalagayan)\b/.test(
      lower,
    );
  if (explicitReportIntent) return true;

  const hasChildSubject = /\b(child|children|kid|kids|anak|bata)\b/.test(lower);
  const asksHowDoing =
    (/\bhow\b/.test(lower) &&
      /\b(do|doing|progress|performing)\b/.test(lower) &&
      hasChildSubject) ||
    (/\bkamusta|kumusta\b/.test(lower) && hasChildSubject);
  const hasTimeframe =
    /\b(today|week|weekly|recent|recently|month|ngayon|linggo|buwan|kamakailan)\b/.test(
      lower,
    );

  return asksHowDoing && hasTimeframe;
}

function shouldTriggerFoodIntakeAgent(lower: string): boolean {
  const mealDomain =
    /\b(meals?|feeding|feed|food|eat|ate|eaten|served|pagkain|kain|kumain|kinain|ulam)\b/.test(
      lower,
    );
  if (!mealDomain) return false;

  const asksWhatWasEaten =
    /\b(what|which)\b/.test(lower) &&
    /\b(eat|ate|food|meal|served)\b/.test(lower);
  const asksIfChildAte =
    /\b(did|has)\b/.test(lower) &&
    /\bchild\b/.test(lower) &&
    /\b(eat|ate)\b/.test(lower);
  const asksFoodByTime =
    /\b(food|meal|pagkain|ulam)\b/.test(lower) &&
    /\b(today|week|recent|recently|ngayon|linggo|kamakailan)\b/.test(lower);
  const asksInTagalog =
    /\b(ano|alin)\b/.test(lower) &&
    /\b(kinain|pagkain|ulam|kumain)\b/.test(lower);

  return asksWhatWasEaten || asksIfChildAte || asksFoodByTime || asksInTagalog;
}

function isAttendanceComparisonQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  const hasAttendance = /\b(attendance|present|absent|pagdalo|pasok|lumiban)\b/.test(
    lower,
  );
  const asksComparison =
    /\b(improv\w*|compar\w*|versus|vs)\b/.test(lower) &&
    /\b(last week|previous week|this week|week)\b/.test(lower);
  return hasAttendance && asksComparison;
}

function isFeedingComparisonQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  const hasFeeding =
    /\b(feeding|feed|food|meal|meals|eat|ate|eaten|served|pagkain|kain|kumain|kinain|ulam)\b/.test(
      lower,
    );
  const asksComparison =
    /\b(improv\w*|compar\w*|versus|vs)\b/.test(lower) &&
    /\b(last week|previous week|this week|week)\b/.test(lower);
  return hasFeeding && asksComparison;
}

function normalizeQuestionForIntentMatching(question: string): string {
  return question
    .trim()
    .toLowerCase()
    .replace(/\batt?e?dance\b/g, "attendance")
    .replace(/\babsenses\b/g, "absences")
    .replace(/\bfeedng\b/g, "feeding");
}

function isTrendQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return (
    /\b(trend|last 30 days|30 days)\b/.test(lower) ||
    (/\b(month|monthly|buwan)\b/.test(lower) &&
      /\b(trend|graph|history)\b/.test(lower))
  );
}

export function detectToolForQuestion(question: string): AgentToolName | null {
  if (inputIsGibberish(question)) return null;

  const lower = normalizeQuestionForIntentMatching(question);
  const hasChildSubject = /\b(child|children|kid|kids|anak|bata)\b/.test(lower);

  const hasAttendanceSignal =
    /\b(attendance|attend|present|absent|check[- ]?in|in school|came to school|pagdalo|pasok|pumasok|lumiban|pagliban)\b/.test(
      lower,
    ) ||
    shouldTriggerAbsenceAgent(lower) ||
    shouldTriggerPresenceAgent(lower);

  const hasFeedingSignal =
    /\b(feeding|feed|food|meal|meals|eat|ate|eaten|served|lunch|snack|breakfast|dinner|pagkain|pakain|kain|kumain|kinain|ulam)\b/.test(
      lower,
    ) ||
    shouldTriggerMissedMealsAgent(lower) ||
    shouldTriggerFoodIntakeAgent(lower);

  const asksRiskLevel =
    /\b(risk|risk level|high risk|medium risk|low risk)\b/.test(lower) ||
    (/\bwhy\b/.test(lower) && /\brisk\b/.test(lower));
  const asksTrend =
    /\b(trend|30 days|last 30 days|monthly|month|buwan)\b/.test(lower) ||
    (/\bcompare|comparison\b/.test(lower) &&
      /\b(last week|this week|previous week|week)\b/.test(lower));

  const wantsReport =
    shouldTriggerReportAgent(lower) ||
    asksRiskLevel ||
    asksTrend ||
    /\b(how is|how are|overall|status|progress|kamusta|kumusta|kalagayan)\b/.test(
      lower,
    );

  if (hasAttendanceSignal && !hasFeedingSignal) return "summarize_attendance";
  if (hasFeedingSignal && !hasAttendanceSignal) return "summarize_feeding";
  if (hasAttendanceSignal && hasFeedingSignal) return "generate_child_report";
  if (wantsReport && hasChildSubject) return "generate_child_report";
  return null;
}

export function shouldUseAIAgent(question: string): boolean {
  return detectToolForQuestion(question) !== null;
}

function inferSuggestedTool(question: string): AgentToolName {
  return detectToolForQuestion(question) ?? "generate_child_report";
}

function inferSuggestedTimeframe(question: string): ToolTimeframe {
  const lower = question.toLowerCase();
  if (lower.includes("last 30 days") || lower.includes("30 days")) return "recent";
  if (lower.includes("monthly") || lower.includes("month") || lower.includes("buwan")) {
    return "month";
  }
  if (
    lower.includes("last week") ||
    lower.includes("previous week") ||
    lower.includes("nakaraang linggo") ||
    lower.includes("huling linggo")
  ) {
    return "last_week";
  }
  if (lower.includes("today") || lower.includes("ngayon")) return "today";
  if (lower.includes("week") || lower.includes("linggo")) return "week";
  return "recent";
}

function resolveConversationId(params: {
  requesterId?: string;
  role: AIRole;
  childId?: string;
  language: AIResponseLanguage;
  conversationId?: string;
}): string {
  const provided = String(params.conversationId ?? "").trim();
  if (provided) return provided;

  return buildConversationId({
    requesterId: params.requesterId,
    role: params.role,
    childId: params.childId,
    language: params.language,
  });
}

export async function tryHandleAgentQuery(params: {
  role: string;
  question: string;
  childId?: string;
  requesterId?: string;
  language?: AIResponseLanguage;
  conversationId?: string;
  suppressFollowUp?: boolean;
}): Promise<string | null> {
  const language = params.language ?? detectResponseLanguage(params.question);
  const normalizedRole = normalizeRole(params.role);
  const normalizedChildId = String(params.childId ?? "").trim();
  const conversationId = resolveConversationId({
    requesterId: params.requesterId,
    role: normalizedRole,
    childId: normalizedChildId,
    language,
    conversationId: params.conversationId,
  });

  if (isClassAggregateQuestion(params.question, normalizedRole)) {
    if (!params.requesterId) {
      return language === "tl"
        ? "Hindi matukoy ang teacher session para sa class-level summary. Pakisubukang mag-login muli."
        : "Unable to resolve teacher session for class-level summary. Please sign in again.";
    }

    const timeframe = inferClassTimeframe(params.question);
    const domain = inferClassQuestionDomain(params.question);

    if (domain === "attendance") {
      const result = await summarizeAttendanceClassTool(params.requesterId, timeframe);
      return writeToolNarrative({
        result,
        role: normalizedRole,
        question: params.question,
        language,
        conversationId,
        suppressFollowUp: params.suppressFollowUp,
      });
    }

    if (domain === "feeding") {
      const result = await summarizeFeedingClassTool(params.requesterId, timeframe);
      return writeToolNarrative({
        result,
        role: normalizedRole,
        question: params.question,
        language,
        conversationId,
        suppressFollowUp: params.suppressFollowUp,
      });
    }

    const [attendance, feeding] = await Promise.all([
      summarizeAttendanceClassTool(params.requesterId, timeframe),
      summarizeFeedingClassTool(params.requesterId, timeframe),
    ]);
    const result: ClassReportResult = {
      tool: "generate_class_report",
      timeframe,
      attendance,
      feeding,
    };

    return writeToolNarrative({
      result,
      role: normalizedRole,
      question: params.question,
      language,
      conversationId,
      suppressFollowUp: params.suppressFollowUp,
    });
  }

  if (!shouldUseAIAgent(params.question)) {
    return null;
  }

  if (!normalizedChildId) {
    return language === "tl"
      ? "Paki-specify ang bata na gusto mong i-check para sa attendance o feeding summary."
      : "Please specify which child you want to check for attendance or feeding summary.";
  }

  if (isTrendQuestion(params.question)) {
    const trendResult = await summarizeChildTrendTool(normalizedChildId);
    return writeToolNarrative({
      result: trendResult,
      role: normalizedRole,
      question: params.question,
      language,
      conversationId,
      suppressFollowUp: params.suppressFollowUp,
    });
  }

  if (isAttendanceComparisonQuestion(params.question)) {
    const [currentWeek, lastWeek] = await Promise.all([
      summarizeAttendanceTool(normalizedChildId, "week"),
      summarizeAttendanceTool(normalizedChildId, "last_week"),
    ]);

    const comparisonResult: AttendanceComparisonResult = {
      tool: "summarize_attendance_comparison",
      timeframe: "week",
      childName: currentWeek.childName ?? lastWeek.childName,
      currentWeek,
      lastWeek,
      deltaRate: Number(
        (currentWeek.attendanceRate - lastWeek.attendanceRate).toFixed(2),
      ),
    };

    return writeToolNarrative({
      result: comparisonResult,
      role: normalizedRole,
      question: params.question,
      language,
      conversationId,
      suppressFollowUp: params.suppressFollowUp,
    });
  }

  if (isFeedingComparisonQuestion(params.question)) {
    const [currentWeek, lastWeek] = await Promise.all([
      summarizeFeedingTool(normalizedChildId, "week"),
      summarizeFeedingTool(normalizedChildId, "last_week"),
    ]);

    const comparisonResult: FeedingComparisonResult = {
      tool: "summarize_feeding_comparison",
      timeframe: "week",
      childName: currentWeek.childName ?? lastWeek.childName,
      currentWeek,
      lastWeek,
      deltaRate: Number((currentWeek.feedingRate - lastWeek.feedingRate).toFixed(2)),
    };

    return writeToolNarrative({
      result: comparisonResult,
      role: normalizedRole,
      question: params.question,
      language,
      conversationId,
      suppressFollowUp: params.suppressFollowUp,
    });
  }

  const tool = inferSuggestedTool(params.question);
  const timeframe = inferSuggestedTimeframe(params.question);
  const result = await executeAgentTool({
    tool,
    timeframe,
    childId: normalizedChildId,
  });

  return writeToolNarrative({
    result,
    role: normalizedRole,
    question: params.question,
    language,
    conversationId,
    suppressFollowUp: params.suppressFollowUp,
  });
}
