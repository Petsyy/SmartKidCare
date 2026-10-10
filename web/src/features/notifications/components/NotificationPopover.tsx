import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, LoaderCircle, RefreshCw, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/Skeleton";
import { NotificationEmptyState } from "@/features/notifications/components/NotificationEmptyState";
import { NotificationItem } from "@/features/notifications/components/NotificationItem";
import { NotificationTabs } from "@/features/notifications/components/NotificationTabs";
import { useAdminNotifications } from "@/features/notifications/hooks/useAdminNotifications";
import { useNotificationMutations } from "@/features/notifications/hooks/useNotificationMutations";
import { useUnreadNotificationCount } from "@/features/notifications/hooks/useUnreadNotificationCount";
import type {
  AdminNotification,
  AdminNotificationView,
} from "@/features/notifications/types/notification.types";

export function NotificationPopover({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<AdminNotificationView>("inbox");
  const unreadQuery = useUnreadNotificationCount(userId);
  const feed = useAdminNotifications({ userId, view, enabled: isOpen });
  const mutations = useNotificationMutations(userId);
  const unreadCount = unreadQuery.data ?? 0;

  useEffect(() => {
    if (!isOpen) return;
    panelRef.current?.focus();
    const handleMouseDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleOpenNotification = (notification: AdminNotification) => {
    if (!notification.readAt) {
      mutations.setRead({ id: notification.id, read: true });
    }
    setIsOpen(false);
    navigate(notification.actionPath);
  };

  const handleViewChange = (nextView: AdminNotificationView) => {
    mutations.clearErrors();
    setView(nextView);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls="admin-notification-popover"
        className="group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-gray-50 text-gray-600 transition-all hover:bg-teal-50 hover:text-teal-600 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-teal-400"
      >
        <Bell
          size={20}
          className="transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
          aria-hidden="true"
        />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold leading-4 text-white dark:border-[#060913]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          id="admin-notification-popover"
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
          tabIndex={-1}
          className="fixed inset-x-3 top-16 z-[70] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl outline-none dark:border-white/10 dark:bg-[#0A101D] sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[24rem]"
        >
          <div className="border-b border-slate-100 p-3 dark:border-white/5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Notifications
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  Important daycare and account alerts
                </p>
              </div>
              <div className="flex items-center gap-1">
                {view !== "archived" && unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => mutations.markAllRead()}
                    disabled={mutations.isMutating}
                    className="inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-teal-700 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-teal-300 dark:hover:bg-teal-500/10"
                  >
                    <CheckCheck size={14} aria-hidden="true" />
                    Mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 dark:hover:bg-white/5 dark:hover:text-slate-200"
                  aria-label="Close notifications"
                >
                  <X size={17} aria-hidden="true" />
                </button>
              </div>
            </div>
            <NotificationTabs value={view} onChange={handleViewChange} />
          </div>

          {mutations.errorMessage && (
            <div
              role="alert"
              className="flex items-center justify-between gap-2 border-b border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
            >
              <span>{mutations.errorMessage}</span>
              <button
                type="button"
                onClick={mutations.clearErrors}
                className="cursor-pointer font-semibold underline"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="max-h-[min(32rem,calc(100vh-9rem))] overflow-y-auto">
            {feed.isLoading && (
              <div className="space-y-3 p-3" aria-label="Loading notifications">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex gap-3 py-2">
                    <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!feed.isLoading && feed.isError && (
              <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">
                <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                  Unable to load notifications
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {feed.error instanceof Error
                    ? feed.error.message
                    : "Please try again."}
                </p>
                <button
                  type="button"
                  onClick={() => void feed.refetch()}
                  className="mt-4 inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
                >
                  <RefreshCw size={14} aria-hidden="true" />
                  Retry
                </button>
              </div>
            )}

            {!feed.isLoading &&
              !feed.isError &&
              feed.notifications.length === 0 && (
                <NotificationEmptyState view={view} />
              )}

            {!feed.isLoading && !feed.isError && feed.notifications.length > 0 && (
              <div>
                {feed.notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onOpen={handleOpenNotification}
                    onToggleRead={(item) =>
                      mutations.setRead({ id: item.id, read: !item.readAt })
                    }
                    onArchive={(item, archived) =>
                      mutations.setArchived({ id: item.id, archived })
                    }
                  />
                ))}
              </div>
            )}

            {feed.hasNextPage && (
              <div className="border-t border-slate-100 p-3 text-center dark:border-white/5">
                <button
                  type="button"
                  onClick={() => void feed.fetchNextPage()}
                  disabled={feed.isFetchingNextPage}
                  className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg px-4 text-xs font-semibold text-teal-700 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-teal-300 dark:hover:bg-teal-500/10"
                >
                  {feed.isFetchingNextPage && (
                    <LoaderCircle
                      size={14}
                      className="animate-spin"
                      aria-hidden="true"
                    />
                  )}
                  {feed.isFetchingNextPage ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

