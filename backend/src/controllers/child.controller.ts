import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { Request, Response } from "express";

import Child from "../models/Child";
import User from "../models/Users";
import { generateStudentId, generateChildLinkCode } from "../utils/generators";

export const createChild = async (req: Request, res: Response) => {
  try {
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
      parentFirstName,
      parentLastName,
      parentEmail,
    } = req.body;

    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    if (!firstName || !lastName || !dateOfBirth || !enrollmentDate) {
      return res.status(400).json({ message: "Missing required child fields" });
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

    // Create child without parent (parent can link later via childLinkCode)
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
        childLinkCode: req.body.childLinkCode || generateChildLinkCode(),
      };
      if (middleName) childData.middleName = middleName;

      const child = await Child.create(childData);
      return res.status(201).json({
        child,
        parentCredentials: null,
      });
    }

    // Check if parent already exists
    let parent = await User.findOne({ email: parentEmail });

    if (parent) {
      // Parent already exists, just create the child linked to this parent
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
          childLinkCode: null,
        },
      });
    }

    // Create new parent
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    parent = await User.create({
      firstName: parentFirstName,
      lastName: parentLastName,
      email: parentEmail,
      password: hashedPassword,
      role: "parent",
      mustChangePassword: true,
    });

    const childLinkCode = generateChildLinkCode();
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
      childLinkCode, // Keep for reference / share with another guardian
    };

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
        childLinkCode,
      },
    });
  } catch (error: any) {
    console.error("Create child error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
      details: error.toString(),
    });
  }
};

export const linkChildToParent = async (req: Request, res: Response) => {
  try {
    const { childLinkCode } = req.body;
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const parentId = req.user.id;

    const child = await Child.findOne({ childLinkCode });

    if (!child) {
      return res.status(404).json({ message: "Invalid link code" });
    }

    if (child.parent) {
      return res.status(400).json({ message: "Child already linked" });
    }

    child.parent = new mongoose.Types.ObjectId(parentId);
    child.childLinkCode = undefined;
    await child.save();

    res.json({ message: "Child linked successfully", child });
  } catch (error: any) {
    res.status(500).json({ message: "Linking failed", error: error.message });
  }
};

export const getChildren = async (_req: Request, res: Response) => {
  try {
    const children = await Child.find()
      .populate("parent", "firstName lastName email")
      .sort({ createdAt: -1 })
      .lean();

    res.json(children);
  } catch {
    res.status(500).json({ message: "Failed to fetch children" });
  }
};
