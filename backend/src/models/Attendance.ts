import mongoose from "mongoose";

const AttendanceRecordSchema = new mongoose.Schema({
  child: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Child",
    required: true,
  },
  status: {
    type: String,
    enum: ["present", "absent"],
    required: true,
  },
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
    records: [AttendanceRecordSchema],
  },
  { timestamps: true }
);

// Ensure one attendance record per teacher per day
AttendanceSchema.index({ date: 1, teacher: 1 }, { unique: true });

export default mongoose.model("Attendance", AttendanceSchema);
