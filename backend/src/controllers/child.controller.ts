import mongoose from "mongoose";

import Child from "../models/Child";
import User from "../models/Worker";
import { Request, Response } from "express";
import { generateStudentId, generateChildLinkCode } from "../utils/generators";
import bcrypt from "bcryptjs";

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
    } = req.body;

    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    const existing = await Child.findOne({
      firstName,
      lastName,
      dateOfBirth,
    });

    if (existing) {
      return res.status(409).json({ message: "Child already exists" });
    }

    const year = new Date(enrollmentDate).getFullYear();

    // Generate parent credentials
    const parentEmail = `parent-${Date.now()}@smartkidcare.com`;
    const parentPassword = Math.random().toString(36).substring(2, 10);
    const hashedPassword = await bcrypt.hash(parentPassword, 10);

    // Create parent account
    const parent = await User.create({
      firstName: firstName,
      lastName: lastName,
      email: parentEmail,
      password: hashedPassword,
      role: "parent",
      verificationStatus: "approved",
    });

    // Create child with parent reference
    const child = await Child.create({
      firstName,
      middleName,
      lastName,
      dateOfBirth,
      age,
      gender,
      enrollmentDate,
      schoolYear,
      status,
      studentId: generateStudentId(year),
      childLinkCode: generateChildLinkCode(),
      parent: parent._id,
    });

    res.status(201).json({
      child,
      parentCredentials: {
        email: parentEmail,
        password: parentPassword,
        message: "Parent account created with these credentials. Parent can use these to log in.",
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
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
  } catch (error) {
    res.status(500).json({ message: "Linking failed", error });
  }
};

export const getChildren = async (_req: Request, res: Response) => {
  try {
    const children = await Child.find().sort({ createdAt: -1 });
    res.json(children);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch children" });
  }
};
