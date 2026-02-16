import {
  dispatchTeacherNotificationsV1,
  TeacherNotificationType,
} from "./teacherNotification.service";

type SlotName = "attendance" | "feeding";

interface SlotConfig {
  name: SlotName;
  displayName: string;
  time: string;
  includeTypes: TeacherNotificationType[];
}

const ENABLED = String(
  process.env.TEACHER_NOTIFICATION_SCHEDULER_ENABLED || "true",
).toLowerCase() !== "false";

const CHECK_INTERVAL_MS = Math.max(
  Number(process.env.TEACHER_NOTIFICATION_CHECK_INTERVAL_MS || 60_000),
  15_000,
);

const SLOTS: SlotConfig[] = [
  {
    name: "attendance",
    displayName: "Attendance",
    time: process.env.TEACHER_ATTENDANCE_NOTIFY_TIME || "08:00",
    includeTypes: ["attendance_reminder", "attendance_incomplete"],
  },
  {
    name: "feeding",
    displayName: "Feeding",
    time: process.env.TEACHER_FEEDING_NOTIFY_TIME || "11:30",
    includeTypes: ["feeding_reminder", "feeding_incomplete"],
  },
];

let timer: NodeJS.Timeout | null = null;
const lastRunDateBySlot: Record<SlotName, string | null> = {
  attendance: null,
  feeding: null,
};
const runningBySlot: Record<SlotName, boolean> = {
  attendance: false,
  feeding: false,
};

const toDateKey = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseTime = (value: string): { hour: number; minute: number } | null => {
  const trimmed = String(value || "").trim();
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(trimmed);
  if (!match) return null;
  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
  };
};

const shouldRunSlotNow = (
  now: Date,
  slot: SlotConfig,
  todayKey: string,
): boolean => {
  const parsedTime = parseTime(slot.time);
  if (!parsedTime) {
    return false;
  }

  if (
    now.getHours() !== parsedTime.hour ||
    now.getMinutes() !== parsedTime.minute
  ) {
    return false;
  }

  return lastRunDateBySlot[slot.name] !== todayKey;
};

const runSlot = async (slot: SlotConfig, now: Date, todayKey: string) => {
  if (runningBySlot[slot.name]) return;
  runningBySlot[slot.name] = true;

  try {
    const result = await dispatchTeacherNotificationsV1({
      date: now,
      includeTypes: slot.includeTypes,
    });

    lastRunDateBySlot[slot.name] = todayKey;
    console.log(
      `[Teacher Scheduler] ${slot.displayName} notifications dispatched for ${todayKey}. Sent: ${result.notificationsSent}.`,
    );
  } catch (error) {
    console.error(
      `[Teacher Scheduler] ${slot.displayName} dispatch failed:`,
      error,
    );
  } finally {
    runningBySlot[slot.name] = false;
  }
};

const tick = () => {
  const now = new Date();
  const todayKey = toDateKey(now);

  SLOTS.forEach((slot) => {
    if (!shouldRunSlotNow(now, slot, todayKey)) return;
    void runSlot(slot, now, todayKey);
  });
};

export const startTeacherNotificationScheduler = () => {
  if (!ENABLED) {
    console.log("[Teacher Scheduler] Disabled.");
    return;
  }

  if (timer) {
    return;
  }

  const invalidSlots = SLOTS.filter((slot) => !parseTime(slot.time));
  if (invalidSlots.length > 0) {
    console.warn(
      "[Teacher Scheduler] Invalid time format detected. Use HH:mm for:",
      invalidSlots.map((slot) => `${slot.name}=${slot.time}`).join(", "),
    );
  }

  timer = setInterval(tick, CHECK_INTERVAL_MS);
  console.log(
    `[Teacher Scheduler] Started. Attendance=${SLOTS[0].time}, Feeding=${SLOTS[1].time}, interval=${CHECK_INTERVAL_MS}ms.`,
  );
};

export const stopTeacherNotificationScheduler = () => {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
};
