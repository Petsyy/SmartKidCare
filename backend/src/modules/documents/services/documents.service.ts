import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { generateSecureUrl } from "../../../shared/utils/generate-secure-url";
import { resolveDocumentField } from "../../child/shared";
import { canAccessChildIdentityDocument } from "../../../shared/services/child-access.service";
import {
  documentsChildRepository,
  documentAccessTokenRepository,
} from "../repositories/documents.repository";
import type { ChildServiceResponse, AuthUser, ResolvedDocumentAccess } from "../types/documents.types";

const getTokenErrorResponse = (message: string, status = 410): ChildServiceResponse => ({
  status,
  body: { message },
});

const consumeDocumentAccessToken = async (
  token: string,
): Promise<ChildServiceResponse | ResolvedDocumentAccess> => {
  const accessToken = await documentAccessTokenRepository.findByToken(token);
  if (!accessToken) {
    return {
      status: 404,
      body: { message: "Token not found or expired" },
    };
  }

  if (accessToken.used) {
    return getTokenErrorResponse(
      "This link has already been used. Request a new document link.",
    );
  }

  if (new Date() > accessToken.expiresAt) {
    return getTokenErrorResponse(
      "This link has expired. Request a new document link.",
    );
  }

  const signedUrl = generateSecureUrl(
    accessToken.publicId,
    accessToken.resourceType,
    accessToken.format,
  );

  await documentAccessTokenRepository.deleteById(String(accessToken._id));

  const isImage =
    accessToken.resourceType === "image" ||
    ["jpg", "jpeg", "png", "gif", "webp"].includes(
      accessToken.format.toLowerCase(),
    );

  return {
    signedUrl,
    documentType: accessToken.documentType,
    contentType: isImage ? `image/${accessToken.format}` : "application/pdf",
    fileName: `${accessToken.childId}-${accessToken.documentType}.${accessToken.format}`,
  };
};

export const createChildDocumentAccessToken = async (
  user: AuthUser | undefined,
  childIdInput: string,
  documentTypeInput: string,
): Promise<ChildServiceResponse> => {
  if (!user?.id) {
    return {
      status: 401,
      body: { message: "Unauthorized" },
    };
  }

  const childId = String(childIdInput || "");
  if (!mongoose.Types.ObjectId.isValid(childId)) {
    return {
      status: 400,
      body: { message: "Invalid child ID" },
    };
  }

  const documentField = resolveDocumentField(String(documentTypeInput));
  if (!documentField) {
    return {
      status: 400,
      body: { message: "Invalid document type" },
    };
  }

  const child = await documentsChildRepository.findWithDocuments(childId);

  if (!child) {
    return {
      status: 404,
      body: { message: "Child not found" },
    };
  }

  const canAccess = canAccessChildIdentityDocument(user as any, child);

  if (!canAccess) {
    return {
      status: 403,
      body: { message: "Forbidden" },
    };
  }

  const doc = (child as any)?.documents?.[documentField];
  if (!doc?.publicId || !doc?.resourceType) {
    return {
      status: 404,
      body: { message: "Document not found" },
    };
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
    format: String(doc.format || "jpg"),
    userId: new mongoose.Types.ObjectId(user.id),
    expiresAt,
  });

  return {
    status: 200,
    body: {
      token,
      expiresInSeconds: 60,
      documentType: documentField,
    },
  };
};

export const getChildDocumentUrlByToken = async (
  tokenInput: string,
): Promise<ChildServiceResponse> => {
  const token = String(tokenInput || "").trim();
  if (!token) {
    return {
      status: 400,
      body: { message: "Invalid token" },
    };
  }

  const resolved = await consumeDocumentAccessToken(token);
  if ("status" in resolved) {
    return resolved;
  }

  return {
    status: 200,
    body: {
      url: resolved.signedUrl,
      documentType: resolved.documentType,
    },
  };
};

export const getChildDocumentStreamByToken = async (
  tokenInput: string,
): Promise<ChildServiceResponse> => {
  const token = String(tokenInput || "").trim();
  if (!token) {
    return {
      status: 400,
      body: { message: "Invalid token" },
    };
  }

  const resolved = await consumeDocumentAccessToken(token);
  if ("status" in resolved) {
    return resolved;
  }

  return {
    status: 200,
    body: {
      signedUrl: resolved.signedUrl,
      contentType: resolved.contentType,
      fileName: resolved.fileName,
      documentType: resolved.documentType,
    },
  };
};

export type { ChildServiceResponse } from "../types/documents.types";
