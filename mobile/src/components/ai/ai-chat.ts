export type ChatMessageLike = {
  role: "user" | "assistant";
  content: string;
};

export type AIRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type AIRiskBadgeStyle = {
  label: string;
  borderColor: string;
  backgroundColor: string;
  textColor: string;
  dotColor: string;
};

const RISK_LEVEL_LINE_REGEX = /^\s*Risk Level\s*:\s*(LOW|MEDIUM|HIGH)\s*$/im;
const RISK_LEVEL_LINE_REMOVE_REGEX =
  /^\s*Risk Level\s*:\s*(LOW|MEDIUM|HIGH)\s*$/gim;
const AI_SECTION_LINE_REGEX =
  /^(Summary|Key Details|Suggested Actions|Follow-up|Buod|Mahahalagang Detalye|Mga Mungkahing Hakbang)\s*:/i;
const AI_BULLET_LINE_REGEX = /^[-*]\s+(.*)$/;

const RISK_BADGE_STYLES: Record<AIRiskLevel, AIRiskBadgeStyle> = {
  LOW: {
    label: "Low Risk",
    borderColor: "#86efac",
    backgroundColor: "#f0fdf4",
    textColor: "#166534",
    dotColor: "#22c55e",
  },
  MEDIUM: {
    label: "Medium Risk",
    borderColor: "#fcd34d",
    backgroundColor: "#fffbeb",
    textColor: "#92400e",
    dotColor: "#f59e0b",
  },
  HIGH: {
    label: "High Risk",
    borderColor: "#fca5a5",
    backgroundColor: "#fef2f2",
    textColor: "#991b1b",
    dotColor: "#ef4444",
  },
};

export function extractAIRiskLevel(text: string): AIRiskLevel | null {
  const match = text.match(RISK_LEVEL_LINE_REGEX);
  if (!match?.[1]) return null;

  const normalized = match[1].toUpperCase();
  if (normalized === "LOW") return "LOW";
  if (normalized === "MEDIUM") return "MEDIUM";
  if (normalized === "HIGH") return "HIGH";
  return null;
}

export function removeAIRiskLevelLine(text: string): string {
  return text.replace(RISK_LEVEL_LINE_REMOVE_REGEX, "").replace(/\n{3,}/g, "\n\n").trim();
}

export function getAIRiskBadgeStyle(level: AIRiskLevel): AIRiskBadgeStyle {
  return RISK_BADGE_STYLES[level];
}

export function isAISectionLine(text: string): boolean {
  return AI_SECTION_LINE_REGEX.test(text.trim());
}

export function extractAIBulletText(text: string): string | null {
  const match = text.trim().match(AI_BULLET_LINE_REGEX);
  return match?.[1]?.trim() ?? null;
}

export function formatDateLabel(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "?";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    return new Intl.DateTimeFormat("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "Asia/Manila",
    }).format(new Date(Date.UTC(year, month - 1, day)));
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
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

export function summarizeAttendanceStatuses(records: any[]): {
  total: number;
  present: number;
  absent: number;
} {
  const safeRecords = Array.isArray(records) ? records : [];
  let present = 0;
  let absent = 0;

  for (const record of safeRecords) {
    if (record?.status === "present") {
      present += 1;
    } else if (record?.status === "absent") {
      absent += 1;
    }
  }

  return {
    total: safeRecords.length,
    present,
    absent,
  };
}

export function summarizeFeedingStatuses(records: any[]): {
  total: number;
  completed: number;
  missed: number;
} {
  const safeRecords = Array.isArray(records) ? records : [];
  let completed = 0;
  let missed = 0;

  for (const record of safeRecords) {
    if (record?.status === "completed") {
      completed += 1;
    } else if (record?.status === "missed") {
      missed += 1;
    }
  }

  return {
    total: safeRecords.length,
    completed,
    missed,
  };
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
