import type { AttendanceRecord } from "@/src/api/api.types";

export type AttendanceStatus = AttendanceRecord["status"];
export type ExcuseReason = NonNullable<AttendanceRecord["excuseReason"]>;
export type AttendanceFilter = "all" | "unmarked" | AttendanceStatus;
export type AttendanceSelection = Omit<AttendanceRecord, "child">;

export type TeacherAttendanceStats = {
  present: number;
  absent: number;
  excused: number;
  unmarked: number;
  total: number;
};

export type ExcuseEditorState = {
  childId: string;
  reason: ExcuseReason | null;
  notes: string;
};

