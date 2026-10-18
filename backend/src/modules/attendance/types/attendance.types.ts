import type { RecordServiceSupport } from "../../../shared/services/record-service-support";
import type { notifyAttendanceSubmitted } from "../../notifications/services/record-event-notification.service";
import type { attendanceRepository, childRepository, findAttendanceHistory, findChildIdsByParent } from "../repositories/attendance.repository";
export type AttendanceAuthUser = {
  id: string;
  role: string;
  daycareCenterId?: string | null;
};

export type AuthUser = AttendanceAuthUser;

export type SubmitAttendanceInput = {
  clientOperationId: string;
  date: unknown;
  records: unknown;
};

export type AttendanceStatus = "present" | "absent" | "excused";
export type ExcuseReason =
  | "sick"
  | "medical_appointment"
  | "family_emergency"
  | "other";

export type AttendanceRecordInput = {
  child: string;
  status: AttendanceStatus;
  excuseReason?: ExcuseReason;
  notes?: string;
};

export type UpdateAttendanceInput = {
  clientOperationId: string;
  expectedVersion: number;
  records: AttendanceRecordInput[];
};

export type AttendanceResult = {
  isUpdate: boolean;
  replayed: boolean;
  attendance: any;
};

export type PaginatedResult<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

export interface AttendanceServiceDependencies {
  support: RecordServiceSupport;
  childRepository: typeof childRepository;
  attendanceRepository: typeof attendanceRepository;
  findChildIdsByParent: typeof findChildIdsByParent;
  findHistory: typeof findAttendanceHistory;
  notifySubmitted: typeof notifyAttendanceSubmitted;
}
