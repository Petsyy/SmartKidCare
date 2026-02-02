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
      enum: ["Active", "Inactive", "On Leave"],
      default: "Active",
    },

    studentId: { type: String, unique: true },
    childLinkCode: { type: String, unique: true, sparse: true },

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Child", ChildSchema);
