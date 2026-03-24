import { Request, Response } from "express";
import Attendance from "../../models/Attendance";
import Feeding from "../../models/Feeding";
import Child from "../../models/Child";
import {
  notifyAttendanceSubmitted,
  notifyFeedingSubmitted,
} from "../../services/notifications/recordEventNotification.service";

const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;
const MANILA_DAY_MS = 24 * 60 * 60 * 1000;
const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

type DateParts = {
  year: number;
  month: number;
  day: number;
};

const resolveChildId = (value: unknown): string => {
  if (value && typeof value === "object") {
    const asObject = value as { _id?: unknown };
    if (asObject._id) return String(asObject._id).trim();
  }
  return String(value ?? "").trim();
};

const toValidDateParts = (
  year: number,
  month: number,
  day: number,
): DateParts | null => {
  if (!Number.isInteger(year) || year < 1900 || year > 9999) return null;
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  if (!Number.isInteger(day) || day < 1 || day > 31) return null;

  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
};

const parseRecordDateParts = (value: unknown): DateParts | null => {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const dateOnlyMatch = DATE_KEY_PATTERN.exec(raw);
  if (dateOnlyMatch) {
    return toValidDateParts(
      Number(dateOnlyMatch[1]),
      Number(dateOnlyMatch[2]),
      Number(dateOnlyMatch[3]),
    );
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;

  const shiftedToManila = new Date(parsed.getTime() + MANILA_OFFSET_MS);
  return toValidDateParts(
    shiftedToManila.getUTCFullYear(),
    shiftedToManila.getUTCMonth() + 1,
    shiftedToManila.getUTCDate(),
  );
};

const getManilaDayRange = (parts: DateParts): { start: Date; end: Date } => {
  const startMs =
    Date.UTC(parts.year, parts.month - 1, parts.day, 0, 0, 0, 0) -
    MANILA_OFFSET_MS;
  return {
    start: new Date(startMs),
    end: new Date(startMs + MANILA_DAY_MS - 1),
  };
};

const validateTeacherChildAssignments = async (
  teacherId: string,
  rawRecords: any[],
): Promise<any[] | null> => {
  const normalizedRecords = rawRecords.map((record: any) => ({
    ...record,
    child: resolveChildId(record?.child),
  }));

  const hasMissingChildId = normalizedRecords.some(
    (record: any) => !String(record.child || "").trim(),
  );
  if (hasMissingChildId) {
    return null;
  }

  const childIds = Array.from(
    new Set(
      normalizedRecords
        .map((record: any) => String(record.child || "").trim())
        .filter(Boolean),
    ),
  );

  if (!childIds.length) {
    return null;
  }

  const assignedChildren = await Child.find({
    _id: { $in: childIds },
    teacher: teacherId,
  })
    .select("_id")
    .lean();

  const assignedChildIdSet = new Set(
    assignedChildren.map((child: any) => String(child._id)),
  );
  const hasUnauthorizedChild = childIds.some(
    (childId) => !assignedChildIdSet.has(childId),
  );

  if (hasUnauthorizedChild) {
    return null;
  }

  return normalizedRecords;
};

export const submitFeeding = async (req: Request, res: Response) => {
  try {
    const { date, foodServed, records } = req.body;

    if (!req.user?.id || req.user.role !== "teacher") {
      return res.status(403).json({ message: "Teachers only" });
    }

    if (!date || !foodServed || !records || !Array.isArray(records)) {
      return res
        .status(400)
        .json({ message: "Date, food served, and records are required" });
    }

    const normalizedRecords = await validateTeacherChildAssignments(
      req.user.id,
      records as any[],
    );
    if (!normalizedRecords) {
      return res.status(403).json({
        message:
          "One or more children are not assigned to this teacher. Submission rejected.",
      });
    }

    const parsedDateParts = parseRecordDateParts(date);
    if (!parsedDateParts) {
      return res.status(400).json({
        message: "Invalid date format. Use ISO date or YYYY-MM-DD.",
      });
    }

    const feedingDayRange = getManilaDayRange(parsedDateParts);
    const feedingDate = feedingDayRange.start;

    const existingFeeding = await Feeding.findOne({
      teacher: req.user.id,
      date: { $gte: feedingDayRange.start, $lte: feedingDayRange.end },
    });

    if (existingFeeding) {
      const newRecords = normalizedRecords as any[];

      existingFeeding.foodServed = foodServed;
      existingFeeding.records = newRecords as any;
      await existingFeeding.save();

      void notifyFeedingSubmitted({
        date: existingFeeding.date || feedingDate,
        foodServed,
        records: newRecords as Array<{
          child: unknown;
          status: "completed" | "missed";
        }>,
      }).catch((error) => {
        console.error("Feeding notification dispatch failed:", error);
      });

      return res.json({
        message: "Feeding updated successfully",
        feeding: existingFeeding,
      });
    }

    const feeding = await Feeding.create({
      date: feedingDate,
      teacher: req.user.id,
      foodServed,
      records: normalizedRecords,
    });

    void notifyFeedingSubmitted({
      date: feedingDate,
      foodServed,
      records: normalizedRecords as Array<{
        child: unknown;
        status: "completed" | "missed";
      }>,
    }).catch((error) => {
      console.error("Feeding notification dispatch failed:", error);
    });

    res.status(201).json({
      message: "Feeding submitted successfully",
      feeding,
    });
  } catch (error: any) {
    console.error("Submit feeding error:", error);
    res.status(500).json({ message: "Failed to submit feeding" });
  }
};

export const submitAttendance = async (req: Request, res: Response) => {
  try {
    const { date, records } = req.body;

    if (!req.user?.id || req.user.role !== "teacher") {
      return res.status(403).json({ message: "Teachers only" });
    }

    if (!date || !records || !Array.isArray(records)) {
      return res.status(400).json({ message: "Date and records are required" });
    }

    const normalizedRecords = await validateTeacherChildAssignments(
      req.user.id,
      records as any[],
    );
    if (!normalizedRecords) {
      return res.status(403).json({
        message:
          "One or more children are not assigned to this teacher. Submission rejected.",
      });
    }

    const parsedDateParts = parseRecordDateParts(date);
    if (!parsedDateParts) {
      return res.status(400).json({
        message: "Invalid date format. Use ISO date or YYYY-MM-DD.",
      });
    }

    const attendanceDayRange = getManilaDayRange(parsedDateParts);
    const attendanceDate = attendanceDayRange.start;

    const existingAttendance = await Attendance.findOne({
      teacher: req.user.id,
      date: { $gte: attendanceDayRange.start, $lte: attendanceDayRange.end },
    });

    if (existingAttendance) {
      const newRecords = normalizedRecords as any[];

      existingAttendance.records = newRecords as any;
      await existingAttendance.save();

      void notifyAttendanceSubmitted({
        date: existingAttendance.date || attendanceDate,
        records: newRecords as Array<{
          child: unknown;
          status: "present" | "absent";
        }>,
      }).catch((error) => {
        console.error("Attendance notification dispatch failed:", error);
      });

      return res.json({
        message: "Attendance updated successfully",
        attendance: existingAttendance,
      });
    }

    const attendance = await Attendance.create({
      date: attendanceDate,
      teacher: req.user.id,
      records: normalizedRecords,
    });

    void notifyAttendanceSubmitted({
      date: attendanceDate,
      records: normalizedRecords as Array<{
        child: unknown;
        status: "present" | "absent";
      }>,
    }).catch((error) => {
      console.error("Attendance notification dispatch failed:", error);
    });

    res.status(201).json({
      message: "Attendance submitted successfully",
      attendance,
    });
  } catch (error: any) {
    console.error("Submit attendance error:", error);
    res.status(500).json({ message: "Failed to submit attendance" });
  }
};
