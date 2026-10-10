import { Archive, BellOff, CheckCheck } from "lucide-react";
import type { AdminNotificationView } from "@/features/notifications/types/notification.types";

const CONTENT = {
  inbox: {
    icon: BellOff,
    title: "No notifications",
    message: "Important operational and security alerts will appear here.",
  },
  unread: {
    icon: CheckCheck,
    title: "You're all caught up",
    message: "There are no unread notifications right now.",
  },
  archived: {
    icon: Archive,
    title: "No archived notifications",
    message: "Notifications you archive remain available for 30 days.",
  },
} satisfies Record<
  AdminNotificationView,
  { icon: typeof BellOff; title: string; message: string }
>;

export function NotificationEmptyState({
  view,
}: {
  view: AdminNotificationView;
}) {
  const content = CONTENT[view];
  const Icon = content.icon;
  return (
    <div className="flex min-h-52 flex-col items-center justify-center px-6 py-10 text-center">
      <span className="mb-3 rounded-2xl bg-slate-100 p-3 text-slate-400 dark:bg-white/5 dark:text-slate-500">
        <Icon size={24} aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
        {content.title}
      </p>
      <p className="mt-1 max-w-64 text-xs leading-5 text-slate-500 dark:text-slate-400">
        {content.message}
      </p>
    </div>
  );
}

