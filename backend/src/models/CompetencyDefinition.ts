import mongoose from "mongoose";

const CompetencyDefinitionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", trim: true, maxlength: 300 },
    category: {
      type: String,
      enum: ["Fine Motor", "Creative Expression"],
      required: true,
    },
    displayOrder: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

CompetencyDefinitionSchema.index({ category: 1, displayOrder: 1 });

export default mongoose.model("CompetencyDefinition", CompetencyDefinitionSchema);
