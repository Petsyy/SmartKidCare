import { Pressable, Text, View } from "react-native";
import type { NotificationFilter } from "@/src/features/notifications/types";

interface NotificationFilterTabsProps {
  activeFilter: NotificationFilter;
  onSelectFilter: (filter: NotificationFilter) => void;
  allCount: number;
  unreadCount: number;
  archivedCount: number;
}

export function NotificationFilterTabs({
  activeFilter,
  onSelectFilter,
  allCount,
  unreadCount,
  archivedCount,
}: NotificationFilterTabsProps) {
  return (
    <View className="flex-row rounded-2xl bg-gray-100 p-1">
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: activeFilter === "all" }}
        onPress={() => onSelectFilter("all")}
        className={`flex-1 items-center rounded-xl py-2.5 ${
          activeFilter === "all" ? "bg-teal-600" : "bg-transparent"
        }`}
        style={
          activeFilter === "all"
            ? {
                shadowColor: "#0F766E",
                shadowOpacity: 0.2,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              }
            : undefined
        }
      >
        <Text
          className={`text-sm font-bold ${
            activeFilter === "all" ? "text-white" : "text-gray-500"
          }`}
        >
          All ({allCount})
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: activeFilter === "unread" }}
        onPress={() => onSelectFilter("unread")}
        className={`flex-1 items-center rounded-xl py-2.5 ${
          activeFilter === "unread" ? "bg-teal-600" : "bg-transparent"
        }`}
        style={
          activeFilter === "unread"
            ? {
                shadowColor: "#0F766E",
                shadowOpacity: 0.2,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              }
            : undefined
        }
      >
        <Text
          className={`text-sm font-bold ${
            activeFilter === "unread" ? "text-white" : "text-gray-500"
          }`}
        >
          Unread{unreadCount > 0 ? ` (${unreadCount})` : ""}
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: activeFilter === "archived" }}
        onPress={() => onSelectFilter("archived")}
        className={`flex-1 items-center rounded-xl py-2.5 ${
          activeFilter === "archived" ? "bg-teal-600" : "bg-transparent"
        }`}
        style={
          activeFilter === "archived"
            ? {
                shadowColor: "#0F766E",
                shadowOpacity: 0.2,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              }
            : undefined
        }
      >
        <Text
          className={`text-sm font-bold ${
            activeFilter === "archived" ? "text-white" : "text-gray-500"
          }`}
        >
          Archived{archivedCount > 0 ? ` (${archivedCount})` : ""}
        </Text>
      </Pressable>
    </View>
  );
}

