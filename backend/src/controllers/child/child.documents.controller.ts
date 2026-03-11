import mongoose from "mongoose";
import { Request, Response } from "express";
import { randomUUID } from "crypto";
import Child from "../../models/Child";
import DocumentAccessToken from "../../models/DocumentAccessToken";
import { generateSecureUrl } from "../../utils/generateSecureUrl";
import { ensureCanAccessChild, resolveDocumentField } from "./child.helpers";

/**
 * Generate a signed URL token for accessing a child's document
 */
export const getChildDocumentSignedUrl = async (
  req: Request,
  res: Response,
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const childId = String(req.params.id || "");
    if (!mongoose.Types.ObjectId.isValid(childId)) {
      return res.status(400).json({ message: "Invalid child ID" });
    }

    const documentField = resolveDocumentField(String(req.params.documentType));
    if (!documentField) {
      return res.status(400).json({ message: "Invalid document type" });
    }

    const child = await Child.findById(childId)
      .populate("parent", "_id")
      .populate("teacher", "_id")
      .select("documents parent teacher")
      .lean();

    if (!child) {
      return res.status(404).json({ message: "Child not found" });
    }

    if (!ensureCanAccessChild(child, req)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const doc = (child as any)?.documents?.[documentField];
    if (!doc?.publicId || !doc?.resourceType) {
      return res.status(404).json({ message: "Document not found" });
    }

    await DocumentAccessToken.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { used: true, usedAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) } },
      ],
    }).catch(() => {
      console.warn("Token cleanup failed silently");
    });

    // Generate one-time access token
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 1000); // 60 seconds

    await DocumentAccessToken.create({
      token,
      childId: new mongoose.Types.ObjectId(childId),
      documentType: documentField,
      publicId: String(doc.publicId),
      resourceType: String(doc.resourceType),
      format: String(doc.format || "jpg"),
      userId: new mongoose.Types.ObjectId(req.user.id),
      expiresAt,
    });

    return res.status(200).json({
      token,
      expiresInSeconds: 60,
      documentType: documentField,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to generate document token",
      error: error?.message,
    });
  }
};

/**
 * Get document URL from access token
 */
export const getChildDocumentUrl = async (req: Request, res: Response) => {
  try {
    const token = String(req.params.token || "").trim();
    if (!token) {
      return res.status(400).json({ message: "Invalid token" });
    }

    // Find and validate token
    const accessToken = await DocumentAccessToken.findOne({ token });
    if (!accessToken) {
      return res.status(404).json({ message: "Token not found or expired" });
    }

    // Check if token is already used
    if (accessToken.used) {
      return res.status(410).json({
        message:
          "This link has already been used. Request a new document link.",
      });
    }

    // Check if token has expired
    if (new Date() > accessToken.expiresAt) {
      return res.status(410).json({
        message: "This link has expired. Request a new document link.",
      });
    }

    // Generate signed URL (valid for 60 seconds)
    const signedUrl = generateSecureUrl(
      accessToken.publicId,
      accessToken.resourceType,
      accessToken.format,
    );

    // Delete token immediately after generating URL (one-time use)
    await DocumentAccessToken.deleteOne({ _id: accessToken._id });

    return res.status(200).json({
      url: signedUrl,
      documentType: accessToken.documentType,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to retrieve document URL",
      error: error?.message,
    });
  }
};

/**
 * Stream child document directly (proxy through backend)
 */
export const streamChildDocument = async (req: Request, res: Response) => {
  try {
    const token = String(req.params.token || "").trim();
    if (!token) {
      return res.status(400).json({ message: "Invalid token" });
    }

    // Find and validate token
    const accessToken = await DocumentAccessToken.findOne({ token });
    if (!accessToken) {
      return res.status(404).json({ message: "Token not found or expired" });
    }

    // Check if token is already used
    if (accessToken.used) {
      return res.status(410).json({
        message:
          "This link has already been used. Request a new document link.",
      });
    }

    // Check if token has expired
    if (new Date() > accessToken.expiresAt) {
      return res.status(410).json({
        message: "This link has expired. Request a new document link.",
      });
    }

    // Generate signed URL (never exposed to frontend)
    const signedUrl = generateSecureUrl(
      accessToken.publicId,
      accessToken.resourceType,
      accessToken.format,
    );

    // Delete token immediately after generating URL (one-time use)
    await DocumentAccessToken.deleteOne({ _id: accessToken._id });

    // Set proper headers for file download/display
    const isImage =
      accessToken.resourceType === "image" ||
      ["jpg", "jpeg", "png", "gif", "webp"].includes(
        accessToken.format.toLowerCase(),
      );
    const contentType = isImage
      ? `image/${accessToken.format}`
      : "application/pdf";
    const fileName = `${accessToken.childId}-${accessToken.documentType}.${accessToken.format}`;

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    // Proxy the request to Cloudinary without exposing the URL
    const axios = require("axios");
    try {
      const response = await axios.get(signedUrl, {
        responseType: "stream",
        timeout: 30000,
      });
      response.data.pipe(res);
    } catch (error: any) {
      return res.status(502).json({
        message: "Failed to retrieve document from storage",
        error: error?.message,
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to stream document",
      error: error?.message,
    });
  }
};

/**
 * View document directly in browser
 */
export const viewDocument = async (req: Request, res: Response) => {
  try {
    const token = String(req.query.token || "").trim();
    if (!token) {
      return res.status(400).json({ message: "Invalid token" });
    }

    // Find and validate token
    const accessToken = await DocumentAccessToken.findOne({ token });
    if (!accessToken) {
      return res.status(404).json({ message: "Token not found or expired" });
    }

    // Check if token is already used
    if (accessToken.used) {
      return res.status(410).json({
        message:
          "This link has already been used. Request a new document link.",
      });
    }

    // Check if token has expired
    if (new Date() > accessToken.expiresAt) {
      return res.status(410).json({
        message: "This link has expired. Request a new document link.",
      });
    }

    // Generate signed URL (never exposed to frontend)
    const signedUrl = generateSecureUrl(
      accessToken.publicId,
      accessToken.resourceType,
      accessToken.format,
    );

    // Delete token immediately after use (one-time use)
    await DocumentAccessToken.deleteOne({ _id: accessToken._id });

    // Set proper headers for file download/display
    const isImage =
      accessToken.resourceType === "image" ||
      ["jpg", "jpeg", "png", "gif", "webp"].includes(
        accessToken.format.toLowerCase(),
      );
    const contentType = isImage
      ? `image/${accessToken.format}`
      : "application/pdf";
    const fileName = `${accessToken.childId}-${accessToken.documentType}.${accessToken.format}`;

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("X-Content-Type-Options", "nosniff");

    // Proxy the request to Cloudinary without exposing the URL
    const axios = require("axios");
    try {
      const response = await axios.get(signedUrl, {
        responseType: "stream",
        timeout: 30000,
      });
      response.data.pipe(res);
    } catch (error: any) {
      return res.status(502).json({
        message: "Failed to retrieve document from storage",
        error: error?.message,
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to view document",
      error: error?.message,
    });
  }
};
