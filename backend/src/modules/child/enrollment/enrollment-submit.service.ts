import type { Express } from "express";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../../shared/errors/app-error";
import { logger } from "../../../shared/lib/logger";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
  type UploadResult,
} from "../../../shared/utils/upload-cloudinary";
import { hashFileBuffer } from "../../../blockchain/ethers";
import {
  buildFullName,
  computeAgeFromDate,
  extractUploadedDocument,
  isChildGender,
  isChildProgramType,
  normalizeEmail,
  normalizeOptionalString,
  normalizeString,
  parseDate,
  splitChildName,
} from "../shared";
import { createParentAccount, findUserByEmail } from "../services";
import {
  enrollmentChildRepository,
  enrollmentRequestRepository,
  enrollmentCenterRepository,
  enrollmentUserRepository,
} from "./enrollment.repository";
import { authUserRepository } from "../../auth/auth.repository";

type AuthUser = {
  id?: string;
  role?: string;
};

type UploadedFiles =
  | {
      [fieldname: string]: Express.Multer.File[];
    }
  | undefined;

export type SubmitEnrollmentRequestCommand = {
  user?: AuthUser;
  body: Record<string, unknown>;
  files?: UploadedFiles;
};

export const submitChildEnrollmentRequest = async (
  command: SubmitEnrollmentRequestCommand,
) => {
  if (!command.user?.id || command.user.role !== "teacher") {
    throw new ForbiddenError("Teachers only");
  }

  const files = command.files;
  const birthFile = files?.birthCertificate?.[0];
  const parentIdFile = files?.parentId?.[0];
  const birthDocumentHash = birthFile ? hashFileBuffer(birthFile.buffer) : null;
  const parentIdDocumentHash = parentIdFile
    ? hashFileBuffer(parentIdFile.buffer)
    : null;

  let firstName = normalizeString(command.body.firstName);
  let middleName = normalizeOptionalString(command.body.middleName);
  let lastName = normalizeString(command.body.lastName);
  const childNameInput = normalizeString(command.body.childName);
  const parsedName = childNameInput ? splitChildName(childNameInput) : null;

  if ((!firstName || !lastName) && parsedName) {
    firstName = parsedName.firstName;
    middleName = parsedName.middleName;
    lastName = parsedName.lastName;
  }

  const dateOfBirth = parseDate(command.body.dateOfBirth);
  const enrollmentDate = parseDate(command.body.enrollmentDate);
  const inputAge = Number(command.body.age);
  const gender = normalizeString(command.body.gender).toLowerCase();
  const programType = normalizeOptionalString(command.body.programType);
  const daycareCenterIdInput = normalizeString(command.body.daycareCenterId);
  const schoolYear = normalizeString(command.body.schoolYear);
  const parentFirstName = normalizeString(command.body.parentFirstName);
  const parentMiddleName = normalizeOptionalString(command.body.parentMiddleName);
  const parentLastName = normalizeString(command.body.parentLastName);
  const parentEmail = normalizeEmail(command.body.parentEmail);
  const parentPhone = normalizeString(command.body.parentPhone);

  if (
    !firstName ||
    !lastName ||
    !dateOfBirth ||
    !enrollmentDate ||
    !daycareCenterIdInput ||
    !programType ||
    !schoolYear ||
    !parentFirstName ||
    !parentLastName ||
    !parentEmail ||
    !parentPhone
  ) {
    throw new ValidationError("Missing required enrollment request fields");
  }

  if (!Number.isFinite(inputAge) || inputAge <= 0) {
    throw new ValidationError("Age must be a valid number");
  }

  const computedAge = computeAgeFromDate(dateOfBirth);
  if (computedAge < 3 || computedAge > 5) {
    throw new ValidationError("Child age must be between 3 and 5 years old only.");
  }

  if (Math.abs(inputAge - computedAge) > 1) {
    throw new ValidationError(
      "Submitted age does not match the provided date of birth.",
    );
  }

  if (!isChildGender(gender)) {
    throw new ValidationError("Gender must be either 'male' or 'female'");
  }

  if (!isChildProgramType(programType)) {
    throw new ValidationError(
      "Program type must be either '4Ps Beneficiary' or 'Regular Enrollee (Non-beneficiary)'",
    );
  }

  if (!daycareCenterIdInput || !/^[a-f\d]{24}$/i.test(daycareCenterIdInput)) {
    throw new ValidationError("Invalid assigned center.");
  }

  const selectedCenter = await enrollmentCenterRepository.findActiveById(daycareCenterIdInput);
  if (!selectedCenter || selectedCenter.isActive === false) {
    throw new NotFoundError("Selected center");
  }

  const requestingTeacher = await enrollmentUserRepository.findTeacherById(command.user.id);
  const teacherCenterId = String(requestingTeacher?.daycareCenter || "");

  if (!teacherCenterId) {
    throw new ValidationError(
      "Your teacher account has no assigned center. Ask an admin to assign one first.",
    );
  }

  if (teacherCenterId !== String(selectedCenter._id)) {
    throw new ForbiddenError(
      "You can only submit requests for your assigned center.",
    );
  }

  const existingChild = await enrollmentChildRepository.findDuplicate(
    firstName,
    lastName,
    dateOfBirth,
  );
  if (existingChild) {
    throw new ConflictError("Child already exists in the enrolled records.");
  }

  const existingPendingRequest = await enrollmentRequestRepository.findPendingDuplicate(
    firstName,
    lastName,
    dateOfBirth,
  );
  if (existingPendingRequest) {
    throw new ConflictError("A pending enrollment request already exists.");
  }

  const existingUserByEmail = await findUserByEmail(parentEmail);
  if (existingUserByEmail && existingUserByEmail.role !== "parent") {
    throw new ConflictError(
      "Email is already used by a non-parent account. Use a different parent email.",
    );
  }

  let birthUpload: UploadResult | null = null;
  let parentUpload: UploadResult | null = null;
  let createdParentId: string | null = null;
  let requestCreated = false;

  try {
    if (birthFile) {
      birthUpload = await uploadToCloudinary(
        birthFile.buffer,
        "child-enrollment-requests/birth-certificates",
        birthFile.mimetype,
        birthFile.originalname,
      );
    }

    if (parentIdFile) {
      parentUpload = await uploadToCloudinary(
        parentIdFile.buffer,
        "child-enrollment-requests/parent-ids",
        parentIdFile.mimetype,
        parentIdFile.originalname,
      );
    }

    let parentCredentials = {
      email: parentEmail,
      phone: parentPhone,
      tempPassword: null as string | null,
    };

    if (!existingUserByEmail) {
      const createdParent = await createParentAccount({
        firstName: parentFirstName,
        middleName: parentMiddleName,
        lastName: parentLastName,
        email: parentEmail,
        phone: parentPhone,
      });
      createdParentId = String(createdParent.parent._id);
      parentCredentials = {
        email: parentEmail,
        phone: parentPhone,
        tempPassword: createdParent.tempPassword,
      };
    }

    const enrollmentRequest = await enrollmentRequestRepository.create({
      requestedBy: command.user.id,
      status: "pending",
      daycareCenter: selectedCenter._id,
      child: {
        fullName: buildFullName([firstName, middleName, lastName]),
        firstName,
        middleName,
        lastName,
        dateOfBirth,
        age: computedAge,
        gender,
        programType,
        enrollmentDate,
        schoolYear,
      },
      parent: {
        firstName: parentFirstName,
        middleName: parentMiddleName,
        lastName: parentLastName,
        email: parentEmail,
        phone: parentPhone,
      },
      documents: {
        birthCertificate: extractUploadedDocument(
          birthUpload,
          birthDocumentHash,
        ),
        parentId: extractUploadedDocument(parentUpload, parentIdDocumentHash),
      },
    });
    requestCreated = true;

    return {
      message: "Enrollment request submitted for admin review.",
      request: enrollmentRequest,
      parentCredentials,
    };
  } catch (error) {
    if (!requestCreated && createdParentId) {
      await authUserRepository.deleteById(createdParentId).catch((cleanupError: unknown) => {
        logger.error("Failed to clean up parent after enrollment error.", {
          parentId: createdParentId,
          error:
            cleanupError instanceof Error
              ? cleanupError.message
              : String(cleanupError),
        });
      });
    }

    if (!requestCreated) {
      if (birthUpload) {
        await deleteFromCloudinary(
          birthUpload.publicId,
          birthUpload.resourceType,
        ).catch(() => undefined);
      }

      if (parentUpload) {
        await deleteFromCloudinary(
          parentUpload.publicId,
          parentUpload.resourceType,
        ).catch(() => undefined);
      }
    }

    throw error;
  }
};
