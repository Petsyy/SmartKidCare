import type { HydratedDocument } from "mongoose";
import { storeChildDocumentHashes } from "../../../blockchain/blockchain.service";
import type { UploadResult } from "../../../shared/utils/upload-cloudinary";
import { extractUploadedDocument } from "../shared";
import { childRepository } from "../child.repository";

export type ChildDocumentUploads = {
  birthUpload?: UploadResult | null;
  parentUpload?: UploadResult | null;
  birthDocumentHash?: string | null;
  parentIdDocumentHash?: string | null;
};

export type CreateChildRecordPayload = {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: Date | string;
  age: number;
  gender: string;
  programType: string;
  enrollmentDate: Date | string;
  schoolYear: string;
  status: string;
  studentId: string;
  parent?: import("mongoose").Types.ObjectId | string | null;
  teacher?: import("mongoose").Types.ObjectId | string | null;
  daycareCenter?: import("mongoose").Types.ObjectId | string | null;
};

export type ChildAnchorResult = Awaited<
  ReturnType<typeof storeChildDocumentHashes>
>;

export type ChildRecordCreationResult = {
  child: HydratedDocument<any>;
  documentsAnchor: ChildAnchorResult;
};

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
