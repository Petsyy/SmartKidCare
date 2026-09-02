import mongoose from "mongoose";

const FeedingRecordSchema = new mongoose.Schema({
  child: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Child",
    required: true,
  },
  status: {
    type: String,
    enum: ["completed", "missed"],
    required: true,
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500,
    default: "",
  },
});

const FeedingSchema = new mongoose.Schema(
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
    foodServed: {
      type: String,
      required: true,
    },
    records: [FeedingRecordSchema],
  },
  { timestamps: true }
);

// Ensure one feeding record per teacher per day
FeedingSchema.index({ date: 1, teacher: 1 }, { unique: true });
FeedingSchema.index({ daycareCenter: 1, date: -1, teacher: 1 });

export default mongoose.model("Feeding", FeedingSchema);
