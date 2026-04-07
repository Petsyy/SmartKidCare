import {
  AlertCircle,
  ClipboardCheck,
  UtensilsCrossed,
} from "lucide-react-native";
import { useAuth } from "@/src/hooks/use-auth";
import {
  getParentNotificationsFeed,
  type ParentNotificationFeedItem,
} from "@/src/api/notifications.api";
import { useNotificationsFeed } from "@/src/features/notifications/hooks";
import { NotificationFeedScreen } from "@/src/features/notifications/screens/notification-feed.screen";

const PARENT_TYPE_UI = {
  attendance_submitted: {
    fallbackTitle: "Attendance Submitted",
    icon: ClipboardCheck,
    iconColor: "#0F766E",
    iconBg: "#CCFBF1",
    accent: "#0F766E",
  },
  absence_alert: {
    fallbackTitle: "Absence Alert",
    icon: AlertCircle,
    iconColor: "#B45309",
    iconBg: "#FEF3C7",
    accent: "#B45309",
  },
  feeding_submitted: {
    fallbackTitle: "Feeding Submitted",
    icon: UtensilsCrossed,
    iconColor: "#0F766E",
    iconBg: "#CCFBF1",
    accent: "#0F766E",
  },
  missed_meal_alert: {
    fallbackTitle: "Missed Meal Alert",
    icon: AlertCircle,
    iconColor: "#B45309",
    iconBg: "#FEF3C7",
    accent: "#B45309",
  },
} as const;

export default function ParentNotificationsScreen() {
  const { token, user } = useAuth();

  const feed = useNotificationsFeed<ParentNotificationFeedItem>({
    audience: "parent",
    token,
    userId: user?.id,
    fetchFeed: async (authToken, date) =>
      getParentNotificationsFeed(authToken, { date }),
  });

  return (
    <NotificationFeedScreen<ParentNotificationFeedItem>
      subtitle="Parent alerts and updates"
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
      cardUi={PARENT_TYPE_UI}
    />
  );
}
