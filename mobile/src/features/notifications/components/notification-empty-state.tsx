import { Archive, Bell, CheckCircle2 } from "lucide-react-native";
import { Text, View } from "react-native";
import type { NotificationFilter } from "@/src/features/notifications/types";

interface NotificationEmptyStateProps {
  activeFilter: NotificationFilter;
}

export function NotificationEmptyState({ activeFilter }: NotificationEmptyStateProps) {
  const getIcon = () => {
    if (activeFilter === "unread") {
      return <CheckCircle2 size={28} color="#059669" strokeWidth={1.5} />;
    }
    if (activeFilter === "archived") {
      return <Archive size={28} color="#6B7280" strokeWidth={1.5} />;
    }
    return <Bell size={28} color="#0F766E" strokeWidth={1.5} />;
  };

  const getBackgroundColor = () => {
    if (activeFilter === "unread") return "#D1FAE5";
    if (activeFilter === "archived") return "#F3F4F6";
    return "#CCFBF1";
  };

  const getTitle = () => {
    if (activeFilter === "unread") return "Everything's read";
    if (activeFilter === "archived") return "No archived items";
    return "All caught up!";
  };

  const getSubtitle = () => {
    if (activeFilter === "unread") {
      return "You've read all your notifications. Nice work!";
    }
    if (activeFilter === "archived") {
      return "Notifications you archive will appear here for reference.";
    }
    return "No notifications for this date. We'll let you know when something needs your attention.";
  };

  return (
    <View className="mt-6 items-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10">
      <View
        className="mb-4 h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: getBackgroundColor() }}
      >
        {getIcon()}
      </View>
      <Text className="text-center text-base font-bold text-gray-700">
        {getTitle()}
      </Text>
      <Text className="mt-1.5 text-center text-sm leading-5 text-gray-400">
        {getSubtitle()}
      </Text>
    </View>
  );
}

