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
export type AgentToolName =
  | "summarize_attendance"
  | "summarize_feeding"
  | "generate_child_report";

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
  food: string | null;
};

type SummarizeAttendanceResult = {
  tool: "summarize_attendance";
  timeframe: AgentToolTimeframe;
  timeframeLabel: string;
  absent: number | null;
  present: number | null;
  datesWithAbsences: Array<{ date: string; absent: number }>;
  latestDate: string | null;
  note?: string;
};

type SummarizeFeedingResult = {
  tool: "summarize_feeding";
  timeframe: AgentToolTimeframe;
  timeframeLabel: string;
  missed: number | null;
  completed: number | null;
  datesWithMissedMeals: Array<{ date: string; missed: number }>;
  entries: FoodIntakeEntry[];
  latestDate: string | null;
  note?: string;
};

type FoodIntakeEntry = {
  date: string;
  food: string | null;
  total: number | null;
  completed: number | null;
  missed: number | null;
};

type GenerateChildReportResult = {
  tool: "generate_child_report";
  timeframe: AgentToolTimeframe;
  timeframeLabel: string;
  attendance: {
    absent: number | null;
    present: number | null;
    datesWithAbsences: Array<{ date: string; absent: number }>;
  };
  feeding: {
    missed: number | null;
    completed: number | null;
    entries: FoodIntakeEntry[];
    datesWithMissedMeals: Array<{ date: string; missed: number }>;
  };
  latestAttendanceDate: string | null;
  latestFeedingDate: string | null;
  note?: string;
};

export type AgentToolResult =
  | SummarizeAttendanceResult
  | SummarizeFeedingResult
  | GenerateChildReportResult;

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

function executeSummarizeAttendanceTool(
  attendanceSummary: string,
  timeframe: AgentToolTimeframe,
): SummarizeAttendanceResult {
  const allEntries = parseSummaryEntries(attendanceSummary);
  const latestDate = latestSummaryDate(allEntries);
  const scopedEntries = filterEntriesByTimeframe(allEntries, timeframe);

  if (!scopedEntries.length) {
    return {
      tool: "summarize_attendance",
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
    tool: "summarize_attendance",
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

function executeSummarizeFeedingTool(
  feedingSummary: string,
  timeframe: AgentToolTimeframe,
): SummarizeFeedingResult {
  const allEntries = parseSummaryEntries(feedingSummary);
  const latestDate = latestSummaryDate(allEntries);
  const scopedEntries = filterEntriesByTimeframe(allEntries, timeframe);

  if (!scopedEntries.length) {
    return {
      tool: "summarize_feeding",
      timeframe,
      timeframeLabel: timeframeLabel(timeframe),
      missed: null,
      completed: null,
      datesWithMissedMeals: [],
      entries: [],
      latestDate,
      note: buildNoDataNote("feeding", timeframe, latestDate),
    };
  }

  const parsed = scopedEntries.map((entry) => ({
    entry,
    counts: parseFeedingCounts(entry.detail),
  }));

  const missedTotals = sumKnown(parsed.map((item) => item.counts.missed));
  const completedTotals = sumKnown(parsed.map((item) => item.counts.completed));

  return {
    tool: "summarize_feeding",
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
    entries: parsed.map((item) => ({
      date: toLongDateFromKey(item.entry.key),
      food: item.counts.food,
      total: item.counts.total,
      completed: item.counts.completed,
      missed: item.counts.missed,
    })),
    latestDate,
  };
}

function executeGenerateChildReportTool(
  attendanceSummary: string,
  feedingSummary: string,
  timeframe: AgentToolTimeframe,
): GenerateChildReportResult {
  const attendance = executeSummarizeAttendanceTool(
    attendanceSummary,
    timeframe,
  );
  const feeding = executeSummarizeFeedingTool(feedingSummary, timeframe);

  const noteParts = [attendance.note, feeding.note].filter(
    (item): item is string => Boolean(item),
  );

  return {
    tool: "generate_child_report",
    timeframe,
    timeframeLabel: timeframeLabel(timeframe),
    attendance: {
      absent: attendance.absent,
      present: attendance.present,
      datesWithAbsences: attendance.datesWithAbsences,
    },
    feeding: {
      missed: feeding.missed,
      completed: feeding.completed,
      entries: feeding.entries,
      datesWithMissedMeals: feeding.datesWithMissedMeals,
    },
    latestAttendanceDate: attendance.latestDate,
    latestFeedingDate: feeding.latestDate,
    note: noteParts.length ? noteParts.join(" ") : undefined,
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

  if (tool === "summarize_attendance") {
    return executeSummarizeAttendanceTool(attendanceSummary, safeTimeframe);
  }

  if (tool === "summarize_feeding") {
    return executeSummarizeFeedingTool(feedingSummary, safeTimeframe);
  }

  return executeGenerateChildReportTool(
    attendanceSummary,
    feedingSummary,
    safeTimeframe,
  );
}

export function renderAgentToolResult(result: AgentToolResult): string {
  if (result.note) return result.note;

  if (result.tool === "summarize_attendance") {
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

  if (result.tool === "summarize_feeding") {
    if (
      result.missed === null &&
      result.completed === null &&
      !result.entries.length
    ) {
      return "Feeding records are available, but completed/missed counts are missing, so I cannot summarize feeding yet.";
    }

    if (!result.entries.length) {
      return "I do not have feeding details to summarize yet.";
    }

    const firstEntry = result.entries[0];
    const fallbackFoodText = "food details are not available";
    const firstFood = firstEntry.food ?? fallbackFoodText;

    if (result.timeframe === "today") {
      if (firstEntry.completed !== null && firstEntry.completed > 0) {
        const statusSuffix =
          firstEntry.missed !== null
            ? ` Feeding status today: ${firstEntry.completed} completed, ${firstEntry.missed} missed.`
            : "";
        return `Your child ate ${firstFood} today.${statusSuffix}`.trim();
      }

      if (firstEntry.missed !== null && firstEntry.missed > 0) {
        return `Feeding records for today show ${firstFood}, but the meal was marked as missed.`;
      }

      return `Feeding records for today show: ${firstFood}.`;
    }

    const lines = [
      `Here is what your child was served ${result.timeframeLabel}:`,
    ];
    result.entries.forEach((entry) => {
      const foodText = entry.food ?? fallbackFoodText;
      const countText =
        entry.completed !== null && entry.missed !== null
          ? ` (completed ${entry.completed}, missed ${entry.missed})`
          : entry.completed !== null
            ? ` (completed ${entry.completed})`
            : entry.missed !== null
              ? ` (missed ${entry.missed})`
              : "";
      lines.push(`- ${entry.date}: ${foodText}${countText}`);
    });

    return lines.join("\n");
  }

  const lines = [`Child report ${result.timeframeLabel}:`];

  if (result.attendance.absent !== null) {
    const presentValue = result.attendance.present ?? 0;
    lines.push(
      `- Attendance: ${presentValue} present, ${result.attendance.absent} absent.`,
    );
  } else {
    lines.push("- Attendance: counts are not available.");
  }

  if (result.feeding.completed !== null || result.feeding.missed !== null) {
    lines.push(
      `- Feeding: ${result.feeding.completed ?? 0} completed, ${result.feeding.missed ?? 0} missed.`,
    );
  } else {
    lines.push("- Feeding: counts are not available.");
  }

  if (result.feeding.entries.length) {
    const latestFood = result.feeding.entries[0]?.food;
    if (latestFood) {
      lines.push(`- Latest food served: ${latestFood}.`);
    }
  }

  return lines.join("\n");
}
