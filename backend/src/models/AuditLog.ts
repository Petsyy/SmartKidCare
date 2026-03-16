import mongoose, { Schema, Document } from "mongoose";

export interface IAuditLog extends Document {
  actorId?: mongoose.Types.ObjectId;
  actorRole?: "admin" | "teacher" | "parent" | "unknown";
  method: string;
  path: string;
  action: string;
  description?: string;
  statusCode: number;
  success: boolean;
  resourceType?:
    | "user"
    | "child"
    | "document"
    | "attendance"
    | "feeding"
    | "blockchain";
  resourceId?: string;
  ip?: string;
  userAgent?: string;
  durationMs: number;
  errorMessage?: string;
  request: {
    params: Record<string, unknown>;
    query: Record<string, unknown>;
    body: Record<string, unknown>;
  };
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    actorRole: {
      type: String,
      enum: ["admin", "teacher", "parent", "unknown"],
      default: "unknown",
      index: true,
    },
    method: { type: String, required: true, index: true },
    path: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    description: { type: String, default: null },
    statusCode: { type: Number, required: true, index: true },
    success: { type: Boolean, required: true, index: true },
    resourceType: {
      type: String,
      enum: [
        "user",
        "child",
        "document",
        "attendance",
        "feeding",
        "blockchain",
      ],
      default: null,
      index: true,
    },
    resourceId: { type: String, default: null, index: true },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
    durationMs: { type: Number, required: true },
    errorMessage: { type: String, default: null },
    request: {
      params: { type: Schema.Types.Mixed, default: {} },
      query: { type: Schema.Types.Mixed, default: {} },
      body: { type: Schema.Types.Mixed, default: {} },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "audit_logs",
  },
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ actorId: 1, createdAt: -1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

const ttlDays = Number(process.env.AUDIT_LOG_TTL_DAYS ?? 0);
if (Number.isFinite(ttlDays) && ttlDays > 0) {
  AuditLogSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: Math.floor(ttlDays * 24 * 60 * 60) },
  );
}

export default mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
