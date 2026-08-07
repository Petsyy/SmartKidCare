import type { HydratedDocument } from "mongoose";
import { storeChildDocumentHashes } from "../../blockchain/services/blockchain.service";
import type { UploadResult } from "../../../shared/utils/upload-cloudinary";
import { extractUploadedDocument } from "../shared";
import { childRepository } from "../repositories/child.repository";
import type { ChildDocumentUploads, CreateChildRecordPayload, ChildAnchorResult, ChildRecordCreationResult } from "../types/child-record.types";

const buildDocumentsPayload = (uploads: ChildDocumentUploads) => {
  const birthCertificate = extractUploadedDocument(
    uploads.birthUpload || null,
    uploads.birthDocumentHash || null,
  );
  const parentId = extractUploadedDocument(
    uploads.parentUpload || null,
    uploads.parentIdDocumentHash || null,
  );

  if (!birthCertificate && !parentId) {
    return undefined;
  }

  return {
    birthCertificate,
    parentId,
  };
};

export const createChildRecord = async (
  payload: CreateChildRecordPayload,
  uploads: ChildDocumentUploads = {},
): Promise<ChildRecordCreationResult> => {
  const documents = buildDocumentsPayload(uploads);
  const child = await childRepository.create({
    ...payload,
    middleName: payload.middleName || undefined,
    parent: payload.parent || undefined,
    teacher: payload.teacher || undefined,
    daycareCenter: payload.daycareCenter || undefined,
    weight: payload.weight ?? null,
    height: payload.height ?? null,
    bmi: payload.bmi ?? null,
    nutritionalStatus: payload.nutritionalStatus ?? null,
    ...(documents ? { documents } : {}),
  });

  const documentsAnchor = await storeChildDocumentHashes(
    String(child.studentId || ""),
    uploads.birthDocumentHash || null,
    uploads.parentIdDocumentHash || null,
  ).catch(() => null);

  if (documentsAnchor) {
    child.documentIntegrity = {
      childIdHash: documentsAnchor.childIdHash,
      documentsHash: documentsAnchor.documentsHash,
      txHash: documentsAnchor.txHash,
      blockNumber: documentsAnchor.blockNumber,
      blockchainVerified: true,
      anchoredAt: new Date(),
    } as never;
    await child.save();
  }

  return { child, documentsAnchor };
};

export type {
  ChildDocumentUploads,
  CreateChildRecordPayload,
  ChildAnchorResult,
  ChildRecordCreationResult,
} from "../types/child-record.types";
