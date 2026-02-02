import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/Users";


export const login = async (req: Request, res: Response) => {
  try {
    const { email, username, identifier, password } = req.body;

    const loginIdentifier = email || username || identifier;

    if (!loginIdentifier || !password) {
      return res.status(400).json({
        message: "Username and password are required",
      });
    }

    const user = await User.findOne({
      $or: [{ email: loginIdentifier }, { username: loginIdentifier }],
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    // Workers & parents must use email
    if (user.role !== "admin" && user.email !== loginIdentifier) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" },
    );

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
