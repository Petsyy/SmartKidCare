import mongoose from "mongoose";

export type FeedingStatus = "completed" | "missed";

export interface IFeedingRecord {
  child: mongoose.Types.ObjectId;
  status: FeedingStatus;
  notes?: string;
}

export interface IFeeding {
  date: Date;
  teacher: mongoose.Types.ObjectId;
  daycareCenter?: mongoose.Types.ObjectId | null;
  foodServed: string;
  clientOperationId?: string;
  payloadHash?: string;
  records: IFeedingRecord[];
  createdAt: Date;
  updatedAt: Date;
}

const FeedingRecordSchema = new mongoose.Schema<IFeedingRecord>({
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
  notes: {
    type: String,
    trim: true,
    maxlength: 500,
    default: "",
  },
});

const FeedingSchema = new mongoose.Schema<IFeeding>(
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
    daycareCenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChildDevelopmentCenter",
      default: null,
      index: true,
    },
    foodServed: {
      type: String,
      required: true,
    },
    clientOperationId: {
      type: String,
      trim: true,
    },
    payloadHash: {
      type: String,
      trim: true,
    },
    records: [FeedingRecordSchema],
  },
  { timestamps: true }
);

// Ensure one feeding record per teacher per day
FeedingSchema.index({ date: 1, teacher: 1 }, { unique: true });
FeedingSchema.index(
  { clientOperationId: 1 },
  {
    unique: true,
    partialFilterExpression: { clientOperationId: { $type: "string" } },
  },
);
FeedingSchema.index({ daycareCenter: 1, date: -1, teacher: 1 });

export default mongoose.model<IFeeding>("Feeding", FeedingSchema);
