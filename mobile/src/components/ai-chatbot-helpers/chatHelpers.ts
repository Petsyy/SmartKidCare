export type ChatMessageLike = {
  role: "user" | "assistant";
  content: string;
};

export function formatDateLabel(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "?";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(year, month - 1, day)));
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

export function getChildDisplayName(record: any): string | null {
  const child = record?.child;
  if (!child || typeof child === "string") return null;

  const first = typeof child.firstName === "string" ? child.firstName : "";
  const last = typeof child.lastName === "string" ? child.lastName : "";
  const fullName = `${first} ${last}`.trim();
  if (fullName) return fullName;

  if (typeof child.name === "string" && child.name.trim()) {
    return child.name.trim();
  }

  if (typeof child.studentId === "string" && child.studentId.trim()) {
    return child.studentId.trim();
  }

  return null;
}

export function buildSummary(
  label: string,
  data: any[],
  formatter: (item: any) => string,
): string {
  if (!data?.length) return `No ${label} data available.`;
  const lines = data.slice(0, 10).map(formatter);
  const more = data.length > 10 ? ` ... and ${data.length - 10} more.` : "";
  return `Recent ${label} (${data.length} total): ${lines.join("; ")}${more}`;
}

export function resolveTeacherFollowUpMessage(
  text: string,
  messages: ChatMessageLike[],
): string {
  const normalized = text.trim().toLowerCase();
  const affirmatives = [
    "yes",
    "y",
    "yeah",
    "yep",
    "sure",
    "ok",
    "okay",
    "please",
  ];
  if (!affirmatives.includes(normalized)) return text;

  const lastAssistantMessage =
    [...messages]
      .reverse()
      .find((m) => m.role === "assistant" && m.content.trim())
      ?.content.toLowerCase() ?? "";

  if (lastAssistantMessage.includes("attendance for other dates")) {
    return "Show attendance for other dates.";
  }
  if (lastAssistantMessage.includes("feeding for other dates")) {
    return "Show feeding records for other dates.";
  }
  if (lastAssistantMessage.includes("submit new attendance")) {
    return "How do I submit new attendance records?";
  }
  if (lastAssistantMessage.includes("submit new feeding")) {
    return "How do I submit new feeding records?";
  }

  const mentionsAttendance = lastAssistantMessage.includes("attendance");
  const mentionsFeeding = lastAssistantMessage.includes("feeding");

  if (mentionsAttendance && !mentionsFeeding) {
    return "Show more attendance details for recent dates.";
  }
  if (mentionsFeeding && !mentionsAttendance) {
    return "Show more feeding details for recent dates.";
  }

  return "Show more attendance details for recent dates.";
}

export function formatAttendanceChildren(records: any[]): string {
  if (!Array.isArray(records) || records.length === 0) return "";
  const uniqueNames = Array.from(
    new Set(
      records
        .map(getChildDisplayName)
        .filter((name): name is string => Boolean(name)),
    ),
  );

  if (!uniqueNames.length) return "";
  const shown = uniqueNames.slice(0, 5);
  const moreCount = uniqueNames.length - shown.length;
  return moreCount > 0
    ? `${shown.join(", ")} +${moreCount} more`
    : shown.join(", ");
}
