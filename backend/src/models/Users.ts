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
  daycareCenter?: mongoose.Types.ObjectId | null;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  password: string;
  role: "barangay_captain" | "teacher" | "parent";
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
  latestTempPassword?: string;
  latestTempPasswordIssuedAt?: Date;
  captainOnboardingStatus?: "invitation_pending" | "active" | "inactive";
  captainInvitationTokenHash?: string;
  captainInvitationExpiresAt?: Date;
  captainInvitationSentAt?: Date;
  captainInvitationActivatedAt?: Date;
  captainInvitedBy?: mongoose.Types.ObjectId;
  captainReplaces?: mongoose.Types.ObjectId;
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

    daycareCenter: {
      type: Schema.Types.ObjectId,
      ref: "ChildDevelopmentCenter",
      default: null,
    },

    firstName: { type: String, required: true },
    middleName: { type: String },
    lastName: { type: String, required: true },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    phone: { type: String, required: true, trim: true },

    adminMfaEnabled: {
      type: Boolean,
      default: function (this: { role?: string }): boolean {
        return this.role === "barangay_captain";
      },
    },

    adminNotifySecurityEvents: {
      type: Boolean,
      default: function (this: { role?: string }): boolean {
        return this.role === "barangay_captain";
      },
    },

    adminNotifySystemUpdates: {
      type: Boolean,
      default: function (this: { role?: string }): boolean {
        return this.role === "barangay_captain";
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
      enum: ["barangay_captain", "teacher", "parent"],
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

    latestTempPassword: {
      type: String,
      default: undefined,
    },

    latestTempPasswordIssuedAt: {
      type: Date,
      default: undefined,
    },
    captainOnboardingStatus: {
      type: String,
      enum: ["invitation_pending", "active", "inactive"],
      default: undefined,
    },
    captainInvitationTokenHash: {
      type: String,
      select: false,
      default: undefined,
    },
    captainInvitationExpiresAt: { type: Date, default: undefined },
    captainInvitationSentAt: { type: Date, default: undefined },
    captainInvitationActivatedAt: { type: Date, default: undefined },
    captainInvitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
    },
    captainReplaces: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
    },
  },
  {
    timestamps: true,
    collection: "users",
  },
);

UserSchema.index(
  { daycareCenter: 1 },
  {
    unique: true,
    partialFilterExpression: {
      role: "barangay_captain",
      isActive: true,
    },
    name: "one_active_captain_per_center",
  },
);

export default mongoose.model<IUser>("User", UserSchema);
