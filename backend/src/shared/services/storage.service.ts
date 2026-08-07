import {
  deleteFromCloudinary,
  uploadToCloudinary,
  type UploadResult,
} from "../utils/upload-cloudinary";
import { logger } from "../lib/logger";

export class StorageService {
  /**
   * Upload a file to Cloudinary.
   */
  public async uploadFile(
    buffer: Buffer,
    folder: string,
    mimetype: string,
    originalName?: string,
  ): Promise<UploadResult> {
    return uploadToCloudinary(buffer, folder, mimetype, originalName);
  }

  /**
   * Delete a file from Cloudinary.
   */
  public async deleteFile(
    publicId: string,
    resourceType: string,
  ): Promise<void> {
    try {
      await deleteFromCloudinary(publicId, resourceType);
    } catch (error: unknown) {
      logger.error("Failed to delete file from storage.", {
        publicId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Cleanup a potentially null/undefined upload result (useful for rollback).
   */
  public async cleanupUpload(upload: UploadResult | null | undefined): Promise<void> {
    if (!upload) return;
    await this.deleteFile(upload.publicId, upload.resourceType);
  }
}

export const storageService = new StorageService();
