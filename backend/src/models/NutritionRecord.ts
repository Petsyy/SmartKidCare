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
      default: undefined,
    },
    recordedBy: {
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
      enum: ["Normal", "Underweight", "Severely Underweight", "Overweight", "Obese"],
      required: true,
    },
    ageInMonths: { type: Number, required: true, min: 0 },
    sex: { type: String, enum: ["male", "female"], required: true },
    measurementDate: { type: Date, required: true },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

NutritionRecordSchema.index({ childId: 1, measurementDate: 1 }, { unique: true });
NutritionRecordSchema.index({
  daycareCenter: 1,
  childId: 1,
  measurementDate: -1,
});

export default mongoose.model("NutritionRecord", NutritionRecordSchema);
