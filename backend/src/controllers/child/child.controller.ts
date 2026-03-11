import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { Request, Response } from "express";

import Child from "../../models/Child";
import User from "../../models/Users";
import { generateStudentId } from "../../utils/generateStudentId";
import {
  uploadToCloudinary,
  UploadResult,
} from "../../utils/uploadToCloudinary";
import { hashFileBuffer } from "../../blockchain/ethers";
import { storeChildDocumentsHash } from "../../services/blockchain/blockchain.service";
import {
  attachUploadedDocuments,
  ensureCanAccessChild,
  resolveTeacherId,
} from "./child.helpers";

// Re-export controllers from other modules for convenience
export { getChildBlockchainProof } from "./child.blockchain.controller";
export {
  getChildDocumentSignedUrl,
  getChildDocumentUrl,
  streamChildDocument,
  viewDocument,
} from "./child.documents.controller";

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
  const birthDocumentHash = birthFile ? hashFileBuffer(birthFile.buffer) : null;
  const parentIdDocumentHash = parentIdFile
    ? hashFileBuffer(parentIdFile.buffer)
    : null;

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
      attachUploadedDocuments(
        childData,
        birthUpload,
        parentUpload,
        birthDocumentHash,
        parentIdDocumentHash,
      );

      const child = await Child.create(childData);
      const documentsAnchor = await storeChildDocumentsHash(
        String(child.studentId || ""),
        birthFile?.buffer,
        parentIdFile?.buffer,
      ).catch((error) => {
        console.error("Child document anchor failed:", error);
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

      return res.status(201).json({
        child,
        parentCredentials: null,
        documentAnchor: documentsAnchor,
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
      attachUploadedDocuments(
        childData,
        birthUpload,
        parentUpload,
        birthDocumentHash,
        parentIdDocumentHash,
      );

      // Only add middleName if it exists
      if (middleName) {
        childData.middleName = middleName;
      }

      const child = await Child.create(childData);
      const documentsAnchor = await storeChildDocumentsHash(
        String(child.studentId || ""),
        birthFile?.buffer,
        parentIdFile?.buffer,
      ).catch((error) => {
        console.error("Child document anchor failed:", error);
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

      return res.status(201).json({
        child,
        parentCredentials: {
          email: parentEmail,
          tempPassword: null,
        },
        documentAnchor: documentsAnchor,
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

    attachUploadedDocuments(
      childData,
      birthUpload,
      parentUpload,
      birthDocumentHash,
      parentIdDocumentHash,
    );

    // Only add middleName if it exists
    if (middleName) {
      childData.middleName = middleName;
    }

    const child = await Child.create(childData);
    const documentsAnchor = await storeChildDocumentsHash(
      String(child.studentId || ""),
      birthFile?.buffer,
      parentIdFile?.buffer,
    ).catch((error) => {
      console.error("Child document anchor failed:", error);
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

    res.status(201).json({
      child,
      parentCredentials: {
        email: parentEmail,
        tempPassword,
      },
      documentAnchor: documentsAnchor,
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
