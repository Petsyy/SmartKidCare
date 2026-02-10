import mongoose from "mongoose";
import crypto from "crypto";

const FeedingRecordSchema = new mongoose.Schema({
  child: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Child",
    required: true,
  },
  status: {
    type: String,
    enum: ["completed", "missed"],
    required: true,
  },
  blockchainVerified: {
    type: Boolean,
    default: false,
  },
  integrityHash: {
    type: String,
    default: null,
  },
});

const FeedingSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    foodServed: {
      type: String,
      required: true,
    },
    records: [FeedingRecordSchema],
  },
  { timestamps: true }
);

// Ensure one feeding record per teacher per day
FeedingSchema.index({ date: 1, teacher: 1 }, { unique: true });

// Post-find middleware to check integrity
FeedingSchema.post("findOne", function(doc) {
  if (doc && doc.records) {
    doc.records.forEach((record: any) => {
      // If record is marked verified but has no integrityHash, force unverified
      if (record.blockchainVerified && !record.integrityHash) {
        record.blockchainVerified = false;
      }
      // Only check integrity for records that have an integrityHash (newly verified records)
      if (record.blockchainVerified && record.integrityHash) {
        // Always use string ObjectId for hash
        const childId = record.child && record.child._id ? record.child._id : record.child;
        const dataToHash = JSON.stringify({
          child: String(childId),
          status: record.status,
        });
        const calculatedHash = crypto
          .createHash("sha256")
          .update(dataToHash)
          .digest("hex");
        // If hash doesn't match, record was tampered with
        if (calculatedHash !== record.integrityHash) {
          record.blockchainVerified = false;
        }
      }
    });
  }
});

FeedingSchema.post("find", function(docs) {
  docs.forEach((doc: any) => {
    if (doc && doc.records) {
      doc.records.forEach((record: any) => {
        // If record is marked verified but has no integrityHash, force unverified
        if (record.blockchainVerified && !record.integrityHash) {
          record.blockchainVerified = false;
        }
        // Only check integrity for records that have an integrityHash (newly verified records)
        if (record.blockchainVerified && record.integrityHash) {
          // Always use string ObjectId for hash
          const childId = record.child && record.child._id ? record.child._id : record.child;
          const dataToHash = JSON.stringify({
            child: String(childId),
            status: record.status,
          });
          const calculatedHash = crypto
            .createHash("sha256")
            .update(dataToHash)
            .digest("hex");
          // If hash doesn't match, record was tampered with
          if (calculatedHash !== record.integrityHash) {
            record.blockchainVerified = false;
          }
        }
      });
    }
  });
});

export default mongoose.model("Feeding", FeedingSchema);
