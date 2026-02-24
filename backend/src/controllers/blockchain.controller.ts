import { Request, Response } from "express";
import {
  storeDailyRecord,
  verifyDailyRecord,
} from "../services/blockchain.service";
import { buildDateHash } from "../blockchain/ethers";

export async function recordAttendance(req: Request, res: Response) {
  const { childId, date, attendance, feeding } = req.body;

  try {
    const result = await storeDailyRecord(childId, date, attendance, feeding);

    res.status(200).json({
      message: "Record stored on blockchain",
      ...result,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function verifyAttendance(req: Request, res: Response) {
  const { childId, date, attendanceHash, feedingHash } = req.body;

  try {
    const result = await verifyDailyRecord(
      childId,
      date,
      attendanceHash,
      feedingHash,
    );

    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function fetchRecordMeta(req: Request, res: Response) {332
  const childId = Array.isArray(req.params.childId)
    ? req.params.childId[0]
    : req.params.childId;
  const date = Array.isArray(req.params.date)
    ? req.params.date[0]
    : req.params.date;

  try {
    const dateKey = new Date(date).toISOString().split("T")[0];
    const dateHash = buildDateHash(childId, dateKey);
    return res.status(501).json({
      message:
        "getRecordMeta is not available on the current AttendanceFeeding contract version.",
      dateHash,
      recordedBy: null,
      timestamp: null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
