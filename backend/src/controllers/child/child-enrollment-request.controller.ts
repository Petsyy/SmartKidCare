import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Child from "../../models/Child";
import User from "../../models/Users";
import ChildEnrollmentRequest from "../../models/ChildEnrollmentRequest";
import ChildDevelopmentCenter from "../../models/ChildDevelopmentCenter";
import { generateStudentId } from "../../utils/generateStudentId";
import {
  uploadToCloudinary,
  type UploadResult,
} from "../../utils/uploadToCloudinary";
import { hashFileBuffer } from "../../blockchain/ethers";
import { storeChildDocumentHashes } from "../../services/blockchain/blockchain.service";

const normalizeString = (value: unknown): string => String(value ?? "").trim();

const normalizeOptionalString = (value: unknown): string | undefined => {
  const normalized = normalizeString(value);
  return normalized ? normalized : undefined;
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseDate = (value: unknown): Date | null => {
  const normalized = normalizeString(value);
  if (!normalized) return null;

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const computeAgeFromDate = (value: Date): number => {
  // Use Asia/Manila (GMT+8) for "now" to match user's local context (PH center)
  const phTimeStr = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Manila",
  });
  const now = new Date(phTimeStr);

  let age = now.getFullYear() - value.getFullYear();
  const monthDiff = now.getMonth() - value.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < value.getDate())) {
    age -= 1;
  }

  return Math.max(0, age);
};

const splitChildName = (
  rawFullName: string,
):
  | {
      fullName: string;
      firstName: string;
      middleName?: string;
      lastName: string;
    }
  | null => {
  const tokens = rawFullName
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (tokens.length < 2) return null;

  const firstName = tokens[0];
  const lastName = tokens[tokens.length - 1];
  const middleName =
    tokens.length > 2 ? tokens.slice(1, tokens.length - 1).join(" ") : undefined;

  return {
    fullName: tokens.join(" "),
    firstName,
    middleName,
    lastName,
  };
};

const extractDocument = (upload: UploadResult | null, hash: string | null) => {
  if (!upload && !hash) {
    return undefined;
  }

  return {
    publicId: upload?.publicId,
    resourceType: upload?.resourceType,
    format: upload?.format,
    hash: hash || undefined,
  };
};

export const submitChildEnrollmentRequest = async (
  req: Request,
  res: Response,
) => {
  try {
    if (!req.user?.id || req.user.role !== "teacher") {
      return res.status(403).json({ message: "Teachers only" });
    }

    const files = req.files as
      | {
          [fieldname: string]: Express.Multer.File[];
        }
      | undefined;

    const birthFile = files?.birthCertificate?.[0];
    const parentIdFile = files?.parentId?.[0];
    const birthDocumentHash = birthFile ? hashFileBuffer(birthFile.buffer) : null;
    const parentIdDocumentHash = parentIdFile
      ? hashFileBuffer(parentIdFile.buffer)
      : null;

    let firstName = normalizeString(req.body.firstName);
    let middleName = normalizeOptionalString(req.body.middleName);
    let lastName = normalizeString(req.body.lastName);
    const childNameInput = normalizeString(req.body.childName);
    const parsedName = childNameInput ? splitChildName(childNameInput) : null;

    if ((!firstName || !lastName) && parsedName) {
      firstName = parsedName.firstName;
      middleName = parsedName.middleName;
      lastName = parsedName.lastName;
    }
    const dateOfBirth = parseDate(req.body.dateOfBirth);
    const age = Number(req.body.age);
    const gender = normalizeString(req.body.gender).toLowerCase();
    const programType = normalizeString(req.body.programType);
    const daycareCenterIdInput = normalizeString(req.body.daycareCenterId);
    const enrollmentDate = parseDate(req.body.enrollmentDate);
    const schoolYear = normalizeString(req.body.schoolYear);
    const parentFirstName = normalizeString(req.body.parentFirstName);
    const parentMiddleName = normalizeOptionalString(req.body.parentMiddleName);
    const parentLastName = normalizeString(req.body.parentLastName);
    const parentEmail = normalizeString(req.body.parentEmail).toLowerCase();
    const parentPhone = normalizeString(req.body.parentPhone);

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
      return res.status(400).json({
        message: "Missing required enrollment request fields",
      });
    }

    const fullName = [firstName, middleName, lastName]
      .filter((value) => String(value || "").trim().length > 0)
      .join(" ");

    if (!Number.isFinite(age) || age <= 0) {
      return res.status(400).json({ message: "Age must be a valid number" });
    }

    const computedAge = dateOfBirth ? computeAgeFromDate(dateOfBirth) : 0;
    if (computedAge < 3 || computedAge > 5) {
      return res.status(400).json({
        message: "Child age must be between 3 and 5 years old only.",
      });
    }

    // Relaxed check: Allow +/- 1 difference due to client/server "now" drift,
    // but use the server's computed age for validity and recording.
    if (Math.abs(age - computedAge) > 1) {
      return res.status(400).json({
        message: "Submitted age does not match the provided date of birth.",
      });
    }

    if (gender !== "male" && gender !== "female") {
      return res
        .status(400)
        .json({ message: "Gender must be either 'male' or 'female'" });
    }

    if (
      programType !== "4Ps Beneficiary" &&
      programType !== "Regular Enrollee (Non-beneficiary)"
    ) {
      return res.status(400).json({
        message:
          "Program type must be either '4Ps Beneficiary' or 'Regular Enrollee (Non-beneficiary)'",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(daycareCenterIdInput)) {
      return res.status(400).json({ message: "Invalid assigned center." });
    }

    const selectedCenter = await ChildDevelopmentCenter.findById(daycareCenterIdInput)
      .select("_id isActive")
      .lean();
    if (!selectedCenter || selectedCenter.isActive === false) {
      return res.status(404).json({ message: "Selected center not found." });
    }

    const requestingTeacher = await User.findById(req.user.id)
      .select("daycareCenter")
      .lean();
    const teacherCenterId = String(requestingTeacher?.daycareCenter || "");

    if (!teacherCenterId) {
      return res.status(400).json({
        message:
          "Your teacher account has no assigned center. Ask an admin to assign one first.",
      });
    }

    if (teacherCenterId !== String(selectedCenter._id)) {
      return res.status(403).json({
        message: "You can only submit requests for your assigned center.",
      });
    }

    const daycareCenterId = selectedCenter._id as mongoose.Types.ObjectId;

    const existingChild = await Child.findOne({
      firstName: {
        $regex: `^${escapeRegex(firstName)}$`,
        $options: "i",
      },
      lastName: {
        $regex: `^${escapeRegex(lastName)}$`,
        $options: "i",
      },
      dateOfBirth,
    })
      .select("_id")
      .lean();

    if (existingChild) {
      return res
        .status(409)
        .json({ message: "Child already exists in the enrolled records." });
    }

    const existingPendingRequest = await ChildEnrollmentRequest.findOne({
      status: "pending",
      "child.firstName": {
        $regex: `^${escapeRegex(firstName)}$`,
        $options: "i",
      },
      "child.lastName": {
        $regex: `^${escapeRegex(lastName)}$`,
        $options: "i",
      },
      "child.dateOfBirth": dateOfBirth,
    })
      .select("_id")
      .lean();

    if (existingPendingRequest) {
      return res
        .status(409)
        .json({ message: "A pending enrollment request already exists." });
    }

    const existingUserByEmail = await User.findOne({
      email: {
        $regex: `^${escapeRegex(parentEmail)}$`,
        $options: "i",
      },
    });

    if (existingUserByEmail && existingUserByEmail.role !== "parent") {
      return res.status(409).json({
        message:
          "Email is already used by a non-parent account. Use a different parent email.",
      });
    }

    let birthUpload: UploadResult | null = null;
    let parentUpload: UploadResult | null = null;

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

    let parentCredentials: {
      email: string;
      phone: string;
      tempPassword: string | null;
    } = {
      email: parentEmail,
      phone: parentPhone,
      tempPassword: null,
    };

    if (!existingUserByEmail) {
      const tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      await User.create({
        firstName: parentFirstName,
        middleName: parentMiddleName || "",
        lastName: parentLastName,
        email: parentEmail,
        phone: parentPhone,
        password: hashedPassword,
        role: "parent",
        mustChangePassword: true,
        needsToConfirmLink: true,
        latestTempPassword: tempPassword,
        latestTempPasswordIssuedAt: new Date(),
      });

      parentCredentials = {
        email: parentEmail,
        phone: parentPhone,
        tempPassword,
      };
    }

    const enrollmentRequest = await ChildEnrollmentRequest.create({
      requestedBy: req.user.id,
      status: "pending",
      daycareCenter: daycareCenterId,
      child: {
        fullName,
        firstName,
        middleName,
        lastName,
        dateOfBirth,
        age: Number(age),
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
        birthCertificate: extractDocument(birthUpload, birthDocumentHash),
        parentId: extractDocument(parentUpload, parentIdDocumentHash),
      },
    });

    return res.status(201).json({
      message: "Enrollment request submitted for admin review.",
      request: enrollmentRequest,
      parentCredentials,
    });
  } catch (error: any) {
    console.error("Submit enrollment request error:", error);
    return res.status(500).json({
      message: "Failed to submit enrollment request",
      error: error?.message,
    });
  }
};

export const getEnrollmentCenters = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id || req.user.role !== "teacher") {
      return res.status(403).json({ message: "Teachers only" });
    }

    const teacher = await User.findById(req.user.id).select("daycareCenter").lean();
    if (!teacher?.daycareCenter) {
      return res.json({ centers: [] });
    }

    const centers = await ChildDevelopmentCenter.find({
      _id: teacher.daycareCenter,
      isActive: true,
    })
      .select("_id name barangay code isActive")
      .sort({ barangay: 1, name: 1 })
      .lean();

    return res.json({ centers });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to fetch enrollment centers",
      error: error?.message,
    });
  }
};

export const getEnrollmentRequests = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    const status = normalizeString(req.query.status).toLowerCase();
    const filter: Record<string, unknown> = {};

    if (status === "pending" || status === "approved" || status === "rejected") {
      filter.status = status;
    }

    const requests = await ChildEnrollmentRequest.find(filter)
      .populate("requestedBy", "firstName middleName lastName email")
      .populate("daycareCenter", "name barangay code isActive")
      .populate("review.reviewedBy", "firstName middleName lastName email")
      .populate(
        "createdChild",
        "firstName middleName lastName studentId documentIntegrity",
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ requests });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to fetch enrollment requests",
      error: error?.message,
    });
  }
};

export const getMyEnrollmentRequests = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id || req.user.role !== "teacher") {
      return res.status(403).json({ message: "Teachers only" });
    }

    const requests = await ChildEnrollmentRequest.find({
      requestedBy: req.user.id,
    })
      .populate("daycareCenter", "name barangay code isActive")
      .populate("review.reviewedBy", "firstName middleName lastName email")
      .populate(
        "createdChild",
        "firstName middleName lastName studentId documentIntegrity",
      )
      .sort({ createdAt: -1 })
      .lean();

    const parentEmails = [
      ...new Set(
        (requests as Array<{ parent?: { email?: string } }>)
          .map((r) => String(r.parent?.email || "").trim().toLowerCase())
          .filter(Boolean),
      ),
    ];

    const parentUsers = parentEmails.length
      ? await User.find({
          role: "parent",
          email: { $in: parentEmails },
        })
          .select("email mustChangePassword")
          .lean()
      : [];

    const mustChangeByEmail = new Map<string, boolean>();
    for (const u of parentUsers) {
      mustChangeByEmail.set(
        String((u as { email?: string }).email || "").toLowerCase(),
        Boolean((u as { mustChangePassword?: boolean }).mustChangePassword),
      );
    }

    const requestsWithResetUi = (requests as Record<string, unknown>[]).map(
      (row) => {
        const email = String(
          (row as { parent?: { email?: string } }).parent?.email || "",
        )
          .trim()
          .toLowerCase();
        const mustChange = email ? mustChangeByEmail.get(email) : undefined;
        return {
          ...row,
          showResetParentPassword: mustChange === true,
        };
      },
    );

    return res.json({ requests: requestsWithResetUi });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to fetch your enrollment requests",
      error: error?.message,
    });
  }
};

export const reviewEnrollmentRequest = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    const requestId = normalizeString(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: "Invalid request ID" });
    }

    const decision = normalizeString(req.body.decision).toLowerCase();
    const reason = normalizeString(req.body.reason);

    if (decision !== "approved" && decision !== "rejected") {
      return res.status(400).json({
        message: "Decision must be either 'approved' or 'rejected'",
      });
    }

    const enrollmentRequest = await ChildEnrollmentRequest.findById(requestId);
    if (!enrollmentRequest) {
      return res.status(404).json({ message: "Enrollment request not found" });
    }

    if (enrollmentRequest.status !== "pending") {
      return res.status(409).json({
        message: `This request is already ${enrollmentRequest.status}.`,
      });
    }

    if (decision === "rejected") {
      enrollmentRequest.status = "rejected";
      enrollmentRequest.review = {
        reviewedBy: new mongoose.Types.ObjectId(req.user.id),
        reviewedAt: new Date(),
        reason,
      } as any;
      await enrollmentRequest.save();

      return res.json({
        message: "Enrollment request rejected.",
        request: enrollmentRequest,
      });
    }

    const childData = enrollmentRequest.child as any;
    const parentData = enrollmentRequest.parent as any;

    const existingChild = await Child.findOne({
      firstName: {
        $regex: `^${escapeRegex(String(childData.firstName || ""))}$`,
        $options: "i",
      },
      lastName: {
        $regex: `^${escapeRegex(String(childData.lastName || ""))}$`,
        $options: "i",
      },
      dateOfBirth: childData.dateOfBirth,
    })
      .select("_id")
      .lean();

    if (existingChild) {
      return res.status(409).json({
        message: "Cannot approve because the child already exists.",
      });
    }

    const normalizedParentEmail = String(parentData.email || "")
      .trim()
      .toLowerCase();
    const existingParent = await User.findOne({
      email: {
        $regex: `^${escapeRegex(normalizedParentEmail)}$`,
        $options: "i",
      },
    });

    let parent = existingParent;
    let tempPassword: string | null = null;

    if (!parent) {
      tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      parent = await User.create({
        firstName: String(parentData.firstName || "").trim(),
        middleName: String(parentData.middleName || "").trim(),
        lastName: String(parentData.lastName || "").trim(),
        email: normalizedParentEmail,
        phone: String(parentData.phone || "").trim(),
        password: hashedPassword,
        role: "parent",
        mustChangePassword: true,
        needsToConfirmLink: true,
      });
    }

    const enrollmentDate = new Date(childData.enrollmentDate);
    const enrollmentYear = enrollmentDate.getFullYear();
    const requestDocuments = enrollmentRequest.documents as any;
    const daycareCenterId = enrollmentRequest.daycareCenter || null;

    const payload: any = {
      firstName: String(childData.firstName || "").trim(),
      middleName: String(childData.middleName || "").trim() || undefined,
      lastName: String(childData.lastName || "").trim(),
      dateOfBirth: new Date(childData.dateOfBirth),
      age: Number(childData.age || 0),
      gender: childData.gender,
      programType: String(childData.programType || "").trim(),
      enrollmentDate,
      schoolYear: String(childData.schoolYear || "").trim(),
      status: "Active",
      studentId: generateStudentId(enrollmentYear),
      parent: parent._id,
      teacher: enrollmentRequest.requestedBy,
      daycareCenter: daycareCenterId,
    };

    if (requestDocuments?.birthCertificate || requestDocuments?.parentId) {
      payload.documents = {};

      if (requestDocuments?.birthCertificate) {
        payload.documents.birthCertificate = {
          publicId: requestDocuments.birthCertificate.publicId,
          resourceType: requestDocuments.birthCertificate.resourceType,
          format: requestDocuments.birthCertificate.format,
          hash: requestDocuments.birthCertificate.hash,
        };
      }

      if (requestDocuments?.parentId) {
        payload.documents.parentId = {
          publicId: requestDocuments.parentId.publicId,
          resourceType: requestDocuments.parentId.resourceType,
          format: requestDocuments.parentId.format,
          hash: requestDocuments.parentId.hash,
        };
      }
    }

    const child = await Child.create(payload);
    const documentsAnchor = await storeChildDocumentHashes(
      String(child.studentId || ""),
      requestDocuments?.birthCertificate?.hash,
      requestDocuments?.parentId?.hash,
    ).catch((error) => {
      console.error("Enrollment request document anchor failed:", error);
      return null;
    });

    if (documentsAnchor) {
      child.documentIntegrity = {
        childIdHash: documentsAnchor.childIdHash,
        documentsHash: documentsAnchor.documentsHash,
        txHash: documentsAnchor.txHash,
        blockNumber: documentsAnchor.blockNumber,
        blockchainVerified: true,
        anchoredAt: new Date(),
      } as any;
      await child.save();
    }

    enrollmentRequest.status = "approved";
    enrollmentRequest.createdChild = child._id;
    enrollmentRequest.review = {
      reviewedBy: new mongoose.Types.ObjectId(req.user.id),
      reviewedAt: new Date(),
      reason,
    } as any;
    await enrollmentRequest.save();

    return res.json({
      message: "Enrollment request approved and child enrolled successfully.",
      request: enrollmentRequest,
      child,
      documentAnchor: documentsAnchor,
      parentCredentials: {
        email: normalizedParentEmail,
        tempPassword,
      },
    });
  } catch (error: any) {
    console.error("Review enrollment request error:", error);
    return res.status(500).json({
      message: "Failed to review enrollment request",
      error: error?.message,
    });
  }
};

export const deleteEnrollmentRequest = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    const requestId = normalizeString(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: "Invalid request ID" });
    }

    const enrollmentRequest = await ChildEnrollmentRequest.findById(requestId)
      .select("status createdChild")
      .lean();

    if (!enrollmentRequest) {
      return res.status(404).json({ message: "Enrollment request not found" });
    }

    if (enrollmentRequest.status === "approved" || enrollmentRequest.createdChild) {
      return res.status(409).json({
        message:
          "Approved enrollment requests cannot be deleted because they are already linked to a child record.",
      });
    }

    await ChildEnrollmentRequest.findByIdAndDelete(requestId);

    return res.json({ message: "Enrollment request deleted successfully." });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to delete enrollment request",
      error: error?.message,
    });
  }
};

export const resetEnrollmentRequestParentPassword = async (
  req: Request,
  res: Response,
) => {
  try {
    if (!req.user?.id || (req.user.role !== "teacher" && req.user.role !== "admin")) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    const requestId = normalizeString(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: "Invalid request ID" });
    }

    const enrollmentRequest = await ChildEnrollmentRequest.findById(requestId)
      .select("requestedBy parent")
      .lean();

    if (!enrollmentRequest) {
      return res.status(404).json({ message: "Enrollment request not found" });
    }

    if (
      req.user.role === "teacher" &&
      String(enrollmentRequest.requestedBy || "") !== String(req.user.id)
    ) {
      return res.status(403).json({ message: "You can only reset passwords for your own submissions." });
    }

    const parentEmail = String((enrollmentRequest as any).parent?.email || "")
      .trim()
      .toLowerCase();

    if (!parentEmail) {
      return res.status(400).json({ message: "Parent email is missing from this request." });
    }

    const parent = await User.findOne({
      email: {
        $regex: `^${escapeRegex(parentEmail)}$`,
        $options: "i",
      },
      role: "parent",
    });

    if (!parent) {
      return res.status(404).json({ message: "Parent account not found." });
    }

    const tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
    parent.password = await bcrypt.hash(tempPassword, 10);
    parent.mustChangePassword = true;
    parent.passwordResetOtpHash = undefined;
    parent.passwordResetOtpExpiresAt = undefined;
    parent.passwordResetOtpPurpose = undefined;
    parent.latestTempPassword = tempPassword;
    parent.latestTempPasswordIssuedAt = new Date();
    await parent.save();

    return res.json({
      message: "Parent password reset successfully.",
      credentials: {
        email: parent.email,
        phone: parent.phone || "",
        tempPassword,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to reset parent password",
      error: error?.message,
    });
  }
};

export const getEnrollmentRequestParentCredentials = async (
  req: Request,
  res: Response,
) => {
  try {
    if (!req.user?.id || (req.user.role !== "teacher" && req.user.role !== "admin")) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    const requestId = normalizeString(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: "Invalid request ID" });
    }

    const enrollmentRequest = await ChildEnrollmentRequest.findById(requestId)
      .select("requestedBy parent")
      .lean();

    if (!enrollmentRequest) {
      return res.status(404).json({ message: "Enrollment request not found" });
    }

    if (
      req.user.role === "teacher" &&
      String(enrollmentRequest.requestedBy || "") !== String(req.user.id)
    ) {
      return res.status(403).json({
        message: "You can only view credentials for your own submissions.",
      });
    }

    const parentEmail = String((enrollmentRequest as any).parent?.email || "")
      .trim()
      .toLowerCase();

    if (!parentEmail) {
      return res.status(400).json({
        message: "Parent email is missing from this request.",
      });
    }

    const parent = await User.findOne({
      email: {
        $regex: `^${escapeRegex(parentEmail)}$`,
        $options: "i",
      },
      role: "parent",
    })
      .select("email phone latestTempPassword mustChangePassword")
      .lean();

    if (!parent) {
      return res.status(404).json({ message: "Parent account not found." });
    }

    const hasActiveTempPassword =
      Boolean((parent as any).mustChangePassword) &&
      String((parent as any).latestTempPassword || "").trim().length > 0;

    return res.json({
      message: hasActiveTempPassword
        ? "Parent credentials fetched successfully."
        : "Temporary password is unavailable because the parent has already updated it.",
      credentials: {
        email: String((parent as any).email || ""),
        phone: String((parent as any).phone || ""),
        tempPassword: hasActiveTempPassword
          ? String((parent as any).latestTempPassword || "")
          : null,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to fetch parent credentials",
      error: error?.message,
    });
  }
};
