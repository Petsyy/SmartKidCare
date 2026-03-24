import mongoose from "mongoose";

const ChildDevelopmentCenterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    barangay: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, unique: true },
    address: { type: String, default: "", trim: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: "child_development_centers",
  },
);

ChildDevelopmentCenterSchema.index({ barangay: 1, name: 1 });

export default mongoose.model(
  "ChildDevelopmentCenter",
  ChildDevelopmentCenterSchema,
);
