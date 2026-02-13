import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/Users";
import {
  maybeRequireTeacherPasswordChange,
  signAuthToken,
} from "./auth.password.controller";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const login = async (req: Request, res: Response) => {
  try {
    const { email, username, identifier, password } = req.body;
    const loginIdentifier = String(
      email || username || identifier || "",
    ).trim();

    if (!loginIdentifier || !password) {
      return res.status(400).json({
        message: "Username and password are required",
      });
    }

    const user = await User.findOne({
      $or: [
        {
          email: {
            $regex: `^${escapeRegex(loginIdentifier)}$`,
            $options: "i",
          },
        },
        { username: loginIdentifier },
      ],
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    // Teachers and parents must use email.
    if (
      user.role !== "admin" &&
      user.email.toLowerCase() !== loginIdentifier.toLowerCase()
    ) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(String(password), user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (await maybeRequireTeacherPasswordChange(user, res)) {
      return;
    }

    const token = signAuthToken(String(user._id), user.role);

    const userResponse = user.toObject();
    delete (userResponse as any).password;

    res.json({ token, user: userResponse });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Not authenticated." });
    }

    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { role } = req.query;

    const filter: any = {};
    if (role) filter.role = role;

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
