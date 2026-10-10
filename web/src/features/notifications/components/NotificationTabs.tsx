import type { AdminNotificationView } from "@/features/notifications/types/notification.types";

const VIEWS: Array<{ value: AdminNotificationView; label: string }> = [
  { value: "inbox", label: "Inbox" },
  { value: "unread", label: "Unread" },
  { value: "archived", label: "Archived" },
];

type NotificationTabsProps = {
  value: AdminNotificationView;
  onChange: (view: AdminNotificationView) => void;
};

export function NotificationTabs({
  value,
  onChange,
}: NotificationTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Notification views"
      className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-white/5"
    >
      {VIEWS.map((view) => (
        <button
          key={view.value}
          type="button"
          role="tab"
          aria-selected={value === view.value}
          onClick={() => onChange(view.value)}
          className={`min-h-9 cursor-pointer rounded-lg px-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-teal-500/40 ${
            value === view.value
              ? "bg-white text-teal-700 shadow-sm dark:bg-slate-800 dark:text-teal-300"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          {view.label}
        </button>
      ))}
    </div>
  );
}

