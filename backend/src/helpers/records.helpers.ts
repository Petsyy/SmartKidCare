import crypto from "crypto";
import Attendance from "../models/Attendance";
import Feeding from "../models/Feeding";
import {
  storeDailyRecord,
  getWalletBalance,
  getGasComparison,
} from "../services/blockchain.service";

export const toDateKey = (date: Date) => date.toISOString().split("T")[0];

export const tryStoreDailyOnChain = async (teacherId: string, date: Date) => {
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

    const successes: Array<{ childId: string; result: unknown }> = [];
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
          // Always use string ObjectId for hash
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

      feeding.records.forEach((record: any) => {
        if (verifiedChildIds.has(String(record.child))) {
          record.blockchainVerified = true;
          // Always use string ObjectId for hash
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

      // Ensure nested array changes are persisted
      attendance.markModified("records");
      feeding.markModified("records");

      await Promise.all([attendance.save(), feeding.save()]);
    }

    // Show balance comparison
    try {
      const comparison = await getGasComparison();
      console.log("\n[Balance Comparison]");
      console.log(
        "         Current Balance:",
        comparison.currentBalance,
        "ETH",
      );
      console.log("Session Spent:", comparison.totalGasSpent, "ETH");
      console.log(
        "Total Transactions:",
        comparison.totalTransactions,
        IDBTransaction,
      );
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
