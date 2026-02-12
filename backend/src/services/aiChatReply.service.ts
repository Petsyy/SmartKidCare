

function shortSummary(summary: string): string {
  const lower = summary.toLowerCase();
  if (!summary || (lower.includes("no ") && lower.includes("data"))) {
    return summary || "No data available.";
  }

  const parts = summary
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) return summary;
  return parts.slice(0, 2).join("; ");
}

export function isGreeting(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return /^(hi|hello|hey|good morning|good afternoon|good evening)\b/.test(
    normalized,
  );
}

export function isAffirmative(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return /^(yes|y|yeah|yep|sure|ok|okay|please)\b/.test(normalized);
}

export function buildGreetingReply(role: string): string {
  if (role === "teacher") {
    return "Hello! I can help with attendance and feeding summaries. What would you like to check?";
  }
  if (role === "parent") {
    return "Hello! I can help with your child's attendance and feeding records. What would you like to know?";
  }
  return "Hello! I can help with attendance, feeding, and system verification insights. What would you like to check?";
}

export function buildAffirmativeReply(role: string): string {
  if (role === "teacher") {
    return "Sure. Do you want attendance, feeding, or both?";
  }
  if (role === "parent") {
    return "Sure. Do you want attendance details, feeding details, or both for your child?";
  }
  return "Sure. Do you want attendance, feeding, or verification insights?";
}

function hasData(summary: string): boolean {
  const lower = summary.toLowerCase();
  return !(lower.includes("no ") && lower.includes("data"));
}

export function buildAffirmativeFollowUpReply(params: {
  role: string;
  attendanceSummary: string;
  feedingSummary: string;
}): string {
  const { role, attendanceSummary, feedingSummary } = params;

  const attendanceHasData = hasData(attendanceSummary);
  const feedingHasData = hasData(feedingSummary);

  if (!attendanceHasData && !feedingHasData) {
    return buildAffirmativeReply(role);
  }

  if (role === "parent") {
    const lines = ["Got it. Here is the latest summary for your child:"];
    if (attendanceHasData) {
      lines.push(`- Attendance: ${shortSummary(attendanceSummary)}`);
    }
    if (feedingHasData) {
      lines.push(`- Feeding: ${shortSummary(feedingSummary)}`);
    }
    lines.push("Would you like details for a specific date?");
    return lines.join("\n");
  }

  if (role === "teacher") {
    const lines = ["Got it. Here is the latest summary:"];
    if (attendanceHasData) {
      lines.push(`- Attendance: ${shortSummary(attendanceSummary)}`);
    }
    if (feedingHasData) {
      lines.push(`- Feeding: ${shortSummary(feedingSummary)}`);
    }
    lines.push("Do you want details for a specific date?");
    return lines.join("\n");
  }

  return buildAffirmativeReply(role);
}

export function buildQuotaFallbackReply(params: {
  role: string;
  question: string;
  attendanceSummary: string;
  feedingSummary: string;
  retryAfterSeconds?: number;
}): string {
  const {
    role,
    question,
    attendanceSummary,
    feedingSummary,
    retryAfterSeconds,
  } = params;

  const retryText = retryAfterSeconds
    ? ` Please try again in about ${retryAfterSeconds} seconds.`
    : " Please try again shortly.";

  const lower = question.toLowerCase();
  const wantsAttendance =
    lower.includes("attendance") ||
    lower.includes("present") ||
    lower.includes("absent") ||
    lower.includes("record");
  const wantsFeeding =
    lower.includes("feeding") ||
    lower.includes("meal") ||
    lower.includes("food");

  if (wantsAttendance && !wantsFeeding) {
    return `AI is temporarily rate-limited.${retryText}\n\nLatest attendance snapshot:\n${shortSummary(attendanceSummary)}`;
  }

  if (wantsFeeding && !wantsAttendance) {
    return `AI is temporarily rate-limited.${retryText}\n\nLatest feeding snapshot:\n${shortSummary(feedingSummary)}`;
  }

  if (role === "parent") {
    return `AI is temporarily rate-limited.${retryText} You can still ask specific date-based attendance or feeding questions while we wait.`;
  }

  return `AI is temporarily rate-limited.${retryText} You can still ask specific attendance or feeding dates while we wait.`;
}
