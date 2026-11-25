import mongoose from "mongoose";

export interface IPickupCode {
  child: mongoose.Types.ObjectId;
  parent: mongoose.Types.ObjectId;
  intendedGuardianIndex?: number | null;
  codeHash: string;
  expiresAt: Date;
  used: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const PickupCodeSchema = new mongoose.Schema<IPickupCode>(
  {
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Child",
      required: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    intendedGuardianIndex: {
      type: Number,
      default: null,
    },
    codeHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    used: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

PickupCodeSchema.index({ child: 1, parent: 1, used: 1 });

export default mongoose.model<IPickupCode>("PickupCode", PickupCodeSchema);
