import mongoose from "mongoose";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../../../shared/errors/app-error";
import { logger } from "../../../shared/lib/logger";
import { createChildRecord } from "../../child/services";
import { parentService } from "../../parents/services/parents.service";
import { normalizeString } from "../../../shared/utils/string.utils";
import { enrollmentChildRepository, enrollmentRequestRepository, } from "../repositories/enrollment.repository";
import { authUserRepository } from "../../auth/repositories/auth.repository";
import type { AuthUser } from "../types/enrollment-review.types";

const getRequestById = async (requestId: string) => {
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    throw new ValidationError("Invalid request ID");
  }

  const enrollmentRequest = await enrollmentRequestRepository.findByIdFull(requestId);
  if (!enrollmentRequest) {
    throw new NotFoundError("Enrollment request");
  }

  return enrollmentRequest;
};

export const reviewEnrollmentRequest = async (
  user: AuthUser | undefined,
  requestIdInput: unknown,
  body: Record<string, unknown>,
) => {
  if (!user?.id || user.role !== "admin") {
    throw new ForbiddenError("Admins only");
  }

  const requestId = normalizeString(requestIdInput);
  const decision = normalizeString(body.decision).toLowerCase();
  const reason = normalizeString(body.reason);

  if (decision !== "approved" && decision !== "rejected") {
    throw new ValidationError("Decision must be either 'approved' or 'rejected'");
  }

  const enrollmentRequest = await getRequestById(requestId);
  if (enrollmentRequest.status !== "pending") {
    throw new ConflictError(
      `This request is already ${enrollmentRequest.status}.`,
    );
  }

  if (decision === "rejected") {
    enrollmentRequest.status = "rejected";
    enrollmentRequest.review = {
      reviewedBy: new mongoose.Types.ObjectId(user.id),
      reviewedAt: new Date(),
      reason,
    } as never;
    await enrollmentRequest.save();

    return {
      message: "Enrollment request rejected.",
      request: enrollmentRequest,
    };
  }

  const childData = enrollmentRequest.child as {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    dateOfBirth?: Date;
    age?: number;
    gender?: string;
    homeAddress?: string;
    programType?: string;
    enrollmentDate?: Date;
    schoolYear?: string;
    weight?: number;
    height?: number;
    bmi?: number;
    nutritionalStatus?: string;
  };
  const parentData = enrollmentRequest.parent as {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    relationship?: string;
  };

  const existingChild = await enrollmentChildRepository.findDuplicate(
    String(childData.firstName || ""),
    String(childData.lastName || ""),
    childData.dateOfBirth as Date,
  );
  if (existingChild) {
    throw new ConflictError("Cannot approve because the child already exists.");
  }

  const normalizedParentEmail = String(parentData.email || "")
    .trim()
    .toLowerCase();
  let parent = await parentService.findParentByEmail(normalizedParentEmail);
  let tempPassword: string | null = null;
  let createdParentId: string | null = null;

  try {
    if (!parent) {
      const createdParent = await parentService.createParentAccount({
        firstName: String(parentData.firstName || "").trim(),
        middleName: String(parentData.middleName || "").trim() || undefined,
        lastName: String(parentData.lastName || "").trim(),
        email: normalizedParentEmail,
        phone: String(parentData.phone || "").trim(),
      });

      parent = createdParent.parent;
      tempPassword = createdParent.tempPassword;
      createdParentId = String(createdParent.parent._id);
    }

    const requestDocuments = enrollmentRequest.documents as {
      birthCertificate?: {
        publicId?: string;
        resourceType?: string;
        format?: string;
        hash?: string;
      };
      parentId?: {
        publicId?: string;
        resourceType?: string;
        format?: string;
        hash?: string;
      };
    };

    const created = await createChildRecord(
      {
        firstName: String(childData.firstName || "").trim(),
        middleName: String(childData.middleName || "").trim() || undefined,
        lastName: String(childData.lastName || "").trim(),
        dateOfBirth: new Date(childData.dateOfBirth as Date),
        age: Number(childData.age || 0),
        gender: String(childData.gender || "").trim(),
        homeAddress: String(childData.homeAddress || "").trim(),
        parentRelationship: String(parentData.relationship || "").trim(),
        programType: String(childData.programType || "").trim(),
        enrollmentDate: new Date(childData.enrollmentDate as Date),
        schoolYear: String(childData.schoolYear || "").trim(),
        weight: childData.weight ?? null,
        height: childData.height ?? null,
        bmi: childData.bmi ?? null,
        nutritionalStatus: childData.nutritionalStatus ?? null,
        status: "Active",
        studentId: String((enrollmentRequest as any).child?.studentId || "").trim() ||
          "",
        parent: parent._id,
        teacher: enrollmentRequest.requestedBy,
        daycareCenter: enrollmentRequest.daycareCenter || null,
      },
      {
        birthUpload: requestDocuments?.birthCertificate?.publicId
          ? {
            publicId: requestDocuments.birthCertificate.publicId,
            resourceType: String(
              requestDocuments.birthCertificate.resourceType || "image",
            ),
            format: String(requestDocuments.birthCertificate.format || "jpg"),
            bytes: 0,
          }
          : null,
        parentUpload: requestDocuments?.parentId?.publicId
          ? {
            publicId: requestDocuments.parentId.publicId,
            resourceType: String(requestDocuments.parentId.resourceType || "image"),
            format: String(requestDocuments.parentId.format || "jpg"),
            bytes: 0,
          }
          : null,
        birthDocumentHash: requestDocuments?.birthCertificate?.hash || null,
        parentIdDocumentHash: requestDocuments?.parentId?.hash || null,
      },
    );

    enrollmentRequest.status = "approved";
    enrollmentRequest.createdChild = created.child._id as never;
    enrollmentRequest.review = {
      reviewedBy: new mongoose.Types.ObjectId(user.id),
      reviewedAt: new Date(),
      reason,
    } as never;
    await enrollmentRequest.save();

    return {
      message: "Enrollment request approved and child enrolled successfully.",
      request: enrollmentRequest,
      child: created.child,
      documentAnchor: created.documentsAnchor,
      parentCredentials: {
        email: normalizedParentEmail,
        tempPassword,
      },
    };
  } catch (error) {
    if (createdParentId) {
      await authUserRepository.deleteById(createdParentId).catch((cleanupError: unknown) => {
        logger.error("Failed to clean up parent after enrollment approval error.", {
          parentId: createdParentId,
          error:
            cleanupError instanceof Error
              ? cleanupError.message
              : String(cleanupError),
        });
      });
    }

    throw error;
  }
};

export const deleteEnrollmentRequest = async (
  user: AuthUser | undefined,
  requestIdInput: unknown,
) => {
  if (!user?.id || user.role !== "admin") {
    throw new ForbiddenError("Admins only");
  }

  const requestId = normalizeString(requestIdInput);
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    throw new ValidationError("Invalid request ID");
  }

  const enrollmentRequest = await enrollmentRequestRepository.findByIdLean(requestId);
  if (!enrollmentRequest) {
    throw new NotFoundError("Enrollment request");
  }

  if (enrollmentRequest.status === "approved" || enrollmentRequest.createdChild) {
    throw new ConflictError(
      "Approved enrollment requests cannot be deleted because they are already linked to a child record.",
    );
  }

  await enrollmentRequestRepository.deleteById(requestId);

  return { message: "Enrollment request deleted successfully." };
};
