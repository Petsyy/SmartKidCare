import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../../models/Users";
import { AuthenticatedUser } from "../types/auth.types";
import {CSRF_COOKIE_NAME,CSRF_HEADER_NAME,setCsrfCookie,verifyCsrfToken,
} from "../lib/csrf";

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const method = String(req.method || "GET").toUpperCase();
  const isUnsafeMethod =
    method === "POST" ||
    method === "PUT" ||
    method === "PATCH" ||
    method === "DELETE";

  const headerToken = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : null;

  const cookieToken = req.cookies?.authToken;

  const token = headerToken || cookieToken;

  if (!token) {
    res.status(401).json({ message: "Access denied. No token provided." });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ message: "Server misconfiguration." });
      return;
    }

    const decoded = jwt.verify(token, secret) as AuthenticatedUser;

    if (cookieToken && !req.cookies?.[CSRF_COOKIE_NAME]) {
      // Backfills CSRF cookie for pre-existing sessions created before CSRF rollout.
      setCsrfCookie(res, cookieToken);
    }

    if (cookieToken && !headerToken && isUnsafeMethod) {
      const csrfCookieToken = String(req.cookies?.[CSRF_COOKIE_NAME] || "");
      const csrfHeaderToken = String(req.get(CSRF_HEADER_NAME) || "");

      if (!csrfCookieToken || !csrfHeaderToken) {
        res.status(403).json({ message: "CSRF token is required." });
        return;
      }

      if (csrfCookieToken !== csrfHeaderToken) {
        res.status(403).json({ message: "Invalid CSRF token." });
        return;
      }

      if (!verifyCsrfToken(cookieToken, csrfHeaderToken)) {
        res.status(403).json({ message: "Invalid CSRF token." });
        return;
      }
    }

    const authenticatedUser = await User.findById(decoded.id)
      .select("role daycareCenter isActive mustChangePassword")
      .lean();

    if (!authenticatedUser || authenticatedUser.isActive === false) {
      res.status(401).json({ message: "Account is inactive or no longer exists." });
      return;
    }

    req.user = {
      id: String(authenticatedUser._id),
      role: authenticatedUser.role,
      daycareCenterId: authenticatedUser.daycareCenter
        ? String(authenticatedUser.daycareCenter)
        : null,
    };

    if (authenticatedUser.role === "parent") {

      const path = String(req.path || "");
      const isAllowedDuringForcedChange =
        path === "/change-password" ||
        path === "/logout" ||
        path === "/me" ||
        path === "/csrf";

      if (authenticatedUser.mustChangePassword && !isAllowedDuringForcedChange) {
        res.status(403).json({
          requiresPasswordChange: true,
          message: "Password change required before accessing this resource.",
        });
        return;
      }
    }

    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token." });
  }
};
