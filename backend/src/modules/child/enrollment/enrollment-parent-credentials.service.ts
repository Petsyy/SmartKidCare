import mongoose from "mongoose";
import ChildEnrollmentRequest from "../../../models/ChildEnrollmentRequest";
import { ForbiddenError, NotFoundError, ValidationError } from "../../../shared/errors/app-error";
import { normalizeString } from "../shared";
import { findParentByEmail, getParentCredentials, resetParentPassword } from "../services";

type AuthUser = {
  id?: string;
  role?: string;
};

const getAccessibleEnrollmentRequest = async (
  user: AuthUser | undefined,
  requestIdInput: unknown,
  unauthorizedMessage: string,
) => {
  if (!user?.id || (user.role !== "teacher" && user.role !== "admin")) {
    throw new ForbiddenError("Unauthorized.");
  }

  const requestId = normalizeString(requestIdInput);
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    throw new ValidationError("Invalid request ID");
  }

  const enrollmentRequest = await ChildEnrollmentRequest.findById(requestId)
    .select("requestedBy parent")
    .lean();
  if (!enrollmentRequest) {
    throw new NotFoundError("Enrollment request");
  }

  if (
    user.role === "teacher" &&
    String(enrollmentRequest.requestedBy || "") !== String(user.id)
  ) {
    throw new ForbiddenError(unauthorizedMessage);
  }

  return enrollmentRequest as {
    requestedBy: unknown;
    parent?: { email?: string };
  };
};

export const resetEnrollmentRequestParentPassword = async (
  user: AuthUser | undefined,
  requestIdInput: unknown,
) => {
  const enrollmentRequest = await getAccessibleEnrollmentRequest(
    user,
    requestIdInput,
    "You can only reset passwords for your own submissions.",
  );

  const parentEmail = String(enrollmentRequest.parent?.email || "")
    .trim()
    .toLowerCase();
  if (!parentEmail) {
    throw new ValidationError("Parent email is missing from this request.");
  }

  const parent = await findParentByEmail(parentEmail);
  if (!parent) {
    throw new NotFoundError("Parent account");
  }

  const credentials = await resetParentPassword(parent);

  return {
    message: "Parent password reset successfully.",
    credentials,
  };
};

export const getEnrollmentRequestParentCredentials = async (
  user: AuthUser | undefined,
  requestIdInput: unknown,
) => {
  const enrollmentRequest = await getAccessibleEnrollmentRequest(
    user,
    requestIdInput,
    "You can only view credentials for your own submissions.",
  );

  const parentEmail = String(enrollmentRequest.parent?.email || "")
    .trim()
    .toLowerCase();
  if (!parentEmail) {
    throw new ValidationError("Parent email is missing from this request.");
  }

  const parent = await findParentByEmail(parentEmail);
  if (!parent) {
    throw new NotFoundError("Parent account");
  }

  const credentials = getParentCredentials(parent);

  return {
    message: credentials.tempPassword
      ? "Parent credentials fetched successfully."
      : "Temporary password is unavailable because the parent has already updated it.",
    credentials,
  };
};
