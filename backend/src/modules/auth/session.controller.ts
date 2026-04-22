import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../../models/Users";
import Child from "../../models/Child";
import {
  maybeRequireParentPasswordChange,
  maybeRequireTeacherPasswordChange,
  signAuthToken,
} from "./password.controller";
import {
  issueAdminLoginOtp,
  mapOtpDeliveryError,
  maskEmail,
  setAdminAuthCookie,
} from "./admin-login-mfa.service";
import { clearCsrfCookie, setCsrfCookie } from "../../shared/lib/csrf";
import { getExpiredCookieOptions } from "../../shared/lib/cookies";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const login = async (req: Request, res: Response) => {
  try {
    const { email, username, identifier, password } = req.body;
    const loginIdentifier = String(
      email || username || identifier || "",
    ).trim();
    const isAdminLoginRoute = req.originalUrl.includes("/auth/admin/login");

    if (!loginIdentifier || !password) {
      return res.status(400).json({
        message: "Username and password are required",
      });
    }

    const user = isAdminLoginRoute
      ? await User.findOne({
        role: "admin",
        $or: [
          {
            email: {
              $regex: `^${escapeRegex(loginIdentifier)}$`,
              $options: "i",
            },
          },
          { username: loginIdentifier },
        ],
      })
      : await User.findOne({
        role: { $in: ["teacher", "parent"] },
        $or: [
          {
            email: {
              $regex: `^${escapeRegex(loginIdentifier)}$`,
              $options: "i",
            },
          },
          {
            phone: loginIdentifier,
          },
        ],
      });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    const isMatch = await bcrypt.compare(String(password), user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (await maybeRequireTeacherPasswordChange(user, res)) {
      return;
    }
    if (await maybeRequireParentPasswordChange(user, res)) {
      return;
    }

    if (user.role === "admin") {
      if (user.adminMfaEnabled === false) {
        const token = signAuthToken(String(user._id), user.role);
        setAdminAuthCookie(res, token);

        const userResponse = user.toObject();
        delete (userResponse as any).password;

        return res.json({ user: userResponse });
      }

      try {
        const mfaToken = await issueAdminLoginOtp(user);
        return res.json({
          requiresMfa: true,
          mfaToken,
          email: maskEmail(user.email),
          message: "OTP sent to your admin email.",
        });
      } catch (error: any) {
        console.error("Admin login OTP send failed:", {
          email: user.email,
          code: error?.code,
          message: error?.message,
        });
        return res.status(500).json({
          message: mapOtpDeliveryError(error),
        });
      }
    }

    const token = signAuthToken(String(user._id), user.role);
    const userResponse = user.toObject();
    delete (userResponse as any).password;

    // Parent & Teacher (Mobile)
    return res.json({ token, user: userResponse });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Not authenticated." });
    }

    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("daycareCenter", "name barangay code isActive");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateMe = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Not authenticated." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const {
      username,
      firstName,
      middleName,
      lastName,
      email,
      phone,
    }: {
      username?: string;
      firstName?: string;
      middleName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
    } = req.body ?? {};

    if (username !== undefined) {
      if (user.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Only admin accounts can update username." });
      }

      const normalizedUsername = String(username).trim();
      const existingByUsername = await User.findOne({
        username: normalizedUsername,
        _id: { $ne: user._id },
      });

      if (existingByUsername) {
        return res.status(409).json({ message: "Username already in use." });
      }

      user.username = normalizedUsername;
    }

    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();
      const existingByEmail = await User.findOne({
        email: {
          $regex: `^${escapeRegex(normalizedEmail)}$`,
          $options: "i",
        },
        _id: { $ne: user._id },
      });

      if (existingByEmail) {
        return res.status(409).json({ message: "Email already in use." });
      }

      user.email = normalizedEmail;
    }

    if (firstName !== undefined) {
      user.firstName = String(firstName).trim();
    }

    if (middleName !== undefined) {
      const normalizedMiddleName = String(middleName).trim();
      user.middleName = normalizedMiddleName || undefined;
    }

    if (lastName !== undefined) {
      user.lastName = String(lastName).trim();
    }

    if (phone !== undefined) {
      const normalizedPhone = String(phone).trim();
      user.phone = normalizedPhone || undefined;
    }

    await user.save();

    const userResponse = user.toObject();
    delete (userResponse as any).password;

    return res.json({ user: userResponse });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateAdminPreferences = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Not authenticated." });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only." });
    }

    const user = await User.findById(req.user.id);
    if (!user || user.role !== "admin") {
      return res.status(404).json({ message: "Admin account not found." });
    }

    const {
      adminMfaEnabled,
      adminNotifySecurityEvents,
      adminNotifySystemUpdates,
    }: {
      adminMfaEnabled?: boolean;
      adminNotifySecurityEvents?: boolean;
      adminNotifySystemUpdates?: boolean;
    } = req.body ?? {};

    if (typeof adminMfaEnabled === "boolean") {
      user.adminMfaEnabled = adminMfaEnabled;
    }

    if (typeof adminNotifySecurityEvents === "boolean") {
      user.adminNotifySecurityEvents = adminNotifySecurityEvents;
    }

    if (typeof adminNotifySystemUpdates === "boolean") {
      user.adminNotifySystemUpdates = adminNotifySystemUpdates;
    }

    await user.save();

    return res.json({
      preferences: {
        adminMfaEnabled: user.adminMfaEnabled !== false,
        adminNotifySecurityEvents: user.adminNotifySecurityEvents !== false,
        adminNotifySystemUpdates: user.adminNotifySystemUpdates !== false,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getCsrf = async (req: Request, res: Response) => {
  try {
    const authToken = String(req.cookies?.authToken || "");

    if (!authToken) {
      return res.status(400).json({
        message: "CSRF token endpoint is only available for cookie sessions.",
      });
    }

    const csrfToken = setCsrfCookie(res, authToken);
    return res.json({ csrfToken });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const logout = async (_req: Request, res: Response) => {
  res.clearCookie("authToken", getExpiredCookieOptions(true));
  clearCsrfCookie(res);

  res.json({ message: "Logged out" });
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admins only." });
    }

    const { role } = req.query;

    const filter: any = {};
    if (role) filter.role = role;
    if (role === "parent") {
      const enrolledParentIds = await Child.distinct("parent", {
        parent: { $ne: null },
      });
      filter._id = { $in: enrolledParentIds };
    }

    const users = await User.find(filter)
      .select("-password")
      .populate("daycareCenter", "name barangay code isActive")
      .sort({ createdAt: -1 })
      .lean();

    if (role === "parent" && users.length > 0) {
      const parentIds = users.map((user: any) => user._id).filter(Boolean);

      const linkedChildren = await Child.find({
        parent: { $in: parentIds },
      })
        .select("_id firstName middleName lastName studentId parent")
        .sort({ createdAt: -1 })
        .lean();

      const childrenByParentId = new Map<string, any[]>();
      linkedChildren.forEach((child: any) => {
        const parentId = String(child.parent || "");
        if (!parentId) return;
        const list = childrenByParentId.get(parentId) ?? [];
        list.push({
          _id: String(child._id),
          firstName: child.firstName,
          middleName: child.middleName,
          lastName: child.lastName,
          studentId: child.studentId,
          source: "child",
          status: "linked",
        });
        childrenByParentId.set(parentId, list);
      });

      users.forEach((user: any) => {
        const parentId = String(user._id || "");
        user.linkedChildren = childrenByParentId.get(parentId) ?? [];
      });
    }

    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
