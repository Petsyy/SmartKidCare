import cloudinary from "../config/cloudinary";
import { randomUUID } from "crypto";

export interface UploadResult {
  publicId: string;
  resourceType: string;
  format: string;
  bytes: number;
}

export const uploadToCloudinary = async (
  buffer: Buffer,
  folder: string,
  mimetype: string,
  originalName?: string,
): Promise<UploadResult> => {
  const resourceType = mimetype === "application/pdf" ? "raw" : "image";
  const inferredExtension = String(originalName || "")
    .split(".")
    .pop()
    ?.trim()
    .toLowerCase();
  const extension =
    inferredExtension ||
    (mimetype === "application/pdf"
      ? "pdf"
      : mimetype === "image/png"
        ? "png"
        : "jpg");

  const uniqueFileName = randomUUID();
  const publicId =
    resourceType === "raw" ? `${uniqueFileName}.${extension}` : uniqueFileName;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: resourceType,
        type: "authenticated",
        overwrite: false,
        invalidate: true,
        filename_override: originalName,
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error("Upload failed"));
        }

        resolve({
          publicId: result.public_id,
          resourceType: result.resource_type,
          format: result.format || extension,
          bytes: result.bytes,
        });
      },
    );

    stream.end(buffer);
  });
};
