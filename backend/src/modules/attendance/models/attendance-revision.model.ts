import mongoose from "mongoose";
import type { AttendanceStatus } from "./attendance.model";

export interface IAttendanceRevisionChange {
  child: mongoose.Types.ObjectId;
  beforeStatus: AttendanceStatus;
  afterStatus: AttendanceStatus;
  beforeExcuseReason?: string | null;
  afterExcuseReason?: string | null;
  beforeNotes?: string | null;
  afterNotes?: string | null;
}

export interface IAttendanceRevision {
  attendance: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  daycareCenter: mongoose.Types.ObjectId;
  revision: number;
  clientOperationId: string;
  payloadHash: string;
  changes: IAttendanceRevisionChange[];
  createdAt?: Date;
  updatedAt?: Date;
}

const AttendanceRevisionChangeSchema = new mongoose.Schema(
    {
      child: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Child",
        required: true,
      },
      beforeStatus: {
        type: String,
        enum: ["present", "absent", "excused"],
        required: true,
      },
      afterStatus: {
        type: String,
        enum: ["present", "absent", "excused"],
        required: true,
      },
      beforeExcuseReason: { type: String, default: null },
      afterExcuseReason: { type: String, default: null },
      beforeNotes: { type: String, default: null },
      afterNotes: { type: String, default: null },
    },
    { _id: false },
  );

const AttendanceRevisionSchema = new mongoose.Schema(
  {
    attendance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attendance",
      required: true,
      index: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    daycareCenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChildDevelopmentCenter",
      required: true,
    },
    revision: { type: Number, required: true, min: 1 },
    clientOperationId: { type: String, required: true },
    payloadHash: { type: String, required: true },
    changes: {
      type: [AttendanceRevisionChangeSchema],
      required: true,
    },
  },
  { timestamps: true },
);

AttendanceRevisionSchema.index(
  { teacher: 1, clientOperationId: 1 },
  { unique: true },
);
AttendanceRevisionSchema.index(
  { attendance: 1, revision: 1 },
  { unique: true },
);

export default mongoose.model(
  "AttendanceRevision",
  AttendanceRevisionSchema,
);
