import mongoose from "mongoose";

const AIChatRequestSchema = new mongoose.Schema(
  {
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    requestId: { type: String, required: true },
    requestHash: { type: String, required: true },
    originalContextId: { type: String, default: null },
    status: {
      type: String,
      enum: ["processing", "completed", "retryable"],
      required: true,
    },
    attemptNumber: { type: Number, required: true, default: 1, min: 1 },
    leaseToken: { type: String, required: true },
    leaseExpiresAt: { type: Date, required: true },
    committedGeneration: { type: Number, default: null },
    committedVersion: { type: Number, default: null },
    completedStatus: { type: Number, default: null },
    completedResponse: { type: mongoose.Schema.Types.Mixed, default: null },
    retentionExpiresAt: { type: Date, required: true },
  },
  { timestamps: true, versionKey: false },
);

AIChatRequestSchema.index(
  { parent: 1, requestId: 1 },
  { unique: true },
);
AIChatRequestSchema.index(
  { retentionExpiresAt: 1 },
  { expireAfterSeconds: 0 },
);

export default mongoose.model("AIChatRequest", AIChatRequestSchema);
