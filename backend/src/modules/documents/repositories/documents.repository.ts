import mongoose from "mongoose";
import Child from "../../../models/Child";
import DocumentAccessToken from "../../../models/DocumentAccessToken";
import { BaseRepository } from "../../../shared/repositories/base.repository";

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

  async findByToken(token: string): Promise<any | null> {
    return this.model.findOne({ token });
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
      .catch(() => {
        console.warn("Token cleanup failed silently");
      });
  }
}

// ─── Singletons ───────────────────────────────────────────────────────────────

export const documentsChildRepository = new DocumentsChildRepository();
export const documentAccessTokenRepository = new DocumentAccessTokenRepository();
