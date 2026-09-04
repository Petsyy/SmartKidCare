import {
  notificationsUserRepository,
  notificationsChildRepository,
  notificationsAttendanceRepository,
  notificationsFeedingRepository,
} from "../repositories/notifications.repository";
import PickupCode from "../../../models/PickupCode";
import PickupRecord from "../../../models/PickupRecord";
import { extractUserPushTokens } from "./push-notification.service";
import type { ParentNotificationType, ParentFeedItem, ParentFeedResult } from "../types/parent-notification.types";

const toDayStart = (value: Date): Date => {
  const dayStart = new Date(value);
  dayStart.setHours(0, 0, 0, 0);
  return dayStart;
};

const toDateKey = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatName = (first?: string, middle?: string, last?: string): string =>
  [first, middle, last].filter(Boolean).join(" ").trim();

const formatTimeLabel = (timeValue: string): string => {
  const trimmed = String(timeValue || "").trim();
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(trimmed);
  if (!match) return trimmed || "--:--";

  const hour24 = Number(match[1]);
  const minute = match[2];
  const meridiem = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minute} ${meridiem}`;
};

const formatTimeFromDate = (value?: Date | string | null): string => {
  if (!value) return "--:--";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "--:--";

  return d.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila",
  });
};

const asIdString = (value: unknown): string => {
  if (value && typeof value === "object") {
    const asObject = value as { _id?: unknown };
    if (asObject._id) return String(asObject._id);
  }
  return String(value ?? "");
};

const uniqueNames = (names: string[]): string[] =>
  Array.from(new Set(names.map((name) => name.trim()).filter(Boolean)));

const summarizeNames = (names: string[], maxVisible = 3): string => {
  const unique = uniqueNames(names);
  if (unique.length <= maxVisible) {
    return unique.join(", ");
  }
  const visible = unique.slice(0, maxVisible).join(", ");
  return `${visible} and ${unique.length - maxVisible} more`;
};

const ATTENDANCE_TIME_LABEL = formatTimeLabel(
  process.env.PARENT_ATTENDANCE_NOTIFY_TIME ||
    process.env.TEACHER_ATTENDANCE_NOTIFY_TIME ||
    "08:00",
);
const FEEDING_TIME_LABEL = formatTimeLabel(
  process.env.PARENT_FEEDING_NOTIFY_TIME ||
    process.env.TEACHER_FEEDING_NOTIFY_TIME ||
    "11:30",
);

export async function getParentNotificationsFeed(params: {
  parentId: string;
  date?: Date;
}): Promise<ParentFeedResult> {
  const targetDate = toDayStart(params.date || new Date());
  const dateKey = toDateKey(targetDate);

  const parent = await notificationsUserRepository.findParentById(params.parentId);

  if (!parent) {
    return {
      date: dateKey,
      parentId: params.parentId,
      parentName: "Parent",
      hasPushToken: false,
      notifications: [],
    };
  }

  const parentId = String(parent._id);
  const parentName =
    formatName(parent.firstName, parent.middleName, parent.lastName) ||
    "Parent";
  const hasPushToken = extractUserPushTokens(parent).length > 0;

  const children = await notificationsChildRepository.findActiveByParent(parentId);

  const childIds = new Set(children.map((child: any) => String(child._id)));
  const childNameById = new Map<string, string>();
  children.forEach((child: any) => {
    childNameById.set(
      String(child._id),
      formatName(child.firstName, child.middleName, child.lastName) || "Child",
    );
  });

  if (!childIds.size) {
    return {
      date: dateKey,
      parentId,
      parentName,
      hasPushToken,
      notifications: [],
    };
  }

  const [attendanceEntries, feedingEntries, pickupCodes, pickupRecords] = await Promise.all([
    notificationsAttendanceRepository.findByChildIdsAndDate(Array.from(childIds), targetDate),
    notificationsFeedingRepository.findByChildIdsAndDate(Array.from(childIds), targetDate),
    PickupCode.find({ child: { $in: Array.from(childIds) }, createdAt: { $gte: targetDate } }).lean(),
    PickupRecord.find({ child: { $in: Array.from(childIds) }, pickedUpAt: { $gte: targetDate } }).lean(),
  ]);

  const attendanceStatuses: Array<"present" | "absent"> = [];
  const absentChildren: string[] = [];
  let attendanceSubmittedAt: Date | null = null;
  attendanceEntries.forEach((entry: any) => {
    if (!attendanceSubmittedAt && entry?.createdAt) {
      attendanceSubmittedAt = new Date(entry.createdAt);
    }
    (entry?.records || []).forEach((record: any) => {
      const childId = asIdString(record?.child);
      if (!childIds.has(childId)) return;

      const status = String(record?.status || "").toLowerCase();
      if (status === "present" || status === "absent") {
        attendanceStatuses.push(status);
        if (status === "absent") {
          absentChildren.push(childNameById.get(childId) || "Child");
        }
      }
    });
  });

  const feedingStatuses: Array<"completed" | "missed"> = [];
  const missedChildren: string[] = [];
  const completedNames: string[] = [];
  const foodServedList: string[] = [];
  let feedingSubmittedAt: Date | null = null;
  feedingEntries.forEach((entry: any) => {
    if (!feedingSubmittedAt && entry?.createdAt) {
      feedingSubmittedAt = new Date(entry.createdAt);
    }
    const food = String(entry?.foodServed || "").trim();
    if (food) {
      foodServedList.push(food);
    }

    (entry?.records || []).forEach((record: any) => {
      const childId = asIdString(record?.child);
      if (!childIds.has(childId)) return;

      const status = String(record?.status || "").toLowerCase();
      if (status === "completed" || status === "missed") {
        feedingStatuses.push(status);
        if (status === "missed") {
          missedChildren.push(childNameById.get(childId) || "Child");
        }
        if (status === "completed") {
          completedNames.push(childNameById.get(childId) || "Child");
        }
      }
    });
  });

  const notifications: ParentFeedItem[] = [];

  if (attendanceStatuses.length > 0) {
    const presentCount = attendanceStatuses.filter(
      (status) => status === "present",
    ).length;
    const absentCount = attendanceStatuses.length - presentCount;
    const presentNames = uniqueNames(
      attendanceEntries.flatMap((entry: any) =>
        (entry?.records || [])
          .filter((record: any) => {
            const id = asIdString(record?.child);
            return (
              childIds.has(id) &&
              String(record?.status || "").toLowerCase() === "present"
            );
          })
          .map(
            (record: any) =>
              childNameById.get(asIdString(record.child)) || "Child",
          ),
      ),
    );

    notifications.push({
      id: `${dateKey}-attendance-submitted`,
      type: "attendance_submitted",
      title: "Attendance Submitted",
      message:
        absentCount > 0
          ? `${presentNames.length ? summarizeNames(presentNames) + " present; " : ""}${absentCount} absent.`
          : `${presentNames.length ? summarizeNames(presentNames) : presentCount} present today.`,
      timeLabel: attendanceSubmittedAt
        ? formatTimeFromDate(attendanceSubmittedAt)
        : ATTENDANCE_TIME_LABEL,
      actionLabel: "View",
    });

    if (absentCount > 0) {
      notifications.push({
        id: `${dateKey}-absence-alert`,
        type: "absence_alert",
        title: "Absence Alert",
        message:
          absentCount === 1
            ? `${uniqueNames(absentChildren)[0] || "Your child"} was marked absent.`
            : `${absentCount} children were marked absent: ${summarizeNames(absentChildren)}.`,
        timeLabel: attendanceSubmittedAt
          ? formatTimeFromDate(attendanceSubmittedAt)
          : ATTENDANCE_TIME_LABEL,
        actionLabel: "View",
      });
    }
  }

  if (feedingStatuses.length > 0) {
    const completedCount = feedingStatuses.filter(
      (status) => status === "completed",
    ).length;
    const missedCount = feedingStatuses.length - completedCount;
    const foods = uniqueNames(foodServedList);
    const foodLabel =
      foods.length === 0
        ? "meal"
        : foods.length === 1
          ? foods[0]
          : `${foods[0]} (+${foods.length - 1} more)`;

    notifications.push({
      id: `${dateKey}-feeding-submitted`,
      type: "feeding_submitted",
      title: "Feeding Submitted",
      message:
        completedNames.length > 0
          ? `${summarizeNames(completedNames)} completed today's lunch.`
          : missedCount > 0
            ? "Lunch record submitted."
            : "Lunch completed today.",
      timeLabel: feedingSubmittedAt
        ? formatTimeFromDate(feedingSubmittedAt)
        : FEEDING_TIME_LABEL,
      actionLabel: "View",
    });

    if (missedCount > 0) {
      notifications.push({
        id: `${dateKey}-missed-meal-alert`,
        type: "missed_meal_alert",
        title: "Missed Meal Alert",
        message:
          missedCount === 1
            ? `${uniqueNames(missedChildren)[0] || "Your child"} missed ${foodLabel}.`
            : `${missedCount} children missed ${foodLabel}: ${summarizeNames(missedChildren)}.`,
        timeLabel: feedingSubmittedAt
          ? formatTimeFromDate(feedingSubmittedAt)
          : FEEDING_TIME_LABEL,
        actionLabel: "View",
      });
    }
  }

  // Add Pickup Codes to feed
  pickupCodes.forEach((code: any) => {
    const childName = childNameById.get(String(code.child)) || "Child";
    notifications.push({
      id: `${dateKey}-pickup-code-${code._id}`,
      type: "pickup_code_generated",
      title: "Pickup Code Generated",
      message: `Pickup code generated for ${childName}.`,
      timeLabel: formatTimeFromDate(code.createdAt),
      actionLabel: "View",
    });
  });

  // Add Pickup Records to feed
  pickupRecords.forEach((record: any) => {
    const childName = childNameById.get(String(record.child)) || "Child";
    const pickerName = record.pickedUpBy?.name || "Guardian";
    notifications.push({
      id: `${dateKey}-pickup-record-${record._id}`,
      type: "child_released",
      title: "Child Released",
      message: `${childName} was released to ${pickerName}.`,
      timeLabel: formatTimeFromDate(record.pickedUpAt),
      actionLabel: "View",
    });
  });

  return {
    date: dateKey,
    parentId,
    parentName,
    hasPushToken,
    notifications,
  };
}

export type { ParentNotificationType, ParentFeedItem, ParentFeedResult } from "../types/parent-notification.types";
