import mongoose, { type Document, Schema } from "mongoose";

export type ParentNotificationEventType =
  | "pickup_reminder"
  | "competency_practice";

export interface IParentNotification extends Document {
  recipient: mongoose.Types.ObjectId;
  child: mongoose.Types.ObjectId;
  evaluation?: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  daycareCenter: mongoose.Types.ObjectId;
  eventType: ParentNotificationEventType;
  title: string;
  message: string;
  cooldownKey: string;
  createdAt: Date;
  updatedAt: Date;
}

const ParentNotificationSchema = new Schema<IParentNotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    child: { type: Schema.Types.ObjectId, ref: "Child", required: true },
    evaluation: {
      type: Schema.Types.ObjectId,
      ref: "CompetencyEvaluation",
      required: false,
    },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    daycareCenter: {
      type: Schema.Types.ObjectId,
      ref: "ChildDevelopmentCenter",
      required: true,
    },
    eventType: {
      type: String,
      enum: ["pickup_reminder", "competency_practice"],
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    cooldownKey: { type: String, required: true, trim: true, maxlength: 200 },
  },
  { timestamps: true },
);

ParentNotificationSchema.index({ recipient: 1, createdAt: -1 });
ParentNotificationSchema.index({ child: 1, eventType: 1, createdAt: -1 });
ParentNotificationSchema.index(
  { cooldownKey: 1 },
  { unique: true, name: "parent_notification_cooldown" },
);

export default mongoose.model<IParentNotification>(
  "ParentNotification",
  ParentNotificationSchema,
);
