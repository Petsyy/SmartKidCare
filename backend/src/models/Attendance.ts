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
    daycareCenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChildDevelopmentCenter",
      default: null,
      index: true,
    },
    records: [AttendanceRecordSchema],
  },
  { timestamps: true }
);

AttendanceSchema.index({ date: 1, teacher: 1 }, { unique: true });
AttendanceSchema.index({ daycareCenter: 1, date: -1, teacher: 1 });

export default mongoose.model("Attendance", AttendanceSchema);
