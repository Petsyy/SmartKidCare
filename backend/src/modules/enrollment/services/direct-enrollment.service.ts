import type { Express } from "express";
import mongoose from "mongoose";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../../../shared/errors/app-error";
import { logger } from "../../../shared/lib/logger";
import { type UploadResult } from "../../../shared/utils/upload-cloudinary";
import { storageService } from "../../../shared/services/storage.service";
import { hashFileBuffer } from "../../blockchain/utils/ethers";
import { buildFullName, extractUploadedDocument, isChildGender, isChildProgramType, splitChildName } from "../../child/shared";
import { normalizeOptionalString, normalizeString } from "../../../shared/utils/string.utils";
import { computeAgeFromDate, parseDate } from "../../../shared/utils/date.utils";
import { createChildRecord } from "../../child/services";
import {
  calculateAgeInMonths,
  calculateBmi,
  classifyNutritionalStatus,
} from "../../../shared/utils/nutrition.utils";
import { parentService } from "../../parents/services/parents.service";
import { enrollmentChildRepository, enrollmentCenterRepository, enrollmentUserRepository } from "../repositories/enrollment.repository";
import { authUserRepository } from "../../auth/repositories/auth.repository";
import { childRepository } from "../../child/repositories/child.repository";
import NutritionRecord from "../../../models/NutritionRecord";
import { generateStudentId } from "../../../shared/utils/generate-child-id";
import type { AuthUser, UploadedFiles, SubmitEnrollmentRequestCommand as DirectEnrollmentCommand } from "../types/enrollment-submit.types";

export const directEnrollChild = async (
  command: DirectEnrollmentCommand,
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
  const homeAddress = normalizeString(command.body.homeAddress);
  const programType = normalizeOptionalString(command.body.programType);
  const daycareCenterIdInput = normalizeString(command.body.daycareCenterId);
  const schoolYear = normalizeString(command.body.schoolYear);
  const parentFirstName = normalizeString(command.body.parentFirstName);
  const parentMiddleName = normalizeOptionalString(command.body.parentMiddleName);
  const parentLastName = normalizeString(command.body.parentLastName);
  const parentPhone = normalizeString(command.body.parentPhone).replace(/\D/g, "");
  const parentRelationship = normalizeString(command.body.parentRelationship);
  const weight = command.body.weight ? Number(command.body.weight) : null;
  const height = command.body.height ? Number(command.body.height) : null;

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
    !parentPhone ||
    !homeAddress ||
    !parentRelationship ||
    weight === null ||
    height === null
  ) {
    throw new ValidationError("Missing required enrollment fields");
  }

  const allowedRelationships = ["Mother", "Father", "Guardian", "Grandparent", "Other"];
  if (!allowedRelationships.includes(parentRelationship)) {
    throw new ValidationError("A valid parent relationship is required.");
  }

  if (!Number.isFinite(inputAge) || inputAge <= 0) {
    throw new ValidationError("Age must be a valid number");
  }

  if (weight < 5 || weight > 50) {
    throw new ValidationError("Weight must be between 5 and 50 kg.");
  }

  if (height < 60 || height > 150) {
    throw new ValidationError("Height must be between 60 and 150 cm.");
  }

  const computedAge = computeAgeFromDate(dateOfBirth);
  if (computedAge < 3) {
    throw new ValidationError("Child must be at least 3 years old at enrollment.");
  }

  // Child must NOT turn 5 during the school year (June–March)
  const schoolYearMatch = /(\d{4})\s*[-–]\s*(\d{4})/.exec(schoolYear);
  if (schoolYearMatch) {
    const endYear = Number(schoolYearMatch[2]);
    const schoolYearEnd = new Date(endYear, 2, 31); // March 31

    const fifthBirthday = new Date(
      dateOfBirth.getFullYear() + 5,
      dateOfBirth.getMonth(),
      dateOfBirth.getDate(),
    );

    if (fifthBirthday <= schoolYearEnd) {
      throw new ValidationError(
        "Child must not turn 5 years old during the school year (June–March)."
      );
    }
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
      "You can only submit records for your assigned center.",
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

  const [existingParent, existingNonParentByPhone] = await Promise.all([
    parentService.findParentByIdentity(parentFirstName, parentLastName, parentPhone),
    parentService.findNonParentByPhone(parentPhone),
  ]);
  if (existingNonParentByPhone) {
    throw new ConflictError(
      "Phone number is already used by a non-parent account. Use a different parent phone number.",
    );
  }

  let birthUpload: UploadResult | null = null;
  let parentUpload: UploadResult | null = null;
  let createdParentId: string | null = null;
  let childCreated = false;

  try {
    if (birthFile) {
      birthUpload = await storageService.uploadFile(
        birthFile.buffer,
        "child-enrollment-requests/birth-certificates",
        birthFile.mimetype,
        birthFile.originalname,
      );
    }

    if (parentIdFile) {
      parentUpload = await storageService.uploadFile(
        parentIdFile.buffer,
        "child-enrollment-requests/parent-ids",
        parentIdFile.mimetype,
        parentIdFile.originalname,
      );
    }

    let parentCredentials = {
      email: existingParent?.email || "",
      phone: parentPhone,
      tempPassword: null as string | null,
    };

    let parentDbRecord = existingParent;

    if (!existingParent) {
      const createdParent = await parentService.createParentAccount({
        firstName: parentFirstName,
        middleName: parentMiddleName,
        lastName: parentLastName,
        email: "", // Will be auto-generated inside createParentAccount if not provided
        phone: parentPhone,
      });
      createdParentId = String(createdParent.parent._id);
      parentCredentials = {
        email: createdParent.parent.email,
        phone: parentPhone,
        tempPassword: createdParent.tempPassword,
      };
      parentDbRecord = createdParent.parent;
    }

    const calculatedBmi = calculateBmi(weight, height);
    const calculatedNutritionalStatus = classifyNutritionalStatus(
      calculatedBmi,
      calculateAgeInMonths(dateOfBirth, enrollmentDate),
      gender as "male" | "female",
    );

    const created = await createChildRecord(
      {
        firstName,
        middleName: middleName || undefined,
        lastName,
        dateOfBirth,
        age: computedAge,
        gender,
        homeAddress,
        parentRelationship,
        programType,
        enrollmentDate,
        schoolYear,
        weight,
        height,
        bmi: calculatedBmi,
        nutritionalStatus: calculatedNutritionalStatus,
        status: "Active",
        studentId: generateStudentId(enrollmentDate.getFullYear()),
        parent: parentDbRecord?._id,
        teacher: new mongoose.Types.ObjectId(command.user.id),
        daycareCenter: selectedCenter._id,
      },
      {
        birthUpload: birthUpload
          ? {
            publicId: birthUpload.publicId,
            resourceType: String(birthUpload.resourceType || "image"),
            format: String(birthUpload.format || "jpg"),
            bytes: birthUpload.bytes || 0,
          }
          : null,
        parentUpload: parentUpload
          ? {
            publicId: parentUpload.publicId,
            resourceType: String(parentUpload.resourceType || "image"),
            format: String(parentUpload.format || "jpg"),
            bytes: parentUpload.bytes || 0,
          }
          : null,
        birthDocumentHash,
        parentIdDocumentHash,
      },
    );

    if (weight != null && height != null) {
      await NutritionRecord.create({
        childId: created.child._id,
        schoolYear,
        period: "initial",
        recordedBy: new mongoose.Types.ObjectId(command.user.id),
        status: "submitted",
        weight,
        height,
        ageInMonths: calculateAgeInMonths(dateOfBirth, new Date()),
        sex: gender as "male" | "female",
        bmi: calculatedBmi === null ? undefined : calculatedBmi,
        nutritionalStatus: (calculatedNutritionalStatus === null ? undefined : calculatedNutritionalStatus) as any,
        measurementDate: new Date(),
        submittedAt: new Date(),
      });
    }

    childCreated = true;

    return {
      message: "Child enrolled successfully.",
      child: created.child,
      documentAnchor: created.documentsAnchor,
      parentCredentials,
    };
  } catch (error) {
    if (!childCreated && createdParentId) {
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

    if (!childCreated) {
      await storageService.cleanupUpload(birthUpload);
      await storageService.cleanupUpload(parentUpload);
    }

    throw error;
  }
};
