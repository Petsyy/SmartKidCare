const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

function toDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toLongDateFromKey(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function extractDateFromQuestion(text: string): {
  key?: string;
  monthDay?: string;
} | null {
  const lower = text.toLowerCase();
  const isoMatch = lower.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (isoMatch) {
    return { key: `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}` };
  }

  const monthRegex = new RegExp(
    `\\b(${MONTHS.join("|")})\\s+(\\d{1,2})(?:,\\s*(\\d{4}))?\\b`,
    "i",
  );
  const monthMatch = text.match(monthRegex);
  if (!monthMatch) return null;

  const monthIndex = MONTHS.indexOf(monthMatch[1].toLowerCase());
  const day = Number(monthMatch[2]);
  const year = monthMatch[3] ? Number(monthMatch[3]) : undefined;
  if (monthIndex < 0 || Number.isNaN(day)) return null;

  if (year) {
    const date = new Date(Date.UTC(year, monthIndex, day));
    return { key: toDateKey(date) };
  }

  return {
    monthDay: `${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
  };
}

type SummaryEntry = { key: string; detail: string };

function extractRecordCount(detail: string): string | null {
  const match = detail.match(/(\d+)\s+records?/i);
  return match ? `${match[1]} records` : null;
}

function extractChildrenList(detail: string): string | null {
  const match = detail.match(/children:\s*([^)]+)\)?/i);
  if (!match) return null;
  const names = match[1].trim();
  return names || null;
}

function parseSummaryEntries(summary: string): SummaryEntry[] {
  const entries: SummaryEntry[] = [];

  const isoRegex = /(\d{4}-\d{2}-\d{2})\s*:\s*([^;\n]+)/gi;
  let isoMatch: RegExpExecArray | null;
  while ((isoMatch = isoRegex.exec(summary))) {
    entries.push({
      key: isoMatch[1],
      detail: isoMatch[2].trim(),
    });
  }

  const longRegex = /([A-Za-z]+\s+\d{1,2},\s*\d{4})\s*:\s*([^;\n]+)/g;
  let longMatch: RegExpExecArray | null;
  while ((longMatch = longRegex.exec(summary))) {
    const parsed = new Date(longMatch[1]);
    if (Number.isNaN(parsed.getTime())) continue;
    entries.push({
      key: toDateKey(parsed),
      detail: longMatch[2].trim(),
    });
  }

  const unique = new Map<string, SummaryEntry>();
  for (const entry of entries) {
    if (!unique.has(entry.key)) unique.set(entry.key, entry);
  }

  return [...unique.values()];
}

export function tryHandleDateSpecificQuery({
  message,
  attendanceSummary,
  feedingSummary,
}: {
  message: string;
  attendanceSummary: string;
  feedingSummary: string;
}): string | null {
  const dateQuery = extractDateFromQuestion(message);
  if (!dateQuery) return null;

  const lower = message.toLowerCase();
  const isFeedingQuery =
    lower.includes("feeding") ||
    lower.includes("meal") ||
    lower.includes("food");
  const isAttendanceQuery =
    lower.includes("attendance") ||
    lower.includes("present") ||
    lower.includes("absent") ||
    lower.includes("record");

  const domain = isFeedingQuery && !isAttendanceQuery ? "feeding" : "attendance";
  const summary = domain === "feeding" ? feedingSummary : attendanceSummary;
  const entries = parseSummaryEntries(summary);
  if (!entries.length) return null;

  let hit: SummaryEntry | undefined;
  if (dateQuery.key) {
    hit = entries.find((e) => e.key === dateQuery.key);
  } else if (dateQuery.monthDay) {
    hit = entries.find((e) => e.key.slice(5) === dateQuery.monthDay);
  }

  if (!hit) return null;

  const longDate = toLongDateFromKey(hit.key);
  if (domain === "feeding") {
    return `For ${longDate}, feeding records show: ${hit.detail}.`;
  }

  const countText = extractRecordCount(hit.detail);
  const children = extractChildrenList(hit.detail);
  if (countText && children) {
    return `For ${longDate}, attendance records show ${countText}. Children: ${children}.`;
  }

  return `For ${longDate}, attendance records show: ${hit.detail}.`;
}
