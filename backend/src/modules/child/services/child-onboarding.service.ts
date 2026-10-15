import mongoose from "mongoose";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../../shared/errors/app-error";
import { logger } from "../../../shared/lib/logger";
import { type UploadResult } from "../../../shared/utils/upload-cloudinary";
import { storageService } from "../../../shared/services/storage.service";
import { hashFileBuffer } from "../../blockchain/utils/ethers";
import { generateStudentId } from "../../../shared/utils/generate-child-id";
import { extractUploadedDocument, resolveTeacherAssignment } from "../shared";
import { parseDate } from "../../../shared/utils/date.utils";
import { parentService } from "../../parents/services/parents.service";
import { childService } from "./child.service";
import { authUserRepository } from "../../auth/repositories/auth.repository";
import type { UploadedFiles } from "../types/child-onboarding.types";

export class ChildOnboardingService {
  private async cleanupUpload(upload: UploadResult | null) {
    await storageService.cleanupUpload(upload);
  }

  public async registerChild(body: Record<string, any>, files: UploadedFiles) {
    const birthFile = files?.birthCertificate?.[0];
    const parentIdFile = files?.parentId?.[0];
    const birthDocumentHash = birthFile
      ? hashFileBuffer(birthFile.buffer)
      : null;
    const parentIdDocumentHash = parentIdFile
      ? hashFileBuffer(parentIdFile.buffer)
      : null;

    const normalizedDateOfBirth = parseDate(body.dateOfBirth);
    const normalizedEnrollmentDate = parseDate(body.enrollmentDate);
    const hasParentInfo = Boolean(
      body.parentFirstName && body.parentLastName && body.parentEmail,
    );

    if (!normalizedDateOfBirth || !normalizedEnrollmentDate) {
      throw new ValidationError(
        "Invalid date format provided for birth or enrollment.",
      );
    }

    let resolvedTeacherId: mongoose.Types.ObjectId | null = null;
    let resolvedDaycareCenterId: mongoose.Types.ObjectId | null = null;

    if (body.teacherId) {
      try {
        const teacherAssignment = await resolveTeacherAssignment(
          body.teacherId,
        );
        resolvedTeacherId = teacherAssignment?.teacherId || null;
        resolvedDaycareCenterId = teacherAssignment?.daycareCenterId || null;
      } catch (error: unknown) {
        if (error instanceof Error && error.message === "invalid_teacher_id")
          throw new ValidationError("Invalid teacher ID");
        if (error instanceof Error && error.message === "teacher_not_found")
          throw new NotFoundError("Teacher");
        throw error;
      }
    }

    // Delegate check to child service
    await childService.ensureNoDuplicate(
      body.firstName,
      body.lastName,
      normalizedDateOfBirth,
    );

    const existingUserByEmail =
      hasParentInfo && body.parentEmail
        ? await parentService.findUserByEmail(body.parentEmail)
        : null;
    if (existingUserByEmail && existingUserByEmail.role !== "parent") {
      throw new ConflictError(
        "Parent email is already used by a non-parent account.",
      );
    }

    if (hasParentInfo && !existingUserByEmail && !body.parentPhone) {
      throw new ValidationError("Missing required parent phone number");
    }

    let birthUpload: UploadResult | null = null;
    let parentUpload: UploadResult | null = null;
    let createdParentId: string | null = null;
    let childRecord: any = null;

    try {
      // 1. Storage Service
      if (birthFile) {
        birthUpload = await storageService.uploadEncryptedDocument(
          birthFile.buffer,
          "child-records/birth-certificates",
          birthFile.mimetype,
          birthFile.originalname,
        );
      }
      if (parentIdFile) {
        parentUpload = await storageService.uploadEncryptedDocument(
          parentIdFile.buffer,
          "child-records/parent-ids",
          parentIdFile.mimetype,
          parentIdFile.originalname,
        );
      }

      const documents = {
        birthCertificate: extractUploadedDocument(
          birthUpload || null,
          birthDocumentHash || null,
        ),
        parentId: extractUploadedDocument(
          parentUpload || null,
          parentIdDocumentHash || null,
        ),
      };

      const payload = {
        firstName: body.firstName,
        middleName: body.middleName,
        lastName: body.lastName,
        dateOfBirth: normalizedDateOfBirth,
        age: body.age || 0,
        gender: body.gender,
        homeAddress: body.homeAddress,
        parentRelationship: body.parentRelationship,
        programType: body.programType,
        enrollmentDate: normalizedEnrollmentDate,
        schoolYear: body.schoolYear || "2024-2025",
        weight: body.weight ? Number(body.weight) : null,
        height: body.height ? Number(body.height) : null,
        status: body.status || "Active",
        studentId:
          body.studentId ||
          generateStudentId(normalizedEnrollmentDate.getFullYear()),
        teacher: resolvedTeacherId,
        daycareCenter: resolvedDaycareCenterId,
        documents:
          documents.birthCertificate || documents.parentId
            ? documents
            : undefined,
        documentIntegrity:
          documents.birthCertificate || documents.parentId
            ? {
                status: "pending",
                attemptCount: 0,
                nextAttemptAt: new Date(),
                blockchainVerified: false,
              }
            : undefined,
      };

      let parentCredentials: any = null;

      // 2. Parent Service (Inline integration)
      if (hasParentInfo) {
        if (existingUserByEmail) {
          (payload as any).parent = existingUserByEmail._id;
          parentCredentials = { email: body.parentEmail, tempPassword: null };
        } else {
          const createdParent = await parentService.createParentAccount({
            firstName: body.parentFirstName,
            middleName: body.parentMiddleName,
            lastName: body.parentLastName,
            email: body.parentEmail,
            phone: body.parentPhone,
          });
          createdParentId = String(createdParent.parent._id);
          (payload as any).parent = createdParent.parent._id;
          parentCredentials = {
            email: body.parentEmail,
            tempPassword: createdParent.tempPassword,
          };
        }
      }

      // 3. Child Service
      childRecord = await childService.createChild(payload);

      for (const [documentType, upload] of [
        ["birthCertificate", birthUpload],
        ["parentId", parentUpload],
      ] as const) {
        if (!upload) continue;
        logger.debug("Enrollment document encrypted and stored.", {
          childId: String(childRecord._id),
          documentType,
          keyId: String((upload as any).encryption?.keyId || "unknown"),
          operation: "encrypt_upload",
          outcome: "success",
        });
      }

      if (documents.birthCertificate || documents.parentId) {
        logger.debug(
          "[Blockchain] Enrollment documents queued for anchoring.",
          {
            childId: String(childRecord._id),
            status: "pending",
          },
        );
      }

      return { child: childRecord, parentCredentials, documentAnchor: null };
    } catch (error) {
      if (!childRecord && createdParentId) {
        // Rollback Parent
        await authUserRepository
          .deleteById(createdParentId)
          .catch((cleanupError: unknown) => {
            logger.error(
              "Failed to clean up parent after child creation error.",
              {
                parentId: createdParentId,
                error:
                  cleanupError instanceof Error
                    ? cleanupError.message
                    : String(cleanupError),
              },
            );
          });
      }
      if (!childRecord) {
        // Rollback Storage
        await this.cleanupUpload(birthUpload);
        await this.cleanupUpload(parentUpload);
      }
      throw error;
    }
  }
}

export const childOnboardingService = new ChildOnboardingService();

export type { UploadedFiles } from "../types/child-onboarding.types";
