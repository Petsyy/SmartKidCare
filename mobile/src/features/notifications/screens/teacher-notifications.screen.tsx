import { AlertCircle, Clock3, UtensilsCrossed } from "lucide-react-native";
import { useAuth } from "@/src/hooks/use-auth";
import {
  getTeacherNotificationsFeed,
  type TeacherNotificationFeedItem,
} from "@/src/api/notifications.api";
import { useNotificationsFeed } from "@/src/features/notifications/hooks";
import { NotificationFeedScreen } from "@/src/features/notifications/screens/notification-feed.screen";

const TEACHER_TYPE_UI = {
  attendance_reminder: {
    fallbackTitle: "Morning Attendance",
    icon: Clock3,
    iconColor: "#0F766E",
    iconBg: "#CCFBF1",
    accent: "#0F766E",
  },
  attendance_incomplete: {
    fallbackTitle: "Attendance Incomplete",
    icon: AlertCircle,
    iconColor: "#B45309",
    iconBg: "#FEF3C7",
    accent: "#0F766E",
  },
  feeding_reminder: {
    fallbackTitle: "Lunch Feeding",
    icon: Clock3,
    iconColor: "#0F766E",
    iconBg: "#CCFBF1",
    accent: "#0F766E",
  },
  feeding_incomplete: {
    fallbackTitle: "Feeding Incomplete",
    icon: UtensilsCrossed,
    iconColor: "#B45309",
    iconBg: "#FEF3C7",
    accent: "#0F766E",
  },
} as const;

export default function TeacherNotificationsScreen() {
  const { token, user } = useAuth();

  const feed = useNotificationsFeed<TeacherNotificationFeedItem>({
    audience: "teacher",
    token,
    userId: user?.id,
    fetchFeed: async (authToken, date) =>
      getTeacherNotificationsFeed(authToken, { date }),
  });

  return (
    <NotificationFeedScreen<TeacherNotificationFeedItem>
      subtitle="Teacher alerts and reminders"
      date={feed.date}
      isLoading={feed.isLoading}
      isRefreshing={feed.isRefreshing}
      error={feed.error}
      readIds={feed.readIds}
      activeItems={feed.activeItems}
      archivedItems={feed.archivedItems}
      visibleActiveItems={feed.visibleActiveItems}
      unreadCount={feed.unreadCount}
      activeFilter={feed.activeFilter}
      setActiveFilter={feed.setActiveFilter}
      showEmptyState={feed.showEmptyState}
      onRefresh={() => void feed.loadNotifications(true)}
      markAsRead={feed.markAsRead}
      markAllAsRead={feed.markAllAsRead}
      archiveNotification={feed.archiveNotification}
      restoreNotification={feed.restoreNotification}
      cardUi={TEACHER_TYPE_UI}
      resolveTitle={(item, fallbackTitle) =>
        item.title === "Reminder" ? fallbackTitle : item.title || fallbackTitle
      }
    />
  );
}
