import { Request, Response } from "express";
import mongoose from "mongoose";
import { Expo } from "expo-server-sdk";
import User from "../../models/Users";
import {
  extractUserPushTokens,
  sendExpoPushNotifications,
} from "./push-notification.service";
import {
  dispatchTeacherNotificationsV1,
  getTeacherNotificationsFeed,
} from "./teacher-notification.service";
import { getParentNotificationsFeed } from "./parent-notification.service";

type Platform = "ios" | "android" | "web" | "unknown";

const ALLOWED_PLATFORMS = new Set<Platform>([
  "ios",
  "android",
  "web",
  "unknown",
]);

const normalizeString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const isValidObjectId = (value: string | null): value is string =>
  typeof value === "string" && mongoose.Types.ObjectId.isValid(value);

const parseDateInput = (value: unknown): Date | null => {
  if (value == null) return new Date();

  const raw = String(value).trim();
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);
    const localDate = new Date(year, month - 1, day);
    if (Number.isNaN(localDate.getTime())) return null;
    return localDate;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

export const registerPushToken = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized: user not found" });
    }

    const pushToken = normalizeString(req.body?.pushToken);
    if (!pushToken) {
      return res.status(400).json({ message: "Push token required" });
    }
    if (!Expo.isExpoPushToken(pushToken)) {
      return res.status(400).json({ message: "Invalid Expo push token" });
    }

    const platformInput = normalizeString(req.body?.platform)?.toLowerCase();
    const platform: Platform =
      platformInput && ALLOWED_PLATFORMS.has(platformInput as Platform)
        ? (platformInput as Platform)
        : "unknown";

    const deviceName = normalizeString(req.body?.deviceName);
    const appOwnership = normalizeString(req.body?.appOwnership);

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const remainingTokens = Array.isArray(user.pushTokens)
      ? user.pushTokens
          .map((entry) => ({
            token: String(entry.token || "").trim(),
            platform:
              typeof entry.platform === "string" &&
              ALLOWED_PLATFORMS.has(entry.platform as Platform)
                ? (entry.platform as Platform)
                : "unknown",
            deviceName:
              typeof entry.deviceName === "string" ? entry.deviceName : null,
            appOwnership:
              typeof entry.appOwnership === "string"
                ? entry.appOwnership
                : null,
            updatedAt: entry.updatedAt || new Date(),
          }))
          .filter((entry) => entry.token.length && entry.token !== pushToken)
      : [];

    user.pushTokens = [
      {
        token: pushToken,
        platform,
        deviceName,
        appOwnership,
        updatedAt: new Date(),
      },
      ...remainingTokens,
    ].slice(0, 10);

    user.pushToken = pushToken;
    await user.save();

    return res.json({
      message: "Push token saved successfully",
      totalTokens: user.pushTokens.length,
    });
  } catch (error: any) {
    console.error("Register push token error:", error);
    return res.status(500).json({ message: "Failed to register push token" });
  }
};

export const unregisterPushToken = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized: user not found" });
    }

    const pushToken = normalizeString(req.body?.pushToken);
    if (!pushToken) {
      return res.status(400).json({ message: "Push token required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.pushTokens = Array.isArray(user.pushTokens)
      ? user.pushTokens.filter((entry) => entry.token !== pushToken)
      : [];

    if (user.pushToken === pushToken) {
      user.pushToken = user.pushTokens[0]?.token || null;
    }

    await user.save();

    return res.json({
      message: "Push token removed successfully",
      totalTokens: user.pushTokens.length,
    });
  } catch (error: any) {
    console.error("Unregister push token error:", error);
    return res.status(500).json({ message: "Failed to unregister push token" });
  }
};

export const sendTestPushNotification = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized: user not found" });
    }

    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const tokens = extractUserPushTokens(user);
    if (!tokens.length) {
      return res
        .status(400)
        .json({ message: "No registered push tokens for this user" });
    }

    const title = normalizeString(req.body?.title) || "SmartKidCare Test";
    const body =
      normalizeString(req.body?.body) || "Push notification is working.";

    const data =
      typeof req.body?.data === "object" &&
      req.body?.data !== null &&
      !Array.isArray(req.body?.data)
        ? req.body.data
        : undefined;

    const result = await sendExpoPushNotifications({
      tokens,
      title,
      body,
      data,
      channelId: "default",
    });

    return res.json({
      message: "Push send request completed",
      ...result,
    });
  } catch (error: any) {
    console.error("Send test push error:", error);
    return res.status(500).json({ message: "Failed to send push notification" });
  }
};

export const dispatchTeacherNotifications = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id || !req.user.role) {
      return res.status(401).json({ message: "Unauthorized: user not found" });
    }

    if (req.user.role !== "admin" && req.user.role !== "teacher") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const parsedDate = parseDateInput(req.body?.date);
    if (!parsedDate) {
      return res
        .status(400)
        .json({ message: "Invalid date. Use ISO date format." });
    }

    let teacherIds: string[] | undefined = undefined;

    if (req.user.role === "teacher") {
      teacherIds = [req.user.id];
    } else if (Array.isArray(req.body?.teacherIds)) {
      const normalizedTeacherIds = req.body.teacherIds
        .map((value: unknown) => normalizeString(value))
        .filter((value: string | null): value is string => Boolean(value));

      if (
        normalizedTeacherIds.some(
          (teacherId: string) => !isValidObjectId(teacherId),
        )
      ) {
        return res.status(400).json({ message: "One or more teacherIds are invalid." });
      }

      teacherIds = normalizedTeacherIds;
    }

    const result = await dispatchTeacherNotificationsV1({
      date: parsedDate,
      teacherIds,
    });

    return res.json({
      message: "Teacher notifications dispatched",
      ...result,
    });
  } catch (error: any) {
    console.error("Teacher v1 dispatch error:", error);
    return res
      .status(500)
      .json({ message: "Failed to dispatch teacher notifications" });
  }
};

export const getTeacherNotifications = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id || !req.user.role) {
      return res.status(401).json({ message: "Unauthorized: user not found" });
    }

    if (req.user.role !== "admin" && req.user.role !== "teacher") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const parsedDate = parseDateInput(req.query?.date);
    if (!parsedDate) {
      return res
        .status(400)
        .json({ message: "Invalid date. Use ISO date format." });
    }

    let teacherId = req.user.id;
    if (req.user.role === "admin") {
      const requestedTeacherId = normalizeString(req.query?.teacherId);
      if (!requestedTeacherId) {
        return res
          .status(400)
          .json({ message: "teacherId is required for admin requests." });
      }
      if (!isValidObjectId(requestedTeacherId)) {
        return res.status(400).json({ message: "Invalid teacherId." });
      }
      teacherId = requestedTeacherId;
    }

    const feed = await getTeacherNotificationsFeed({
      teacherId,
      date: parsedDate,
    });

    return res.json({
      message: "Teacher notifications feed retrieved",
      ...feed,
    });
  } catch (error: any) {
    console.error("Teacher v1 feed error:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch teacher notifications feed" });
  }
};

export const getParentNotifications = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id || !req.user.role) {
      return res.status(401).json({ message: "Unauthorized: user not found" });
    }

    if (req.user.role !== "admin" && req.user.role !== "parent") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const parsedDate = parseDateInput(req.query?.date);
    if (!parsedDate) {
      return res
        .status(400)
        .json({ message: "Invalid date. Use ISO date format." });
    }

    let parentId = req.user.id;
    if (req.user.role === "admin") {
      const requestedParentId = normalizeString(req.query?.parentId);
      if (!requestedParentId) {
        return res
          .status(400)
          .json({ message: "parentId is required for admin requests." });
      }
      if (!isValidObjectId(requestedParentId)) {
        return res.status(400).json({ message: "Invalid parentId." });
      }
      parentId = requestedParentId;
    }

    const feed = await getParentNotificationsFeed({
      parentId,
      date: parsedDate,
    });

    return res.json({
      message: "Parent notifications feed retrieved",
      ...feed,
    });
  } catch (error: any) {
    console.error("Parent v1 feed error:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch parent notifications feed" });
  }
};
