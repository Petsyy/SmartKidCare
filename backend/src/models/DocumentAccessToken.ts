import mongoose from "mongoose";

export interface IDocumentAccessToken extends mongoose.Document {
  token: string;
  childId: mongoose.Types.ObjectId;
  documentType: "birthCertificate" | "parentId";
  publicId: string;
  resourceType: string;
  format: string;
  userId: mongoose.Types.ObjectId;
  expiresAt: Date;
  usedAt?: Date;
  used: boolean;
}

const DocumentAccessTokenSchema = new mongoose.Schema<IDocumentAccessToken>(
  {
    token: { type: String, required: true, unique: true, index: true },
    childId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Child",
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      enum: ["birthCertificate", "parentId"],
      required: true,
    },
    publicId: { type: String, required: true },
    resourceType: { type: String, required: true },
    format: { type: String, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date },
    used: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Auto-delete expired tokens
DocumentAccessTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 },
);

export default mongoose.model<IDocumentAccessToken>(
  "DocumentAccessToken",
  DocumentAccessTokenSchema,
);
