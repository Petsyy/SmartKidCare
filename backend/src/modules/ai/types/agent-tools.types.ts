export type ToolTimeframe =
  | "today"
  | "yesterday"
  | "week"
  | "last_week"
  | "month"
  | "last_month"
  | "recent";

export type DateRange = {
  start: Date;
  endExclusive: Date;
};

export type SummarizeAttendanceResult = {
  tool: "summarize_attendance";
  timeframe: ToolTimeframe;
  childName?: string;
  present: number;
  absent: number;
  excused: number;
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
  excused: number;
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
  periodEnd?: string;
  partial?: boolean;
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

export type AttendanceDetailEntry = {
  date: string;
  status: "present" | "absent" | "excused";
  excuseReason?: string;
  notes?: string;
};

export type FeedingDetailEntry = {
  date: string;
  status: "completed" | "missed";
  foodServed: string;
  notes?: string;
};

export type AttendanceDetailsResult = {
  tool: "attendance_details";
  timeframe: ToolTimeframe;
  childName?: string;
  totalEntries: number;
  entries: AttendanceDetailEntry[];
  truncated: boolean;
};

export type FeedingDetailsResult = {
  tool: "feeding_details";
  timeframe: ToolTimeframe;
  childName?: string;
  totalEntries: number;
  entries: FeedingDetailEntry[];
  truncated: boolean;
};

export type AttendanceRecordRow = {
  child: unknown;
  status: "present" | "absent" | "excused";
  excuseReason?: string;
  notes?: string;
};

export type AttendanceRow = {
  date: Date;
  records: AttendanceRecordRow[];
};

export type FeedingRecordRow = {
  child: unknown;
  status: "completed" | "missed";
  notes?: string;
};

export type FeedingRow = {
  date: Date;
  foodServed: string;
  records: FeedingRecordRow[];
};
