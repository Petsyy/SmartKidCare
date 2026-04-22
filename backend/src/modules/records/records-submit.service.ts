import { ValidationError, ForbiddenError } from "../../shared/errors/AppError";
import {
  childRepository,
  ChildRepository,
  attendanceRepository,
  AttendanceRepository,
  feedingRepository,
  FeedingRepository,
  type DateRange,
} from "./records.repository";
import {
  notifyAttendanceSubmitted,
  notifyFeedingSubmitted,
} from "../notifications/record-event-notification.service";

type AuthUser = { id: string; role: string };

type SubmitAttendanceInput = {
  date: unknown;
  records: unknown;
};

type SubmitFeedingInput = {
  date: unknown;
  foodServed: unknown;
  records: unknown;
};

export type AttendanceResult = {
  isUpdate: boolean;
  attendance: any;
};

export type FeedingResult = {
  isUpdate: boolean;
  feeding: any;
};

const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;
const MANILA_DAY_MS = 24 * 60 * 60 * 1000;
const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

type DateParts = { year: number; month: number; day: number };

const toValidDateParts = (year: number, month: number, day: number): DateParts | null => {
  if (!Number.isInteger(year) || year < 1900 || year > 9999) return null;
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  if (!Number.isInteger(day) || day < 1 || day > 31) return null;
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) return null;
  return { year, month, day };
};

const parseRecordDateParts = (value: unknown): DateParts | null => {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const dateOnlyMatch = DATE_KEY_PATTERN.exec(raw);
  if (dateOnlyMatch) return toValidDateParts(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]), Number(dateOnlyMatch[3]));
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  const shiftedToManila = new Date(parsed.getTime() + MANILA_OFFSET_MS);
  return toValidDateParts(shiftedToManila.getUTCFullYear(), shiftedToManila.getUTCMonth() + 1, shiftedToManila.getUTCDate());
};

const getManilaDayRange = (parts: DateParts): DateRange => {
  const startMs = Date.UTC(parts.year, parts.month - 1, parts.day, 0, 0, 0, 0) - MANILA_OFFSET_MS;
  return { start: new Date(startMs), end: new Date(startMs + MANILA_DAY_MS - 1) };
};

const resolveChildId = (value: unknown): string => {
  if (value && typeof value === "object") {
    const asObject = value as { _id?: unknown };
    if (asObject._id) return String(asObject._id).trim();
  }
  return String(value ?? "").trim();
};

export class RecordsSubmitService {

  constructor(
    private childRepo: ChildRepository = childRepository,
    private attendanceRepo: AttendanceRepository = attendanceRepository,
    private feedingRepo: FeedingRepository = feedingRepository
  ) {}

  private async validateTeacherChildAssignments(teacherId: string, rawRecords: any[]): Promise<any[]> {
    const normalizedRecords = rawRecords.map((record: any) => ({
      ...record,
      child: resolveChildId(record?.child),
    }));

    const hasMissingChildId = normalizedRecords.some((record: any) => !String(record.child || "").trim());
    if (hasMissingChildId) {
      throw new ForbiddenError("One or more children are not assigned to this teacher. Submission rejected.");
    }

    const childIds = Array.from(new Set(normalizedRecords.map((record: any) => String(record.child || "").trim()).filter(Boolean)));
    if (!childIds.length) {
      throw new ForbiddenError("One or more children are not assigned to this teacher. Submission rejected.");
    }

    const assignedIds = await this.childRepo.findAssignedChildIds(childIds, teacherId);
    
    const assignedChildIdSet = new Set(assignedIds);
    const hasUnauthorizedChild = childIds.some((childId) => !assignedChildIdSet.has(childId));

    if (hasUnauthorizedChild) {
      throw new ForbiddenError("One or more children are not assigned to this teacher. Submission rejected.");
    }

    return normalizedRecords;
  }

  public async submitAttendance(user: AuthUser, input: SubmitAttendanceInput): Promise<AttendanceResult> {
    const { date, records } = input;

    if (!date || !records || !Array.isArray(records)) {
      throw new ValidationError("Date and records are required");
    }

    const normalizedRecords = await this.validateTeacherChildAssignments(user.id, records);
    const parsedDateParts = parseRecordDateParts(date);
    
    if (!parsedDateParts) {
      throw new ValidationError("Invalid date format. Use ISO date or YYYY-MM-DD.");
    }

    const dayRange = getManilaDayRange(parsedDateParts);
    const attendanceDate = dayRange.start;

    const existing = await this.attendanceRepo.findByTeacherAndDay(user.id, dayRange);

    if (existing) {
      existing.records = normalizedRecords as any;
      await existing.save();

      void notifyAttendanceSubmitted({
        date: existing.date || attendanceDate,
        records: normalizedRecords as Array<{ child: unknown; status: "present" | "absent" }>,
      }).catch((error) => console.error("Attendance notification dispatch failed:", error));

      return { isUpdate: true, attendance: existing };
    }

    const attendance = await this.attendanceRepo.create({
      date: attendanceDate,
      teacher: user.id,
      records: normalizedRecords,
    });

    void notifyAttendanceSubmitted({
      date: attendanceDate,
      records: normalizedRecords as Array<{ child: unknown; status: "present" | "absent" }>,
    }).catch((error) => console.error("Attendance notification dispatch failed:", error));

    return { isUpdate: false, attendance };
  }

  public async submitFeeding(user: AuthUser, input: SubmitFeedingInput): Promise<FeedingResult> {
    const { date, foodServed, records } = input;

    if (!date || !foodServed || !records || !Array.isArray(records)) {
      throw new ValidationError("Date, food served, and records are required");
    }

    const normalizedRecords = await this.validateTeacherChildAssignments(user.id, records);
    const parsedDateParts = parseRecordDateParts(date);
    
    if (!parsedDateParts) {
      throw new ValidationError("Invalid date format. Use ISO date or YYYY-MM-DD.");
    }

    const dayRange = getManilaDayRange(parsedDateParts);
    const feedingDate = dayRange.start;

    const existing = await this.feedingRepo.findByTeacherAndDay(user.id, dayRange);

    if (existing) {
      existing.foodServed = String(foodServed);
      existing.records = normalizedRecords as any;
      await existing.save();

      void notifyFeedingSubmitted({
        date: existing.date || feedingDate,
        foodServed: String(foodServed),
        records: normalizedRecords as Array<{ child: unknown; status: "completed" | "missed" }>,
      }).catch((error) => console.error("Feeding notification dispatch failed:", error));

      return { isUpdate: true, feeding: existing };
    }

    const feeding = await this.feedingRepo.create({
      date: feedingDate,
      teacher: user.id,
      foodServed: String(foodServed),
      records: normalizedRecords,
    });

    void notifyFeedingSubmitted({
      date: feedingDate,
      foodServed: String(foodServed),
      records: normalizedRecords as Array<{ child: unknown; status: "completed" | "missed" }>,
    }).catch((error) => console.error("Feeding notification dispatch failed:", error));

    return { isUpdate: false, feeding };
  }
}

export const recordsSubmitService = new RecordsSubmitService();

export const submitAttendance = (user: AuthUser, input: SubmitAttendanceInput) => 
  recordsSubmitService.submitAttendance(user, input);

export const submitFeeding = (user: AuthUser, input: SubmitFeedingInput) => 
  recordsSubmitService.submitFeeding(user, input);
