import mongoose from "mongoose";
import { getManilaMeasurementDateKey } from "../shared/utils/nutrition.utils";

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
      enum: ["initial", "quarterly", "final"],
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
      enum: [
        "Normal",
        "Underweight",
        "Severely Underweight",
        "Overweight",
        "Obese",
      ],
      required: true,
    },
    ageInMonths: { type: Number, required: true, min: 0 },
    sex: { type: String, enum: ["male", "female"], required: true },
    measurementDate: { type: Date, required: true },
    measurementDateKey: {
      type: String,
      match: /^\d{4}-\d{2}-\d{2}$/,
      default: undefined,
    },
    singletonPeriodKey: {
      type: String,
      enum: ["initial", "final"],
      default: undefined,
    },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

NutritionRecordSchema.index(
  { childId: 1, measurementDate: 1 },
  { unique: true },
);
NutritionRecordSchema.index(
  { childId: 1, schoolYear: 1, period: 1, measurementDateKey: 1 },
  {
    name: "unique_quarterly_nutrition_day",
    unique: true,
    partialFilterExpression: {
      period: "quarterly",
      measurementDateKey: { $type: "string" },
    },
  },
);
NutritionRecordSchema.index(
  { childId: 1, schoolYear: 1, singletonPeriodKey: 1 },
  {
    name: "unique_singleton_nutrition_period",
    unique: true,
    partialFilterExpression: { singletonPeriodKey: { $type: "string" } },
  },
);
NutritionRecordSchema.index({
  daycareCenter: 1,
  childId: 1,
  measurementDate: -1,
});

NutritionRecordSchema.pre("validate", function () {
  if (this.measurementDate) {
    this.measurementDateKey = getManilaMeasurementDateKey(this.measurementDate);
  }
  this.singletonPeriodKey =
    this.period === "initial" || this.period === "final"
      ? this.period
      : undefined;
});

export default mongoose.model("NutritionRecord", NutritionRecordSchema);
