import mongoose from "mongoose";
import Child from "../../../models/Child";
import DocumentAccessToken from "../../../models/DocumentAccessToken";
import { BaseRepository } from "../../../shared/repositories/base.repository";
import { logger } from "../../../shared/lib/logger";

// ─── Child ────────────────────────────────────────────────────────────────────

export class DocumentsChildRepository extends BaseRepository<any> {
  constructor() {
    super(Child);
  }

  async findWithDocuments(childId: string): Promise<any | null> {
    return this.model
      .findById(childId)
      .populate("parent", "_id")
      .populate("teacher", "_id")
      .select("documents parent teacher daycareCenter")
      .lean();
  }
}

// ─── DocumentAccessToken ──────────────────────────────────────────────────────

export class DocumentAccessTokenRepository extends BaseRepository<any> {
  constructor() {
    super(DocumentAccessToken);
  }

  async consumeByToken(token: string): Promise<any | null> {
    return this.model.findOneAndDelete({ token });
  }

  async createToken(data: {
    token: string;
    childId: mongoose.Types.ObjectId;
    documentType: string;
    publicId: string;
    resourceType: string;
    format: string;
    userId: mongoose.Types.ObjectId;
    expiresAt: Date;
  }): Promise<any> {
    return this.model.create(data);
  }

  async deleteById(id: string): Promise<void> {
    await this.model.deleteOne({ _id: id });
  }

  /**
   * Deletes expired or recently-used tokens to prevent accumulation.
   */
  async pruneStale(): Promise<void> {
    await this.model
      .deleteMany({
        $or: [
          { expiresAt: { $lt: new Date() } },
          {
            used: true,
            usedAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) },
          },
        ],
      })
      .catch((error: unknown) => {
        logger.warn("Document access token cleanup failed.", {
          operation: "prune_access_tokens",
          outcome: "failed",
          error: error instanceof Error ? error.message : "unknown",
        });
      });
  }
}

// ─── Singletons ───────────────────────────────────────────────────────────────

export const documentsChildRepository = new DocumentsChildRepository();
export const documentAccessTokenRepository = new DocumentAccessTokenRepository();
