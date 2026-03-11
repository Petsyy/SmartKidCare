import mongoose, { Schema, Document } from "mongoose";

export interface IUserPushToken {
  token: string;
  platform: "ios" | "android" | "web" | "unknown";
  deviceName?: string | null;
  appOwnership?: string | null;
  updatedAt: Date;
}

export interface IUser extends Document {
  username?: string; // admin only
  employeeId?: string; // teacher only
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  password: string;
  role: "admin" | "teacher" | "parent";
  phone?: string; // required for teacher/parent
  adminMfaEnabled?: boolean; // admin only
  adminNotifySecurityEvents?: boolean; // admin only
  adminNotifySystemUpdates?: boolean; // admin only
  pushToken?: string | null;
  pushTokens?: IUserPushToken[];
  isActive: boolean;
  mustChangePassword: boolean;
  needsToConfirmLink: boolean;
  passwordResetOtpHash?: string;
  passwordResetOtpExpiresAt?: Date;
  passwordResetOtpPurpose?: string;
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

    phone: {
      type: String,
      required: function (this: { role?: string }): boolean {
        return this.role !== "admin";
      },
      trim: true,
    },

    adminMfaEnabled: {
      type: Boolean,
      default: function (this: { role?: string }): boolean {
        return this.role === "admin"; 
      },
    },

    adminNotifySecurityEvents: {
      type: Boolean,
      default: function (this: { role?: string }): boolean {
        return this.role === "admin";
      },
    },

    adminNotifySystemUpdates: {
      type: Boolean,
      default: function (this: { role?: string }): boolean {
        return this.role === "admin";
      },
    },

    pushToken: {
      type: String,
      default: null,
    },

    pushTokens: [
      {
        token: {
          type: String,
          required: true,
          trim: true,
        },
        platform: {
          type: String,
          enum: ["ios", "android", "web", "unknown"],
          default: "unknown",
        },
        deviceName: {
          type: String,
          default: null,
        },
        appOwnership: {
          type: String,
          default: null,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

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

    passwordResetOtpHash: {
      type: String,
      default: undefined,
    },

    passwordResetOtpExpiresAt: {
      type: Date,
      default: undefined,
    },

    passwordResetOtpPurpose: {
      type: String,
      default: undefined,
    },
  },
  {
    timestamps: true,
    collection: "users",
  },
);

export default mongoose.model<IUser>("User", UserSchema);
