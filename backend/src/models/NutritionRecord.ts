import mongoose from "mongoose";

const NutritionRecordSchema = new mongoose.Schema(
  {
    childId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Child",
      required: true,
      index: true,
    },
    schoolYear: { type: String, required: true },
    period: {
      type: String,
      enum: ["initial", "final"],
      required: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "submitted"],
      required: true,
    },
    weight: { type: Number, required: true },
    height: { type: Number, required: true },
    bmi: { type: Number, required: true },
    nutritionalStatus: {
      type: String,
      enum: ["Normal", "Underweight", "Severely Underweight", "Overweight"],
      required: true,
    },
    measurementDate: { type: Date, required: true },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// A child can only have one nutrition record per period per school year
NutritionRecordSchema.index({ childId: 1, schoolYear: 1, period: 1 }, { unique: true });

export default mongoose.model("NutritionRecord", NutritionRecordSchema);
