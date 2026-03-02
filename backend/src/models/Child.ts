import mongoose from "mongoose";

const ChildSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    middleName: { type: String },
    lastName: { type: String, required: true },

    dateOfBirth: { type: Date, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ["male", "female"], required: true },

    enrollmentDate: { type: Date, required: true },
    schoolYear: { type: String, required: true },
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

    documents: {
      birthCertificate: {
        publicId: String,
        resourceType: String,
        format: String,
      },
      parentId: {
        publicId: String,
        resourceType: String,
        format: String,
      },
    },
  },
  { timestamps: true },
);

export default mongoose.model("Child", ChildSchema);
