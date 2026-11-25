import mongoose from "mongoose";

const ConversationTurnSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true, maxlength: 4000 },
  },
  { _id: false },
);

const PendingActionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["confirmation", "domain_selection"],
      required: true,
    },
    action: {
      type: String,
      enum: ["show_details", "choose_domain"],
      required: true,
    },
    domain: {
      type: String,
      enum: ["attendance", "feeding", "both"],
      required: true,
    },
    timeframe: {
      type: String,
      enum: [
        "today",
        "yesterday",
        "week",
        "last_week",
        "month",
        "last_month",
        "recent",
      ],
      required: true,
    },
    expiresAt: { type: Date, required: true },
  },
  { _id: false },
);

const AIConversationStateSchema = new mongoose.Schema(
  {
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Child",
      required: true,
      index: true,
    },
    contextId: { type: String, required: true },
    responseLanguage: {
      type: String,
      enum: ["en", "fil"],
      required: true,
      default: "en",
    },
    languageMode: {
      type: String,
      enum: ["auto", "explicit"],
      required: true,
      default: "auto",
    },
    activeDomain: {
      type: String,
      enum: ["attendance", "feeding", "both"],
      default: null,
    },
    timeframe: {
      type: String,
      enum: [
        "today",
        "yesterday",
        "week",
        "last_week",
        "month",
        "last_month",
        "recent",
      ],
      default: null,
    },
    detailLevel: {
      type: String,
      enum: ["summary", "detailed"],
      default: null,
    },
    lastIntent: { type: String, default: null, maxlength: 80 },
    pendingAction: { type: PendingActionSchema, default: null },
    turns: { type: [ConversationTurnSchema], default: [] },
    generation: { type: Number, required: true, default: 0, min: 0 },
    version: { type: Number, required: true, default: 0, min: 0 },
    expiresAt: { type: Date, required: true },
    invalidatedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

AIConversationStateSchema.index(
  { parent: 1, contextId: 1 },
  { unique: true },
);
AIConversationStateSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model(
  "AIConversationState",
  AIConversationStateSchema,
);
