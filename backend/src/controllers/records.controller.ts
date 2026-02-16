import { Request, Response } from "express";
import crypto from "crypto";
import Attendance from "../models/Attendance";
import Feeding from "../models/Feeding";
import Child from "../models/Child";
import {
  verifyDailyRecord,
  getRecordMeta,
  findTxForDateHash,
} from "../services/blockchain.service";
import {
  notifyAttendanceSubmitted,
  notifyFeedingSubmitted,
} from "../services/notifications-services/recordEventNotification.service";
import { buildDateHash, hashData } from "../blockchain/ethers";
import { toDateKey, tryStoreDailyOnChain } from "../helpers/records.helpers";

const resolveChildId = (child: any): string => {
  if (child && typeof child === "object") {
    return String(child._id ?? "");
  }
  return String(child ?? "");
};

const isRecordIntegrityValid = (
  child: any,
  status: string,
  integrityHash?: string | null,
  blockchainVerified?: boolean | null,
): boolean => {
  if (!blockchainVerified) return false;
  if (!integrityHash) return false;
  const dataToHash = JSON.stringify({
    child: resolveChildId(child),
    status,
  });
  const calculatedHash = crypto
    .createHash("sha256")
    .update(dataToHash)
    .digest("hex");
  return calculatedHash === integrityHash;
};

const DEFAULT_VERIFY_REASON =
  "Record is not yet stored on-chain or the on-chain hash does not match this record.";
const EDIT_REANCHOR_REASON =
  "Record status was modified after submission and has not been re-anchored on-chain yet.";

const queueBlockchainSync = (
  teacherId: string,
  date: Date,
  source: "submit" | "edit" = "submit",
) => {
  void tryStoreDailyOnChain(teacherId, date, {
    markRecordsAsVerified: source === "submit",
  }).catch((error) => {
    console.error("Background blockchain sync failed:", error);
  });
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

    // Parse date and set to start of day
    const feedingDate = new Date(date);
    feedingDate.setHours(0, 0, 0, 0);

    // Check if feeding already exists for this teacher on this date
    const existingFeeding = await Feeding.findOne({
      teacher: req.user.id,
      date: feedingDate,
    });

    if (existingFeeding) {
      // Update existing feeding and reset blockchain verification if status changed
      const newRecords = records as any[];

      // Create a map of old records by child ID
      const oldRecordMap = new Map(
        existingFeeding.records.map((r: any) => [String(r.child), r]),
      );

      // Check each new record for status changes
      newRecords.forEach((newRecord: any) => {
        const oldRecord = oldRecordMap.get(String(newRecord.child));

        // If status changed, reset blockchain verification
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

    // Create new feeding record
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

export const getAttendanceHistory = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { startDate, endDate } = req.query;

    const query: any = {};

    let parentChildIds: string[] = [];

    if (req.user.role === "teacher") {
      query.teacher = req.user.id;
    } else if (req.user.role === "parent") {
      parentChildIds = await getParentChildIds(req.user.id);
      if (!parentChildIds.length) {
        return res.json([]);
      }
      query["records.child"] = { $in: parentChildIds };
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

    attendance.forEach((entry: any) => {
      if (!Array.isArray(entry.records)) return;
      entry.records = entry.records.map((record: any) => ({
        ...record,
        blockchainVerified: isRecordIntegrityValid(
          record.child,
          record.status,
          record.integrityHash,
          record.blockchainVerified,
        ),
      }));
    });

    if (req.user.role === "parent") {
      const allowedChildIds = new Set(parentChildIds);
      const scopedAttendance = attendance
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

      return res.json(scopedAttendance);
    }

    res.json(attendance);
  } catch (error: any) {
    console.error("Get attendance history error:", error);
    res.status(500).json({ message: "Failed to fetch attendance history" });
  }
};

export const getAttendanceVerification = async (
  req: Request,
  res: Response,
) => {
  try {
    let { id } = req.params;
    if (Array.isArray(id)) id = id[0];
    const [attendanceId, childId] = String(id).split("-");
    if (!attendanceId || !childId)
      return res.status(400).json({ message: "Invalid id" });

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance)
      return res.status(404).json({ message: "Attendance not found" });

    // find attendance record
    const aRecord: any = attendance.records.find(
      (r: any) =>
        String(r.child) === childId || String(r.child?._id) === childId,
    );
    if (!aRecord)
      return res.status(404).json({ message: "Child attendance not found" });

    // find feeding record for same teacher/date
    const feeding = await Feeding.findOne({
      teacher: attendance.teacher,
      date: attendance.date,
    });
    const fRecord: any = feeding?.records.find(
      (r: any) =>
        String(r.child) === childId || String(r.child?._id) === childId,
    );

    const dateKey = toDateKey(new Date(attendance.date));
    const dateHash = buildDateHash(childId, dateKey);

    if (!aRecord.blockchainVerified || !aRecord.integrityHash) {
      return res.json({
        isValid: false,
        dateHash,
        recordedBy: null,
        timestamp: null,
        reason: !feeding
          ? "Feeding record for this date is missing, so this record is not yet anchored on-chain."
          : EDIT_REANCHOR_REASON,
      });
    }

    // Build the keccak hashes the contract uses (matching storeDailyRecord)
    const attendanceData = {
      child: childId,
      date: dateKey,
      status: aRecord.status,
      teacherId: String(attendance.teacher),
    };
    const feedingData = {
      child: childId,
      date: dateKey,
      status: fRecord ? fRecord.status : "missed",
      foodServed: feeding?.foodServed || "",
      teacherId: String(attendance.teacher),
    };

    const attendanceHash = hashData(attendanceData);
    const feedingHash = hashData(feedingData);

    const verify = await verifyDailyRecord(
      childId,
      dateKey,
      attendanceHash,
      feedingHash,
    );
    const meta = await getRecordMeta(verify.dateHash as string).catch(() => ({
      timestamp: null,
      recordedBy: null,
    }));
    const reason = verify.isValid
      ? undefined
      : !feeding
        ? "Feeding record for this date is missing, so this record is not yet anchored on-chain."
        : DEFAULT_VERIFY_REASON;

    res.json({
      isValid: verify.isValid,
      dateHash,
      recordedBy: meta.recordedBy,
      timestamp: meta.timestamp,
      reason,
    });
  } catch (err: any) {
    console.error("Get attendance verification error:", err);
    res.status(500).json({ message: "Failed to fetch verification" });
  }
};

export const getFeedingVerification = async (req: Request, res: Response) => {
  try {
    let { id } = req.params;
    if (Array.isArray(id)) id = id[0];
    const [feedingId, childId] = String(id).split("-");
    if (!feedingId || !childId)
      return res.status(200).json({
        isValid: false,
        dateHash: null,
        recordedBy: null,
        timestamp: null,
        reason: "Invalid id",
      });

    const feeding = await Feeding.findById(feedingId);
    if (!feeding)
      return res.status(200).json({
        isValid: false,
        dateHash: null,
        recordedBy: null,
        timestamp: null,
        reason: "Feeding not found",
      });

    const fRecord: any = feeding.records.find(
      (r: any) =>
        String(r.child) === childId || String(r.child?._id) === childId,
    );
    if (!fRecord)
      return res.status(200).json({
        isValid: false,
        dateHash: null,
        recordedBy: null,
        timestamp: null,
        reason: "Child feeding not found",
      });

    const attendance = await Attendance.findOne({
      teacher: feeding.teacher,
      date: feeding.date,
    });
    if (!attendance)
      return res.status(200).json({
        isValid: false,
        dateHash: null,
        recordedBy: null,
        timestamp: null,
        reason: "Attendance not found",
      });

    const aRecord: any = attendance.records.find(
      (r: any) =>
        String(r.child) === childId || String(r.child?._id) === childId,
    );
    if (!aRecord)
      return res.status(200).json({
        isValid: false,
        dateHash: null,
        recordedBy: null,
        timestamp: null,
        reason: "Child attendance not found",
      });

    const dateKey = toDateKey(new Date(feeding.date));
    const dateHash = buildDateHash(childId, dateKey);

    if (!fRecord.blockchainVerified || !fRecord.integrityHash) {
      return res.json({
        isValid: false,
        dateHash,
        recordedBy: null,
        timestamp: null,
        reason: EDIT_REANCHOR_REASON,
      });
    }

    const attendanceData = {
      child: childId,
      date: dateKey,
      status: aRecord.status,
      teacherId: String(attendance.teacher),
    };
    const feedingData = {
      child: childId,
      date: dateKey,
      status: fRecord.status,
      foodServed: feeding.foodServed || "",
      teacherId: String(feeding.teacher),
    };

    const attendanceHash = hashData(attendanceData);
    const feedingHash = hashData(feedingData);

    const verify = await verifyDailyRecord(
      childId,
      dateKey,
      attendanceHash,
      feedingHash,
    );
    const meta = await getRecordMeta(verify.dateHash as string).catch(() => ({
      timestamp: null,
      recordedBy: null,
    }));
    const reason = verify.isValid ? undefined : DEFAULT_VERIFY_REASON;

    res.json({
      isValid: verify.isValid,
      dateHash,
      recordedBy: meta.recordedBy,
      timestamp: meta.timestamp,
      reason,
    });
  } catch (err: any) {
    console.error("Get feeding verification error:", err);
    res.status(500).json({ message: "Failed to fetch verification" });
  }
};

export const getTxForDateHash = async (req: Request, res: Response) => {
  try {
    let { dateHash } = req.params;
    if (Array.isArray(dateHash)) dateHash = dateHash[0];
    if (!dateHash)
      return res.status(400).json({ message: "dateHash required" });

    const blocksToScan = req.query.blocks
      ? Number(req.query.blocks)
      : undefined;
    const tx = await findTxForDateHash(dateHash, blocksToScan).catch((e) => {
      console.error("findTxForDateHash error:", e);
      return null;
    });

    if (!tx) return res.status(404).json({ message: "Transaction not found" });
    res.json({ txHash: tx });
  } catch (err: any) {
    console.error("Get tx for dateHash error:", err);
    res.status(500).json({ message: "Failed to retrieve transaction" });
  }
};

export const getFeedingHistory = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { startDate, endDate } = req.query;

    const query: any = {};

    let parentChildIds: string[] = [];

    if (req.user.role === "teacher") {
      query.teacher = req.user.id;
    } else if (req.user.role === "parent") {
      parentChildIds = await getParentChildIds(req.user.id);
      if (!parentChildIds.length) {
        return res.json([]);
      }
      query["records.child"] = { $in: parentChildIds };
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

    feeding.forEach((entry: any) => {
      if (!Array.isArray(entry.records)) return;
      entry.records = entry.records.map((record: any) => ({
        ...record,
        blockchainVerified: isRecordIntegrityValid(
          record.child,
          record.status,
          record.integrityHash,
          record.blockchainVerified,
        ),
      }));
    });

    if (req.user.role === "parent") {
      const allowedChildIds = new Set(parentChildIds);
      const scopedFeeding = feeding
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

      return res.json(scopedFeeding);
    }

    res.json(feeding);
  } catch (error: any) {
    console.error("Get feeding history error:", error);
    res.status(500).json({ message: "Failed to fetch feeding history" });
  }
};

async function getParentChildIds(parentId: string): Promise<string[]> {
  const children = await Child.find({ parent: parentId }).select("_id").lean();
  return children.map((child: any) => String(child._id));
}

export const updateAttendanceRecord = async (req: Request, res: Response) => {
  try {
    let { id } = req.params;
    const { status } = req.body;
    if (!status || !["present", "absent"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    if (Array.isArray(id)) id = id[0];
    const [attendanceId, childId] = String(id).split("-");
    if (!attendanceId || !childId) {
      return res.status(400).json({ message: "Invalid record id" });
    }
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance not found" });
    }
    const record = attendance.records.find(
      (r: any) =>
        String(r.child) === childId || String(r.child?._id) === childId,
    );
    if (!record) {
      return res.status(404).json({ message: "Child record not found" });
    }
    // Only update if status is different
    if (record.status !== status) {
      record.status = status;
      record.blockchainVerified = false;
      record.integrityHash = null;
      attendance.markModified("records");
      await attendance.save();
      queueBlockchainSync(
        String(attendance.teacher),
        new Date(attendance.date),
        "edit",
      );
    }
    res.json({ message: "Attendance record updated" });
  } catch (error: any) {
    console.error("Update attendance error:", error);
    res.status(500).json({ message: "Failed to update attendance record" });
  }
};

export const updateFeedingRecord = async (req: Request, res: Response) => {
  try {
    let { id } = req.params;
    const { status } = req.body;
    if (!status || !["completed", "missed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    if (Array.isArray(id)) id = id[0];
    // id format: feedingId-childId
    const [feedingId, childId] = String(id).split("-");
    if (!feedingId || !childId) {
      return res.status(400).json({ message: "Invalid record id" });
    }
    const feeding = await Feeding.findById(feedingId);
    if (!feeding) {
      return res.status(404).json({ message: "Feeding not found" });
    }
    const record = feeding.records.find(
      (r: any) =>
        String(r.child) === childId || String(r.child?._id) === childId,
    );
    if (!record) {
      return res.status(404).json({ message: "Child record not found" });
    }
    if (record.status !== status) {
      record.status = status;
      record.blockchainVerified = false;
      record.integrityHash = null;
      feeding.markModified("records");
      await feeding.save();
      queueBlockchainSync(
        String(feeding.teacher),
        new Date(feeding.date),
        "edit",
      );
    }
    res.json({ message: "Feeding record updated" });
  } catch (error: any) {
    console.error("Update feeding error:", error);
    res.status(500).json({ message: "Failed to update feeding record" });
  }
};

export const deleteAttendanceRecord = async (req: Request, res: Response) => {
  try {
    let { id } = req.params;
    if (Array.isArray(id)) id = id[0];
    // id format: attendanceId-childId
    const [attendanceId, childId] = String(id).split("-");
    if (!attendanceId || !childId) {
      return res.status(400).json({ message: "Invalid record id" });
    }
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance not found" });
    }
    const initialLength = attendance.records.length;
    // Use pull to preserve DocumentArray type
    attendance.records.pull({ child: childId });
    if (attendance.records.length === initialLength) {
      return res.status(404).json({ message: "Child record not found" });
    }
    attendance.markModified("records");
    await attendance.save();
    res.json({ message: "Attendance record deleted" });
  } catch (error: any) {
    console.error("Delete attendance error:", error);
    res.status(500).json({ message: "Failed to delete attendance record" });
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
