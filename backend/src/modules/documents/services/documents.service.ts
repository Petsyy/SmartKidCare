import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { ethers } from "ethers";
import { AppError } from "../../../shared/errors/app-error";
import { logger } from "../../../shared/lib/logger";
import { storageService } from "../../../shared/services/storage.service";
import {
  decryptDocument,
  type DocumentEncryptionMetadata,
} from "../../../shared/services/document-encryption.service";
import { resolveDocumentField } from "../../child/shared";
import { canAccessChild } from "../../../shared/services/child-access.service";
import {
  documentsChildRepository,
  documentAccessTokenRepository,
} from "../repositories/documents.repository";
import type {
  ChildServiceResponse,
  AuthUser,
  ResolvedDocumentAccess,
} from "../types/documents.types";

const response = (status: number, message: string): ChildServiceResponse => ({
  status,
  body: { message },
});

const resolveStoredDocument = async (childId: string, documentType: string) => {
  const child = await documentsChildRepository.findWithDocuments(childId);
  const doc = (child as any)?.documents?.[documentType];
  return { child, doc };
};

const consumeDocumentAccessToken = async (
  token: string,
): Promise<ChildServiceResponse | ResolvedDocumentAccess> => {
  const accessToken = await documentAccessTokenRepository.consumeByToken(token);
  if (!accessToken) return response(404, "Token not found or expired");
  if (new Date() > accessToken.expiresAt) {
    return response(410, "This link has expired. Request a new document link.");
  }

  const { doc } = await resolveStoredDocument(
    String(accessToken.childId),
    String(accessToken.documentType),
  );
  if (!doc?.publicId || !doc?.resourceType) {
    return response(404, "Document not found");
  }

  try {
    const storedBytes = await storageService.downloadFile(
      String(doc.publicId),
      String(doc.resourceType),
      String(doc.format || "bin"),
    );
    const encryption = doc.encryption as DocumentEncryptionMetadata | undefined;
    const buffer = encryption?.keyId
      ? decryptDocument(storedBytes, encryption)
      : storedBytes;
    const actualHash = ethers.keccak256(buffer);
    if (
      doc.hash &&
      actualHash.toLowerCase() !== String(doc.hash).toLowerCase()
    ) {
      throw new Error("Document plaintext hash mismatch");
    }

    logger.info("Document access completed.", {
      childId: String(accessToken.childId),
      documentType: String(accessToken.documentType),
      keyId: encryption?.keyId || "legacy-plaintext",
      operation: "decrypt_stream",
      outcome: "success",
    });

    const contentType =
      encryption?.originalMimeType ||
      (doc.resourceType === "image"
        ? `image/${doc.format || "jpeg"}`
        : "application/pdf");
    const fileName =
      encryption?.originalFileName ||
      `${accessToken.childId}-${accessToken.documentType}.${doc.format || "pdf"}`;
    return {
      buffer,
      documentType: String(accessToken.documentType),
      contentType,
      fileName,
    };
  } catch (error: unknown) {
    logger.error("Document access failed.", {
      childId: String(accessToken.childId),
      documentType: String(accessToken.documentType),
      keyId: String(doc?.encryption?.keyId || "legacy-plaintext"),
      operation: "decrypt_stream",
      outcome: "failed",
      error: error instanceof Error ? error.message : "unknown",
    });
    throw new AppError(500, "Document could not be securely retrieved.");
  }
};

export const createChildDocumentAccessToken = async (
  user: AuthUser | undefined,
  childIdInput: string,
  documentTypeInput: string,
): Promise<ChildServiceResponse> => {
  if (!user?.id) return response(401, "Unauthorized");
  const childId = String(childIdInput || "");
  if (!mongoose.Types.ObjectId.isValid(childId)) {
    return response(400, "Invalid child ID");
  }
  const documentField = resolveDocumentField(documentTypeInput);
  if (!documentField) return response(400, "Invalid document type");

  const { child, doc } = await resolveStoredDocument(childId, documentField);
  if (!child) return response(404, "Child not found");
  if (!canAccessChild(user as any, child)) return response(403, "Forbidden");
  if (!doc?.publicId || !doc?.resourceType) {
    return response(404, "Document not found");
  }

  await documentAccessTokenRepository.pruneStale();
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 1000);
  await documentAccessTokenRepository.createToken({
    token,
    childId: new mongoose.Types.ObjectId(childId),
    documentType: documentField,
    publicId: String(doc.publicId),
    resourceType: String(doc.resourceType),
    format: String(doc.format || "bin"),
    userId: new mongoose.Types.ObjectId(user.id),
    expiresAt,
  });

  logger.info("Document access token issued.", {
    childId,
    documentType: documentField,
    keyId: String(doc?.encryption?.keyId || "legacy-plaintext"),
    operation: "issue_access_token",
    outcome: "success",
  });
  return {
    status: 200,
    body: {
      token,
      expiresInSeconds: 60,
      documentType: documentField,
      viewPath: `/api/documents/view?token=${encodeURIComponent(token)}`,
    },
  };
};

export const getChildDocumentStreamByToken = async (
  tokenInput: string,
): Promise<ChildServiceResponse> => {
  const token = String(tokenInput || "").trim();
  if (!token) return response(400, "Invalid token");
  const resolved = await consumeDocumentAccessToken(token);
  if ("status" in resolved) return resolved;
  return { status: 200, body: resolved };
};

export type { ChildServiceResponse } from "../types/documents.types";
