import mongoose from "mongoose";

export type PickupActorType = "parent" | "guardian";
export type PickupVerificationMethod = "pickup_code" | "manual_override";

export interface IPickedUpBy {
  type: PickupActorType;
  userId?: mongoose.Types.ObjectId | null;
  guardianIndex?: number | null;
  name: string;
  phone: string;
  relationship: string;
}

export interface IPickupRecord {
  child: mongoose.Types.ObjectId;
  daycareCenter?: mongoose.Types.ObjectId;
  pickedUpBy: IPickedUpBy;
  verificationMethod: PickupVerificationMethod;
  verifiedByTeacher: mongoose.Types.ObjectId;
  pickupCode?: string | null;
  pickedUpAt: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const PickupRecordSchema = new mongoose.Schema<IPickupRecord>(
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

export default mongoose.model<IPickupRecord>("PickupRecord", PickupRecordSchema);
