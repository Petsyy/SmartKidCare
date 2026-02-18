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

type Timeframe = "today" | "week" | "recent";
type SummaryEntry = { key: string; detail: string };

function toDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toLongDateFromKey(key: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(fromDateKey(key));
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

  const longRegex = /([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})\s*:\s*([^;\n]+)/g;
  let longMatch: RegExpExecArray | null;
  while ((longMatch = longRegex.exec(summary))) {
    const monthIndex = MONTHS.indexOf(longMatch[1].toLowerCase());
    const day = Number(longMatch[2]);
    const year = Number(longMatch[3]);
    if (monthIndex < 0 || Number.isNaN(day) || Number.isNaN(year)) continue;
    const parsed = new Date(Date.UTC(year, monthIndex, day));
    entries.push({
      key: toDateKey(parsed),
      detail: longMatch[4].trim(),
    });
  }

  const unique = new Map<string, SummaryEntry>();
  for (const entry of entries) {
    if (!unique.has(entry.key)) unique.set(entry.key, entry);
  }

  return [...unique.values()];
}

function extractLabeledCount(detail: string, label: string): number | null {
  const regex = new RegExp(`\\b${label}\\b\\s*[:]?\\s*(\\d+)`, "i");
  const match = detail.match(regex);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function extractTotalCount(detail: string): number | null {
  const labeledTotal = extractLabeledCount(detail, "total");
  if (labeledTotal !== null) return labeledTotal;
  const rawRecordCount = detail.match(/(\d+)\s+records?/i);
  if (!rawRecordCount) return null;
  const value = Number(rawRecordCount[1]);
  return Number.isFinite(value) ? value : null;
}

function deriveCounterpartCount(
  total: number | null,
  known: number | null,
): number | null {
  if (total === null || known === null) return null;
  return Math.max(total - known, 0);
}

function extractFoodLabel(detail: string): string | null {
  const head = detail.split("(")[0]?.trim() ?? "";
  if (!head) return null;
  if (/^total\b/i.test(head)) return null;
  if (/^\d+\s+records?$/i.test(head)) return null;
  return head;
}

function parseAttendanceCounts(detail: string): {
  total: number | null;
  present: number | null;
  absent: number | null;
} {
  const total = extractTotalCount(detail);
  let present = extractLabeledCount(detail, "present");
  let absent = extractLabeledCount(detail, "absent");

  if (absent === null && present !== null) {
    absent = deriveCounterpartCount(total, present);
  }
  if (present === null && absent !== null) {
    present = deriveCounterpartCount(total, absent);
  }

  return { total, present, absent };
}

function parseFeedingCounts(detail: string): {
  total: number | null;
  completed: number | null;
  missed: number | null;
  food: string | null;
} {
  const total = extractTotalCount(detail);
  let completed = extractLabeledCount(detail, "completed");
  let missed = extractLabeledCount(detail, "missed");

  if (missed === null && completed !== null) {
    missed = deriveCounterpartCount(total, completed);
  }
  if (completed === null && missed !== null) {
    completed = deriveCounterpartCount(total, missed);
  }

  return {
    total,
    completed,
    missed,
    food: extractFoodLabel(detail),
  };
}

function sumKnown(values: Array<number | null>): {
  total: number;
  hasKnownValues: boolean;
} {
  let total = 0;
  let hasKnownValues = false;
  for (const value of values) {
    if (value === null) continue;
    total += value;
    hasKnownValues = true;
  }
  return { total, hasKnownValues };
}

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

function latestSummaryDate(entries: SummaryEntry[]): string | null {
  if (!entries.length) return null;
  let latest = entries[0].key;
  for (const entry of entries) {
    if (entry.key > latest) latest = entry.key;
  }
  return latest;
}

function resolveTimeframe(message: string): Timeframe {
  const lower = message.toLowerCase();
  if (lower.includes("today")) return "today";
  if (lower.includes("this week") || /\bweek\b/.test(lower)) return "week";
  return "recent";
}

function startOfUtcWeek(date: Date): Date {
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = start.getUTCDay();
  const daysFromMonday = (day + 6) % 7;
  start.setUTCDate(start.getUTCDate() - daysFromMonday);
  return start;
}

function filterEntriesByTimeframe(
  entries: SummaryEntry[],
  timeframe: Timeframe,
): SummaryEntry[] {
  if (timeframe === "recent") return entries;

  const now = new Date();

  if (timeframe === "today") {
    const todayKey = toDateKey(now);
    return entries.filter((entry) => entry.key === todayKey);
  }

  const filterByWeek = (anchorDate: Date): SummaryEntry[] => {
    const start = startOfUtcWeek(anchorDate);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
    const startKey = toDateKey(start);
    const endKey = toDateKey(end);
    return entries.filter(
      (entry) => entry.key >= startKey && entry.key <= endKey,
    );
  };

  const currentWeekEntries = filterByWeek(now);
  if (currentWeekEntries.length) return currentWeekEntries;

  const latestKey = latestSummaryDate(entries);
  if (!latestKey) return [];

  return filterByWeek(fromDateKey(latestKey));
}

function timeframeLabel(timeframe: Timeframe): string {
  if (timeframe === "today") return "today";
  if (timeframe === "week") return "this week";
  return "in recent records";
}

function noDataForTimeframeReply(
  domain: "attendance" | "feeding",
  timeframe: Timeframe,
  allEntries: SummaryEntry[],
): string {
  const latest = latestSummaryDate(allEntries);
  const latestText = latest
    ? ` Latest available ${domain} date: ${toLongDateFromKey(latest)}.`
    : "";
  return `I do not have ${domain} records for ${timeframeLabel(timeframe)}.${latestText}`;
}

function isAbsenceMetricQuery(lower: string): boolean {
  if (lower.includes("why") && lower.includes("absent")) return false;

  if (/\babsences?\b/.test(lower)) return true;

  const mentionsAbsent = /\babsent\b/.test(lower);
  const asksForCount = /\b(how many|count|number|total|any|have)\b/.test(lower);
  return mentionsAbsent && asksForCount;
}

function isMissedMealMetricQuery(lower: string): boolean {
  const mentionsMealDomain = /\b(meals?|feed|feeding|food|eat|eaten|ate)\b/.test(
    lower,
  );
  const mentionsMissed =
    /\b(missed|skip|skipped)\b/.test(lower) ||
    lower.includes("did not eat") ||
    lower.includes("didn't eat") ||
    lower.includes("not eat");

  return mentionsMealDomain && mentionsMissed;
}

function isTodayFeedingQuestion(lower: string): boolean {
  if (!lower.includes("today")) return false;
  return /\b(feed|feeding|food|meals?|eat|ate|eaten)\b/.test(lower);
}

function buildAbsenceMetricReply(
  message: string,
  attendanceSummary: string,
): string | null {
  const allEntries = parseSummaryEntries(attendanceSummary);
  if (!allEntries.length) return null;

  const timeframe = resolveTimeframe(message);
  const scopedEntries = filterEntriesByTimeframe(allEntries, timeframe);
  if (!scopedEntries.length) {
    return noDataForTimeframeReply("attendance", timeframe, allEntries);
  }

  const parsed = scopedEntries.map((entry) => ({
    entry,
    counts: parseAttendanceCounts(entry.detail),
  }));

  const absentTotals = sumKnown(parsed.map((item) => item.counts.absent));
  const presentTotals = sumKnown(parsed.map((item) => item.counts.present));

  if (!absentTotals.hasKnownValues) {
    return "Attendance records are available, but present/absent counts are missing, so I cannot calculate absences yet.";
  }

  const lines = [
    `I found ${absentTotals.total} ${pluralize(absentTotals.total, "absence record", "absence records")} ${timeframeLabel(timeframe)}.`,
  ];

  if (presentTotals.hasKnownValues) {
    lines.push(
      `Attendance in this period: ${presentTotals.total} present, ${absentTotals.total} absent.`,
    );
  }

  const absentDates = parsed.filter((item) => (item.counts.absent ?? 0) > 0);
  if (absentDates.length) {
    lines.push("Dates with absences:");
    absentDates.forEach((item) => {
      const count = item.counts.absent ?? 0;
      lines.push(
        `- ${toLongDateFromKey(item.entry.key)}: ${count} ${pluralize(count, "absence record", "absence records")}`,
      );
    });
  }

  return lines.join("\n");
}

function buildMissedMealMetricReply(
  message: string,
  feedingSummary: string,
): string | null {
  const allEntries = parseSummaryEntries(feedingSummary);
  if (!allEntries.length) return null;

  const timeframe = resolveTimeframe(message);
  const scopedEntries = filterEntriesByTimeframe(allEntries, timeframe);
  if (!scopedEntries.length) {
    return noDataForTimeframeReply("feeding", timeframe, allEntries);
  }

  const parsed = scopedEntries.map((entry) => ({
    entry,
    counts: parseFeedingCounts(entry.detail),
  }));

  const missedTotals = sumKnown(parsed.map((item) => item.counts.missed));
  const completedTotals = sumKnown(parsed.map((item) => item.counts.completed));

  if (!missedTotals.hasKnownValues) {
    return "Feeding records are available, but completed/missed counts are missing, so I cannot calculate missed meals yet.";
  }

  const lines = [
    `I found ${missedTotals.total} ${pluralize(missedTotals.total, "missed meal record", "missed meal records")} ${timeframeLabel(timeframe)}.`,
  ];

  if (completedTotals.hasKnownValues) {
    lines.push(
      `Feeding in this period: ${completedTotals.total} completed, ${missedTotals.total} missed.`,
    );
  }

  const missedDates = parsed.filter((item) => (item.counts.missed ?? 0) > 0);
  if (missedDates.length) {
    lines.push("Dates with missed meals:");
    missedDates.forEach((item) => {
      const count = item.counts.missed ?? 0;
      const mealText = item.counts.food
        ? ` (food served: ${item.counts.food})`
        : "";
      lines.push(
        `- ${toLongDateFromKey(item.entry.key)}: ${count} ${pluralize(count, "missed meal record", "missed meal records")}${mealText}`,
      );
    });
  }

  return lines.join("\n");
}

function buildTodayFeedingReply(feedingSummary: string): string | null {
  const allEntries = parseSummaryEntries(feedingSummary);
  if (!allEntries.length) return null;

  const todayKey = toDateKey(new Date());
  const todayEntries = allEntries.filter((entry) => entry.key === todayKey);
  if (!todayEntries.length) {
    const latestKey = latestSummaryDate(allEntries);
    const latestText = latestKey
      ? ` Latest available feeding date: ${toLongDateFromKey(latestKey)}.`
      : "";
    return `I do not have a feeding record for today.${latestText}`;
  }

  const parsed = todayEntries.map((entry) => parseFeedingCounts(entry.detail));
  const completedTotals = sumKnown(parsed.map((item) => item.completed));
  const missedTotals = sumKnown(parsed.map((item) => item.missed));
  const recordTotals = sumKnown(parsed.map((item) => item.total));
  const foods = Array.from(
    new Set(
      parsed
        .map((item) => item.food)
        .filter((item): item is string => Boolean(item)),
    ),
  );
  const foodSuffix = foods.length ? ` Food served: ${foods.join(", ")}.` : "";

  if (completedTotals.hasKnownValues && completedTotals.total > 0) {
    const lines = [
      `Yes. Feeding records for today show ${completedTotals.total} ${pluralize(completedTotals.total, "completed meal record", "completed meal records")}.${foodSuffix}`.trim(),
    ];
    if (missedTotals.hasKnownValues && missedTotals.total > 0) {
      lines.push(
        `There are also ${missedTotals.total} ${pluralize(missedTotals.total, "missed meal record", "missed meal records")} today.`,
      );
    }
    return lines.join("\n");
  }

  if (missedTotals.hasKnownValues && missedTotals.total > 0) {
    return `No. Feeding records for today show ${missedTotals.total} ${pluralize(missedTotals.total, "missed meal record", "missed meal records")} and no completed meal records.${foodSuffix}`.trim();
  }

  if (recordTotals.hasKnownValues && recordTotals.total > 0) {
    return `I have feeding records for today, but completed/missed status counts are not available.${foodSuffix}`.trim();
  }

  return "I do not have feeding records for today.";
}

export function tryHandleStatusMetricQuery({
  message,
  attendanceSummary,
  feedingSummary,
}: {
  message: string;
  attendanceSummary: string;
  feedingSummary: string;
}): string | null {
  const lower = message.toLowerCase();

  if (isAbsenceMetricQuery(lower)) {
    return buildAbsenceMetricReply(message, attendanceSummary);
  }

  if (isMissedMealMetricQuery(lower)) {
    return buildMissedMealMetricReply(message, feedingSummary);
  }

  if (isTodayFeedingQuestion(lower)) {
    return buildTodayFeedingReply(feedingSummary);
  }

  return null;
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
    hit = entries.find((entry) => entry.key === dateQuery.key);
  } else if (dateQuery.monthDay) {
    hit = entries.find((entry) => entry.key.slice(5) === dateQuery.monthDay);
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
