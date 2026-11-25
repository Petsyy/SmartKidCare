import mongoose from "mongoose";

const BlockchainWorkerLockSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    ownerId: { type: String, required: true },
    leaseUntil: { type: Date, required: true, index: true },
  },
  { timestamps: true },
);

export default mongoose.model(
  "BlockchainWorkerLock",
  BlockchainWorkerLockSchema,
);
