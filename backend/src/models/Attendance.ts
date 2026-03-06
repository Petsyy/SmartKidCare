import mongoose from "mongoose";
import crypto from "crypto";

const AttendanceRecordSchema = new mongoose.Schema({
  child: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Child",
    required: true,
  },
  status: {
    type: String,
    enum: ["present", "absent"],
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

const AttendanceSchema = new mongoose.Schema(
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
    records: [AttendanceRecordSchema],

    // Blockchain anchor: stores daily Merkle root info
    blockchainAnchor: {
      dateHash: { type: String, default: null },
      rootHash: { type: String, default: null },
      transactionHash: { type: String, default: null },
      blockNumber: { type: Number, default: null },
      anchoredAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

AttendanceSchema.index({ date: 1, teacher: 1 }, { unique: true });

AttendanceSchema.post("findOne", function(doc) {
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

AttendanceSchema.post("find", function(docs) {
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

export default mongoose.model("Attendance", AttendanceSchema);
