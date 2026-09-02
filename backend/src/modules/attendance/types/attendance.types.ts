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
  date: unknown;
  records: unknown;
};

export type AttendanceResult = {
  isUpdate: boolean;
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
