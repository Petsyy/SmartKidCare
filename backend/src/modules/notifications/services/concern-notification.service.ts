import User from "../../../models/Users";
import type { ConcernNotification } from "../../concerns/types/concern.types";
import {
  extractUserPushTokens,
  sendExpoPushNotifications,
} from "./push-notification.service";

export async function notifyParentAboutConcern(
  notification: ConcernNotification,
): Promise<void> {
  const parent = await User.findOne({
    _id: notification.parentId,
    role: "parent",
    isActive: true,
  })
    .select("pushToken pushTokens")
    .lean();

  if (!parent) return;
  const tokens = extractUserPushTokens(parent);
  if (!tokens.length) return;

  const result = await sendExpoPushNotifications({
    tokens,
    title: notification.title,
    body: notification.body,
    data: {
      type: notification.type,
      concernId: notification.concernId,
      audience: "parent",
    },
    channelId: "default",
  });

  if (result.errors.length > 0) {
    console.warn("Concern push warning:", notification.concernId, result.errors);
  }
}
