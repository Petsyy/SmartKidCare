import { Types } from "mongoose";
import Attendance from "../../models/Attendance";
import Feeding from "../../models/Feeding";

export type ToolTimeframe = "today" | "week" | "recent";

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

function toUtcStartOfDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function toUtcEndOfDay(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toObjectId(childId: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(childId)) {
    throw new Error("Invalid childId");
  }
  return new Types.ObjectId(childId);
}

function childMatches(recordChild: unknown, childId: string): boolean {
  if (typeof recordChild === "string") return recordChild === childId;
  if (recordChild instanceof Types.ObjectId) {
    return recordChild.toString() === childId;
  }
  if (typeof recordChild === "object" && recordChild !== null && "_id" in recordChild) {
    const maybeId = (recordChild as { _id?: unknown })._id;
    if (typeof maybeId === "string") return maybeId === childId;
    if (maybeId instanceof Types.ObjectId) return maybeId.toString() === childId;
  }
  return false;
}

function safeRate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Number(((numerator / denominator) * 100).toFixed(2));
}

export async function getDateRange(timeframe: ToolTimeframe): Promise<DateRange> {
  const now = new Date();
  const todayStart = toUtcStartOfDay(now);
  const todayEnd = toUtcEndOfDay(now);

  if (timeframe === "today") {
    return { start: todayStart, end: todayEnd };
  }

  if (timeframe === "week") {
    const weekStart = new Date(todayStart);
    const day = weekStart.getUTCDay();
    const daysFromMonday = (day + 6) % 7;
    weekStart.setUTCDate(weekStart.getUTCDate() - daysFromMonday);

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

    return {
      start: weekStart,
      end: toUtcEndOfDay(weekEnd),
    };
  }

  const recentEnd = todayEnd;
  const recentStart = new Date(todayStart);
  recentStart.setUTCDate(recentStart.getUTCDate() - 29);
  return {
    start: recentStart,
    end: recentEnd,
  };
}

export async function summarizeAttendanceTool(
  childId: string,
  timeframe: ToolTimeframe,
): Promise<SummarizeAttendanceResult> {
  const childObjectId = toObjectId(childId);
  const range = await getDateRange(timeframe);

  const rows = await Attendance.find(
    {
      date: { $gte: range.start, $lte: range.end },
      "records.child": childObjectId,
    },
    { date: 1, records: 1 },
  )
    .sort({ date: 1 })
    .lean<AttendanceRow[]>();

  let present = 0;
  let absent = 0;
  const absentDateSet = new Set<string>();

  rows.forEach((row) => {
    const dateKey = toDateKey(row.date);
    row.records.forEach((record) => {
      if (!childMatches(record.child, childId)) return;
      if (record.status === "present") {
        present += 1;
      } else if (record.status === "absent") {
        absent += 1;
        absentDateSet.add(dateKey);
      }
    });
  });

  const totalDays = present + absent;

  return {
    tool: "summarize_attendance",
    timeframe,
    present,
    absent,
    totalDays,
    attendanceRate: safeRate(present, totalDays),
    absentDates: [...absentDateSet].sort(),
  };
}

export async function summarizeFeedingTool(
  childId: string,
  timeframe: ToolTimeframe,
): Promise<SummarizeFeedingResult> {
  const childObjectId = toObjectId(childId);
  const range = await getDateRange(timeframe);

  const rows = await Feeding.find(
    {
      date: { $gte: range.start, $lte: range.end },
      "records.child": childObjectId,
    },
    { date: 1, foodServed: 1, records: 1 },
  )
    .sort({ date: 1 })
    .lean<FeedingRow[]>();

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
      } else if (record.status === "missed") {
        missed += 1;
      }
    });
  });

  const totalMeals = completed + missed;

  return {
    tool: "summarize_feeding",
    timeframe,
    completed,
    missed,
    totalMeals,
    feedingRate: safeRate(completed, totalMeals),
    foods: [...foodsSet].sort(),
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

