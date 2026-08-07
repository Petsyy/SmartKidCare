import mongoose from "mongoose";

const EnrollmentRequestDocumentSchema = new mongoose.Schema(
  {
    publicId: { type: String, default: undefined },
    resourceType: { type: String, default: undefined },
    format: { type: String, default: undefined },
    hash: { type: String, default: undefined },
  },
  { _id: false },
);

const EnrollmentRequestChildSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    middleName: { type: String, default: undefined, trim: true },
    lastName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ["male", "female"], required: true },
    homeAddress: { type: String, required: true, trim: true, maxlength: 300 },
    programType: {
      type: String,
      enum: ["4Ps Beneficiary", "Regular Enrollee (Non-beneficiary)"],
      required: true,
      trim: true,
    },
    enrollmentDate: { type: Date, required: true },
    schoolYear: { type: String, required: true, trim: true },
    weight: { type: Number, default: null },
    height: { type: Number, default: null },
    bmi: { type: Number, default: null },
    nutritionalStatus: {
      type: String,
      enum: ["Normal", "Underweight", "Severely Underweight", "Overweight", null],
      default: null,
    },
  },
  { _id: false },
);

const EnrollmentRequestParentSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    middleName: { type: String, default: undefined, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    relationship: {
      type: String,
      enum: ["Mother", "Father", "Guardian", "Grandparent", "Other"],
      required: true,
    },
  },
  { _id: false },
);

const ChildEnrollmentRequestSchema = new mongoose.Schema(
  {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    child: {
      type: EnrollmentRequestChildSchema,
      required: true,
    },
    daycareCenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChildDevelopmentCenter",
      default: null,
    },
    parent: {
      type: EnrollmentRequestParentSchema,
      required: true,
    },
    documents: {
      birthCertificate: {
        type: EnrollmentRequestDocumentSchema,
        default: undefined,
      },
      parentId: {
        type: EnrollmentRequestDocumentSchema,
        default: undefined,
      },
    },
    review: {
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      reviewedAt: {
        type: Date,
        default: null,
      },
      reason: {
        type: String,
        default: "",
      },
    },
    createdChild: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Child",
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "child_enrollment_requests",
  },
);

ChildEnrollmentRequestSchema.index({ status: 1, createdAt: -1 });
ChildEnrollmentRequestSchema.index({
  "child.firstName": 1,
  "child.lastName": 1,
  "child.dateOfBirth": 1,
});

export default mongoose.model(
  "ChildEnrollmentRequest",
  ChildEnrollmentRequestSchema,
);
