import { Request, Response } from "express";
import Attendance from "../../models/Attendance";
import Feeding from "../../models/Feeding";
import {
  verifyDailyRecord,
  findTxForDateHash,
} from "../../services/blockchain.service";
import { buildDateHash, hashData } from "../../blockchain/ethers";
import { toDateKey } from "../../utils/recordUtilities";
import { DEFAULT_VERIFY_REASON, EDIT_REANCHOR_REASON } from "./records.shared";

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

    const aRecord: any = attendance.records.find(
      (r: any) =>
        String(r.child) === childId || String(r.child?._id) === childId,
    );
    if (!aRecord)
      return res.status(404).json({ message: "Child attendance not found" });

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
    const reason = verify.isValid
      ? undefined
      : !feeding
        ? "Feeding record for this date is missing, so this record is not yet anchored on-chain."
        : DEFAULT_VERIFY_REASON;

    res.json({
      isValid: verify.isValid,
      dateHash,
      recordedBy: null,
      timestamp: null,
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
    const reason = verify.isValid ? undefined : DEFAULT_VERIFY_REASON;

    res.json({
      isValid: verify.isValid,
      dateHash,
      recordedBy: null,
      timestamp: null,
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
