import mongoose from "mongoose";
import { randomUUID } from "crypto";
import Child from "../../../models/Child";
import DocumentAccessToken from "../../../models/DocumentAccessToken";
import { generateSecureUrl } from "../../../shared/utils/generate-secure-url";
import { ensureCanAccessChild, resolveDocumentField } from "../shared";

export type ChildServiceResponse = {
  status: number;
  body: unknown;
};

type AuthUser = {
  id: string;
  role: string;
};

type ResolvedDocumentAccess = {
  signedUrl: string;
  documentType: string;
  contentType: string;
  fileName: string;
};

const getTokenErrorResponse = (message: string, status = 410): ChildServiceResponse => ({
  status,
  body: { message },
});

const consumeDocumentAccessToken = async (
  token: string,
): Promise<ChildServiceResponse | ResolvedDocumentAccess> => {
  const accessToken = await DocumentAccessToken.findOne({ token });
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

  await DocumentAccessToken.deleteOne({ _id: accessToken._id });

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

  const child = await Child.findById(childId)
    .populate("parent", "_id")
    .populate("teacher", "_id")
    .select("documents parent teacher")
    .lean();

  if (!child) {
    return {
      status: 404,
      body: { message: "Child not found" },
    };
  }

  const canAccess = ensureCanAccessChild(child, {
    user,
  } as any);

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

  await DocumentAccessToken.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { used: true, usedAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) } },
    ],
  }).catch(() => {
    console.warn("Token cleanup failed silently");
  });

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 1000);

  await DocumentAccessToken.create({
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

