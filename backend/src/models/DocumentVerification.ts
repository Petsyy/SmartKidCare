import mongoose from "mongoose";

const DocumentVerificationSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    documentType: {
      type: String,
      enum: ["birthCertificate", "parentId"],
      required: true,
    },
    fileHash: { type: String, required: true },
    expectedFieldsHash: { type: String, required: true },
    status: {
      type: String,
      enum: ["verified", "teacher_confirmation_required", "rejected"],
      required: true,
    },
    detectedType: {
      type: String,
      enum: [
        "birth_certificate",
        "government_id",
        "other_document",
        "person_photo",
        "unrelated_image",
        "unknown",
      ],
      required: true,
    },
    confidence: { type: Number, default: null },
    reasonCodes: { type: [String], default: [] },
    fieldMatches: {
      childName: { type: Boolean, default: undefined },
      birthDate: { type: Boolean, default: undefined },
      parentName: { type: Boolean, default: undefined },
      parentFirstName: { type: Boolean, default: undefined },
      parentMiddleName: { type: Boolean, default: undefined },
      parentLastName: { type: Boolean, default: undefined },
    },
    teacherConfirmed: { type: Boolean, default: false },
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    confirmedAt: { type: Date, default: null },
    modelVersion: { type: String, required: true },
    policyVersion: { type: String, required: true },
    isTransientFailure: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
    consumedAt: { type: Date, default: null },
    consumedByEnrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Child",
      default: null,
    },
  },
  { timestamps: true },
);

DocumentVerificationSchema.index({
  teacherId: 1,
  documentType: 1,
  fileHash: 1,
  expectedFieldsHash: 1,
  policyVersion: 1,
  expiresAt: 1,
});
DocumentVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model(
  "DocumentVerification",
  DocumentVerificationSchema,
);
