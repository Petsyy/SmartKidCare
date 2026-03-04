import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { randomUUID } from "crypto";

import Child from "../../models/Child";
import User from "../../models/Users";
import DocumentAccessToken from "../../models/DocumentAccessToken";
import { generateStudentId } from "../../utils/generateStudentId";
import { generateSecureUrl } from "../../utils/generateSecureUrl";
import {
  uploadToCloudinary,
  UploadResult,
} from "../../utils/uploadToCloudinary";

type ChildDocumentKey = "birthCertificate" | "parentId";

const attachUploadedDocuments = (
  childData: any,
  birthUpload: UploadResult | null,
  parentUpload: UploadResult | null,
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
    };
  }

  if (parentUpload) {
    childData.documents.parentId = {
      publicId: parentUpload.publicId,
      resourceType: parentUpload.resourceType,
      format: parentUpload.format,
    };
  }
};

const ensureCanAccessChild = (child: any, req: Request): boolean => {
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

const resolveDocumentField = (value: string): ChildDocumentKey | null => {
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

const resolveTeacherId = async (
  value: unknown,
): Promise<mongoose.Types.ObjectId | null> => {
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
    .select("_id")
    .lean();

  if (!teacher) {
    throw new Error("teacher_not_found");
  }

  return new mongoose.Types.ObjectId(normalizedTeacherId);
};

export const createChild = async (req: Request, res: Response) => {
  console.log("[createChild] Request debug", {
    contentType: req.headers["content-type"],
    hasReqFiles: Boolean(req.files),
    filesType: typeof req.files,
    filesKeys: req.files ? Object.keys(req.files) : [],
    bodyKeys: Object.keys(req.body || {}),
  });

  const files = req.files as
    | {
        [fieldname: string]: Express.Multer.File[];
      }
    | undefined;

  const birthFile = files?.birthCertificate?.[0];
  const parentIdFile = files?.parentId?.[0];

  console.log("[createChild] Incoming document files", {
    hasBirthCertificate: Boolean(birthFile),
    birthCertificate: birthFile
      ? {
          originalname: birthFile.originalname,
          mimetype: birthFile.mimetype,
          size: birthFile.size,
        }
      : null,
    hasParentId: Boolean(parentIdFile),
    parentId: parentIdFile
      ? {
          originalname: parentIdFile.originalname,
          mimetype: parentIdFile.mimetype,
          size: parentIdFile.size,
        }
      : null,
  });

  try {
    let birthUpload: UploadResult | null = null;
    let parentUpload: UploadResult | null = null;

    if (birthFile) {
      birthUpload = await uploadToCloudinary(
        birthFile.buffer,
        "child-records/birth-certificates",
        birthFile.mimetype,
        birthFile.originalname,
      );
      console.log("[createChild] Birth certificate uploaded", {
        publicId: birthUpload?.publicId,
        resourceType: birthUpload?.resourceType,
        format: birthUpload?.format,
      });
    }

    if (parentIdFile) {
      parentUpload = await uploadToCloudinary(
        parentIdFile.buffer,
        "child-records/parent-ids",
        parentIdFile.mimetype,
        parentIdFile.originalname,
      );
      console.log("[createChild] Parent ID uploaded", {
        publicId: parentUpload?.publicId,
        resourceType: parentUpload?.resourceType,
        format: parentUpload?.format,
      });
    }

    const {
      firstName,
      middleName,
      lastName,
      dateOfBirth,
      age,
      gender,
      enrollmentDate,
      schoolYear,
      status,
      teacherId,
      parentFirstName,
      parentMiddleName,
      parentLastName,
      parentEmail,
      parentPhone,
    } = req.body;

    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    if (!firstName || !lastName || !dateOfBirth || !enrollmentDate) {
      return res.status(400).json({ message: "Missing required child fields" });
    }

    let resolvedTeacherId: mongoose.Types.ObjectId | null = null;
    try {
      resolvedTeacherId = await resolveTeacherId(teacherId);
    } catch (error: any) {
      if (error?.message === "invalid_teacher_id") {
        return res.status(400).json({ message: "Invalid teacher ID" });
      }
      if (error?.message === "teacher_not_found") {
        return res
          .status(404)
          .json({ message: "Teacher not found or inactive" });
      }
      throw error;
    }

    const existingChild = await Child.findOne({
      firstName,
      lastName,
      dateOfBirth,
    });

    if (existingChild) {
      return res.status(409).json({ message: "Child already exists" });
    }

    const year = new Date(enrollmentDate).getFullYear();
    const hasParentInfo = parentFirstName && parentLastName && parentEmail;

    if (!hasParentInfo) {
      const childData: any = {
        firstName,
        lastName,
        dateOfBirth,
        age: Number(age) || 0,
        gender: gender || "male",
        enrollmentDate,
        schoolYear: schoolYear || "2024-2025",
        status: status || "Active",
        studentId: req.body.studentId || generateStudentId(year),
      };

      if (middleName) childData.middleName = middleName;
      if (resolvedTeacherId) childData.teacher = resolvedTeacherId;
      attachUploadedDocuments(childData, birthUpload, parentUpload);

      const child = await Child.create(childData);

      return res.status(201).json({
        child,
        parentCredentials: null,
      });
    }

    // Check if parent already exists
    let parent = await User.findOne({ email: parentEmail });

    if (parent) {
      const childData: any = {
        firstName,
        lastName,
        dateOfBirth,
        age: Number(age),
        gender,
        enrollmentDate,
        schoolYear,
        status: status || "Active",
        studentId: generateStudentId(year),
        parent: parent._id,
      };
      if (resolvedTeacherId) childData.teacher = resolvedTeacherId;
      attachUploadedDocuments(childData, birthUpload, parentUpload);

      // Only add middleName if it exists
      if (middleName) {
        childData.middleName = middleName;
      }

      const child = await Child.create(childData);

      return res.status(201).json({
        child,
        parentCredentials: {
          email: parentEmail,
          tempPassword: null,
        },
      });
    }

    // Create new parent
    if (!parentPhone) {
      return res
        .status(400)
        .json({ message: "Missing required parent phone number" });
    }
    const tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    parent = await User.create({
      firstName: parentFirstName,
      middleName: parentMiddleName || "",
      lastName: parentLastName,
      email: parentEmail,
      phone: parentPhone,
      password: hashedPassword,
      role: "parent",
      mustChangePassword: true,
      needsToConfirmLink: true,
    });

    const childData: any = {
      firstName,
      lastName,
      dateOfBirth,
      age: Number(age),
      gender,
      enrollmentDate,
      schoolYear,
      status: status || "Active",
      studentId: generateStudentId(year),
      parent: parent._id,
    };
    if (resolvedTeacherId) childData.teacher = resolvedTeacherId;

    attachUploadedDocuments(childData, birthUpload, parentUpload);

    // Only add middleName if it exists
    if (middleName) {
      childData.middleName = middleName;
    }

    const child = await Child.create(childData);

    res.status(201).json({
      child,
      parentCredentials: {
        email: parentEmail,
        tempPassword,
      },
    });
  } catch (error: any) {
    console.error("Create child error:", error);
    console.error("[createChild] Document upload context", {
      hasBirthCertificate: Boolean(birthFile),
      hasParentId: Boolean(parentIdFile),
      message: error?.message,
    });
    res.status(500).json({
      message: "Server error",
      error: error.message,
      details: error.toString(),
    });
  }
};

export const getChildren = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const role = req.user.role;
    const query: Record<string, unknown> = {};

    if (role === "admin") {
      // Admins see all children
    } else if (role === "teacher") {
      query.teacher = req.user.id;
    } else if (role === "parent") {
      query.parent = req.user.id;
    } else {
      return res.status(403).json({ message: "Forbidden" });
    }

    const children = await Child.find(query)
      .populate("parent", "firstName lastName email phone")
      .populate("teacher", "firstName middleName lastName email phone")
      .sort({ createdAt: -1 })
      .lean();

    res.json(children);
  } catch {
    res.status(500).json({ message: "Failed to fetch children" });
  }
};

export const getMyChildren = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (req.user.role !== "parent") {
      return res.status(403).json({ message: "Parents only" });
    }

    const children = await Child.find({ parent: req.user.id })
      .populate("teacher", "firstName middleName lastName email phone")
      .sort({ createdAt: -1 })
      .lean();

    res.json(children);
  } catch {
    res.status(500).json({ message: "Failed to fetch children" });
  }
};

// Get single child by ID with parent info
export const getChildById = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const id = req.params.id as string;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid child ID" });
    }

    const child = await Child.findById(id)
      .populate("parent", "firstName lastName email phone")
      .populate("teacher", "firstName middleName lastName email phone")
      .lean();

    if (!child) {
      return res.status(404).json({ message: "Child not found" });
    }

    if (!ensureCanAccessChild(child, req)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(child);
  } catch {
    res.status(500).json({ message: "Failed to fetch child details" });
  }
};

export const getChildDocumentSignedUrl = async (
  req: Request,
  res: Response,
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const childId = String(req.params.id || "");
    if (!mongoose.Types.ObjectId.isValid(childId)) {
      return res.status(400).json({ message: "Invalid child ID" });
    }

    const documentField = resolveDocumentField(String(req.params.documentType));
    if (!documentField) {
      return res.status(400).json({ message: "Invalid document type" });
    }

    const child = await Child.findById(childId)
      .populate("parent", "_id")
      .populate("teacher", "_id")
      .select("documents parent teacher")
      .lean();

    if (!child) {
      return res.status(404).json({ message: "Child not found" });
    }

    if (!ensureCanAccessChild(child, req)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const doc = (child as any)?.documents?.[documentField];
    if (!doc?.publicId || !doc?.resourceType) {
      return res.status(404).json({ message: "Document not found" });
    }

    await DocumentAccessToken.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { used: true, usedAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) } },
      ],
    }).catch(() => {
      console.warn("Token cleanup failed silently");
    });

    // Generate one-time access token
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 1000); // 60 seconds

    await DocumentAccessToken.create({
      token,
      childId: new mongoose.Types.ObjectId(childId),
      documentType: documentField,
      publicId: String(doc.publicId),
      resourceType: String(doc.resourceType),
      format: String(doc.format || "jpg"),
      userId: new mongoose.Types.ObjectId(req.user.id),
      expiresAt,
    });

    return res.status(200).json({
      token,
      expiresInSeconds: 60,
      documentType: documentField,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to generate document token",
      error: error?.message,
    });
  }
};

export const getChildDocumentUrl = async (req: Request, res: Response) => {
  try {
    const token = String(req.params.token || "").trim();
    if (!token) {
      return res.status(400).json({ message: "Invalid token" });
    }

    // Find and validate token
    const accessToken = await DocumentAccessToken.findOne({ token });
    if (!accessToken) {
      return res.status(404).json({ message: "Token not found or expired" });
    }

    // Check if token is already used
    if (accessToken.used) {
      return res.status(410).json({
        message:
          "This link has already been used. Request a new document link.",
      });
    }

    // Check if token has expired
    if (new Date() > accessToken.expiresAt) {
      return res.status(410).json({
        message: "This link has expired. Request a new document link.",
      });
    }

    // Generate signed URL (valid for 60 seconds)
    const signedUrl = generateSecureUrl(
      accessToken.publicId,
      accessToken.resourceType,
      accessToken.format,
    );

    // Delete token immediately after generating URL (one-time use)
    await DocumentAccessToken.deleteOne({ _id: accessToken._id });

    return res.status(200).json({
      url: signedUrl,
      documentType: accessToken.documentType,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to retrieve document URL",
      error: error?.message,
    });
  }
};

export const streamChildDocument = async (req: Request, res: Response) => {
  try {
    const token = String(req.params.token || "").trim();
    if (!token) {
      return res.status(400).json({ message: "Invalid token" });
    }

    // Find and validate token
    const accessToken = await DocumentAccessToken.findOne({ token });
    if (!accessToken) {
      return res.status(404).json({ message: "Token not found or expired" });
    }

    // Check if token is already used
    if (accessToken.used) {
      return res.status(410).json({
        message:
          "This link has already been used. Request a new document link.",
      });
    }

    // Check if token has expired
    if (new Date() > accessToken.expiresAt) {
      return res.status(410).json({
        message: "This link has expired. Request a new document link.",
      });
    }

    // Generate signed URL (never exposed to frontend)
    const signedUrl = generateSecureUrl(
      accessToken.publicId,
      accessToken.resourceType,
      accessToken.format,
    );

    // Delete token immediately after generating URL (one-time use)
    await DocumentAccessToken.deleteOne({ _id: accessToken._id });

    // Set proper headers for file download/display
    const isImage =
      accessToken.resourceType === "image" ||
      ["jpg", "jpeg", "png", "gif", "webp"].includes(
        accessToken.format.toLowerCase(),
      );
    const contentType = isImage
      ? `image/${accessToken.format}`
      : "application/pdf";
    const fileName = `${accessToken.childId}-${accessToken.documentType}.${accessToken.format}`;

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    // Proxy the request to Cloudinary without exposing the URL
    const axios = require("axios");
    try {
      const response = await axios.get(signedUrl, {
        responseType: "stream",
        timeout: 30000,
      });
      response.data.pipe(res);
    } catch (error: any) {
      return res.status(502).json({
        message: "Failed to retrieve document from storage",
        error: error?.message,
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to stream document",
      error: error?.message,
    });
  }
};

export const viewDocument = async (req: Request, res: Response) => {
  try {
    const token = String(req.query.token || "").trim();
    if (!token) {
      return res.status(400).json({ message: "Invalid token" });
    }

    // Find and validate token
    const accessToken = await DocumentAccessToken.findOne({ token });
    if (!accessToken) {
      return res.status(404).json({ message: "Token not found or expired" });
    }

    // Check if token is already used
    if (accessToken.used) {
      return res.status(410).json({
        message:
          "This link has already been used. Request a new document link.",
      });
    }

    // Check if token has expired
    if (new Date() > accessToken.expiresAt) {
      return res.status(410).json({
        message: "This link has expired. Request a new document link.",
      });
    }

    // Generate signed URL (never exposed to frontend)
    const signedUrl = generateSecureUrl(
      accessToken.publicId,
      accessToken.resourceType,
      accessToken.format,
    );

    // Delete token immediately after use (one-time use)
    await DocumentAccessToken.deleteOne({ _id: accessToken._id });

    // Set proper headers for file download/display
    const isImage =
      accessToken.resourceType === "image" ||
      ["jpg", "jpeg", "png", "gif", "webp"].includes(
        accessToken.format.toLowerCase(),
      );
    const contentType = isImage
      ? `image/${accessToken.format}`
      : "application/pdf";
    const fileName = `${accessToken.childId}-${accessToken.documentType}.${accessToken.format}`;

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("X-Content-Type-Options", "nosniff");

    // Proxy the request to Cloudinary without exposing the URL
    const axios = require("axios");
    try {
      const response = await axios.get(signedUrl, {
        responseType: "stream",
        timeout: 30000,
      });
      response.data.pipe(res);
    } catch (error: any) {
      return res.status(502).json({
        message: "Failed to retrieve document from storage",
        error: error?.message,
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to view document",
      error: error?.message,
    });
  }
};

export const updateChild = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    const child = await Child.findById(req.params.id);
    if (!child) {
      return res.status(404).json({ message: "Child not found" });
    }

    const {
      firstName,
      middleName,
      lastName,
      dateOfBirth,
      age,
      gender,
      schoolYear,
      status,
      unlinkParent,
      teacherId,
      unlinkTeacher,
    } = req.body;

    if (firstName !== undefined) child.firstName = firstName;
    if (middleName !== undefined) child.middleName = middleName;
    if (lastName !== undefined) child.lastName = lastName;
    if (dateOfBirth !== undefined) child.dateOfBirth = dateOfBirth;
    if (age !== undefined) child.age = Number(age);
    if (gender !== undefined) child.gender = gender;
    if (schoolYear !== undefined) child.schoolYear = schoolYear;
    if (status !== undefined) child.status = status;

    if (unlinkParent === true) {
      child.parent = undefined;
    }

    if (unlinkTeacher === true) {
      child.teacher = undefined;
    } else if (teacherId !== undefined) {
      try {
        const resolvedTeacherId = await resolveTeacherId(teacherId);
        child.teacher = resolvedTeacherId || undefined;
      } catch (error: any) {
        if (error?.message === "invalid_teacher_id") {
          return res.status(400).json({ message: "Invalid teacher ID" });
        }
        if (error?.message === "teacher_not_found") {
          return res
            .status(404)
            .json({ message: "Teacher not found or inactive" });
        }
        throw error;
      }
    }

    await child.save();

    const updated = await Child.findById(child._id)
      .populate("parent", "firstName lastName email phone")
      .populate("teacher", "firstName middleName lastName email phone")
      .lean();

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const deleteChild = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    const id = req.params.id as string;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid child ID" });
    }

    const deleted = await Child.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Child not found" });
    }

    return res.json({ message: "Child deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to delete child",
      error: error.message,
    });
  }
};
