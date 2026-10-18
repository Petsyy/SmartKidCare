import {
  ForbiddenError,
  ValidationError,
} from "../../../shared/errors/app-error";
import { recordServiceSupport } from "../../../shared/services/record-service-support";
import {
  extractUserPushTokens,
  sendExpoPushNotifications,
} from "../../notifications/services/push-notification.service";
import { pickupNotificationRepository } from "../repositories/pickup-notification.repository";
import type { PickupAuthUser } from "../types/pickup.types";
import type {
  BulkPickupNotificationDetail,
  BulkPickupNotificationInput,
  BulkPickupNotificationResult,
  PickupNotificationChild,
  PickupNotificationServiceDependencies,
} from "../types/pickup-notification.types";

const COOLDOWN_MS = 15 * 60 * 1000;
const TITLE = "Pickup Reminder";

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: number }).code === 11000;

const childName = (child: PickupNotificationChild): string =>
  `${child.firstName} ${child.lastName}`.trim();

const buildMessage = (child: PickupNotificationChild): string =>
  `Please pick up ${childName(child)} from the child development center. Contact the teacher if you need assistance.`;

export const sendBulkPickupNotificationsOperation = async (
  user: PickupAuthUser,
  input: BulkPickupNotificationInput,
  dependencies: PickupNotificationServiceDependencies,
): Promise<BulkPickupNotificationResult> => {
  if (user.role !== "teacher" || !user.daycareCenterId) {
    throw new ForbiddenError("Only assigned teachers can send pickup reminders.");
  }

  const now = dependencies.now();
  const dayRange = dependencies.parseDayRange(now);
  if (!dayRange) throw new ValidationError("Unable to resolve today's pickup date.");

  const children = await dependencies.repository.findChildrenByIds(input.childIds);
  const childById = new Map(children.map((child) => [String(child._id), child]));
  const hasUnauthorizedChild = input.childIds.some((id) => {
    const child = childById.get(id);
    return (
      !child ||
      String(child.teacher) !== user.id ||
      String(child.daycareCenter) !== String(user.daycareCenterId)
    );
  });
  if (hasUnauthorizedChild) {
    throw new ForbiddenError("One or more children are not assigned to this teacher.");
  }

  const [presentIds, releasedIds, recentIds] = await Promise.all([
    dependencies.repository.findPresentChildIds({
      teacherId: user.id,
      centerId: String(user.daycareCenterId),
      ...dayRange,
    }),
    dependencies.repository.findReleasedChildIds({ childIds: input.childIds, ...dayRange }),
    dependencies.repository.findRecentlyAlertedChildIds(
      input.childIds,
      new Date(now.getTime() - COOLDOWN_MS),
    ),
  ]);

  const present = new Set(presentIds);
  const released = new Set(releasedIds);
  const recent = new Set(recentIds);
  const details: BulkPickupNotificationDetail[] = [];
  let sent = 0;
  let pushDelivered = 0;
  let pushFailed = 0;

  for (const id of input.childIds) {
    const child = childById.get(id)!;
    const name = childName(child);

    if (child.status !== "Active" || !present.has(id)) {
      details.push({ childId: id, childName: name, status: "not_present", reason: "Child is not currently present and eligible for pickup." });
      continue;
    }
    if (released.has(id)) {
      details.push({ childId: id, childName: name, status: "already_released", reason: "Child has already been released today." });
      continue;
    }
    if (recent.has(id)) {
      details.push({ childId: id, childName: name, status: "cooldown", reason: "A pickup reminder was sent within the last 15 minutes." });
      continue;
    }

    const parent = child.parent;
    if (!parent || typeof parent !== "object" || parent.role !== "parent" || !parent.isActive) {
      details.push({ childId: id, childName: name, status: "missing_parent", reason: "No active parent account is available." });
      continue;
    }

    const message = buildMessage(child);
    const cooldownBucket = Math.floor(now.getTime() / COOLDOWN_MS);
    try {
      await dependencies.repository.createAlert({
        recipientId: String(parent._id),
        childId: id,
        senderId: user.id,
        centerId: String(user.daycareCenterId),
        title: TITLE,
        message,
        cooldownKey: `pickup_reminder:${id}:${cooldownBucket}`,
      });
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
      details.push({ childId: id, childName: name, status: "cooldown", reason: "A pickup reminder was already sent recently." });
      continue;
    }

    sent += 1;
    const tokens = dependencies.extractTokens(parent);
    if (!tokens.length) {
      details.push({ childId: id, childName: name, status: "sent", reason: "In-app alert saved; no registered push token." });
      continue;
    }

    try {
      const pushResult = await dependencies.sendPush({
        tokens,
        title: TITLE,
        body: message,
        data: { type: "pickup_reminder", childId: id },
      });
      if (pushResult.accepted > 0) pushDelivered += 1;
      if (pushResult.rejected > 0 || pushResult.accepted === 0) {
        pushFailed += 1;
        details.push({ childId: id, childName: name, status: "push_failed", reason: "In-app alert saved, but push delivery was incomplete." });
      } else {
        details.push({ childId: id, childName: name, status: "sent" });
      }
    } catch {
      pushFailed += 1;
      details.push({ childId: id, childName: name, status: "push_failed", reason: "In-app alert saved, but push delivery failed." });
    }
  }

  return {
    sent,
    pushDelivered,
    pushFailed,
    skipped: details.filter((detail) => !["sent", "push_failed"].includes(detail.status)).length,
    details,
  };
};

export class PickupNotificationService {
  constructor(private readonly dependencies: PickupNotificationServiceDependencies) {}

  sendBulk(user: PickupAuthUser, input: BulkPickupNotificationInput) {
    return sendBulkPickupNotificationsOperation(user, input, this.dependencies);
  }
}

export const pickupNotificationService = new PickupNotificationService({
  repository: pickupNotificationRepository,
  now: () => new Date(),
  parseDayRange: (value) => recordServiceSupport.parseDayRange(value),
  extractTokens: extractUserPushTokens,
  sendPush: sendExpoPushNotifications,
});
