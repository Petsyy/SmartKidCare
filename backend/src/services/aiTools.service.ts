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

export type AgentToolTimeframe = "today" | "week" | "recent";
export type AgentToolName = "count_absences" | "count_missed_meals";

type SummaryEntry = { key: string; detail: string };

type AttendanceCounts = {
  total: number | null;
  present: number | null;
  absent: number | null;
};

type FeedingCounts = {
  total: number | null;
  completed: number | null;
  missed: number | null;
};

type CountAbsencesResult = {
  tool: "count_absences";
  timeframe: AgentToolTimeframe;
  timeframeLabel: string;
  absent: number | null;
  present: number | null;
  datesWithAbsences: Array<{ date: string; absent: number }>;
  latestDate: string | null;
  note?: string;
};

type CountMissedMealsResult = {
  tool: "count_missed_meals";
  timeframe: AgentToolTimeframe;
  timeframeLabel: string;
  missed: number | null;
  completed: number | null;
  datesWithMissedMeals: Array<{ date: string; missed: number }>;
  latestDate: string | null;
  note?: string;
};

export type AgentToolResult = CountAbsencesResult | CountMissedMealsResult;

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
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(fromDateKey(key));
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

function parseAttendanceCounts(detail: string): AttendanceCounts {
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

function parseFeedingCounts(detail: string): FeedingCounts {
  const total = extractTotalCount(detail);
  let completed = extractLabeledCount(detail, "completed");
  let missed = extractLabeledCount(detail, "missed");

  if (missed === null && completed !== null) {
    missed = deriveCounterpartCount(total, completed);
  }
  if (completed === null && missed !== null) {
    completed = deriveCounterpartCount(total, missed);
  }

  return { total, completed, missed };
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

function latestSummaryDate(entries: SummaryEntry[]): string | null {
  if (!entries.length) return null;
  let latest = entries[0].key;
  for (const entry of entries) {
    if (entry.key > latest) latest = entry.key;
  }
  return latest;
}

function normalizeTimeframe(value?: string): AgentToolTimeframe {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  if (normalized === "today" || normalized.includes("today")) return "today";
  if (
    normalized === "week" ||
    normalized === "this_week" ||
    normalized.includes("week")
  ) {
    return "week";
  }
  return "recent";
}

function timeframeLabel(timeframe: AgentToolTimeframe): string {
  if (timeframe === "today") return "today";
  if (timeframe === "week") return "this week";
  return "in recent records";
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
  timeframe: AgentToolTimeframe,
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

function buildNoDataNote(
  domain: "attendance" | "feeding",
  timeframe: AgentToolTimeframe,
  latestDate: string | null,
): string {
  const latestText = latestDate
    ? ` Latest available ${domain} date: ${toLongDateFromKey(latestDate)}.`
    : "";
  return `I do not have ${domain} records for ${timeframeLabel(timeframe)}.${latestText}`;
}

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

function executeCountAbsencesTool(
  attendanceSummary: string,
  timeframe: AgentToolTimeframe,
): CountAbsencesResult {
  const allEntries = parseSummaryEntries(attendanceSummary);
  const latestDate = latestSummaryDate(allEntries);
  const scopedEntries = filterEntriesByTimeframe(allEntries, timeframe);

  if (!scopedEntries.length) {
    return {
      tool: "count_absences",
      timeframe,
      timeframeLabel: timeframeLabel(timeframe),
      absent: null,
      present: null,
      datesWithAbsences: [],
      latestDate,
      note: buildNoDataNote("attendance", timeframe, latestDate),
    };
  }

  const parsed = scopedEntries.map((entry) => ({
    entry,
    counts: parseAttendanceCounts(entry.detail),
  }));

  const absentTotals = sumKnown(parsed.map((item) => item.counts.absent));
  const presentTotals = sumKnown(parsed.map((item) => item.counts.present));

  return {
    tool: "count_absences",
    timeframe,
    timeframeLabel: timeframeLabel(timeframe),
    absent: absentTotals.hasKnownValues ? absentTotals.total : null,
    present: presentTotals.hasKnownValues ? presentTotals.total : null,
    datesWithAbsences: parsed
      .filter((item) => (item.counts.absent ?? 0) > 0)
      .map((item) => ({
        date: toLongDateFromKey(item.entry.key),
        absent: item.counts.absent ?? 0,
      })),
    latestDate,
  };
}

function executeCountMissedMealsTool(
  feedingSummary: string,
  timeframe: AgentToolTimeframe,
): CountMissedMealsResult {
  const allEntries = parseSummaryEntries(feedingSummary);
  const latestDate = latestSummaryDate(allEntries);
  const scopedEntries = filterEntriesByTimeframe(allEntries, timeframe);

  if (!scopedEntries.length) {
    return {
      tool: "count_missed_meals",
      timeframe,
      timeframeLabel: timeframeLabel(timeframe),
      missed: null,
      completed: null,
      datesWithMissedMeals: [],
      latestDate,
      note: buildNoDataNote("feeding", timeframe, latestDate),
    };
  }

  const parsed = scopedEntries.map((entry) => ({
    entry,
    counts: parseFeedingCounts(entry.detail),
  }));

  const missedTotals = sumKnown(parsed.map((item) => item.counts.missed));
  const completedTotals = sumKnown(
    parsed.map((item) => item.counts.completed),
  );

  return {
    tool: "count_missed_meals",
    timeframe,
    timeframeLabel: timeframeLabel(timeframe),
    missed: missedTotals.hasKnownValues ? missedTotals.total : null,
    completed: completedTotals.hasKnownValues ? completedTotals.total : null,
    datesWithMissedMeals: parsed
      .filter((item) => (item.counts.missed ?? 0) > 0)
      .map((item) => ({
        date: toLongDateFromKey(item.entry.key),
        missed: item.counts.missed ?? 0,
      })),
    latestDate,
  };
}

export function executeAgentTool(params: {
  tool: AgentToolName;
  timeframe?: string;
  attendanceSummary: string;
  feedingSummary: string;
}): AgentToolResult {
  const { tool, attendanceSummary, feedingSummary, timeframe } = params;
  const safeTimeframe = normalizeTimeframe(timeframe);

  if (tool === "count_absences") {
    return executeCountAbsencesTool(attendanceSummary, safeTimeframe);
  }

  return executeCountMissedMealsTool(feedingSummary, safeTimeframe);
}

export function renderAgentToolResult(result: AgentToolResult): string {
  if (result.note) return result.note;

  if (result.tool === "count_absences") {
    if (result.absent === null) {
      return "Attendance records are available, but present/absent counts are missing, so I cannot calculate absences yet.";
    }

    const lines = [
      `I found ${result.absent} ${pluralize(result.absent, "absence record", "absence records")} ${result.timeframeLabel}.`,
    ];
    if (result.present !== null) {
      lines.push(
        `Attendance in this period: ${result.present} present, ${result.absent} absent.`,
      );
    }
    if (result.datesWithAbsences.length > 0) {
      lines.push("Dates with absences:");
      result.datesWithAbsences.forEach((entry) => {
        lines.push(
          `- ${entry.date}: ${entry.absent} ${pluralize(entry.absent, "absence record", "absence records")}`,
        );
      });
    }

    return lines.join("\n");
  }

  if (result.missed === null) {
    return "Feeding records are available, but completed/missed counts are missing, so I cannot calculate missed meals yet.";
  }

  const lines = [
    `I found ${result.missed} ${pluralize(result.missed, "missed meal record", "missed meal records")} ${result.timeframeLabel}.`,
  ];
  if (result.completed !== null) {
    lines.push(
      `Feeding in this period: ${result.completed} completed, ${result.missed} missed.`,
    );
  }
  if (result.datesWithMissedMeals.length > 0) {
    lines.push("Dates with missed meals:");
    result.datesWithMissedMeals.forEach((entry) => {
      lines.push(
        `- ${entry.date}: ${entry.missed} ${pluralize(entry.missed, "missed meal record", "missed meal records")}`,
      );
    });
  }

  return lines.join("\n");
}
