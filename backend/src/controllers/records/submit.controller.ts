import { Request, Response } from "express";
import Attendance from "../../models/Attendance";
import Feeding from "../../models/Feeding";
import {
  notifyAttendanceSubmitted,
  notifyFeedingSubmitted,
} from "../../services/notifications/recordEventNotification.service";
import { queueBlockchainSync } from "./records.shared";

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

    const feedingDate = new Date(date);
    feedingDate.setHours(0, 0, 0, 0);

    const existingFeeding = await Feeding.findOne({
      teacher: req.user.id,
      date: feedingDate,
    });

    if (existingFeeding) {
      const newRecords = records as any[];

      const oldRecordMap = new Map(
        existingFeeding.records.map((r: any) => [String(r.child), r]),
      );

      newRecords.forEach((newRecord: any) => {
        const oldRecord = oldRecordMap.get(String(newRecord.child));

        if (oldRecord && oldRecord.status !== newRecord.status) {
          newRecord.blockchainVerified = false;
          newRecord.integrityHash = null;
        }
      });

      existingFeeding.foodServed = foodServed;
      existingFeeding.records = newRecords as any;
      await existingFeeding.save();

      queueBlockchainSync(req.user.id, feedingDate);
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
      records,
    });

    queueBlockchainSync(req.user.id, feedingDate);
    void notifyFeedingSubmitted({
      date: feedingDate,
      foodServed,
      records: records as Array<{
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

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const existingAttendance = await Attendance.findOne({
      teacher: req.user.id,
      date: attendanceDate,
    });

    if (existingAttendance) {
      const newRecords = records as any[];

      const oldRecordMap = new Map(
        existingAttendance.records.map((r: any) => [String(r.child), r]),
      );

      newRecords.forEach((newRecord: any) => {
        const oldRecord = oldRecordMap.get(String(newRecord.child));

        if (oldRecord && oldRecord.status !== newRecord.status) {
          newRecord.blockchainVerified = false;
          newRecord.integrityHash = null;
        }
      });

      existingAttendance.records = newRecords as any;
      await existingAttendance.save();

      queueBlockchainSync(req.user.id, attendanceDate);
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
      records,
    });

    queueBlockchainSync(req.user.id, attendanceDate);
    void notifyAttendanceSubmitted({
      date: attendanceDate,
      records: records as Array<{
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
