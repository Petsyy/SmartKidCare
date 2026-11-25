import mongoose from "mongoose";

const SystemSettingsSchema = new mongoose.Schema(
  {
    schoolName: {
      type: String,
      required: true,
      default: "Smart KidCare",
    },
    address: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("SystemSettings", SystemSettingsSchema);
