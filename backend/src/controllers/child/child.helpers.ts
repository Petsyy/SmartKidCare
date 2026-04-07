import mongoose from "mongoose";
import { Request } from "express";
import User from "../../models/Users";
import { UploadResult } from "../../utils/upload-cloudinary";

export type ChildDocumentKey = "birthCertificate" | "parentId";

export const ZERO_HASH =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

export const attachUploadedDocuments = (
  childData: any,
  birthUpload: UploadResult | null,
  parentUpload: UploadResult | null,
  birthHash?: string | null,
  parentIdHash?: string | null,
) => {
  if (!birthUpload && !parentUpload) {
    return;
  }

  childData.documents = {};

  if (birthUpload) {
    childData.documents.birthCertificate = {
      publicId: birthUpload.publicId,
      resourceType: birthUpload.resourceType,
      format: birthUpload.format,
      hash: birthHash || undefined,
    };
  }

  if (parentUpload) {
    childData.documents.parentId = {
      publicId: parentUpload.publicId,
      resourceType: parentUpload.resourceType,
      format: parentUpload.format,
      hash: parentIdHash || undefined,
    };
  }
};

export const ensureCanAccessChild = (child: any, req: Request): boolean => {
  if (!req.user?.id) {
    return false;
  }

  if (req.user.role === "admin") {
    return true;
  }

  if (req.user.role === "teacher") {
    return String(child?.teacher?._id || child?.teacher || "") === req.user.id;
  }

  if (req.user.role === "parent") {
    return String(child?.parent?._id || child?.parent || "") === req.user.id;
  }

  return false;
};

export const resolveDocumentField = (
  value: string,
): ChildDocumentKey | null => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (
    normalized === "birth-certificate" ||
    normalized === "birth_certificate" ||
    normalized === "birthcertificate"
  ) {
    return "birthCertificate";
  }

  if (
    normalized === "parent-id" ||
    normalized === "parent_id" ||
    normalized === "parentid"
  ) {
    return "parentId";
  }

  return null;
};

export const resolveTeacherId = async (
  value: unknown,
): Promise<mongoose.Types.ObjectId | null> => {
  const assignment = await resolveTeacherAssignment(value);
  return assignment?.teacherId || null;
};

export type TeacherAssignment = {
  teacherId: mongoose.Types.ObjectId;
  daycareCenterId: mongoose.Types.ObjectId | null;
};

export const resolveTeacherAssignment = async (
  value: unknown,
): Promise<TeacherAssignment | null> => {
  const normalizedTeacherId = String(value ?? "").trim();
  if (!normalizedTeacherId) {
    return null;
  }

  if (!mongoose.Types.ObjectId.isValid(normalizedTeacherId)) {
    throw new Error("invalid_teacher_id");
  }

  const teacher = await User.findOne({
    _id: normalizedTeacherId,
    role: "teacher",
    isActive: true,
  })
    .select("_id daycareCenter")
    .lean();

  if (!teacher) {
    throw new Error("teacher_not_found");
  }

  const assignedDaycareCenterId = (teacher as any)?.daycareCenter
    ? new mongoose.Types.ObjectId(String((teacher as any).daycareCenter))
    : null;

  return {
    teacherId: new mongoose.Types.ObjectId(normalizedTeacherId),
    daycareCenterId: assignedDaycareCenterId,
  };
};
