import { Request, Response } from "express";
import { adminUserManagementService } from "../services/user-management.service";

export const createTeacher = async (req: Request, res: Response) => {
  try {
    const result = await adminUserManagementService.createTeacher(req.body);
    res.status(201).json(result);
  } catch (error: any) {
    if (error.message === "Email already in use") {
      return res.status(409).json({ message: error.message });
    }
    if (error.message === "Selected center not found.") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const user = await adminUserManagementService.updateUserProfile(
      String(userId),
      req.body,
    );
    res.json(user);
  } catch (error: any) {
    if (error.message === "Email already in use.") {
      return res.status(409).json({ message: error.message });
    }
    if (
      error.message === "Selected center not found." ||
      error.message === "User not found."
    ) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const result = await adminUserManagementService.resetPassword(
      String(req.params.id),
    );
    res.json(result);
  } catch (error: any) {
    if (error.message === "User not found.") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const result = await adminUserManagementService.toggleUserStatus(
      String(req.params.id),
    );
    res.json(result);
  } catch (error: any) {
    if (error.message === "User not found.") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    await adminUserManagementService.deleteUser(String(req.params.id));
    res.json({ message: "User deleted" });
  } catch (error: any) {
    if (error.message === "User not found.") {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes("Cannot delete this teacher account")) {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getParentChildren = async (req: Request, res: Response) => {
  try {
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Surrogate-Control": "no-store",
    });

    const result = await adminUserManagementService.getParentChildren(
      String(req.params.parentId),
    );
    res.json(result);
  } catch (error: any) {
    if (error.message === "Parent not found.") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
