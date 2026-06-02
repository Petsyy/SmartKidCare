export type ToolTimeframe = "today" | "week" | "last_week" | "month" | "recent";

export type DateRange = {
  start: Date;
  end: Date;
};

export type SummarizeAttendanceResult = {
  tool: "summarize_attendance";
  timeframe: ToolTimeframe;
  childName?: string;
  present: number;
  absent: number;
  totalDays: number;
  attendanceRate: number;
  absentDates: string[];
};

export type SummarizeFeedingResult = {
  tool: "summarize_feeding";
  timeframe: ToolTimeframe;
  childName?: string;
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
  childName?: string;
  attendance: SummarizeAttendanceResult;
  feeding: SummarizeFeedingResult;
};

export type ChildTrendPoint = {
  periodStart: string;
  attendanceRate: number;
  feedingRate: number;
  attendanceTotal: number;
  feedingTotal: number;
};

export type SummarizeChildTrendResult = {
  tool: "summarize_child_trend";
  timeframe: "recent";
  childName?: string;
  attendanceRate: number;
  feedingRate: number;
  attendanceTotal: number;
  feedingTotal: number;
  points: ChildTrendPoint[];
};

export type AttendanceRecordRow = {
  child: unknown;
  status: "present" | "absent";
};

export type AttendanceRow = {
  date: Date;
  records: AttendanceRecordRow[];
};

export type FeedingRecordRow = {
  child: unknown;
  status: "completed" | "missed";
};

export type FeedingRow = {
  date: Date;
  foodServed: string;
  records: FeedingRecordRow[];
};
