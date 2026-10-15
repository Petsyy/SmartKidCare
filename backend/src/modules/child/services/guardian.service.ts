import Child from "../../../models/Child";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "../../../shared/errors/app-error";
import { storageService } from "../../../shared/services/storage.service";
import { documentVerificationService } from "../../enrollment/services/document-verification.service";
import {
  generateSecureUrl,
  refreshGuardianMediaUrls,
} from "../../../shared/utils/generate-secure-url";

const attachGuardianUploads = async (
  guardianData: any,
  files?: Record<string, Express.Multer.File[] | undefined>,
) => {
  const {
    photoUrl: _photoUrl,
    photoPublicId: _photoPublicId,
    idUrl: _idUrl,
    idPublicId: _idPublicId,
    documentVerificationId: _documentVerificationId,
    idVerification: _idVerification,
    ...editableGuardianData
  } = guardianData;
  const nextGuardianData = { ...editableGuardianData };

  if (files?.guardianId?.[0]) {
    const file = files.guardianId[0];
    const upload = await storageService.uploadFile(
      file.buffer,
      "child-guardians/ids",
      file.mimetype,
      file.originalname,
    );

    nextGuardianData.idUrl = generateSecureUrl(
      upload.publicId,
      upload.resourceType,
      upload.format,
    );
    nextGuardianData.idPublicId = upload.publicId;
  }

  return nextGuardianData;
};

const guardianExpectedBody = (guardianData: any) => ({
  documentType: "guardianId" as const,
  guardianFirstName: guardianData.firstName,
  guardianLastName: guardianData.lastName,
});

const verificationMetadata = (record: any) => ({
  status: record.status,
  teacherConfirmed: Boolean(record.teacherConfirmed),
  modelVersion: record.modelVersion,
  policyVersion: record.policyVersion,
  reasonCodes: record.reasonCodes || [],
  confirmedBy: record.confirmedBy || null,
  confirmedAt: record.confirmedAt || null,
});

const normalizeGuardianName = (value: unknown) =>
  documentVerificationService.normalizeVerificationName(String(value || ""));

export const guardianIdentityRequiresVerification = (
  currentGuardian: {
    firstName?: string;
    middleName?: string | null;
    lastName?: string;
  } | null,
  nextGuardian: {
    firstName?: string;
    middleName?: string | null;
    lastName?: string;
  },
  hasNewIdFile: boolean,
) =>
  !currentGuardian ||
  hasNewIdFile ||
  normalizeGuardianName(currentGuardian.firstName) !==
    normalizeGuardianName(nextGuardian.firstName) ||
  normalizeGuardianName(currentGuardian.lastName) !==
    normalizeGuardianName(nextGuardian.lastName);

const sanitizeGuardian = (guardian: any) => {
  const value = guardian.toJSON ? guardian.toJSON() : guardian;
  const {
    idPublicId: _idPublicId,
    photoPublicId: _photoPublicId,
    ...safeGuardian
  } = refreshGuardianMediaUrls(value);
  return safeGuardian;
};

class GuardianService {
  public async addGuardian(
    user: any,
    childId: string,
    guardianData: any,
    files?: Record<string, Express.Multer.File[] | undefined>,
  ) {
    const child = await Child.findById(childId);
    if (!child) throw new NotFoundError("Child");
    if (child.status !== "Active") throw new ValidationError("This child is archived and cannot receive new records.");

    if (user.role === "parent") {
      throw new ForbiddenError(
        "Parents are not authorized to add guardians directly",
      );
    }

    if (
      user.role === "teacher" &&
      String(child.daycareCenter) !== String(user.daycareCenterId)
    ) {
      throw new ForbiddenError(
        "Not authorized to manage guardians for this child",
      );
    }

    if ((child.authorizedPickupPersons?.length || 0) >= 5) {
      throw new ValidationError("Maximum of 5 guardians allowed");
    }

    const guardianIdFile = files?.guardianId?.[0];
    if (!guardianIdFile || !guardianData.documentVerificationId) {
      throw new ValidationError(
        "Guardian ID verification is required before saving.",
      );
    }
    const verification =
      await documentVerificationService.assertEnrollmentVerification({
        id: guardianData.documentVerificationId,
        teacherId: user.id,
        documentType: "guardianId",
        file: guardianIdFile,
        expectedBody: guardianExpectedBody(guardianData),
      });

    child.authorizedPickupPersons = child.authorizedPickupPersons || [];
    const normalizedGuardian = await attachGuardianUploads(guardianData, files);
    if (!normalizedGuardian.idPublicId) {
      throw new ValidationError(
        "A government-issued photo ID is required for each guardian.",
      );
    }
    normalizedGuardian.idVerification = verificationMetadata(verification);
    child.authorizedPickupPersons.push(normalizedGuardian);
    await child.save();

    try {
      await documentVerificationService.consumeVerification(
        guardianData.documentVerificationId,
        user.id,
        String(child._id),
      );
    } catch (error) {
      child.authorizedPickupPersons.pop();
      await child.save();
      await storageService.deleteFile(normalizedGuardian.idPublicId, "image");
      throw error;
    }

    return child.authorizedPickupPersons.map(sanitizeGuardian);
  }

  public async updateGuardian(
    user: any,
    childId: string,
    guardianIndex: number,
    guardianData: any,
    files?: Record<string, Express.Multer.File[] | undefined>,
  ) {
    const child = await Child.findById(childId);
    if (!child) throw new NotFoundError("Child");
    if (child.status !== "Active") throw new ValidationError("This child is archived and cannot receive new records.");

    if (user.role === "parent") {
      throw new ForbiddenError(
        "Parents are not authorized to modify guardians directly",
      );
    }

    if (
      user.role === "teacher" &&
      String(child.daycareCenter) !== String(user.daycareCenterId)
    ) {
      throw new ForbiddenError(
        "Not authorized to manage guardians for this child",
      );
    }

    if (
      !child.authorizedPickupPersons ||
      !child.authorizedPickupPersons[guardianIndex]
    ) {
      throw new NotFoundError("Guardian");
    }

    const currentGuardian: any = child.authorizedPickupPersons[guardianIndex];
    const guardianIdFile = files?.guardianId?.[0];
    const nameChanged = guardianIdentityRequiresVerification(
      currentGuardian,
      guardianData,
      false,
    );
    const requiresVerification = guardianIdentityRequiresVerification(
      currentGuardian,
      guardianData,
      Boolean(guardianIdFile),
    );
    if (nameChanged && !guardianIdFile) {
      throw new ValidationError(
        "Upload and verify the guardian ID again after changing the guardian name.",
      );
    }
    if (requiresVerification && !guardianData.documentVerificationId) {
      throw new ValidationError(
        "Guardian ID verification is required before saving.",
      );
    }
    const verification = requiresVerification
      ? await documentVerificationService.assertEnrollmentVerification({
          id: guardianData.documentVerificationId,
          teacherId: user.id,
          documentType: "guardianId",
          file: guardianIdFile!,
          expectedBody: guardianExpectedBody(guardianData),
        })
      : null;
    const previousGuardian = currentGuardian.toObject
      ? currentGuardian.toObject()
      : { ...currentGuardian };

    const normalizedGuardian = await attachGuardianUploads(guardianData, files);
    if (verification)
      normalizedGuardian.idVerification = verificationMetadata(verification);

    // Mongoose doesn't track direct index assignment
    Object.assign(
      child.authorizedPickupPersons[guardianIndex],
      normalizedGuardian,
    );
    const updatedGuardian = child.authorizedPickupPersons[guardianIndex];
    if (!updatedGuardian.idPublicId && !updatedGuardian.idUrl) {
      throw new ValidationError(
        "A government-issued photo ID is required for each guardian.",
      );
    }
    child.markModified("authorizedPickupPersons");
    await child.save();

    if (verification) {
      try {
        await documentVerificationService.consumeVerification(
          guardianData.documentVerificationId,
          user.id,
          String(child._id),
        );
      } catch (error) {
        Object.assign(
          child.authorizedPickupPersons[guardianIndex],
          previousGuardian,
        );
        child.markModified("authorizedPickupPersons");
        await child.save();
        if (normalizedGuardian.idPublicId)
          await storageService.deleteFile(
            normalizedGuardian.idPublicId,
            "image",
          );
        throw error;
      }
    }

    return child.authorizedPickupPersons.map(sanitizeGuardian);
  }

  public async removeGuardian(
    user: any,
    childId: string,
    guardianIndex: number,
  ) {
    const child = await Child.findById(childId);
    if (!child) throw new NotFoundError("Child");
    if (child.status !== "Active") throw new ValidationError("This child is archived and cannot receive new records.");

    if (user.role === "parent") {
      throw new ForbiddenError(
        "Parents are not authorized to remove guardians directly",
      );
    }

    if (
      user.role === "teacher" &&
      String(child.daycareCenter) !== String(user.daycareCenterId)
    ) {
      throw new ForbiddenError(
        "Not authorized to manage guardians for this child",
      );
    }

    if (
      !child.authorizedPickupPersons ||
      !child.authorizedPickupPersons[guardianIndex]
    ) {
      throw new NotFoundError("Guardian");
    }

    child.authorizedPickupPersons[guardianIndex].isActive = false;
    child.markModified("authorizedPickupPersons");
    await child.save();
  }

  public async getGuardians(user: any, childId: string) {
    const child = await Child.findById(childId);
    if (!child) throw new NotFoundError("Child");

    if (user.role === "parent" && String(child.parent) !== String(user.id)) {
      throw new ForbiddenError(
        "Not authorized to view guardians for this child",
      );
    }

    if (
      user.role === "teacher" &&
      String(child.daycareCenter) !== String(user.daycareCenterId)
    ) {
      throw new ForbiddenError(
        "Not authorized to view guardians for this child",
      );
    }

    const allGuardians = child.authorizedPickupPersons || [];
    const activeGuardians = allGuardians.filter(
      (g: any) => g.isActive !== false,
    );
    return activeGuardians.map(sanitizeGuardian);
  }
}

export const guardianService = new GuardianService();
