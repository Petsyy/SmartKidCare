import { Request, Response } from "express";
import Attendance from "../../models/Attendance";
import Feeding from "../../models/Feeding";
import {
  formatChildName,
  getDateRangeFromPreset,
  getParentChildIds,
  parsePositiveInt,
  shouldPaginate,
} from "./records.shared";

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

export const getAttendanceHistory = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      startDate,
      endDate,
      page,
      limit,
      search,
      status,
      datePreset,
      teacherId,
    } = req.query;

    const query: any = {};

    let parentChildIds: string[] = [];
    const teacherFilter = parseTeacherIdQuery(teacherId);

    if (req.user.role === "teacher") {
      query.teacher = req.user.id;
    } else if (req.user.role === "admin" && teacherFilter) {
      query.teacher = teacherFilter;
    } else if (req.user.role === "parent") {
      parentChildIds = await getParentChildIds(req.user.id);
      if (!parentChildIds.length) {
        if (shouldPaginate(req.query)) {
          return res.json({
            data: [],
            pagination: {
              page: parsePositiveInt(page, 1),
              limit: parsePositiveInt(limit, 25),
              total: 0,
              totalPages: 0,
              hasNextPage: false,
              hasPrevPage: false,
            },
          });
        }
        return res.json([]);
      }
      query["records.child"] = { $in: parentChildIds };
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

    const attendance = await Attendance.find(query)
      .populate("teacher", "firstName lastName email phone")
      .populate("records.child", "firstName middleName lastName studentId")
      .sort({ date: -1 })
      .lean();

    let scopedAttendance = attendance;

    if (req.user.role === "parent") {
      const allowedChildIds = new Set(parentChildIds);
      scopedAttendance = attendance
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
    }

    if (!shouldPaginate(req.query)) {
      return res.json(scopedAttendance);
    }

    const currentPage = parsePositiveInt(page, 1);
    const currentLimit = parsePositiveInt(limit, 25);
    const normalizedSearch = String(search || "")
      .trim()
      .toLowerCase();
    const normalizedStatus = String(status || "")
      .trim()
      .toLowerCase();
    const flatRows = scopedAttendance.flatMap((entry: any, entryIndex: number) =>
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
      ? flatRows.filter(
          (row: any) => {
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
          },
        )
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

    return res.json({
      data,
      pagination: {
        page: safePage,
        limit: currentLimit,
        total,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1 && totalPages > 0,
      },
    });
  } catch (error: any) {
    console.error("Get attendance history error:", error);
    res.status(500).json({ message: "Failed to fetch attendance history" });
  }
};

export const getFeedingHistory = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      startDate,
      endDate,
      page,
      limit,
      search,
      status,
      datePreset,
      teacherId,
    } = req.query;

    const query: any = {};

    let parentChildIds: string[] = [];
    const teacherFilter = parseTeacherIdQuery(teacherId);

    if (req.user.role === "teacher") {
      query.teacher = req.user.id;
    } else if (req.user.role === "admin" && teacherFilter) {
      query.teacher = teacherFilter;
    } else if (req.user.role === "parent") {
      parentChildIds = await getParentChildIds(req.user.id);
      if (!parentChildIds.length) {
        if (shouldPaginate(req.query)) {
          return res.json({
            data: [],
            pagination: {
              page: parsePositiveInt(page, 1),
              limit: parsePositiveInt(limit, 25),
              total: 0,
              totalPages: 0,
              hasNextPage: false,
              hasPrevPage: false,
            },
          });
        }
        return res.json([]);
      }
      query["records.child"] = { $in: parentChildIds };
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

    const feeding = await Feeding.find(query)
      .populate("teacher", "firstName lastName email phone")
      .populate("records.child", "firstName middleName lastName studentId")
      .sort({ date: -1 })
      .lean();

    let scopedFeeding = feeding;

    if (req.user.role === "parent") {
      const allowedChildIds = new Set(parentChildIds);
      scopedFeeding = feeding
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
    }

    if (!shouldPaginate(req.query)) {
      return res.json(scopedFeeding);
    }

    const currentPage = parsePositiveInt(page, 1);
    const currentLimit = parsePositiveInt(limit, 25);
    const normalizedSearch = String(search || "")
      .trim()
      .toLowerCase();
    const normalizedStatus = String(status || "")
      .trim()
      .toLowerCase();
    const flatRows = scopedFeeding.flatMap((entry: any, entryIndex: number) =>
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
      ? flatRows.filter(
          (row: any) => {
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
          },
        )
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

    return res.json({
      data,
      pagination: {
        page: safePage,
        limit: currentLimit,
        total,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1 && totalPages > 0,
      },
    });
  } catch (error: any) {
    console.error("Get feeding history error:", error);
    res.status(500).json({ message: "Failed to fetch feeding history" });
  }
};
