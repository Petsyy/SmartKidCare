import mongoose, { Schema, Document } from "mongoose";

export interface IWorker extends Document {
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "admin" | "worker" | "parent";
  documents: string[];
  verificationStatus: "pending" | "approved" | "rejected";
}

const UserSchema: Schema = new Schema(
  {
    firstName: { type: String },
    lastName: { type: String },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "worker", "parent"],
      required: true,
    },
    documents: [{ type: String }],
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true, collection: "workers" }
);

export default mongoose.model<IWorker>("User", UserSchema);
