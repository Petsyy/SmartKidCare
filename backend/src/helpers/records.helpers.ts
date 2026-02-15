import crypto from "crypto";
import Attendance from "../models/Attendance";
import Feeding from "../models/Feeding";
import {
  storeDailyRecord,
  getWalletBalance,
} from "../services/blockchain.service";

export const toDateKey = (date: Date) => date.toISOString().split("T")[0];

type SyncOptions = {
  markRecordsAsVerified?: boolean;
};

export const tryStoreDailyOnChain = async (
  teacherId: string,
  date: Date,
  options: SyncOptions = {},
) => {
  const { markRecordsAsVerified = true } = options;
  try {
    const [attendance, feeding] = await Promise.all([
      Attendance.findOne({ teacher: teacherId, date }),
      Feeding.findOne({ teacher: teacherId, date }),
    ]);

    if (!attendance || !feeding) {
      const missingParts = [
        !attendance ? "attendance" : null,
        !feeding ? "feeding" : null,
      ]
        .filter(Boolean)
        .join(" and ");
      console.log(
        `[Blockchain sync skipped] Missing ${missingParts} record for teacher ${teacherId} on ${toDateKey(date)}`,
      );
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

    // Always submit all attendance records for blockchain verification, regardless of feeding status
    const attendanceByChild = new Map<string, { status: string }>();
    attendance.records.forEach((record: any) => {
      attendanceByChild.set(String(record.child), { status: record.status });
    });

    // Build feeding map (may be empty if no feeding record for a child)
    const feedingByChild = new Map<string, { status: string }>();
    feeding.records.forEach((record: any) => {
      feedingByChild.set(String(record.child), { status: record.status });
    });

    const successes: Array<{
      childId: string;
      attendanceStatus: string;
      feedingStatus: string;
      feedingFoodServed: string;
      result: unknown;
    }> = [];
    const failures: Array<{ childId: string; error: string }> = [];

    for (const [childId, attendanceRecord] of attendanceByChild.entries()) {
      // Always submit attendance, even if no feeding record exists for this child
      const feedingRecord = feedingByChild.get(childId);
      const attendanceData = {
        child: childId,
        date: dateKey,
        status: attendanceRecord.status,
        teacherId,
      };
      // If feeding record exists, use it; otherwise, submit a default 'missed' feeding
      const feedingData = feedingRecord
        ? {
            child: childId,
            date: dateKey,
            status: feedingRecord.status,
            foodServed: feeding.foodServed,
            teacherId,
          }
        : {
            child: childId,
            date: dateKey,
            status: "missed",
            foodServed: feeding.foodServed || "",
            teacherId,
          };
      try {
        const result = await storeDailyRecord(
          childId,
          dateKey,
          attendanceData,
          feedingData,
        );
        successes.push({
          childId,
          attendanceStatus: attendanceRecord.status,
          feedingStatus: feedingData.status,
          feedingFoodServed: feedingData.foodServed,
          result,
        });
      } catch (error: any) {
        failures.push({
          childId,
          error: error?.message || "Unknown error",
        });
      }
    }

    // Optionally update DB verification state after successful on-chain writes.
    if (markRecordsAsVerified && successes.length > 0 && attendance && feeding) {
      const latestAttendance = await Attendance.findById(attendance._id);
      const latestFeeding = await Feeding.findById(feeding._id);

      if (!latestAttendance || !latestFeeding) {
        return { successes, failures };
      }

      const latestAttendanceByChild = new Map<string, string>();
      latestAttendance.records.forEach((record: any) => {
        latestAttendanceByChild.set(String(record.child), record.status);
      });

      const latestFeedingByChild = new Map<string, string>();
      latestFeeding.records.forEach((record: any) => {
        latestFeedingByChild.set(String(record.child), record.status);
      });

      const eligibleChildIds = new Set<string>();
      successes.forEach((success) => {
        const currentAttendanceStatus = latestAttendanceByChild.get(
          success.childId,
        );
        const currentFeedingStatus = latestFeedingByChild.get(success.childId);
        const currentFoodServed = String(latestFeeding.foodServed || "");

        if (
          currentAttendanceStatus === success.attendanceStatus &&
          currentFeedingStatus === success.feedingStatus &&
          currentFoodServed === String(success.feedingFoodServed || "")
        ) {
          eligibleChildIds.add(success.childId);
        }
      });

      latestAttendance.records.forEach((record: any) => {
        if (eligibleChildIds.has(String(record.child))) {
          record.blockchainVerified = true;
          const childId =
            record.child && record.child._id ? record.child._id : record.child;
          const dataToHash = JSON.stringify({
            child: String(childId),
            status: record.status,
          });
          record.integrityHash = crypto
            .createHash("sha256")
            .update(dataToHash)
            .digest("hex");
        }
      });

      latestFeeding.records.forEach((record: any) => {
        if (eligibleChildIds.has(String(record.child))) {
          record.blockchainVerified = true;
          const childId =
            record.child && record.child._id ? record.child._id : record.child;
          const dataToHash = JSON.stringify({
            child: String(childId),
            status: record.status,
          });
          record.integrityHash = crypto
            .createHash("sha256")
            .update(dataToHash)
            .digest("hex");
        }
      });

      latestAttendance.markModified("records");
      latestFeeding.markModified("records");

      await Promise.all([latestAttendance.save(), latestFeeding.save()]);
    }

    return { successes, failures };
  } catch (error) {
    console.error("Blockchain daily sync error:", error);
    return null;
  }
};
