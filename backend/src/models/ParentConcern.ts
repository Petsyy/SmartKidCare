import mongoose, { type Document } from "mongoose";

export const CONCERN_CATEGORIES = [
  "child_safety",
  "attendance",
  "feeding_nutrition",
  "child_records",
  "daycare_service",
  "feedback_suggestion",
  "other",
] as const;

export const CONCERN_STATUSES = [
  "new",
  "acknowledged",
  "in_progress",
  "resolved",
  "closed",
] as const;

export type ConcernCategory = (typeof CONCERN_CATEGORIES)[number];
export type ConcernStatus = (typeof CONCERN_STATUSES)[number];
export type ConcernActorRole = "parent" | "barangay_captain";

export interface IConcernMessage {
  _id?: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  senderRole: ConcernActorRole;
  body: string;
  createdAt: Date;
}

export interface IConcernStatusHistory {
  _id?: mongoose.Types.ObjectId;
  previousStatus: ConcernStatus | null;
  newStatus: ConcernStatus;
  changedBy: mongoose.Types.ObjectId;
  changedByRole: ConcernActorRole;
  note?: string;
  changedAt: Date;
}

export interface IParentConcern extends Document {
  parent: mongoose.Types.ObjectId;
  child: mongoose.Types.ObjectId;
  daycareCenter: mongoose.Types.ObjectId;
  category: ConcernCategory;
  subject: string;
  status: ConcernStatus;
  messages: IConcernMessage[];
  statusHistory: IConcernStatusHistory[];
  lastActivityAt: Date;
  acknowledgedAt?: Date | null;
  resolvedAt?: Date | null;
  closedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ConcernMessageSchema = new mongoose.Schema<IConcernMessage>(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["parent", "barangay_captain"],
      required: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 2000,
    },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  { _id: true },
);

const ConcernStatusHistorySchema = new mongoose.Schema<IConcernStatusHistory>(
  {
    previousStatus: {
      type: String,
      enum: [...CONCERN_STATUSES, null],
      default: null,
    },
    newStatus: { type: String, enum: CONCERN_STATUSES, required: true },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    changedByRole: {
      type: String,
      enum: ["parent", "barangay_captain"],
      required: true,
    },
    note: { type: String, trim: true, maxlength: 1000, default: undefined },
    changedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: true },
);

const ParentConcernSchema = new mongoose.Schema<IParentConcern>(
  {
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Child",
      required: true,
    },
    daycareCenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChildDevelopmentCenter",
      required: true,
    },
    category: { type: String, enum: CONCERN_CATEGORIES, required: true },
    subject: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 120,
    },
    status: {
      type: String,
      enum: CONCERN_STATUSES,
      default: "new",
      required: true,
    },
    messages: { type: [ConcernMessageSchema], default: [] },
    statusHistory: { type: [ConcernStatusHistorySchema], default: [] },
    lastActivityAt: { type: Date, required: true, default: Date.now },
    acknowledgedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

ParentConcernSchema.index({ parent: 1, lastActivityAt: -1 });
ParentConcernSchema.index({ daycareCenter: 1, status: 1, lastActivityAt: -1 });
ParentConcernSchema.index({
  daycareCenter: 1,
  category: 1,
  lastActivityAt: -1,
});

export default mongoose.model<IParentConcern>(
  "ParentConcern",
  ParentConcernSchema,
);
