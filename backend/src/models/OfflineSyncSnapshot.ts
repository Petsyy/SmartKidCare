import mongoose from "mongoose";

const ResourceManifestSchema = new mongoose.Schema(
  {
    resource: { type: String, required: true },
    required: { type: Boolean, required: true, default: true },
    itemCount: { type: Number, required: true, min: 0 },
    pageCount: { type: Number, required: true, min: 0 },
    checksum: { type: String, required: true },
  },
  { _id: false },
);

const OfflineSyncSnapshotSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: { type: String, enum: ["teacher", "parent"], required: true },
    resources: { type: [ResourceManifestSchema], required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

OfflineSyncSnapshotSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("OfflineSyncSnapshot", OfflineSyncSnapshotSchema);
