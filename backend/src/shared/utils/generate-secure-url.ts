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
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
  });
};

export const refreshGuardianMediaUrls = <T extends {
  photoUrl?: string | null;
  photoPublicId?: string | null;
  idUrl?: string | null;
  idPublicId?: string | null;
}>(guardian: T): T => ({
  ...guardian,
  photoUrl: guardian.photoPublicId
    ? generateSecureUrl(guardian.photoPublicId, "image")
    : guardian.photoUrl ?? null,
  idUrl: guardian.idPublicId
    ? generateSecureUrl(guardian.idPublicId, "image")
    : guardian.idUrl ?? null,
});
