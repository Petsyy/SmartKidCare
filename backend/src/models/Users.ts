import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username?: string; // admin only
  employeeId?: string; // teacher only
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  password: string;
  role: "admin" | "teacher" | "parent";
  isActive: boolean;
  mustChangePassword: boolean;
  needsToConfirmLink: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    // admin only
    username: {
      type: String,
      unique: true,
      sparse: true,
    },

    // teacher only
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
    },

    firstName: { type: String, required: true },
    middleName: { type: String },
    lastName: { type: String, required: true },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "teacher", "parent"],
      required: true,
    },

    isActive: { type: Boolean, default: true },

    mustChangePassword: {
      type: Boolean,
      default: false,
    },

    needsToConfirmLink: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "users",
  },
);

export default mongoose.model<IUser>("User", UserSchema);
