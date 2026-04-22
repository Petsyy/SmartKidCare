import mongoose from "mongoose";
import Child from "../../../models/Child";
import User from "../../../models/Users";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../../../shared/errors/AppError";
import { logger } from "../../../shared/lib/logger";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
  type UploadResult,
} from "../../../shared/utils/upload-cloudinary";
import { hashFileBuffer } from "../../../blockchain/ethers";
import { generateStudentId } from "../../../shared/utils/generate-child-id";
import { createChildRecord } from "./child-record.service";
import {
  CHILD_GENDERS,
  CHILD_PROGRAM_TYPES,
  isChildGender,
  isChildProgramType,
  normalizeEmail,
  normalizeOptionalString,
  parseDate,
} from "../shared";
import {
  createParentAccount,
  findUserByEmail,
} from "./parent-account.service";
import { resolveTeacherAssignment } from "../shared";

type AuthUser = {
  id?: string;
  role?: string;
};

type UploadedFiles =
  | {
      [fieldname: string]: Express.Multer.File[];
    }
  | undefined;

export type CreateChildCommand = {
  user?: AuthUser;
  body: Record<string, unknown>;
  files?: UploadedFiles;
};

export type CreateChildResult = {
  child: unknown;
  parentCredentials: {
    email: string;
    tempPassword: string | null;
  } | null;
  documentAnchor: unknown;
};

const cleanupUpload = async (upload: UploadResult | null) => {
  if (!upload) return;

  await deleteFromCloudinary(upload.publicId, upload.resourceType).catch(
    (error: unknown) => {
      logger.error("Failed to clean up child upload.", {
        publicId: upload.publicId,
        error: error instanceof Error ? error.message : String(error),
      });
    },
  );
};

export const createChildForAdmin = async (
  command: CreateChildCommand,
): Promise<CreateChildResult> => {
  if (command.user?.role !== "admin") {
    throw new ForbiddenError("Admins only");
  }

  const files = command.files;
  const birthFile = files?.birthCertificate?.[0];
  const parentIdFile = files?.parentId?.[0];
  const birthDocumentHash = birthFile ? hashFileBuffer(birthFile.buffer) : null;
  const parentIdDocumentHash = parentIdFile
    ? hashFileBuffer(parentIdFile.buffer)
    : null;

  logger.debug("createChild request received.", {
    hasBirthCertificate: Boolean(birthFile),
    hasParentId: Boolean(parentIdFile),
    allowedGenders: CHILD_GENDERS,
    allowedProgramTypes: CHILD_PROGRAM_TYPES,
  });

  const normalizedFirstName = normalizeOptionalString(command.body.firstName);
  const normalizedMiddleName = normalizeOptionalString(command.body.middleName);
  const normalizedLastName = normalizeOptionalString(command.body.lastName);
  const normalizedDateOfBirth = parseDate(command.body.dateOfBirth);
  const normalizedEnrollmentDate = parseDate(command.body.enrollmentDate);
  const normalizedProgramType = normalizeOptionalString(command.body.programType);
  const normalizedParentFirstName = normalizeOptionalString(
    command.body.parentFirstName,
  );
  const normalizedParentMiddleName = normalizeOptionalString(
    command.body.parentMiddleName,
  );
  const normalizedParentLastName = normalizeOptionalString(
    command.body.parentLastName,
  );
  const normalizedParentEmail = normalizeEmail(command.body.parentEmail);
  const normalizedParentPhone = normalizeOptionalString(command.body.parentPhone);
  const normalizedStudentId = normalizeOptionalString(command.body.studentId);
  const normalizedStatus =
    command.body.status === "Inactive" ? "Inactive" : "Active";
  const normalizedSchoolYear =
    normalizeOptionalString(command.body.schoolYear) || "2024-2025";
  const numericAge = Number(command.body.age);
  const normalizedAge =
    Number.isFinite(numericAge) && numericAge >= 0 ? numericAge : 0;
  const normalizedGender = String(command.body.gender || "male")
    .trim()
    .toLowerCase();
  const hasAnyParentInput = Boolean(
    normalizedParentFirstName ||
      normalizedParentMiddleName ||
      normalizedParentLastName ||
      normalizedParentEmail ||
      normalizedParentPhone,
  );
  const hasParentInfo = Boolean(
    normalizedParentFirstName &&
      normalizedParentLastName &&
      normalizedParentEmail,
  );

  if (
    !normalizedFirstName ||
    !normalizedLastName ||
    !normalizedDateOfBirth ||
    !normalizedEnrollmentDate
  ) {
    throw new ValidationError("Missing required child fields");
  }

  if (!normalizedProgramType || !isChildProgramType(normalizedProgramType)) {
    throw new ValidationError("A valid program type is required.");
  }

  if (!isChildGender(normalizedGender)) {
    throw new ValidationError("Gender must be either male or female.");
  }

  if (hasAnyParentInput && !hasParentInfo) {
    throw new ValidationError(
      "Parent first name, last name, and email are required together.",
    );
  }

  let resolvedTeacherId: mongoose.Types.ObjectId | null = null;
  let resolvedDaycareCenterId: mongoose.Types.ObjectId | null = null;
  try {
    const teacherAssignment = await resolveTeacherAssignment(command.body.teacherId);
    resolvedTeacherId = teacherAssignment?.teacherId || null;
    resolvedDaycareCenterId = teacherAssignment?.daycareCenterId || null;
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "invalid_teacher_id") {
      throw new ValidationError("Invalid teacher ID");
    }

    if (error instanceof Error && error.message === "teacher_not_found") {
      throw new NotFoundError("Teacher");
    }

    throw error;
  }

  const existingChild = await Child.findOne({
    firstName: normalizedFirstName,
    lastName: normalizedLastName,
    dateOfBirth: normalizedDateOfBirth,
  })
    .select("_id")
    .lean();

  if (existingChild) {
    throw new ConflictError("Child already exists");
  }

  const existingUserByEmail =
    hasParentInfo && normalizedParentEmail
      ? await findUserByEmail(normalizedParentEmail)
      : null;

  if (existingUserByEmail && existingUserByEmail.role !== "parent") {
    throw new ConflictError(
      "Parent email is already used by a non-parent account.",
    );
  }

  if (hasParentInfo && !existingUserByEmail && !normalizedParentPhone) {
    throw new ValidationError("Missing required parent phone number");
  }

  let birthUpload: UploadResult | null = null;
  let parentUpload: UploadResult | null = null;
  let createdParentId: string | null = null;
  let childCreated = false;

  try {
    if (birthFile) {
      birthUpload = await uploadToCloudinary(
        birthFile.buffer,
        "child-records/birth-certificates",
        birthFile.mimetype,
        birthFile.originalname,
      );
    }

    if (parentIdFile) {
      parentUpload = await uploadToCloudinary(
        parentIdFile.buffer,
        "child-records/parent-ids",
        parentIdFile.mimetype,
        parentIdFile.originalname,
      );
    }

    const payload = {
      firstName: normalizedFirstName,
      middleName: normalizedMiddleName,
      lastName: normalizedLastName,
      dateOfBirth: normalizedDateOfBirth,
      age: normalizedAge,
      gender: normalizedGender,
      programType: normalizedProgramType,
      enrollmentDate: normalizedEnrollmentDate,
      schoolYear: normalizedSchoolYear,
      status: normalizedStatus,
      studentId:
        normalizedStudentId ||
        generateStudentId(normalizedEnrollmentDate.getFullYear()),
      teacher: resolvedTeacherId,
      daycareCenter: resolvedDaycareCenterId,
    };

    if (!hasParentInfo) {
      const result = await createChildRecord(payload, {
        birthUpload,
        parentUpload,
        birthDocumentHash,
        parentIdDocumentHash,
      });
      childCreated = true;

      return {
        child: result.child,
        parentCredentials: null,
        documentAnchor: result.documentsAnchor,
      };
    }

    if (existingUserByEmail) {
      const result = await createChildRecord(
        {
          ...payload,
          parent: existingUserByEmail._id,
        },
        {
          birthUpload,
          parentUpload,
          birthDocumentHash,
          parentIdDocumentHash,
        },
      );
      childCreated = true;

      return {
        child: result.child,
        parentCredentials: {
          email: normalizedParentEmail!,
          tempPassword: null,
        },
        documentAnchor: result.documentsAnchor,
      };
    }

    const createdParent = await createParentAccount({
      firstName: normalizedParentFirstName!,
      middleName: normalizedParentMiddleName,
      lastName: normalizedParentLastName!,
      email: normalizedParentEmail!,
      phone: normalizedParentPhone!,
    });
    createdParentId = String(createdParent.parent._id);

    const result = await createChildRecord(
      {
        ...payload,
        parent: createdParent.parent._id,
      },
      {
        birthUpload,
        parentUpload,
        birthDocumentHash,
        parentIdDocumentHash,
      },
    );
    childCreated = true;

    return {
      child: result.child,
      parentCredentials: {
        email: normalizedParentEmail!,
        tempPassword: createdParent.tempPassword,
      },
      documentAnchor: result.documentsAnchor,
    };
  } catch (error) {
    if (!childCreated && createdParentId) {
      await User.findByIdAndDelete(createdParentId)
        .catch((cleanupError: unknown) => {
          logger.error("Failed to clean up parent after child creation error.", {
            parentId: createdParentId,
            error:
              cleanupError instanceof Error
                ? cleanupError.message
                : String(cleanupError),
          });
        });
    }

    if (!childCreated) {
      await cleanupUpload(birthUpload);
      await cleanupUpload(parentUpload);
    }

    throw error;
  }
};
