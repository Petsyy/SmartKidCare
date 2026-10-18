import crypto from "crypto";
import mongoose, { Types } from "mongoose";
import AIChatRequest from "../../../models/AIChatRequest";
import AIConversationState from "../../../models/AIConversationState";
import type {
  AIChatSuccessBody,
  AIConversationStateRecord,
  AILanguageMode,
  AIResponseLanguage,
  AIPendingAction,
  AIIntent,
  FollowUpChoice,
  PendingTimeframe,
  AIDetailLevel,
  AIConversationTurn,
} from "../types/core-ai-chat.types";

export const AI_CONTEXT_TTL_MS = 30 * 60_000;
export const AI_REQUEST_RETENTION_MS = 30 * 60_000;
export const AI_REQUEST_LEASE_MS = 30_000;

const asRecord = (value: unknown): AIConversationStateRecord =>
  value as AIConversationStateRecord;

export type AcquireRequestResult =
  | {
      kind: "acquired";
      leaseToken: string;
      attemptNumber: number;
    }
  | {
      kind: "completed";
      response: AIChatSuccessBody;
      status: number;
      committedGeneration: number;
      committedVersion: number;
      originalContextId: string | null;
    }
  | { kind: "processing" }
  | { kind: "reused" };

export type ConversationMutation = {
  responseLanguage: AIResponseLanguage;
  languageMode: AILanguageMode;
  activeDomain: FollowUpChoice | null;
  timeframe: PendingTimeframe | null;
  detailLevel: AIDetailLevel | null;
  lastIntent: AIIntent;
  pendingAction: AIPendingAction | null;
  turns: AIConversationTurn[];
};

export const aiConversationRepository = {
  async findAny(parentId: string, contextId: string) {
    return asRecord(
      await AIConversationState.findOne({ parent: parentId, contextId }).lean(),
    ) as AIConversationStateRecord | null;
  },

  async findActive(
    parentId: string,
    childId: string,
    contextId: string,
    now = new Date(),
  ) {
    return asRecord(
      await AIConversationState.findOne({
        parent: parentId,
        child: childId,
        contextId,
        invalidatedAt: null,
        expiresAt: { $gt: now },
      }).lean(),
    ) as AIConversationStateRecord | null;
  },

  async create(params: {
    parentId: string;
    childId: string;
    contextId: string;
    responseLanguage: AIResponseLanguage;
    languageMode: AILanguageMode;
    now?: Date;
  }) {
    const now = params.now ?? new Date();
    try {
      const created = await AIConversationState.create({
        parent: params.parentId,
        child: params.childId,
        contextId: params.contextId,
        responseLanguage: params.responseLanguage,
        languageMode: params.languageMode,
        expiresAt: new Date(now.getTime() + AI_CONTEXT_TTL_MS),
      });
      return asRecord(created.toObject());
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
      const existing = await this.findActive(
        params.parentId,
        params.childId,
        params.contextId,
        now,
      );
      if (!existing) throw error;
      return existing;
    }
  },

  async invalidate(parentId: string, contextId: string, now = new Date()) {
    await AIConversationState.updateOne(
      { parent: parentId, contextId, invalidatedAt: null },
      {
        $set: {
          invalidatedAt: now,
          expiresAt: now,
          pendingAction: null,
          turns: [],
        },
        $inc: { generation: 1, version: 1 },
      },
    );
  },

  async acquireRequest(params: {
    parentId: string;
    requestId: string;
    requestHash: string;
    originalContextId?: string;
    now?: Date;
  }): Promise<AcquireRequestResult> {
    const now = params.now ?? new Date();
    const existing = await AIChatRequest.findOne({
      parent: params.parentId,
      requestId: params.requestId,
    }).lean();

    if (existing) {
      if (existing.requestHash !== params.requestHash) return { kind: "reused" };
      if (
        existing.status === "completed" &&
        existing.retentionExpiresAt > now &&
        existing.completedResponse
      ) {
        return {
          kind: "completed",
          response: existing.completedResponse as AIChatSuccessBody,
          status: existing.completedStatus ?? 200,
          committedGeneration: existing.committedGeneration ?? -1,
          committedVersion: existing.committedVersion ?? -1,
          originalContextId: existing.originalContextId ?? null,
        };
      }
      if (
        existing.status === "processing" &&
        existing.leaseExpiresAt > now
      ) {
        return { kind: "processing" };
      }

      const leaseToken = crypto.randomUUID();
      const reclaimed = await AIChatRequest.findOneAndUpdate(
        {
          _id: existing._id,
          requestHash: params.requestHash,
          $or: [
            { status: "retryable" },
            { status: "processing", leaseExpiresAt: { $lte: now } },
            { status: "completed", retentionExpiresAt: { $lte: now } },
          ],
        },
        {
          $set: {
            status: "processing",
            leaseToken,
            leaseExpiresAt: new Date(now.getTime() + AI_REQUEST_LEASE_MS),
            completedResponse: null,
            completedStatus: null,
            committedGeneration: null,
            committedVersion: null,
            retentionExpiresAt: new Date(
              now.getTime() + AI_REQUEST_RETENTION_MS,
            ),
          },
          $inc: { attemptNumber: 1 },
        },
        { new: true },
      ).lean();
      return reclaimed
        ? {
            kind: "acquired",
            leaseToken,
            attemptNumber: reclaimed.attemptNumber,
          }
        : { kind: "processing" };
    }

    const leaseToken = crypto.randomUUID();
    try {
      await AIChatRequest.create({
        parent: params.parentId,
        requestId: params.requestId,
        requestHash: params.requestHash,
        originalContextId: params.originalContextId ?? null,
        status: "processing",
        attemptNumber: 1,
        leaseToken,
        leaseExpiresAt: new Date(now.getTime() + AI_REQUEST_LEASE_MS),
        retentionExpiresAt: new Date(now.getTime() + AI_REQUEST_RETENTION_MS),
      });
      return { kind: "acquired", leaseToken, attemptNumber: 1 };
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
      return this.acquireRequest(params);
    }
  },

  async commit(params: {
    parentId: string;
    requestId?: string;
    leaseToken?: string;
    attemptNumber?: number;
    context: AIConversationStateRecord;
    mutation: ConversationMutation;
    response: AIChatSuccessBody;
    now?: Date;
  }): Promise<"committed" | "context_conflict" | "lease_lost"> {
    const now = params.now ?? new Date();
    const session = await mongoose.startSession();
    let outcome: "committed" | "context_conflict" | "lease_lost" =
      "context_conflict";
    try {
      await session.withTransaction(async () => {
        if (params.requestId) {
          const lease = await AIChatRequest.findOne({
            parent: params.parentId,
            requestId: params.requestId,
            status: "processing",
            leaseToken: params.leaseToken,
            attemptNumber: params.attemptNumber,
            leaseExpiresAt: { $gt: now },
          })
            .session(session)
            .lean();
          if (!lease) {
            outcome = "lease_lost";
            return;
          }
        }

        const nextExpiresAt = new Date(now.getTime() + AI_CONTEXT_TTL_MS);
        const updated = await AIConversationState.findOneAndUpdate(
          {
            _id: params.context._id,
            parent: params.parentId,
            generation: params.context.generation,
            version: params.context.version,
            invalidatedAt: null,
            expiresAt: { $gt: now },
          },
          {
            $set: {
              ...params.mutation,
              expiresAt: nextExpiresAt,
            },
            $inc: { version: 1 },
          },
          { new: true, session },
        ).lean();
        if (!updated) {
          outcome = "context_conflict";
          return;
        }

        params.response.contextExpiresAt = nextExpiresAt.toISOString();
        if (params.requestId) {
          const completed = await AIChatRequest.updateOne(
            {
              parent: params.parentId,
              requestId: params.requestId,
              status: "processing",
              leaseToken: params.leaseToken,
              attemptNumber: params.attemptNumber,
            },
            {
              $set: {
                status: "completed",
                completedStatus: 200,
                completedResponse: params.response,
                committedGeneration: updated.generation,
                committedVersion: updated.version,
                retentionExpiresAt: new Date(
                  now.getTime() + AI_REQUEST_RETENTION_MS,
                ),
              },
            },
            { session },
          );
          if (completed.modifiedCount !== 1) {
            outcome = "lease_lost";
            throw new Error("AI_REQUEST_LEASE_LOST");
          }
        }
        outcome = "committed";
      });
      return outcome;
    } finally {
      await session.endSession();
    }
  },

  async releaseRetryable(params: {
    parentId: string;
    requestId: string;
    leaseToken: string;
    attemptNumber: number;
  }) {
    await AIChatRequest.updateOne(
      {
        parent: params.parentId,
        requestId: params.requestId,
        status: "processing",
        leaseToken: params.leaseToken,
        attemptNumber: params.attemptNumber,
      },
      { $set: { status: "retryable", leaseExpiresAt: new Date(0) } },
    );
  },
};

export const createRequestHash = (params: {
  message: string;
  childId: string | null;
  contextId: string | null;
  resetContext: boolean;
  language: AIResponseLanguage | null;
  languageMode: AILanguageMode | null;
}) => {
  const secret = String(
    process.env.AI_REQUEST_HASH_SECRET || process.env.JWT_SECRET || "",
  );
  if (!secret) throw new Error("AI request hash secret is not configured.");
  return crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(params))
    .digest("hex");
};

export const newContextId = () => crypto.randomUUID();

export const isObjectId = (value: string) => Types.ObjectId.isValid(value);
