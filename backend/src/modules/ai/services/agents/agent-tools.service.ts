import { Types } from "mongoose";
import {
  fetchAttendanceRows,
  fetchFeedingRows,
  fetchChildDisplayName,
} from "../../repositories/ai.repository";

import {
  ToolTimeframe,
  DateRange,
  SummarizeAttendanceResult,
  SummarizeFeedingResult,
  SummarizeAttendanceClassResult,
  SummarizeFeedingClassResult,
  GenerateChildReportResult,
  ChildTrendPoint,
  SummarizeChildTrendResult,
  AttendanceRecordRow,
  AttendanceRow,
  FeedingRecordRow,
  FeedingRow,
} from "../../types/agent-tools.types";

import {
  toLocalDayUtcRange,
  toLocalDateKey,
  getCurrentWeekStart,
  buildWeekRange,
  getCurrentMonthRange,
  weekStartKeyFromDate,
} from "../../../../shared/utils/date.utils";

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_DAYS = 7;
const WEEK_MS = WEEK_DAYS * DAY_MS;
const RECENT_WINDOW_DAYS = 30;
const DEFAULT_REPORT_TZ_OFFSET_MINUTES = 8 * 60;
const MAX_TZ_OFFSET_MINUTES = 14 * 60;

function reportTimezoneOffsetMinutes(): number {
  const raw = process.env.AI_REPORT_TZ_OFFSET_MINUTES;
  if (raw === undefined) return DEFAULT_REPORT_TZ_OFFSET_MINUTES;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || Math.abs(parsed) > MAX_TZ_OFFSET_MINUTES) {
    return DEFAULT_REPORT_TZ_OFFSET_MINUTES;
  }
  return Math.trunc(parsed);
}

function toObjectId(childId: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(childId)) {
    throw new Error("Invalid childId");
  }
  return new Types.ObjectId(childId);
}

function recordChildId(recordChild: unknown): string | null {
  if (typeof recordChild === "string") return recordChild;
  if (recordChild instanceof Types.ObjectId) return recordChild.toString();
  if (
    typeof recordChild === "object" &&
    recordChild !== null &&
    "_id" in recordChild
  ) {
    const maybeId = (recordChild as { _id?: unknown })._id;
    if (typeof maybeId === "string") return maybeId;
    if (maybeId instanceof Types.ObjectId) return maybeId.toString();
  }
  return null;
}

function childMatches(recordChild: unknown, childId: string): boolean {
  return recordChildId(recordChild) === childId;
}

function safeRate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Number(((numerator / denominator) * 100).toFixed(2));
}

function toSortedList(values: Set<string>): string[] {
  return [...values].sort();
}

async function fetchAttendanceInRange(
  range: DateRange,
  filter: Record<string, unknown>,
): Promise<AttendanceRow[]> {
  return fetchAttendanceRows(range, filter) as Promise<AttendanceRow[]>;
}

async function fetchFeedingInRange(
  range: DateRange,
  filter: Record<string, unknown>,
): Promise<FeedingRow[]> {
  return fetchFeedingRows(range, filter) as Promise<FeedingRow[]>;
}

function summarizeChildAttendanceRows(
  rows: AttendanceRow[],
  childId: string,
  offsetMinutes: number,
): { present: number; absent: number; absentDates: string[] } {
  let present = 0;
  let absent = 0;
  const absentDateSet = new Set<string>();

  rows.forEach((row) => {
    const dateKey = toLocalDateKey(row.date, offsetMinutes);
    row.records.forEach((record: AttendanceRecordRow) => {
      if (!childMatches(record.child, childId)) return;
      if (record.status === "present") {
        present += 1;
        return;
      }
      if (record.status === "absent") {
        absent += 1;
        absentDateSet.add(dateKey);
      }
    });
  });

  return {
    present,
    absent,
    absentDates: toSortedList(absentDateSet),
  };
}

function summarizeChildFeedingRows(
  rows: FeedingRow[],
  childId: string,
): { completed: number; missed: number; foods: string[] } {
  let completed = 0;
  let missed = 0;
  const foodsSet = new Set<string>();

  rows.forEach((row) => {
    const food = (row.foodServed ?? "").trim();
    row.records.forEach((record: FeedingRecordRow) => {
      if (!childMatches(record.child, childId)) return;
      if (record.status === "completed") {
        completed += 1;
        if (food) foodsSet.add(food);
        return;
      }
      if (record.status === "missed") {
        missed += 1;
      }
    });
  });

  return {
    completed,
    missed,
    foods: toSortedList(foodsSet),
  };
}

function summarizeClassFeedingRows(rows: FeedingRow[]): {
  completed: number;
  missed: number;
  totalChildren: number;
  foods: string[];
} {
  let completed = 0;
  let missed = 0;
  const foodsSet = new Set<string>();
  const childIdSet = new Set<string>();

  rows.forEach((row) => {
    const food = (row.foodServed ?? "").trim();
    row.records.forEach((record: FeedingRecordRow) => {
      const childId = recordChildId(record.child);
      if (childId) childIdSet.add(childId);

      if (record.status === "completed") {
        completed += 1;
        if (food) foodsSet.add(food);
        return;
      }
      if (record.status === "missed") {
        missed += 1;
      }
    });
  });

  return {
    completed,
    missed,
    totalChildren: childIdSet.size,
    foods: toSortedList(foodsSet),
  };
}

export async function getDateRange(timeframe: ToolTimeframe): Promise<DateRange> {
  const offsetMinutes = reportTimezoneOffsetMinutes();
  const todayRange = toLocalDayUtcRange(new Date(), offsetMinutes);
  const todayStart = todayRange.start;
  const todayEnd = todayRange.end;

  if (timeframe === "today") {
    return { start: todayStart, end: todayEnd };
  }

  if (timeframe === "week" || timeframe === "last_week") {
    const thisWeekStart = getCurrentWeekStart(todayStart, offsetMinutes);

    const weekStart =
      timeframe === "last_week"
        ? new Date(thisWeekStart.getTime() - WEEK_MS)
        : thisWeekStart;

    return buildWeekRange(weekStart);
  }

  if (timeframe === "month") {
    return getCurrentMonthRange(todayStart, offsetMinutes);
  }

  const recentStart = new Date(todayStart);
  recentStart.setUTCDate(recentStart.getUTCDate() - (RECENT_WINDOW_DAYS - 1));
  return {
    start: recentStart,
    end: todayEnd,
  };
}

export async function summarizeAttendanceTool(
  childId: string,
  timeframe: ToolTimeframe,
): Promise<SummarizeAttendanceResult> {
  const childObjectId = toObjectId(childId);
  const range = await getDateRange(timeframe);
  const offsetMinutes = reportTimezoneOffsetMinutes();
  const childName = await fetchChildDisplayName(childId);

  const rows = await fetchAttendanceInRange(range, { "records.child": childObjectId });
  const { present, absent, absentDates } = summarizeChildAttendanceRows(
    rows,
    childId,
    offsetMinutes,
  );

  const totalDays = present + absent;

  return {
    tool: "summarize_attendance",
    timeframe,
    childName,
    present,
    absent,
    totalDays,
    attendanceRate: safeRate(present, totalDays),
    absentDates,
  };
}

export async function summarizeFeedingTool(
  childId: string,
  timeframe: ToolTimeframe,
): Promise<SummarizeFeedingResult> {
  const childObjectId = toObjectId(childId);
  const range = await getDateRange(timeframe);
  const childName = await fetchChildDisplayName(childId);

  const rows = await fetchFeedingInRange(range, { "records.child": childObjectId });
  const { completed, missed, foods } = summarizeChildFeedingRows(rows, childId);

  const totalMeals = completed + missed;

  return {
    tool: "summarize_feeding",
    timeframe,
    childName,
    completed,
    missed,
    totalMeals,
    feedingRate: safeRate(completed, totalMeals),
    foods,
  };
}

export async function generateChildReportTool(
  childId: string,
  timeframe: ToolTimeframe,
): Promise<GenerateChildReportResult> {
  const [attendance, feeding] = await Promise.all([
    summarizeAttendanceTool(childId, timeframe),
    summarizeFeedingTool(childId, timeframe),
  ]);

  return {
    tool: "generate_child_report",
    timeframe,
    childName: attendance.childName ?? feeding.childName,
    attendance,
    feeding,
  };
}

export async function summarizeChildTrendTool(
  childId: string,
): Promise<SummarizeChildTrendResult> {
  const childObjectId = toObjectId(childId);
  const range = await getDateRange("recent");
  const offsetMinutes = reportTimezoneOffsetMinutes();

  const [attendance, feeding, attendanceRows, feedingRows] = await Promise.all([
    summarizeAttendanceTool(childId, "recent"),
    summarizeFeedingTool(childId, "recent"),
    fetchAttendanceInRange(range, { "records.child": childObjectId }),
    fetchFeedingInRange(range, { "records.child": childObjectId }),
  ]);

  const buckets = new Map<
    string,
    { present: number; absent: number; completed: number; missed: number }
  >();

  const ensureBucket = (key: string) => {
    if (!buckets.has(key)) {
      buckets.set(key, { present: 0, absent: 0, completed: 0, missed: 0 });
    }
    return buckets.get(key)!;
  };

  attendanceRows.forEach((row: AttendanceRow) => {
    const bucket = ensureBucket(weekStartKeyFromDate(row.date, offsetMinutes));
    row.records.forEach((record: AttendanceRecordRow) => {
      if (!childMatches(record.child, childId)) return;
      if (record.status === "present") bucket.present += 1;
      if (record.status === "absent") bucket.absent += 1;
    });
  });

  feedingRows.forEach((row: FeedingRow) => {
    const bucket = ensureBucket(weekStartKeyFromDate(row.date, offsetMinutes));
    row.records.forEach((record: FeedingRecordRow) => {
      if (!childMatches(record.child, childId)) return;
      if (record.status === "completed") bucket.completed += 1;
      if (record.status === "missed") bucket.missed += 1;
    });
  });

  const points = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-5)
    .map(([periodStart, value]) => ({
      periodStart,
      attendanceRate: safeRate(value.present, value.present + value.absent),
      feedingRate: safeRate(value.completed, value.completed + value.missed),
      attendanceTotal: value.present + value.absent,
      feedingTotal: value.completed + value.missed,
    }));

  return {
    tool: "summarize_child_trend",
    timeframe: "recent",
    childName: attendance.childName ?? feeding.childName,
    attendanceRate: attendance.attendanceRate,
    feedingRate: feeding.feedingRate,
    attendanceTotal: attendance.totalDays,
    feedingTotal: feeding.totalMeals,
    points,
  };
}

export { ToolTimeframe };
