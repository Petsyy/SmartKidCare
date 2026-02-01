import mongoose, { Schema, Document } from "mongoose";

export interface IAdmin extends Document {
  username: string;
  email: string;
  password: string;
  role: "admin";
}

const AdminSchema: Schema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin"],
      default: "admin",
    },
  },
  { timestamps: true, collection: "admins" }
);

export default mongoose.model<IAdmin>("Admin", AdminSchema);
