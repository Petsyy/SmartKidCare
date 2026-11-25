import mongoose, { Schema } from "mongoose";

export type SecurityAuditAction =
  | "CAPTAIN_INVITATION_CREATED"
  | "CAPTAIN_INVITATION_DELIVERY_FAILED"
  | "CAPTAIN_INVITATION_RESENT"
  | "CAPTAIN_INVITATION_REVOKED"
  | "CAPTAIN_ACCOUNT_ACTIVATED"
  | "CAPTAIN_ACCOUNT_DEACTIVATED";

const SecurityAuditLogSchema = new Schema(
  {
    action: { type: String, required: true },
    actor: { type: Schema.Types.ObjectId, ref: "User", default: null },
    targetUser: { type: Schema.Types.ObjectId, ref: "User", required: true },
    daycareCenter: {
      type: Schema.Types.ObjectId,
      ref: "ChildDevelopmentCenter",
      default: null,
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

SecurityAuditLogSchema.index({ targetUser: 1, createdAt: -1 });
SecurityAuditLogSchema.index({ action: 1, createdAt: -1 });

export default mongoose.model("SecurityAuditLog", SecurityAuditLogSchema);
