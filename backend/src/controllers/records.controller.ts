import { Request, Response } from "express";
import Attendance from "../models/Attendance";
import Feeding from "../models/Feeding";
import {
  storeDailyRecord,
  getWalletBalance,
  getGasComparison,
} from "../services/blockchain.service";

const toDateKey = (date: Date) => date.toISOString().split("T")[0];

const tryStoreDailyOnChain = async (teacherId: string, date: Date) => {
  try {
    const [attendance, feeding] = await Promise.all([
      Attendance.findOne({ teacher: teacherId, date }),
      Feeding.findOne({ teacher: teacherId, date }),
    ]);

    if (!attendance || !feeding) {
      return null;
    }

    // Check and log wallet balance
    try {
      const walletInfo = await getWalletBalance();
      console.log("\n[Wallet Info]");
      console.log("Address:", walletInfo.address);
      console.log("Sepolia ETH Balance:", walletInfo.balanceInEth, "ETH");
    } catch (error) {
      console.error("Failed to fetch wallet balance:", error);
    }

    const dateKey = toDateKey(date);
    const attendanceByChild = new Map<string, { status: string }>();
    const feedingByChild = new Map<string, { status: string }>();

    attendance.records.forEach((record: any) => {
      attendanceByChild.set(String(record.child), { status: record.status });
    });

    feeding.records.forEach((record: any) => {
      feedingByChild.set(String(record.child), { status: record.status });
    });

    const successes: Array<{ childId: string; result: unknown }> = [];
    const failures: Array<{ childId: string; error: string }> = [];

    for (const [childId, attendanceRecord] of attendanceByChild.entries()) {
      const feedingRecord = feedingByChild.get(childId);
      if (!feedingRecord) continue;

      const attendanceData = {
        date: dateKey,
        status: attendanceRecord.status,
        teacherId,
      };

      const feedingData = {
        date: dateKey,
        status: feedingRecord.status,
        foodServed: feeding.foodServed,
        teacherId,
      };

      try {
        const result = await storeDailyRecord(
          childId,
          dateKey,
          attendanceData,
          feedingData,
        );
        successes.push({ childId, result });
      } catch (error: any) {
        failures.push({
          childId,
          error: error?.message || "Unknown error",
        });
      }
    }

    // Mark successful records as blockchain verified
    if (successes.length > 0 && attendance && feeding) {
      const verifiedChildIds = new Set(successes.map((s) => s.childId));

      attendance.records.forEach((record: any) => {
        if (verifiedChildIds.has(String(record.child))) {
          record.blockchainVerified = true;
        }
      });

      feeding.records.forEach((record: any) => {
        if (verifiedChildIds.has(String(record.child))) {
          record.blockchainVerified = true;
        }
      });

      // Ensure nested array changes are persisted
      attendance.markModified("records");
      feeding.markModified("records");

      await Promise.all([attendance.save(), feeding.save()]);
    }

    // Show balance comparison
    try {
      const comparison = await getGasComparison();
      console.log("\n[Balance Comparison]");
      console.log("Current Balance:", comparison.currentBalance, "ETH");
      console.log("Session Spent:", comparison.totalGasSpent, "ETH");
      console.log("Total Transactions:", comparison.totalTransactions);
    } catch (error) {
      console.error("Failed to fetch balance comparison");
    }

    console.log("");

    return { successes, failures };
  } catch (error) {
    console.error("Blockchain daily sync error:", error);
    return null;
  }
};

// Submit daily attendance
export const submitAttendance = async (req: Request, res: Response) => {
  try {
    const { date, records } = req.body;

    if (!req.user?.id || req.user.role !== "teacher") {
      return res.status(403).json({ message: "Teachers only" });
    }

    if (!date || !records || !Array.isArray(records)) {
      return res.status(400).json({ message: "Date and records are required" });
    }

    // Parse date and set to start of day
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if attendance already exists for this teacher on this date
    const existingAttendance = await Attendance.findOne({
      teacher: req.user.id,
      date: attendanceDate,
    });

    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.records = records as any;
      await existingAttendance.save();

      // Trigger blockchain sync asynchronously (don't wait)
      tryStoreDailyOnChain(req.user.id, attendanceDate).catch((err) =>
        console.error("Background blockchain sync failed:", err),
      );

      return res.json({
        message: "Attendance updated successfully",
        attendance: existingAttendance,
      });
    }

    // Create new attendance record
    const attendance = await Attendance.create({
      date: attendanceDate,
      teacher: req.user.id,
      records,
    });

    // Trigger blockchain sync asynchronously (don't wait)
    tryStoreDailyOnChain(req.user.id, attendanceDate).catch((err) =>
      console.error("Background blockchain sync failed:", err),
    );

    res.status(201).json({
      message: "Attendance submitted successfully",
      attendance,
    });
  } catch (error: any) {
    console.error("Submit attendance error:", error);
    res.status(500).json({ message: "Failed to submit attendance" });
  }
};

// Submit daily feeding
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

    // Parse date and set to start of day
    const feedingDate = new Date(date);
    feedingDate.setHours(0, 0, 0, 0);

    // Check if feeding already exists for this teacher on this date
    const existingFeeding = await Feeding.findOne({
      teacher: req.user.id,
      date: feedingDate,
    });

    if (existingFeeding) {
      // Update existing feeding
      existingFeeding.foodServed = foodServed;
      existingFeeding.records = records as any;
      await existingFeeding.save();

      // Trigger blockchain sync asynchronously (don't wait)
      tryStoreDailyOnChain(req.user.id, feedingDate).catch((err) =>
        console.error("Background blockchain sync failed:", err),
      );

      return res.json({
        message: "Feeding updated successfully",
        feeding: existingFeeding,
      });
    }

    // Create new feeding record
    const feeding = await Feeding.create({
      date: feedingDate,
      teacher: req.user.id,
      foodServed,
      records,
    });

    // Trigger blockchain sync asynchronously (don't wait)
    tryStoreDailyOnChain(req.user.id, feedingDate).catch((err) =>
      console.error("Background blockchain sync failed:", err),
    );

    res.status(201).json({
      message: "Feeding submitted successfully",
      feeding,
    });
  } catch (error: any) {
    console.error("Submit feeding error:", error);
    res.status(500).json({ message: "Failed to submit feeding" });
  }
};

// Get attendance history
export const getAttendanceHistory = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { startDate, endDate } = req.query;

    const query: any = {};

    if (req.user.role === "teacher") {
      query.teacher = req.user.id;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const attendance = await Attendance.find(query)
      .populate("teacher", "firstName lastName email phone")
      .populate("records.child", "firstName middleName lastName studentId")
      .sort({ date: -1 })
      .lean();

    res.json(attendance);
  } catch (error: any) {
    console.error("Get attendance history error:", error);
    res.status(500).json({ message: "Failed to fetch attendance history" });
  }
};

// Get feeding history
export const getFeedingHistory = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { startDate, endDate } = req.query;

    const query: any = {};

    if (req.user.role === "teacher") {
      query.teacher = req.user.id;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const feeding = await Feeding.find(query)
      .populate("teacher", "firstName lastName email phone")
      .populate("records.child", "firstName middleName lastName studentId")
      .sort({ date: -1 })
      .lean();

    res.json(feeding);
  } catch (error: any) {
    console.error("Get feeding history error:", error);
    res.status(500).json({ message: "Failed to fetch feeding history" });
  }
};
