import mongoose, { type Document, Schema } from "mongoose";

export type AdminNotificationCategory = "operational" | "security";

export type AdminNotificationEventType =
  | "child_enrolled"
  | "attendance_absence"
  | "feeding_missed"
  | "credential_delivery_failed"
  | "captain_password_changed"
  | "captain_mfa_enabled"
  | "captain_mfa_disabled"
  | "captain_login_email_changed"
  | "captain_username_changed"
  | "captain_invitation_delivery_failed"
  | "captain_account_activated";

export interface IAdminNotification extends Document {
  recipientId: mongoose.Types.ObjectId;
  daycareCenterId?: mongoose.Types.ObjectId | null;
  category: AdminNotificationCategory;
  eventType: AdminNotificationEventType;
  title: string;
  message: string;
  actionPath: string;
  actionLabel: string;
  sourceId: string;
  deduplicationKey: string;
  readAt?: Date | null;
  archivedAt?: Date | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ADMIN_NOTIFICATION_EVENT_TYPES: AdminNotificationEventType[] = [
  "child_enrolled",
  "attendance_absence",
  "feeding_missed",
  "credential_delivery_failed",
  "captain_password_changed",
  "captain_mfa_enabled",
  "captain_mfa_disabled",
  "captain_login_email_changed",
  "captain_username_changed",
  "captain_invitation_delivery_failed",
  "captain_account_activated",
];

const AdminNotificationSchema = new Schema<IAdminNotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    daycareCenterId: {
      type: Schema.Types.ObjectId,
      ref: "ChildDevelopmentCenter",
      default: null,
    },
    category: {
      type: String,
      enum: ["operational", "security"],
      required: true,
    },
    eventType: {
      type: String,
      enum: ADMIN_NOTIFICATION_EVENT_TYPES,
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    actionPath: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
      validate: {
        validator: (value: string) => /^\/monitoring\/(dashboard|users|records|feeding|reports(?:\/.*)?|settings)(?:\?.*)?$/.test(value),
        message: "Notification action path must be an internal admin route.",
      },
    },
    actionLabel: { type: String, required: true, trim: true, maxlength: 80 },
    sourceId: { type: String, required: true, trim: true, maxlength: 200 },
    deduplicationKey: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    readAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

AdminNotificationSchema.index(
  { recipientId: 1, deduplicationKey: 1 },
  { unique: true, name: "admin_notification_deduplication" },
);
AdminNotificationSchema.index({
  recipientId: 1,
  archivedAt: 1,
  createdAt: -1,
  _id: -1,
});
AdminNotificationSchema.index({
  recipientId: 1,
  archivedAt: 1,
  readAt: 1,
  expiresAt: 1,
});
AdminNotificationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: "admin_notification_expiration" },
);

export default mongoose.model<IAdminNotification>(
  "AdminNotification",
  AdminNotificationSchema,
);
