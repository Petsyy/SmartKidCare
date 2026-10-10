import {
  Archive,
  Check,
  KeyRound,
  MailWarning,
  RotateCcw,
  ShieldCheck,
  UserPlus,
  UserX,
  UtensilsCrossed,
} from "lucide-react";
import type { AdminNotification } from "@/features/notifications/types/notification.types";

const formatRelativeTime = (value: string): string => {
  const timestamp = new Date(value).getTime();
  const seconds = Math.round((timestamp - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const ranges: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  for (const [unit, divisor] of ranges) {
    if (Math.abs(seconds) >= divisor) {
      return formatter.format(Math.round(seconds / divisor), unit);
    }
  }
  return "just now";
};

const NotificationEventIcon = ({
  notification,
}: {
  notification: AdminNotification;
}) => {
  if (notification.category === "security") {
    return <ShieldCheck size={18} aria-hidden="true" />;
  }
  if (notification.eventType === "child_enrolled") {
    return <UserPlus size={18} aria-hidden="true" />;
  }
  if (notification.eventType === "attendance_absence") {
    return <UserX size={18} aria-hidden="true" />;
  }
  if (notification.eventType === "feeding_missed") {
    return <UtensilsCrossed size={18} aria-hidden="true" />;
  }
  if (notification.eventType === "credential_delivery_failed") {
    return <MailWarning size={18} aria-hidden="true" />;
  }
  return <KeyRound size={18} aria-hidden="true" />;
};

type NotificationItemProps = {
  notification: AdminNotification;
  onOpen: (notification: AdminNotification) => void;
  onToggleRead: (notification: AdminNotification) => void;
  onArchive: (notification: AdminNotification, archived: boolean) => void;
};

export function NotificationItem({
  notification,
  onOpen,
  onToggleRead,
  onArchive,
}: NotificationItemProps) {
  const isUnread = !notification.readAt;
  const isArchived = Boolean(notification.archivedAt);
  const fullTimestamp = new Date(notification.createdAt).toLocaleString(
    "en-PH",
    { timeZone: "Asia/Manila" },
  );

  return (
    <article
      className={`relative border-b border-slate-100 px-3 py-3 transition last:border-b-0 dark:border-white/5 ${
        isUnread
          ? "bg-teal-50/60 dark:bg-teal-500/5"
          : "bg-white dark:bg-[#0A101D]"
      }`}
    >
      <div className="flex gap-3">
        <span
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            notification.category === "security"
              ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
              : "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300"
          }`}
        >
          <NotificationEventIcon notification={notification} />
        </span>

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onOpen(notification)}
            className="w-full cursor-pointer rounded-md text-left focus:outline-none focus:ring-2 focus:ring-teal-500/40"
            aria-label={`${notification.title}. ${notification.actionLabel}`}
          >
            <span className="flex items-start gap-2">
              <span
                className={`min-w-0 flex-1 text-sm text-slate-900 dark:text-slate-100 ${
                  isUnread ? "font-bold" : "font-semibold"
                }`}
              >
                {notification.title}
              </span>
              {isUnread && (
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal-500"
                  aria-label="Unread"
                />
              )}
            </span>
            <span className="mt-1 block text-xs leading-5 text-slate-600 dark:text-slate-300">
              {notification.message}
            </span>
            <span
              className="mt-1.5 block text-[11px] font-medium text-slate-400 dark:text-slate-500"
              title={fullTimestamp}
            >
              {formatRelativeTime(notification.createdAt)} · {notification.actionLabel}
            </span>
          </button>

          <div className="mt-2 flex items-center gap-1">
            {!isArchived && (
              <button
                type="button"
                onClick={() => onToggleRead(notification)}
                className="inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/40 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200"
                aria-label={isUnread ? "Mark as read" : "Mark as unread"}
              >
                <Check size={13} aria-hidden="true" />
                {isUnread ? "Mark read" : "Mark unread"}
              </button>
            )}
            <button
              type="button"
              onClick={() => onArchive(notification, !isArchived)}
              className="inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/40 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200"
              aria-label={isArchived ? "Restore notification" : "Archive notification"}
            >
              {isArchived ? (
                <RotateCcw size={13} aria-hidden="true" />
              ) : (
                <Archive size={13} aria-hidden="true" />
              )}
              {isArchived ? "Restore" : "Archive"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
