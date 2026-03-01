import cloudinary from "../config/cloudinary";
import { UploadApiResponse } from "cloudinary";

export const uploadToCloudinary = (
  buffer: Buffer,
  folder: string,
): Promise<UploadApiResponse> => {
  console.log("[uploadToCloudinary] Upload started", {
    folder,
    bufferSize: buffer.length,
  });

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        asset_folder: folder,
        resource_type: "auto", // IMPORTANT for PDF + images
      },
      (error, result) => {
        if (error) {
          console.error("[uploadToCloudinary] Upload failed", {
            folder,
            message: error.message,
            http_code: (error as any).http_code,
            name: error.name,
          });
          reject(error);
        } else {
          if (!result) {
            reject(new Error("Cloudinary upload did not return a result"));
            return;
          }

          console.log("[uploadToCloudinary] Upload success", {
            folder,
            publicId: result.public_id,
            assetFolder: (result as any).asset_folder,
            secureUrl: result.secure_url,
            resourceType: result.resource_type,
          });

          resolve(result as UploadApiResponse);
        }
      },
    );

    stream.end(buffer);
  });
};
