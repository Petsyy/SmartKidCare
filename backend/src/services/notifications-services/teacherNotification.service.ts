import Attendance from "../../models/Attendance";
import Child from "../../models/Child";
import Feeding from "../../models/Feeding";
import User from "../../models/Users";
import {
  extractUserPushTokens,
  sendExpoPushNotifications,
} from "./pushNotification.service";

export type TeacherNotificationType =
  | "attendance_reminder"
  | "attendance_incomplete"
  | "feeding_reminder"
  | "feeding_incomplete";

interface TeacherDispatchDetail {
  teacherId: string;
  teacherName: string;
  sent: TeacherNotificationType[];
  skipped?: string;
}

export interface TeacherDispatchResult {
  date: string;
  totalTeachers: number;
  processedTeachers: number;
  notificationsSent: number;
  attendanceReminderCount: number;
  attendanceIncompleteCount: number;
  feedingReminderCount: number;
  feedingIncompleteCount: number;
  details: TeacherDispatchDetail[];
}

export interface TeacherFeedItem {
  id: string;
  type: TeacherNotificationType;
  title: string;
  message: string;
  timeLabel: string;
  actionLabel: string;
}

export interface TeacherFeedResult {
  date: string;
  teacherId: string;
  teacherName: string;
  hasPushToken: boolean;
  notifications: TeacherFeedItem[];
}

interface DispatchTeacherParams {
  date?: Date;
  teacherIds?: string[];
  includeTypes?: TeacherNotificationType[];
}

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

const formatDateLabel = (value: Date): string => {
  const [year, month, day] = toDateKey(value).split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, (month || 1) - 1, day || 1));
  return utcDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
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

const ATTENDANCE_TIME_LABEL = formatTimeLabel(
  process.env.TEACHER_ATTENDANCE_NOTIFY_TIME || "08:00",
);
const FEEDING_TIME_LABEL = formatTimeLabel(
  process.env.TEACHER_FEEDING_NOTIFY_TIME || "11:30",
);

const asIdString = (value: unknown): string => {
  if (value && typeof value === "object") {
    const asObject = value as { _id?: unknown };
    if (asObject._id) return String(asObject._id);
  }
  return String(value ?? "");
};

const getRecordCoverage = (
  records: Array<{ child: unknown }>,
  activeChildIds: Set<string>,
): { markedCount: number; missingCount: number } => {
  const markedIds = new Set<string>();
  records.forEach((record) => {
    const childId = asIdString(record.child);
    if (activeChildIds.has(childId)) {
      markedIds.add(childId);
    }
  });

  const markedCount = markedIds.size;
  const missingCount = Math.max(activeChildIds.size - markedCount, 0);

  return { markedCount, missingCount };
};

interface TeacherNotificationDraft {
  type: TeacherNotificationType;
  title: string;
  body: string;
  timeLabel: string;
  actionLabel: string;
  data: Record<string, unknown>;
}

const buildTeacherNotificationDrafts = (params: {
  attendance: any;
  feeding: any;
  dateKey: string;
  dateLabel: string;
  expectedChildCount: number;
  activeChildIds: Set<string>;
  includeTypeSet: Set<TeacherNotificationType>;
}): TeacherNotificationDraft[] => {
  const {
    attendance,
    feeding,
    dateKey,
    dateLabel,
    expectedChildCount,
    activeChildIds,
    includeTypeSet,
  } = params;

  const drafts: TeacherNotificationDraft[] = [];

  if (!attendance && includeTypeSet.has("attendance_reminder")) {
    drafts.push({
      type: "attendance_reminder",
      title: "Reminder",
      body: "Submit today's attendance record.",
      timeLabel: ATTENDANCE_TIME_LABEL,
      actionLabel: "View",
      data: {
        type: "teacher_attendance_reminder",
        date: dateKey,
        dateLabel,
        audience: "teacher",
      },
    });
  } else if (includeTypeSet.has("attendance_incomplete") && expectedChildCount > 0) {
    const coverage = getRecordCoverage(attendance?.records || [], activeChildIds);
    if (coverage.markedCount < expectedChildCount) {
      drafts.push({
        type: "attendance_incomplete",
        title: "Reminder",
        body: `Attendance record is incomplete (${coverage.markedCount}/${expectedChildCount} marked).`,
        timeLabel: ATTENDANCE_TIME_LABEL,
        actionLabel: "View",
        data: {
          type: "teacher_attendance_incomplete",
          date: dateKey,
          dateLabel,
          markedCount: coverage.markedCount,
          expectedCount: expectedChildCount,
          missingCount: coverage.missingCount,
          audience: "teacher",
        },
      });
    }
  }

  if (!feeding && includeTypeSet.has("feeding_reminder")) {
    drafts.push({
      type: "feeding_reminder",
      title: "Reminder",
      body: "Feeding record not submitted yet.",
      timeLabel: FEEDING_TIME_LABEL,
      actionLabel: "View",
      data: {
        type: "teacher_feeding_reminder",
        date: dateKey,
        dateLabel,
        audience: "teacher",
      },
    });
  } else if (includeTypeSet.has("feeding_incomplete") && expectedChildCount > 0) {
    const coverage = getRecordCoverage(feeding?.records || [], activeChildIds);
    if (coverage.markedCount < expectedChildCount) {
      drafts.push({
        type: "feeding_incomplete",
        title: "Reminder",
        body: `Feeding record is incomplete (${coverage.markedCount}/${expectedChildCount} marked).`,
        timeLabel: FEEDING_TIME_LABEL,
        actionLabel: "View",
        data: {
          type: "teacher_feeding_incomplete",
          date: dateKey,
          dateLabel,
          markedCount: coverage.markedCount,
          expectedCount: expectedChildCount,
          missingCount: coverage.missingCount,
          audience: "teacher",
        },
      });
    }
  }

  return drafts;
};

export async function dispatchTeacherNotificationsV1(
  params: DispatchTeacherParams = {},
): Promise<TeacherDispatchResult> {
  const targetDate = toDayStart(params.date || new Date());
  const dateKey = toDateKey(targetDate);
  const dateLabel = formatDateLabel(targetDate);

  const includeTypes = Array.isArray(params.includeTypes)
    ? params.includeTypes
    : [];
  const includeTypeSet =
    includeTypes.length > 0
      ? new Set<TeacherNotificationType>(includeTypes)
      : new Set<TeacherNotificationType>([
          "attendance_reminder",
          "attendance_incomplete",
          "feeding_reminder",
          "feeding_incomplete",
        ]);

  const teacherQuery: Record<string, unknown> = {
    role: "teacher",
    isActive: true,
  };

  if (params.teacherIds?.length) {
    teacherQuery._id = { $in: params.teacherIds };
  }

  const teachers = await User.find(teacherQuery)
    .select("firstName middleName lastName pushToken pushTokens")
    .lean();

  if (!teachers.length) {
    return {
      date: dateKey,
      totalTeachers: 0,
      processedTeachers: 0,
      notificationsSent: 0,
      attendanceReminderCount: 0,
      attendanceIncompleteCount: 0,
      feedingReminderCount: 0,
      feedingIncompleteCount: 0,
      details: [],
    };
  }

  const activeChildren = await Child.find({ status: "Active" })
    .select("_id")
    .lean();
  const activeChildIds = new Set(
    activeChildren.map((child: any) => String(child._id)),
  );
  const expectedChildCount = activeChildIds.size;

  const teacherIds = teachers.map((teacher: any) => String(teacher._id));

  const [attendanceEntries, feedingEntries] = await Promise.all([
    Attendance.find({
      teacher: { $in: teacherIds },
      date: targetDate,
    })
      .select("teacher records")
      .lean(),
    Feeding.find({
      teacher: { $in: teacherIds },
      date: targetDate,
    })
      .select("teacher records")
      .lean(),
  ]);

  const attendanceByTeacher = new Map<string, any>();
  attendanceEntries.forEach((entry: any) =>
    attendanceByTeacher.set(String(entry.teacher), entry),
  );

  const feedingByTeacher = new Map<string, any>();
  feedingEntries.forEach((entry: any) =>
    feedingByTeacher.set(String(entry.teacher), entry),
  );

  let notificationsSent = 0;
  let attendanceReminderCount = 0;
  let attendanceIncompleteCount = 0;
  let feedingReminderCount = 0;
  let feedingIncompleteCount = 0;

  const details: TeacherDispatchDetail[] = [];

  for (const teacher of teachers as any[]) {
    const teacherId = String(teacher._id);
    const teacherName =
      formatName(teacher.firstName, teacher.middleName, teacher.lastName) ||
      "Teacher";
    const tokens = extractUserPushTokens(teacher);

    if (!tokens.length) {
      details.push({
        teacherId,
        teacherName,
        sent: [],
        skipped: "No registered push token",
      });
      continue;
    }

    const sent: TeacherNotificationType[] = [];
    const attendance = attendanceByTeacher.get(teacherId);
    const feeding = feedingByTeacher.get(teacherId);
    const drafts = buildTeacherNotificationDrafts({
      attendance,
      feeding,
      dateKey,
      dateLabel,
      expectedChildCount,
      activeChildIds,
      includeTypeSet,
    });

    for (const draft of drafts) {
      const result = await sendExpoPushNotifications({
        tokens,
        title: draft.title,
        body: draft.body,
        data: draft.data,
        channelId: "default",
      });

      if (result.accepted <= 0) continue;

      notificationsSent += 1;
      sent.push(draft.type);

      if (draft.type === "attendance_reminder") {
        attendanceReminderCount += 1;
      } else if (draft.type === "attendance_incomplete") {
        attendanceIncompleteCount += 1;
      } else if (draft.type === "feeding_reminder") {
        feedingReminderCount += 1;
      } else if (draft.type === "feeding_incomplete") {
        feedingIncompleteCount += 1;
      }
    }

    details.push({ teacherId, teacherName, sent });
  }

  return {
    date: dateKey,
    totalTeachers: teachers.length,
    processedTeachers: details.length,
    notificationsSent,
    attendanceReminderCount,
    attendanceIncompleteCount,
    feedingReminderCount,
    feedingIncompleteCount,
    details,
  };
}

export async function getTeacherNotificationsFeed(params: {
  teacherId: string;
  date?: Date;
  includeTypes?: TeacherNotificationType[];
}): Promise<TeacherFeedResult> {
  const targetDate = toDayStart(params.date || new Date());
  const dateKey = toDateKey(targetDate);
  const dateLabel = formatDateLabel(targetDate);

  const includeTypes = Array.isArray(params.includeTypes)
    ? params.includeTypes
    : [];
  const includeTypeSet =
    includeTypes.length > 0
      ? new Set<TeacherNotificationType>(includeTypes)
      : new Set<TeacherNotificationType>([
          "attendance_reminder",
          "attendance_incomplete",
          "feeding_reminder",
          "feeding_incomplete",
        ]);

  const teacher = await User.findOne({
    _id: params.teacherId,
    role: "teacher",
    isActive: true,
  })
    .select("firstName middleName lastName pushToken pushTokens")
    .lean();

  if (!teacher) {
    return {
      date: dateKey,
      teacherId: params.teacherId,
      teacherName: "Teacher",
      hasPushToken: false,
      notifications: [],
    };
  }

  const teacherId = String(teacher._id);
  const teacherName =
    formatName(teacher.firstName, teacher.middleName, teacher.lastName) ||
    "Teacher";
  const hasPushToken = extractUserPushTokens(teacher).length > 0;

  const activeChildren = await Child.find({ status: "Active" })
    .select("_id")
    .lean();
  const activeChildIds = new Set(
    activeChildren.map((child: any) => String(child._id)),
  );
  const expectedChildCount = activeChildIds.size;

  const [attendance, feeding] = await Promise.all([
    Attendance.findOne({
      teacher: teacherId,
      date: targetDate,
    })
      .select("records")
      .lean(),
    Feeding.findOne({
      teacher: teacherId,
      date: targetDate,
    })
      .select("records")
      .lean(),
  ]);

  const drafts = buildTeacherNotificationDrafts({
    attendance,
    feeding,
    dateKey,
    dateLabel,
    expectedChildCount,
    activeChildIds,
    includeTypeSet,
  });

  const notifications: TeacherFeedItem[] = drafts.map((draft, index) => ({
    id: `${dateKey}-${draft.type}-${index + 1}`,
    type: draft.type,
    title: draft.title,
    message: draft.body,
    timeLabel: draft.timeLabel,
    actionLabel: draft.actionLabel,
  }));

  return {
    date: dateKey,
    teacherId,
    teacherName,
    hasPushToken,
    notifications,
  };
}
