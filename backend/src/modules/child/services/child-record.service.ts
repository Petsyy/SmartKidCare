import type { HydratedDocument } from "mongoose";
import { logger } from "../../../shared/lib/logger";
import type { UploadResult } from "../../../shared/utils/upload-cloudinary";
import { extractUploadedDocument } from "../shared";
import { childRepository } from "../repositories/child.repository";
import {
  calculateAgeInMonths,
  calculateBmi,
  classifyNutritionalStatus,
} from "../../../shared/utils/nutrition.utils";
import type {
  ChildDocumentUploads,
  CreateChildRecordPayload,
  ChildAnchorResult,
  ChildRecordCreationResult,
} from "../types/child-record.types";

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
  const weight = payload.weight ?? null;
  const height = payload.height ?? null;
  const bmi = weight && height ? calculateBmi(weight, height) : null;
  const nutritionalStatus =
    bmi && payload.gender
      ? classifyNutritionalStatus(
          bmi,
          calculateAgeInMonths(new Date(payload.dateOfBirth)),
          payload.gender as "male" | "female",
        )
      : null;
  const child = await childRepository.create({
    ...payload,
    middleName: payload.middleName || undefined,
    parent: payload.parent || undefined,
    teacher: payload.teacher || undefined,
    daycareCenter: payload.daycareCenter || undefined,
    weight,
    height,
    bmi,
    nutritionalStatus,
    ...(documents ? { documents } : {}),
    ...(documents
      ? {
          documentIntegrity: {
            status: "pending",
            attemptCount: 0,
            nextAttemptAt: new Date(),
            blockchainVerified: false,
          },
        }
      : {}),
  });

  if (documents) {
    logger.debug("[Blockchain] Enrollment documents queued for anchoring.", {
      childId: String(child._id),
      status: "pending",
    });
  }

  return { child, documentsAnchor: null };
};

export type {
  ChildDocumentUploads,
  CreateChildRecordPayload,
  ChildAnchorResult,
  ChildRecordCreationResult,
} from "../types/child-record.types";
