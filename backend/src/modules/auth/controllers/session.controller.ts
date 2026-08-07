import { Request, Response } from "express";
import { sessionService } from "../services/session.service";
import { clearCsrfCookie, setCsrfCookie } from "../../../shared/lib/csrf";
import { getExpiredCookieOptions } from "../../../shared/lib/cookies";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, username, identifier, password } = req.body;
    const loginIdentifier = String(
      email || username || identifier || "",
    ).trim();
    const isAdminLoginRoute = req.originalUrl.includes("/auth/admin/login");

    const result = await sessionService.login(
      {
        identifier: loginIdentifier,
        password,
        isAdminRoute: isAdminLoginRoute,
      },
      res
    );

    if (result === null) {
      return; // Password change handled by service
    }

    return res.json(result);
  } catch (error: any) {
    const statusCode = error.message.includes("Account is deactivated")
      ? 403
      : error.message.includes("Invalid credentials")
        ? 401
        : 500;

    res.status(statusCode).json({ error: error.message });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Not authenticated." });
    }

    const user = await sessionService.getUserById(req.user.id);
    res.json({ user });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

export const updateMe = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Not authenticated." });
    }

    const user = await sessionService.updateUserProfile(req.user.id, req.body);
    return res.json({ user });
  } catch (error: any) {
    const statusCode = error.message.includes("Only admin accounts")
      ? 403
      : error.message.includes("already in use")
        ? 409
        : 500;

    return res.status(statusCode).json({ error: error.message });
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

    const preferences = await sessionService.updateAdminPreferences(
      req.user.id,
      req.body
    );

    return res.json({ preferences });
  } catch (error: any) {
    return res.status(404).json({ error: error.message });
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
    const users = await sessionService.getAllUsers(role as string | undefined);

    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
