import cloudinary from "../config/cloudinary";

export const generateSecureUrl = (
  publicId: string,
  resourceType: string,
  format?: string,
) => {
  const extensionFromPublicId = String(publicId).includes(".")
    ? String(publicId).split(".").pop()
    : undefined;
  const resolvedFormat =
    String(format || "").trim() ||
    String(extensionFromPublicId || "").trim() ||
    (resourceType === "raw" ? "pdf" : "jpg");

  return cloudinary.utils.private_download_url(publicId, resolvedFormat, {
    resource_type: resourceType,
    type: "authenticated",
    expires_at: Math.floor(Date.now() / 1000) + 60,
  });
};
