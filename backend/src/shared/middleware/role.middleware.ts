import { Request, Response, NextFunction } from "express";

export type UserRole = "admin" | "teacher" | "parent";

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !req.user.role) {
      res.status(401).json({ message: "Access denied. Authentication required." });
      return;
    }

    const userRole = req.user.role as UserRole;

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        message: `Access denied. Requires one of the following roles: ${allowedRoles.join(", ")}`,
      });
      return;
    }

    next();
  };
};
