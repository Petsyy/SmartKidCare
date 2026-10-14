import mongoose from "mongoose";
import Child from "../../../models/Child";
import BlockchainWorkerLock from "../../../models/BlockchainWorkerLock";
import type {
  BlockchainAnchorStatus,
  BlockchainErrorCode,
  ClaimedBlockchainChild,
} from "../types/blockchain-proof.types";

const WRITER_LOCK_ID = "sepolia-documents-registry-writer";

export class BlockchainRepository {
  async initializePending(childId: string): Promise<void> {
    await Child.updateOne(
      { _id: childId },
      {
        $set: {
          "documentIntegrity.status": "pending",
          "documentIntegrity.attemptCount": 0,
          "documentIntegrity.nextAttemptAt": new Date(),
          "documentIntegrity.lastAttemptAt": null,
          "documentIntegrity.leaseUntil": null,
          "documentIntegrity.lastErrorCode": null,
          "documentIntegrity.blockchainVerified": false,
        },
      },
    );
  }

  async claimNext(now: Date, leaseUntil: Date): Promise<ClaimedBlockchainChild | null> {
    return Child.findOneAndUpdate(
      {
        $or: [
          {
            "documentIntegrity.status": "pending",
            $or: [
              { "documentIntegrity.nextAttemptAt": null },
              { "documentIntegrity.nextAttemptAt": { $lte: now } },
            ],
          },
          {
            "documentIntegrity.status": "processing",
            "documentIntegrity.leaseUntil": { $lte: now },
          },
        ],
      },
      {
        $set: {
          "documentIntegrity.status": "processing",
          "documentIntegrity.lastAttemptAt": now,
          "documentIntegrity.leaseUntil": leaseUntil,
          "documentIntegrity.lastErrorCode": null,
        },
        $inc: { "documentIntegrity.attemptCount": 1 },
      },
      { new: true },
    )
      .select("documents documentIntegrity")
      .lean<ClaimedBlockchainChild>();
  }

  async markBroadcast(childId: string, txHash: string): Promise<void> {
    await Child.updateOne(
      { _id: childId },
      { $set: { "documentIntegrity.txHash": txHash } },
    );
  }

  async markConfirmed(
    childId: string,
    data: {
      childIdHash: string;
      documentsHash: string;
      txHash?: string | null;
      blockNumber?: number | null;
      chainId: number;
      contractAddress: string;
      anchoredAt: Date;
    },
  ): Promise<void> {
    await Child.updateOne(
      { _id: childId },
      {
        $set: {
          "documentIntegrity.status": "confirmed",
          "documentIntegrity.childIdHash": data.childIdHash,
          "documentIntegrity.documentsHash": data.documentsHash,
          "documentIntegrity.txHash": data.txHash ?? null,
          "documentIntegrity.blockNumber": data.blockNumber ?? null,
          "documentIntegrity.chainId": data.chainId,
          "documentIntegrity.contractAddress": data.contractAddress,
          "documentIntegrity.blockchainVerified": true,
          "documentIntegrity.anchoredAt": data.anchoredAt,
          "documentIntegrity.nextAttemptAt": null,
          "documentIntegrity.leaseUntil": null,
          "documentIntegrity.lastErrorCode": null,
        },
      },
    );
  }

  async markRetry(
    childId: string,
    errorCode: BlockchainErrorCode,
    nextAttemptAt: Date,
  ): Promise<void> {
    await Child.updateOne(
      { _id: childId },
      {
        $set: {
          "documentIntegrity.status": "pending",
          "documentIntegrity.nextAttemptAt": nextAttemptAt,
          "documentIntegrity.leaseUntil": null,
          "documentIntegrity.lastErrorCode": errorCode,
          "documentIntegrity.blockchainVerified": false,
        },
      },
    );
  }

  async markFailed(childId: string, errorCode: BlockchainErrorCode): Promise<void> {
    await Child.updateOne(
      { _id: childId },
      {
        $set: {
          "documentIntegrity.status": "failed",
          "documentIntegrity.nextAttemptAt": null,
          "documentIntegrity.leaseUntil": null,
          "documentIntegrity.lastErrorCode": errorCode,
          "documentIntegrity.blockchainVerified": false,
        },
      },
    );
  }

  async findForProof(childId: string): Promise<Record<string, unknown> | null> {
    return Child.findById(childId)
      .populate("parent", "_id")
      .populate("teacher", "_id")
      .select("documents documentIntegrity parent teacher daycareCenter")
      .lean();
  }

  async acquireWriterLock(ownerId: string, now: Date, leaseUntil: Date): Promise<boolean> {
    try {
      const lock = await BlockchainWorkerLock.findOneAndUpdate(
        {
          _id: WRITER_LOCK_ID,
          $or: [{ leaseUntil: { $lte: now } }, { ownerId }],
        },
        { $set: { ownerId, leaseUntil } },
        { new: true, upsert: true },
      ).lean();
      return lock?.ownerId === ownerId;
    } catch (error: unknown) {
      if ((error as { code?: number })?.code === 11000) return false;
      throw error;
    }
  }

  async releaseWriterLock(ownerId: string): Promise<void> {
    await BlockchainWorkerLock.deleteOne({ _id: WRITER_LOCK_ID, ownerId });
  }

  async listBackfillCandidates(): Promise<Array<Record<string, unknown>>> {
    return Child.find({
      $or: [
        { "documents.birthCertificate.publicId": { $exists: true, $ne: null } },
        { "documents.parentId.publicId": { $exists: true, $ne: null } },
      ],
      "documentIntegrity.status": { $ne: "confirmed" },
    })
      .select("documents documentIntegrity")
      .sort({ _id: 1 })
      .lean();
  }

  async setBackfillPending(childIds: string[]): Promise<number> {
    if (!childIds.length) return 0;
    const result = await Child.updateMany(
      { _id: { $in: childIds.map((id) => new mongoose.Types.ObjectId(id)) } },
      {
        $set: {
          "documentIntegrity.status": "pending" as BlockchainAnchorStatus,
          "documentIntegrity.attemptCount": 0,
          "documentIntegrity.nextAttemptAt": new Date(),
          "documentIntegrity.leaseUntil": null,
          "documentIntegrity.lastErrorCode": null,
          "documentIntegrity.blockchainVerified": false,
        },
      },
    );
    return result.modifiedCount;
  }
}

export const blockchainRepository = new BlockchainRepository();
