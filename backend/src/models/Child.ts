import mongoose from "mongoose";

const ChildSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    middleName: { type: String },
    lastName: { type: String, required: true },

    dateOfBirth: { type: Date, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ["male", "female"], required: true },
    homeAddress: { type: String, required: true, trim: true, maxlength: 300 },
    parentRelationship: {
      type: String,
      enum: ["Mother", "Father", "Guardian", "Grandparent", "Other"],
      required: true,
    },
    programType: {
      type: String,
      enum: ["4Ps Beneficiary", "Regular Enrollee (Non-beneficiary)"],
      required: true,
      trim: true,
    },

    enrollmentDate: { type: Date, required: true },
    schoolYear: { type: String, required: true },
    weight: { type: Number, default: null },
    height: { type: Number, default: null },
    bmi: { type: Number, default: null },
    nutritionalStatus: {
      type: String,
      enum: ["Normal", "Underweight", "Severely Underweight", "Overweight", null],
      default: null,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    studentId: { type: String, unique: true },

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    daycareCenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChildDevelopmentCenter",
      default: null,
    },

    documents: {
      birthCertificate: {
        publicId: String,
        resourceType: String,
        format: String,
        hash: String,
      },
      parentId: {
        publicId: String,
        resourceType: String,
        format: String,
        hash: String,
      },
    },
    documentIntegrity: {
      childIdHash: { type: String, default: null },
      documentsHash: { type: String, default: null },
      txHash: { type: String, default: null },
      blockNumber: { type: Number, default: null },
      blockchainVerified: { type: Boolean, default: false },
      anchoredAt: { type: Date, default: null },
    },
  },
  { timestamps: true },
);

export default mongoose.model("Child", ChildSchema);
