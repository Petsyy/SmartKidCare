import mongoose from "mongoose";

const PickupRecordSchema = new mongoose.Schema(
  {
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Child",
      required: true,
      index: true,
    },
    daycareCenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChildDevelopmentCenter",
      index: true,
    },
    pickedUpBy: {
      type: {
        type: String,
        enum: ["parent", "guardian"],
        required: true,
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      guardianIndex: {
        type: Number,
        default: null,
      },
      name: { type: String, required: true },
      phone: { type: String, required: true },
      relationship: { type: String, required: true },
    },
    verificationMethod: {
      type: String,
      enum: ["pickup_code", "manual_override"],
      required: true,
    },
    verifiedByTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    pickupCode: {
      type: String,
      default: null,
    },
    pickedUpAt: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      default: "",
      maxlength: 500,
    },
  },
  { timestamps: true }
);

PickupRecordSchema.index({ child: 1, pickedUpAt: -1 });
PickupRecordSchema.index({ daycareCenter: 1, pickedUpAt: -1 });

export default mongoose.model("PickupRecord", PickupRecordSchema);
