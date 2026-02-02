import { Request, Response } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/Users";
import { generateEmployeeId } from "../utils/generateEmployeeId";
import Child from "../models/Child";

export const createTeacher = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admins Only" });
    }

    const { firstName, lastName, email } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const employeeId = await generateEmployeeId();

    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const teacher = await User.create({
      employeeId,
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: "teacher",
      mustChangePassword: true,
    });
    res.status(201).json({
      teacher,
      credentials: {
        email,
        tempPassword,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admins Only." });
    }

    const userId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const { firstName, lastName, email } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: new mongoose.Types.ObjectId(userId) },
    });

    if (existing) {
      return res.status(409).json({ message: "Email already in use." });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        firstName,
        lastName,
        email: normalizedEmail,
      },
      { new: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admins Only." });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const tempPassword = Math.random().toString(36).slice(-8);
    user.password = await bcrypt.hash(tempPassword, 10);
    user.mustChangePassword = true;

    await user.save();

    res.json({
      credentials: {
        email: user.email,
        tempPassword,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admins Only." });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    user.isActive = !user.isActive;
    await user.save();

    res.json({ isActive: user.isActive });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getParentChildren = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admins Only." });
    }

    const children = await Child.find({ parentId: req.params.parentId }).sort({
      createdAt: -1,
    });

    res.json({ children });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
