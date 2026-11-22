import { attendanceService } from "@/src/features/attendance/services";
import { feedingService } from "@/src/features/feeding/services";

export {
  AttendanceService,
  attendanceService,
  submitAttendance,
  updateAttendance,
  getAttendanceHistory,
  getTodayAttendance,
  getAttendanceForDate,
} from "@/src/features/attendance/services";
export {
  FeedingService,
  feedingService,
  submitFeeding,
  getFeedingHistory,
  getTodayFeeding,
  getFeedingForDate,
} from "@/src/features/feeding/services";

export type {
  AttendanceRecord,
  FeedingRecord,
  BlockchainResult,
  BlockchainConfirmation,
  OnChainData,
  SubmitResponse,
  SubmitAttendanceData,
  SubmitFeedingData,
  UpdateAttendanceData,
} from "./api.types";

export class RecordsApi {
  submitAttendance =
    attendanceService.submitAttendance.bind(attendanceService);
  updateAttendance =
    attendanceService.updateAttendance.bind(attendanceService);
  getAttendanceHistory =
    attendanceService.getAttendanceHistory.bind(attendanceService);
  getTodayAttendance =
    attendanceService.getTodayAttendance.bind(attendanceService);
  getAttendanceForDate =
    attendanceService.getAttendanceForDate.bind(attendanceService);

  submitFeeding = feedingService.submitFeeding.bind(feedingService);
  getFeedingHistory =
    feedingService.getFeedingHistory.bind(feedingService);
  getTodayFeeding = feedingService.getTodayFeeding.bind(feedingService);
  getFeedingForDate =
    feedingService.getFeedingForDate.bind(feedingService);
}

export const recordsApi = new RecordsApi();
