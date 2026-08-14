import type { Request } from "express";
import { ValidationError, ForbiddenError } from "../../../shared/errors/app-error";
import {childRepository,attendanceRepository,findChildIdsByParent,findAttendanceHistory} from "../repositories/attendance.repository";
import { notifyAttendanceSubmitted } from "../../notifications/services/record-event-notification.service";
import {parsePositiveInt,shouldPaginate,formatChildName,getDateRangeFromPreset,
} from "../../../shared/utils/records.utils";
import { RecordServiceSupport, recordServiceSupport } from "../../../shared/services/record-service-support";
import type { AttendanceAuthUser, AuthUser, SubmitAttendanceInput, AttendanceResult, PaginatedResult, AttendanceServiceDependencies } from "../types/attendance.types";

const submitAttendanceOperation = async (user: AuthUser, input: SubmitAttendanceInput, dependencies: AttendanceServiceDependencies): Promise<AttendanceResult> => {
  const { date, records } = input;

  const normalizedRecords = (records as any[]).map((record: any) => ({
    ...record,
    child: dependencies.support.resolveChildId(record?.child),
  }));

  const hasMissingChildId = normalizedRecords.some((record: any) => !String(record.child || "").trim());
  if (hasMissingChildId) {
    throw new ForbiddenError("One or more children are not assigned to this teacher. Submission rejected.");
  }

  const childIds = Array.from(new Set(normalizedRecords.map((record: any) => String(record.child || "").trim()).filter(Boolean)));
  if (!childIds.length) {
    throw new ForbiddenError("One or more children are not assigned to this teacher. Submission rejected.");
  }

  const assignedIds = await dependencies.childRepository.findAssignedChildIds(childIds, user.id);
  const assignedChildIdSet = new Set(assignedIds);
  const hasUnauthorizedChild = childIds.some((childId) => !assignedChildIdSet.has(childId));

  if (hasUnauthorizedChild) {
    throw new ForbiddenError("One or more children are not assigned to this teacher. Submission rejected.");
  }

  const dayRange = dependencies.support.parseDayRange(date);
  if (!dayRange) {
    throw new ValidationError("Invalid date format. Use ISO date or YYYY-MM-DD.");
  }

  const attendanceDate = dayRange.start;

  const existing = await dependencies.attendanceRepository.findByTeacherAndDay(user.id, dayRange);

  if (existing) {
    existing.records = normalizedRecords as any;
    await existing.save();

    void dependencies.notifySubmitted({
      date: existing.date || attendanceDate,
      records: normalizedRecords as Array<{ child: unknown; status: "present" | "absent" }>,
    }).catch((error) => console.error("Attendance notification dispatch failed:", error));

    return { isUpdate: true, attendance: existing };
  }

  const attendance = await dependencies.attendanceRepository.create({
    date: attendanceDate,
    teacher: user.id,
    records: normalizedRecords,
  });

  void dependencies.notifySubmitted({
    date: attendanceDate,
    records: normalizedRecords as Array<{ child: unknown; status: "present" | "absent" }>,
  }).catch((error) => console.error("Attendance notification dispatch failed:", error));

  return { isUpdate: false, attendance };
};

const getAttendanceHistoryOperation = async (
  user: AuthUser | undefined,
  queryInput: Request["query"],
  dependencies: AttendanceServiceDependencies,
): Promise<any[] | PaginatedResult<any>> => {
  const validUser = dependencies.support.assertAuthenticated(user);
  const { startDate, endDate, datePreset, teacherId } = queryInput;
  const query: Record<string, unknown> = {};
  let parentChildIds: string[] = [];
  const teacherFilter = dependencies.support.parseTeacherIdQuery(teacherId);

  if (validUser.role === "teacher") {
    query.teacher = validUser.id;
  } else if (validUser.role === "admin" && teacherFilter) {
    query.teacher = teacherFilter;
  } else if (validUser.role === "parent") {
    parentChildIds = await dependencies.findChildIdsByParent(validUser.id);
    if (parentChildIds.length) {
      query["records.child"] = { $in: parentChildIds };
    }
  }

  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate as string),
      $lte: new Date(endDate as string),
    };
  } else if (datePreset) {
    const range = getDateRangeFromPreset(String(datePreset));
    if (range) {
      query.date = { $gte: range.start, $lte: range.end };
    }
  }

  if (validUser.role === "parent" && !parentChildIds.length) {
    if (shouldPaginate(queryInput)) {
      return {
        data: [],
        pagination: { page: parsePositiveInt(queryInput.page, 1), limit: parsePositiveInt(queryInput.limit, 25), total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false },
      };
    }
    return [];
  }

  const attendance = await dependencies.findHistory(query);
  let scoped = attendance;
  if (validUser.role === "parent") {
    const allowedChildIds = new Set(parentChildIds);
    scoped = attendance.map((entry: any) => {
      const records = Array.isArray(entry.records) ? entry.records.filter((record: any) => {
        const childValue = record?.child;
        const childId = childValue && typeof childValue === "object" ? String(childValue._id ?? "") : String(childValue ?? "");
        return allowedChildIds.has(childId);
      }) : [];
      return { ...entry, records };
    }).filter((entry: any) => entry.records.length > 0);
  }

  if (!shouldPaginate(queryInput)) return scoped;

  const { page, limit, search, status } = queryInput;
  const currentPage = parsePositiveInt(page, 1);
  const currentLimit = parsePositiveInt(limit, 25);
  const normalizedSearch = String(search || "").trim().toLowerCase();
  const normalizedStatus = String(status || "").trim().toLowerCase();

  const flatRows = scoped.flatMap((entry: any, entryIndex: number) =>
    (Array.isArray(entry.records) ? entry.records : []).map(
      (record: any, recordIndex: number) => {
        const child = record?.child && typeof record.child === "object" ? record.child : null;
        const childId = String(child?._id ?? record?.child ?? `${entryIndex}-${recordIndex}`);
        return {
          id: `${entry._id}-${childId}`,
          date: entry.date,
          studentId: child?.studentId ?? "--",
          childName: formatChildName(child),
          status: record.status,
          teacherName: entry.teacher ? `${entry.teacher.firstName} ${entry.teacher.lastName}` : "--",
          submittedAt: entry.updatedAt || entry.createdAt || entry.date,
        };
      },
    ),
  );

  const filteredRows = normalizedSearch
    ? flatRows.filter((row: any) => {
        const searchableDateKeys = dependencies.support.buildSearchDateKeys(row.date);
        return (
          String(row.childName).toLowerCase().includes(normalizedSearch) ||
          String(row.studentId).toLowerCase().includes(normalizedSearch) ||
          String(row.status).toLowerCase().includes(normalizedSearch) ||
          String(row.teacherName).toLowerCase().includes(normalizedSearch) ||
          searchableDateKeys.some((dateKey) => dateKey.includes(normalizedSearch))
        );
      })
    : flatRows;

  const statusFilteredRows = normalizedStatus === "present" || normalizedStatus === "absent"
      ? filteredRows.filter((row: any) => row.status === normalizedStatus)
      : filteredRows;

  const total = statusFilteredRows.length;
  const totalPages = total > 0 ? Math.ceil(total / currentLimit) : 0;
  const safePage = totalPages > 0 ? Math.min(currentPage, totalPages) : currentPage;
  const start = (safePage - 1) * currentLimit;
  const data = statusFilteredRows.slice(start, start + currentLimit);

  return {
    data,
    pagination: { page: safePage, limit: currentLimit, total, totalPages, hasNextPage: safePage < totalPages, hasPrevPage: safePage > 1 && totalPages > 0 },
  };
};


const defaultAttendanceDependencies: AttendanceServiceDependencies = {
  support: recordServiceSupport,
  childRepository,
  attendanceRepository,
  findChildIdsByParent,
  findHistory: findAttendanceHistory,
  notifySubmitted: notifyAttendanceSubmitted,
};

export class AttendanceService {
  constructor(private readonly dependencies: AttendanceServiceDependencies) {}

  submit(user: AuthUser, input: SubmitAttendanceInput): Promise<AttendanceResult> {
    return submitAttendanceOperation(user, input, this.dependencies);
  }

  getHistory(user: AuthUser | undefined, query: Request["query"]): Promise<any[] | PaginatedResult<any>> {
    return getAttendanceHistoryOperation(user, query, this.dependencies);
  }

}

export const attendanceService = new AttendanceService(defaultAttendanceDependencies);
export const submitAttendance = attendanceService.submit.bind(attendanceService);
export const getAttendanceHistory = attendanceService.getHistory.bind(attendanceService);

export type { AttendanceAuthUser, SubmitAttendanceInput, AttendanceResult, PaginatedResult, AttendanceServiceDependencies } from "../types/attendance.types";
