/**
 * Records History Service
 *
 * Builds queries and formats history results.
 * Throws AppError subclasses — no HTTP awareness.
 */
import type { Request } from "express";
import { UnauthorizedError, ForbiddenError } from "../../shared/errors/app-error";
import {
  findAttendanceHistory,
  findFeedingHistory,
  findChildIdsByParent,
} from "./records.repository";
import {
  formatChildName,
  getDateRangeFromPreset,
  parsePositiveInt,
  shouldPaginate,
} from "./records.shared";

// ─── Types ──────────────────────────────────────────────────────────

type AuthUser = { id: string; role: string };

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

// ─── Helpers ────────────────────────────────────────────────────────

const parseTeacherIdQuery = (value: unknown): string => {
  if (Array.isArray(value)) {
    return String(value[0] ?? "").trim();
  }
  return String(value ?? "").trim();
};

const buildSearchDateKeys = (value: unknown): string[] => {
  if (!value) return [];
  const raw = String(value).trim();
  if (!raw) return [];

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return [raw.toLowerCase()];

  const iso = parsed.toISOString();
  const isoDateOnly = iso.slice(0, 10);
  const localDate = parsed.toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const localDateVerbose = parsed.toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return Array.from(
    new Set([raw, iso, isoDateOnly, localDate, localDateVerbose]).values(),
  )
    .map((item) => String(item).toLowerCase())
    .filter(Boolean);
};

const assertAuthenticated = (user: AuthUser | undefined): AuthUser => {
  if (!user?.id) {
    throw new UnauthorizedError();
  }
  return user;
};

type QueryContext = {
  query: Record<string, unknown>;
  parentChildIds: string[];
};

const buildHistoryQuery = async (
  user: AuthUser,
  queryInput: Request["query"],
): Promise<QueryContext> => {
  const { startDate, endDate, datePreset, teacherId } = queryInput;
  const query: Record<string, unknown> = {};
  let parentChildIds: string[] = [];
  const teacherFilter = parseTeacherIdQuery(teacherId);

  if (user.role === "teacher") {
    query.teacher = user.id;
  } else if (user.role === "admin" && teacherFilter) {
    query.teacher = teacherFilter;
  } else if (user.role === "parent") {
    parentChildIds = await findChildIdsByParent(user.id);
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
      query.date = {
        $gte: range.start,
        $lte: range.end,
      };
    }
  }

  return { query, parentChildIds };
};

const scopeRecordsForParent = (
  entries: any[],
  parentChildIds: string[],
): any[] => {
  const allowedChildIds = new Set(parentChildIds);
  return entries
    .map((entry: any) => {
      const records = Array.isArray(entry.records)
        ? entry.records.filter((record: any) => {
            const childValue = record?.child;
            const childId =
              childValue && typeof childValue === "object"
                ? String(childValue._id ?? "")
                : String(childValue ?? "");
            return allowedChildIds.has(childId);
          })
        : [];
      return { ...entry, records };
    })
    .filter((entry: any) => entry.records.length > 0);
};

// ─── Attendance history ─────────────────────────────────────────────

export const getAttendanceHistory = async (
  user: AuthUser | undefined,
  queryInput: Request["query"],
): Promise<any[] | PaginatedResult<any>> => {
  const validUser = assertAuthenticated(user);
  const { query, parentChildIds } = await buildHistoryQuery(
    validUser,
    queryInput,
  );

  if (validUser.role === "parent" && !parentChildIds.length) {
    if (shouldPaginate(queryInput)) {
      return {
        data: [],
        pagination: {
          page: parsePositiveInt(queryInput.page, 1),
          limit: parsePositiveInt(queryInput.limit, 25),
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }
    return [];
  }

  const attendance = await findAttendanceHistory(query);
  let scoped =
    validUser.role === "parent"
      ? scopeRecordsForParent(attendance, parentChildIds)
      : attendance;

  if (!shouldPaginate(queryInput)) {
    return scoped;
  }

  return paginateAttendanceRows(scoped, queryInput);
};

const paginateAttendanceRows = (
  entries: any[],
  queryInput: Request["query"],
): PaginatedResult<any> => {
  const { page, limit, search, status } = queryInput;
  const currentPage = parsePositiveInt(page, 1);
  const currentLimit = parsePositiveInt(limit, 25);
  const normalizedSearch = String(search || "").trim().toLowerCase();
  const normalizedStatus = String(status || "").trim().toLowerCase();

  const flatRows = entries.flatMap((entry: any, entryIndex: number) =>
    (Array.isArray(entry.records) ? entry.records : []).map(
      (record: any, recordIndex: number) => {
        const child =
          record?.child && typeof record.child === "object"
            ? record.child
            : null;
        const childId = String(
          child?._id ?? record?.child ?? `${entryIndex}-${recordIndex}`,
        );
        return {
          id: `${entry._id}-${childId}`,
          date: entry.date,
          studentId: child?.studentId ?? "--",
          childName: formatChildName(child),
          status: record.status,
          teacherName: entry.teacher
            ? `${entry.teacher.firstName} ${entry.teacher.lastName}`
            : "--",
          submittedAt: entry.updatedAt || entry.createdAt || entry.date,
        };
      },
    ),
  );

  const filteredRows = normalizedSearch
    ? flatRows.filter((row: any) => {
        const searchableDateKeys = buildSearchDateKeys(row.date);
        return (
          String(row.childName).toLowerCase().includes(normalizedSearch) ||
          String(row.studentId).toLowerCase().includes(normalizedSearch) ||
          String(row.status).toLowerCase().includes(normalizedSearch) ||
          String(row.teacherName).toLowerCase().includes(normalizedSearch) ||
          searchableDateKeys.some((dateKey) =>
            dateKey.includes(normalizedSearch),
          )
        );
      })
    : flatRows;

  const statusFilteredRows =
    normalizedStatus === "present" || normalizedStatus === "absent"
      ? filteredRows.filter((row: any) => row.status === normalizedStatus)
      : filteredRows;

  const total = statusFilteredRows.length;
  const totalPages = total > 0 ? Math.ceil(total / currentLimit) : 0;
  const safePage =
    totalPages > 0 ? Math.min(currentPage, totalPages) : currentPage;
  const start = (safePage - 1) * currentLimit;
  const data = statusFilteredRows.slice(start, start + currentLimit);

  return {
    data,
    pagination: {
      page: safePage,
      limit: currentLimit,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1 && totalPages > 0,
    },
  };
};

// ─── Feeding history ────────────────────────────────────────────────

export const getFeedingHistory = async (
  user: AuthUser | undefined,
  queryInput: Request["query"],
): Promise<any[] | PaginatedResult<any>> => {
  const validUser = assertAuthenticated(user);
  const { query, parentChildIds } = await buildHistoryQuery(
    validUser,
    queryInput,
  );

  if (validUser.role === "parent" && !parentChildIds.length) {
    if (shouldPaginate(queryInput)) {
      return {
        data: [],
        pagination: {
          page: parsePositiveInt(queryInput.page, 1),
          limit: parsePositiveInt(queryInput.limit, 25),
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }
    return [];
  }

  const feeding = await findFeedingHistory(query);
  let scoped =
    validUser.role === "parent"
      ? scopeRecordsForParent(feeding, parentChildIds)
      : feeding;

  if (!shouldPaginate(queryInput)) {
    return scoped;
  }

  return paginateFeedingRows(scoped, queryInput);
};

const paginateFeedingRows = (
  entries: any[],
  queryInput: Request["query"],
): PaginatedResult<any> => {
  const { page, limit, search, status } = queryInput;
  const currentPage = parsePositiveInt(page, 1);
  const currentLimit = parsePositiveInt(limit, 25);
  const normalizedSearch = String(search || "").trim().toLowerCase();
  const normalizedStatus = String(status || "").trim().toLowerCase();

  const flatRows = entries.flatMap((entry: any, entryIndex: number) =>
    (Array.isArray(entry.records) ? entry.records : []).map(
      (record: any, recordIndex: number) => {
        const child =
          record?.child && typeof record.child === "object"
            ? record.child
            : null;
        const childId = String(
          child?._id ?? record?.child ?? `${entryIndex}-${recordIndex}`,
        );
        return {
          id: `${entry._id}-${childId}`,
          date: entry.date,
          studentId: child?.studentId ?? "--",
          childName: formatChildName(child),
          foodServed: entry.foodServed || "",
          status: record.status,
          teacherName: entry.teacher
            ? `${entry.teacher.firstName} ${entry.teacher.lastName}`
            : "--",
          submittedAt: entry.updatedAt || entry.createdAt || entry.date,
        };
      },
    ),
  );

  const filteredRows = normalizedSearch
    ? flatRows.filter((row: any) => {
        const searchableDateKeys = buildSearchDateKeys(row.date);
        return (
          String(row.childName).toLowerCase().includes(normalizedSearch) ||
          String(row.studentId).toLowerCase().includes(normalizedSearch) ||
          String(row.foodServed).toLowerCase().includes(normalizedSearch) ||
          String(row.status).toLowerCase().includes(normalizedSearch) ||
          searchableDateKeys.some((dateKey) =>
            dateKey.includes(normalizedSearch),
          )
        );
      })
    : flatRows;

  const statusFilteredRows =
    normalizedStatus === "completed" || normalizedStatus === "missed"
      ? filteredRows.filter((row: any) => row.status === normalizedStatus)
      : filteredRows;

  const total = statusFilteredRows.length;
  const totalPages = total > 0 ? Math.ceil(total / currentLimit) : 0;
  const safePage =
    totalPages > 0 ? Math.min(currentPage, totalPages) : currentPage;
  const start = (safePage - 1) * currentLimit;
  const data = statusFilteredRows.slice(start, start + currentLimit);

  return {
    data,
    pagination: {
      page: safePage,
      limit: currentLimit,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1 && totalPages > 0,
    },
  };
};
