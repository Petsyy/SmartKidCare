import { z } from "zod";
import { validate } from "../../../shared/middleware/validate.middleware";

const nonEmptyString = z.string().trim().min(1, "Field is required.");
const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format.");

const registerPushTokenSchema = z.object({
  pushToken: nonEmptyString,
  platform: z.enum(["ios", "android", "web", "unknown"]).optional(),
  deviceName: z.string().trim().optional(),
  appOwnership: z.string().trim().optional(),
});

const unregisterPushTokenSchema = z.object({
  pushToken: nonEmptyString,
});

const sendTestPushSchema = z.object({
  title: z.string().trim().optional(),
  body: z.string().trim().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

const dispatchTeacherNotificationsSchema = z.object({
  date: z.string().trim().optional(),
  teacherIds: z.array(objectIdSchema).optional(),
});

const teacherFeedQuerySchema = z.object({
  date: z.string().trim().optional(),
  teacherId: z.string().trim().optional(),
});

const parentFeedQuerySchema = z.object({
  date: z.string().trim().optional(),
  parentId: z.string().trim().optional(),
});

const adminNotificationFeedQuerySchema = z.object({
  view: z.enum(["inbox", "unread", "archived"]).default("inbox"),
  cursor: z.string().trim().min(1).max(1000).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const adminNotificationParamsSchema = z.object({
  id: objectIdSchema,
});

const adminNotificationReadSchema = z.object({
  read: z.boolean(),
});

const adminNotificationArchiveSchema = z.object({
  archived: z.boolean(),
});

export const validateRegisterPushToken = validate(registerPushTokenSchema);
export const validateUnregisterPushToken = validate(unregisterPushTokenSchema);
export const validateSendTestPush = validate(sendTestPushSchema);
export const validateDispatchTeacherNotifications = validate(
  dispatchTeacherNotificationsSchema,
);
export const validateTeacherNotificationsFeed = validate(
  teacherFeedQuerySchema,
  "query",
);
export const validateParentNotificationsFeed = validate(
  parentFeedQuerySchema,
  "query",
);
export const validateAdminNotificationFeed = validate(
  adminNotificationFeedQuerySchema,
  "query",
);
export const validateAdminNotificationParams = validate(
  adminNotificationParamsSchema,
  "params",
);
export const validateAdminNotificationRead = validate(
  adminNotificationReadSchema,
);
export const validateAdminNotificationArchive = validate(
  adminNotificationArchiveSchema,
);
