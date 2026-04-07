import { Request, Response } from "express";
import mongoose from "mongoose";
import AuditLog from "../../models/AuditLog";

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admins Only." });
    }

    const page = Math.max(1, Number(req.query.page ?? 1) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20) || 20));
    const skip = (page - 1) * limit;

    const actorId = String(req.query.actorId ?? "").trim();
    const method = String(req.query.method ?? "").trim().toUpperCase();
    const successRaw = String(req.query.success ?? "").trim().toLowerCase();
    const from = String(req.query.from ?? "").trim();
    const to = String(req.query.to ?? "").trim();

    const query: Record<string, unknown> = {};

    if (actorId && mongoose.Types.ObjectId.isValid(actorId)) {
      query.actorId = new mongoose.Types.ObjectId(actorId);
    }

    if (method) {
      query.method = method;
    }

    if (successRaw === "true" || successRaw === "false") {
      query.success = successRaw === "true";
    }

    if (from || to) {
      const createdAtRange: Record<string, Date> = {};
      if (from) {
        const fromDate = new Date(from);
        if (!Number.isNaN(fromDate.getTime())) createdAtRange.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        if (!Number.isNaN(toDate.getTime())) createdAtRange.$lte = toDate;
      }
      if (Object.keys(createdAtRange).length > 0) {
        query.createdAt = createdAtRange;
      }
    }

    const [items, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(query),
    ]);

    return res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: "Server error", error: String(error?.message || error) });
  }
};
