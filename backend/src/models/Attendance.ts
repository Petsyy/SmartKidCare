import mongoose from "mongoose";

const AttendanceRecordSchema = new mongoose.Schema({
  child: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Child",
    required: true,
  },
  status: {
    type: String,
    enum: ["present", "absent", "excused"],
    required: true,
  },
  excuseReason: {
    type: String,
    enum: ["sick", "medical_appointment", "family_emergency", "other"],
  },
  notes: { type: String, trim: true, maxlength: 250 },
});

const AttendanceSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    daycareCenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChildDevelopmentCenter",
      default: null,
      index: true,
    },
    clientOperationId: {
      type: String,
      trim: true,
    },
    payloadHash: {
      type: String,
      trim: true,
    },
    version: { type: Number, default: 0, min: 0 },
    records: [AttendanceRecordSchema],
  },
  { timestamps: true }
);

AttendanceSchema.index({ date: 1, teacher: 1 }, { unique: true });
AttendanceSchema.index(
  { clientOperationId: 1 },
  {
    unique: true,
    partialFilterExpression: { clientOperationId: { $type: "string" } },
  },
);
AttendanceSchema.index({ daycareCenter: 1, date: -1, teacher: 1 });

export default mongoose.model("Attendance", AttendanceSchema);
