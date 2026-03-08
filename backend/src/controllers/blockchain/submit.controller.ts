import { Request, Response } from "express";
import Attendance from "../../models/Attendance";
import Feeding from "../../models/Feeding";
import Child from "../../models/Child";
import {
  notifyAttendanceSubmitted,
  notifyFeedingSubmitted,
} from "../../services/notifications/recordEventNotification.service";

const resolveChildId = (value: unknown): string => {
  if (value && typeof value === "object") {
    const asObject = value as { _id?: unknown };
    if (asObject._id) return String(asObject._id).trim();
  }
  return String(value ?? "").trim();
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

    const feedingDate = new Date(date);
    feedingDate.setHours(0, 0, 0, 0);

    const existingFeeding = await Feeding.findOne({
      teacher: req.user.id,
      date: feedingDate,
    });

    if (existingFeeding) {
      const newRecords = normalizedRecords as any[];

      existingFeeding.foodServed = foodServed;
      existingFeeding.records = newRecords as any;
      await existingFeeding.save();

      void notifyFeedingSubmitted({
        date: feedingDate,
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

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const existingAttendance = await Attendance.findOne({
      teacher: req.user.id,
      date: attendanceDate,
    });

    if (existingAttendance) {
      const newRecords = normalizedRecords as any[];

      existingAttendance.records = newRecords as any;
      await existingAttendance.save();

      void notifyAttendanceSubmitted({
        date: attendanceDate,
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
