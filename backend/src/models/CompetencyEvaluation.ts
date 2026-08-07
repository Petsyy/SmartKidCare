import mongoose from "mongoose";

const CompetencyEntrySchema = new mongoose.Schema(
  {
    competency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompetencyDefinition",
      required: true,
    },
    level: {
      type: String,
      enum: ["not_demonstrated", "emerging", "developing", "achieved"],
      required: true,
    },
    remarks: { type: String, default: "", trim: true, maxlength: 500 },
  },
  { _id: false },
);

const CompetencyEvaluationSchema = new mongoose.Schema(
  {
    child: { type: mongoose.Schema.Types.ObjectId, ref: "Child", required: true, index: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    daycareCenter: { type: mongoose.Schema.Types.ObjectId, ref: "ChildDevelopmentCenter", default: null },
    evaluationDate: { type: Date, required: true },
    schoolYear: { type: String, required: true, trim: true },
    period: { type: String, enum: ["initial", "midyear", "final"], default: "initial" },
    status: { type: String, enum: ["draft", "submitted"], default: "submitted" },
    entries: { type: [CompetencyEntrySchema], required: true },
    generalNotes: { type: String, default: "", trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);

CompetencyEvaluationSchema.index({ child: 1, evaluationDate: -1 });
CompetencyEvaluationSchema.index({ teacher: 1, evaluationDate: -1 });
CompetencyEvaluationSchema.index({ daycareCenter: 1, evaluationDate: -1 });
CompetencyEvaluationSchema.index(
  { child: 1, schoolYear: 1, period: 1 },
  { unique: true, partialFilterExpression: { status: "submitted" } },
);

export default mongoose.model("CompetencyEvaluation", CompetencyEvaluationSchema);
