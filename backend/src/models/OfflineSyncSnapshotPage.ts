import mongoose from "mongoose";

const OfflineSyncSnapshotPageSchema = new mongoose.Schema(
  {
    snapshot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OfflineSyncSnapshot",
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resource: { type: String, required: true },
    pageIndex: { type: Number, required: true, min: 0 },
    items: { type: [mongoose.Schema.Types.Mixed], required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

OfflineSyncSnapshotPageSchema.index(
  { snapshot: 1, resource: 1, pageIndex: 1 },
  { unique: true },
);
OfflineSyncSnapshotPageSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 },
);

export default mongoose.model(
  "OfflineSyncSnapshotPage",
  OfflineSyncSnapshotPageSchema,
);
