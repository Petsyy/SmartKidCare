import Child from "../../models/Child";
import User from "../../models/Users";
import {
  extractUserPushTokens,
  sendExpoPushNotifications,
} from "./pushNotification.service";

type AttendanceStatus = "present" | "absent";
type FeedingStatus = "completed" | "missed";

interface RecordInput {
  child: unknown;
  status: string;
}

interface ParentRecord {
  childId: string;
  childName: string;
  status: string;
}

interface ParentTarget {
  parentId: string;
  parentName: string;
  tokens: string[];
  records: ParentRecord[];
}

const asIdString = (value: unknown): string => {
  if (value && typeof value === "object") {
    const objectValue = value as { _id?: unknown };
    if (objectValue._id) {
      return String(objectValue._id);
    }
  }
  return String(value ?? "");
};

const toDateKey = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateLabel = (value: Date): string => {
  const key = toDateKey(value);
  const [year, month, day] = key.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, (month || 1) - 1, day || 1));
  return utcDate.toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  });
};

const formatName = (first?: string, middle?: string, last?: string): string => {
  return [first, middle, last].filter(Boolean).join(" ").trim();
};

const summarizeNames = (names: string[], maxVisible = 3): string => {
  const unique = Array.from(
    new Set(names.map((name) => name.trim()).filter(Boolean)),
  );
  if (unique.length <= maxVisible) {
    return unique.join(", ");
  }
  const visible = unique.slice(0, maxVisible).join(", ");
  return `${visible} and ${unique.length - maxVisible} more`;
};

const buildParentTargets = async (
  records: RecordInput[],
): Promise<ParentTarget[]> => {
  const normalizedRecords = records
    .map((record) => ({
      childId: asIdString(record.child),
      status: String(record.status || "").toLowerCase(),
    }))
    .filter((record) => record.childId.length > 0 && record.status.length > 0);

  if (!normalizedRecords.length) {
    return [];
  }

  const childIds = Array.from(
    new Set(normalizedRecords.map((record) => record.childId)),
  );

  const children = await Child.find({ _id: { $in: childIds } })
    .select("firstName middleName lastName parent")
    .lean();

  const childMap = new Map<
    string,
    {
      parentId: string;
      childName: string;
    }
  >();

  children.forEach((child: any) => {
    if (!child?.parent) return;
    const childId = String(child._id);
    const parentId = String(child.parent);
    if (!parentId) return;
    childMap.set(childId, {
      parentId,
      childName: formatName(child.firstName, child.middleName, child.lastName),
    });
  });

  const groupedRecords = new Map<string, ParentRecord[]>();
  normalizedRecords.forEach((record) => {
    const childInfo = childMap.get(record.childId);
    if (!childInfo?.parentId) return;
    const list = groupedRecords.get(childInfo.parentId) ?? [];
    list.push({
      childId: record.childId,
      childName: childInfo.childName || "Child",
      status: record.status,
    });
    groupedRecords.set(childInfo.parentId, list);
  });

  const parentIds = Array.from(groupedRecords.keys());
  if (!parentIds.length) {
    return [];
  }

  const parents = await User.find({
    _id: { $in: parentIds },
    role: "parent",
    isActive: true,
  })
    .select("firstName lastName pushToken pushTokens")
    .lean();

  return parents
    .map((parent: any) => {
      const parentId = String(parent._id);
      const recordsForParent = groupedRecords.get(parentId) ?? [];
      const tokens = extractUserPushTokens(parent);
      return {
        parentId,
        parentName:
          formatName(parent.firstName, undefined, parent.lastName) || "Parent",
        tokens,
        records: recordsForParent,
      };
    })
    .filter((entry) => entry.tokens.length > 0 && entry.records.length > 0);
};

export const notifyAttendanceSubmitted = async (params: {
  date: Date;
  records: Array<{ child: unknown; status: AttendanceStatus }>;
}): Promise<void> => {
  const targets = await buildParentTargets(params.records);
  if (!targets.length) return;

  const dateLabel = formatDateLabel(params.date);
  const dateKey = toDateKey(params.date);

  for (const target of targets) {
    const presentCount = target.records.filter(
      (record) => record.status === "present",
    ).length;
    const absentRecords = target.records.filter(
      (record) => record.status === "absent",
    );
    const total = target.records.length;

    const summaryResult = await sendExpoPushNotifications({
      tokens: target.tokens,
      title: "Attendance Submitted",
      body:
        absentRecords.length > 0
          ? `Attendance for ${dateLabel}: ${presentCount} present, ${absentRecords.length} absent.`
          : `Attendance for ${dateLabel}: all ${total} marked present.`,
      data: {
        type: "attendance_submitted",
        date: dateKey,
        total,
        present: presentCount,
        absent: absentRecords.length,
        audience: "parent",
      },
      channelId: "default",
    });
    if (summaryResult.errors.length > 0) {
      console.warn(
        "Attendance summary push warning:",
        target.parentId,
        summaryResult.errors,
      );
    }

    if (absentRecords.length > 0) {
      const alertResult = await sendExpoPushNotifications({
        tokens: target.tokens,
        title: "Absence Alert",
        body:
          absentRecords.length === 1
            ? `${absentRecords[0].childName} is marked absent on ${dateLabel}.`
            : `${absentRecords.length} children are marked absent on ${dateLabel}: ${summarizeNames(absentRecords.map((record) => record.childName))}.`,
        data: {
          type: "absence_alert",
          date: dateKey,
          absentChildren: absentRecords.map((record) => record.childName),
          audience: "parent",
        },
        channelId: "default",
      });
      if (alertResult.errors.length > 0) {
        console.warn(
          "Absence alert push warning:",
          target.parentId,
          alertResult.errors,
        );
      }
    }
  }
};

export const notifyFeedingSubmitted = async (params: {
  date: Date;
  foodServed: string;
  records: Array<{ child: unknown; status: FeedingStatus }>;
}): Promise<void> => {
  const targets = await buildParentTargets(params.records);
  if (!targets.length) return;

  const dateLabel = formatDateLabel(params.date);
  const dateKey = toDateKey(params.date);

  for (const target of targets) {
    const completedCount = target.records.filter(
      (record) => record.status === "completed",
    ).length;
    const missedRecords = target.records.filter(
      (record) => record.status === "missed",
    );

    const summaryResult = await sendExpoPushNotifications({
      tokens: target.tokens,
      title: "Feeding Submitted",
      body: `${params.foodServed} on ${dateLabel}: ${completedCount} completed, ${missedRecords.length} missed.`,
      data: {
        type: "feeding_submitted",
        date: dateKey,
        foodServed: params.foodServed,
        completed: completedCount,
        missed: missedRecords.length,
        audience: "parent",
      },
      channelId: "default",
    });
    if (summaryResult.errors.length > 0) {
      console.warn(
        "Feeding summary push warning:",
        target.parentId,
        summaryResult.errors,
      );
    }

    if (missedRecords.length > 0) {
      const alertResult = await sendExpoPushNotifications({
        tokens: target.tokens,
        title: "Missed Meal Alert",
        body:
          missedRecords.length === 1
            ? `${missedRecords[0].childName} missed ${params.foodServed} on ${dateLabel}.`
            : `${missedRecords.length} children missed ${params.foodServed} on ${dateLabel}: ${summarizeNames(missedRecords.map((record) => record.childName))}.`,
        data: {
          type: "missed_meal_alert",
          date: dateKey,
          foodServed: params.foodServed,
          missedChildren: missedRecords.map((record) => record.childName),
          audience: "parent",
        },
        channelId: "default",
      });
      if (alertResult.errors.length > 0) {
        console.warn(
          "Missed meal alert push warning:",
          target.parentId,
          alertResult.errors,
        );
      }
    }
  }
};
