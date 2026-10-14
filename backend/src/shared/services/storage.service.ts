import {
  deleteFromCloudinary,
  uploadToCloudinary,
  type UploadResult,
} from "../utils/upload-cloudinary";
import { logger } from "../lib/logger";
import axios from "axios";
import { generateSecureUrl } from "../utils/generate-secure-url";
import {
  encryptDocument,
  type DocumentEncryptionMetadata,
} from "./document-encryption.service";

export type EncryptedUploadResult = UploadResult & {
  encryption: DocumentEncryptionMetadata;
};

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

  public async uploadEncryptedDocument(
    buffer: Buffer,
    folder: string,
    mimetype: string,
    originalName: string,
  ): Promise<EncryptedUploadResult> {
    const { ciphertext, encryption } = encryptDocument(
      buffer,
      mimetype,
      originalName,
    );
    const upload = await uploadToCloudinary(
      ciphertext,
      folder,
      "application/octet-stream",
      `${originalName}.encrypted`,
      { forceRaw: true, storedExtension: "bin" },
    );
    return { ...upload, encryption };
  }

  public async downloadFile(
    publicId: string,
    resourceType: string,
    format?: string,
  ): Promise<Buffer> {
    const signedUrl = generateSecureUrl(publicId, resourceType, format);
    const response = await axios.get<ArrayBuffer>(signedUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
      maxContentLength: 15 * 1024 * 1024,
    });
    return Buffer.from(response.data);
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
