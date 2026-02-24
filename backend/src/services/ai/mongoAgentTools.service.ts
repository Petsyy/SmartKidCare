import { Types } from "mongoose";
import Attendance from "../../models/Attendance";
import Feeding from "../../models/Feeding";

export type ToolTimeframe = "today" | "week" | "last_week" | "recent";

export type DateRange = {
  start: Date;
  end: Date;
};

export type SummarizeAttendanceResult = {
  tool: "summarize_attendance";
  timeframe: ToolTimeframe;
  present: number;
  absent: number;
  totalDays: number;
  attendanceRate: number;
  absentDates: string[];
};

export type SummarizeFeedingResult = {
  tool: "summarize_feeding";
  timeframe: ToolTimeframe;
  completed: number;
  missed: number;
  totalMeals: number;
  feedingRate: number;
  foods: string[];
};

export type SummarizeAttendanceClassResult = {
  tool: "summarize_attendance_class";
  timeframe: ToolTimeframe;
  present: number;
  absent: number;
  totalRecords: number;
  totalChildren: number;
  attendanceRate: number;
  absentDates: string[];
};

export type SummarizeFeedingClassResult = {
  tool: "summarize_feeding_class";
  timeframe: ToolTimeframe;
  completed: number;
  missed: number;
  totalRecords: number;
  totalChildren: number;
  feedingRate: number;
  foods: string[];
};

export type GenerateChildReportResult = {
  tool: "generate_child_report";
  timeframe: ToolTimeframe;
  attendance: SummarizeAttendanceResult;
  feeding: SummarizeFeedingResult;
};

type AttendanceRecordRow = {
  child: unknown;
  status: "present" | "absent";
};

type AttendanceRow = {
  date: Date;
  records: AttendanceRecordRow[];
};

type FeedingRecordRow = {
  child: unknown;
  status: "completed" | "missed";
};

type FeedingRow = {
  date: Date;
  foodServed: string;
  records: FeedingRecordRow[];
};

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

function toLocalDayUtcRange(date: Date, offsetMinutes: number): DateRange {
  // Shift into local timezone frame, compute 00:00/23:59, then shift back to UTC.
  const shiftedMs = date.getTime() + offsetMinutes * MINUTE_MS;
  const shiftedDate = new Date(shiftedMs);
  const localStartShifted = Date.UTC(
    shiftedDate.getUTCFullYear(),
    shiftedDate.getUTCMonth(),
    shiftedDate.getUTCDate(),
    0,
    0,
    0,
    0,
  );

  const start = new Date(localStartShifted - offsetMinutes * MINUTE_MS);
  const end = new Date(start.getTime() + DAY_MS - 1);
  return { start, end };
}

function toLocalDateKey(date: Date, offsetMinutes: number): string {
  const shiftedMs = date.getTime() + offsetMinutes * MINUTE_MS;
  const shiftedDate = new Date(shiftedMs);
  return shiftedDate.toISOString().slice(0, 10);
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

function getCurrentWeekStart(todayStart: Date, offsetMinutes: number): Date {
  const start = new Date(todayStart);
  const localWeekAnchor = new Date(start.getTime() + offsetMinutes * MINUTE_MS);
  const dayOfWeek = localWeekAnchor.getUTCDay();
  const daysFromMonday = (dayOfWeek + 6) % 7;
  start.setUTCDate(start.getUTCDate() - daysFromMonday);
  return start;
}

function buildWeekRange(weekStart: Date): DateRange {
  return {
    start: weekStart,
    end: new Date(weekStart.getTime() + WEEK_MS - 1),
  };
}

async function fetchAttendanceRows(
  range: DateRange,
  filter: Record<string, unknown>,
): Promise<AttendanceRow[]> {
  return Attendance.find(
    {
      date: { $gte: range.start, $lte: range.end },
      ...filter,
    },
    { date: 1, records: 1 },
  )
    .sort({ date: 1 })
    .lean<AttendanceRow[]>();
}

async function fetchFeedingRows(
  range: DateRange,
  filter: Record<string, unknown>,
): Promise<FeedingRow[]> {
  return Feeding.find(
    {
      date: { $gte: range.start, $lte: range.end },
      ...filter,
    },
    { date: 1, foodServed: 1, records: 1 },
  )
    .sort({ date: 1 })
    .lean<FeedingRow[]>();
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
    row.records.forEach((record) => {
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

function summarizeClassAttendanceRows(
  rows: AttendanceRow[],
  offsetMinutes: number,
): {
  present: number;
  absent: number;
  totalChildren: number;
  absentDates: string[];
} {
  let present = 0;
  let absent = 0;
  const childIdSet = new Set<string>();
  const absentDateSet = new Set<string>();

  rows.forEach((row) => {
    const dateKey = toLocalDateKey(row.date, offsetMinutes);
    row.records.forEach((record) => {
      const childId = recordChildId(record.child);
      if (childId) childIdSet.add(childId);

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
    totalChildren: childIdSet.size,
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
    row.records.forEach((record) => {
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
    row.records.forEach((record) => {
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

  const rows = await fetchAttendanceRows(range, { "records.child": childObjectId });
  const { present, absent, absentDates } = summarizeChildAttendanceRows(
    rows,
    childId,
    offsetMinutes,
  );

  const totalDays = present + absent;

  return {
    tool: "summarize_attendance",
    timeframe,
    present,
    absent,
    totalDays,
    attendanceRate: safeRate(present, totalDays),
    absentDates,
  };
}

export async function summarizeAttendanceClassTool(
  teacherId: string,
  timeframe: ToolTimeframe,
): Promise<SummarizeAttendanceClassResult> {
  const teacherObjectId = toObjectId(teacherId);
  const range = await getDateRange(timeframe);
  const offsetMinutes = reportTimezoneOffsetMinutes();

  const rows = await fetchAttendanceRows(range, { teacher: teacherObjectId });
  const { present, absent, totalChildren, absentDates } = summarizeClassAttendanceRows(
    rows,
    offsetMinutes,
  );

  const totalRecords = present + absent;

  return {
    tool: "summarize_attendance_class",
    timeframe,
    present,
    absent,
    totalRecords,
    totalChildren,
    attendanceRate: safeRate(present, totalRecords),
    absentDates,
  };
}

export async function summarizeFeedingTool(
  childId: string,
  timeframe: ToolTimeframe,
): Promise<SummarizeFeedingResult> {
  const childObjectId = toObjectId(childId);
  const range = await getDateRange(timeframe);

  const rows = await fetchFeedingRows(range, { "records.child": childObjectId });
  const { completed, missed, foods } = summarizeChildFeedingRows(rows, childId);

  const totalMeals = completed + missed;

  return {
    tool: "summarize_feeding",
    timeframe,
    completed,
    missed,
    totalMeals,
    feedingRate: safeRate(completed, totalMeals),
    foods,
  };
}

export async function summarizeFeedingClassTool(
  teacherId: string,
  timeframe: ToolTimeframe,
): Promise<SummarizeFeedingClassResult> {
  const teacherObjectId = toObjectId(teacherId);
  const range = await getDateRange(timeframe);

  const rows = await fetchFeedingRows(range, { teacher: teacherObjectId });
  const { completed, missed, totalChildren, foods } = summarizeClassFeedingRows(rows);

  const totalRecords = completed + missed;

  return {
    tool: "summarize_feeding_class",
    timeframe,
    completed,
    missed,
    totalRecords,
    totalChildren,
    feedingRate: safeRate(completed, totalRecords),
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
    attendance,
    feeding,
  };
}

