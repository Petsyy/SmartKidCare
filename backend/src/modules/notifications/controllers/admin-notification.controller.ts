import type { Request, Response } from "express";
import { UnauthorizedError } from "../../../shared/errors/app-error";
import { asyncHandler } from "../../../shared/utils/async-handler";
import { adminNotificationService } from "../services/admin-notification.service";
import type { AdminNotificationView } from "../types/admin-notification.types";

const requireRecipientId = (req: Request): string => {
  if (!req.user?.id) throw new UnauthorizedError();
  return req.user.id;
};

export const getAdminNotificationFeed = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await adminNotificationService.getFeed({
      recipientId: requireRecipientId(req),
      view: String(req.query.view || "inbox") as AdminNotificationView,
      cursor: req.query.cursor ? String(req.query.cursor) : undefined,
      limit: Number(req.query.limit || 20),
    });
    res.json(result);
  },
);

export const setAdminNotificationRead = asyncHandler(
  async (req: Request, res: Response) => {
    const notification = await adminNotificationService.setRead({
      recipientId: requireRecipientId(req),
      notificationId: String(req.params.id),
      read: req.body.read,
    });
    res.json({ notification });
  },
);

export const markAllAdminNotificationsRead = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await adminNotificationService.markAllRead(
      requireRecipientId(req),
    );
    res.json(result);
  },
);

export const setAdminNotificationArchived = asyncHandler(
  async (req: Request, res: Response) => {
    const notification = await adminNotificationService.setArchived({
      recipientId: requireRecipientId(req),
      notificationId: String(req.params.id),
      archived: req.body.archived,
    });
    res.json({ notification });
  },
);

