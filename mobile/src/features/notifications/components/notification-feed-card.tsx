import { Archive } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { NotificationCheckbox } from "./notification-checkbox";
import type { CardUI, NotificationItemBase } from "@/src/features/notifications/types";

interface NotificationFeedCardProps<T extends NotificationItemBase> {
  item: T;
  ui: CardUI;
  title: string;
  isRead: boolean;
  isSelected: boolean;
  isInSelectionMode: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onToggleSelect: () => void;
  onActionPress?: () => void;
  onArchive?: () => void;
}

export function NotificationFeedCard<T extends NotificationItemBase>({
  item,
  ui,
  title,
  isRead,
  isSelected,
  isInSelectionMode,
  onPress,
  onLongPress,
  onToggleSelect,
  onActionPress,
  onArchive,
}: NotificationFeedCardProps<T>) {
  const Icon = ui.icon;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      className={`mb-3 overflow-hidden rounded-2xl p-4 active:scale-[0.99] ${
        isSelected
          ? "border border-teal-500 bg-teal-50/70"
          : isRead
            ? "border border-transparent bg-white"
            : "border border-teal-200 bg-white"
      }`}
      style={{
        shadowColor: "#0F172A",
        shadowOpacity: isSelected ? 0.08 : isRead ? 0.03 : 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: isRead ? 1 : 2,
      }}
    >
      <View className="flex-row items-center">
        {isInSelectionMode ? (
          <NotificationCheckbox
            selected={isSelected}
            label={`Select ${title}`}
            onPress={onToggleSelect}
            className="mr-3"
          />
        ) : null}

        {/* Icon */}
        <View
          className="mr-3 h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: ui.iconBg }}
        >
          <Icon size={22} color={ui.iconColor} strokeWidth={1.5} />
        </View>

        {/* Header Title */}
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            {!isRead ? (
              <View className="h-2 w-2 rounded-full bg-teal-500" />
            ) : null}
            <Text
              className={`flex-1 text-base font-extrabold ${
                isRead ? "text-gray-700" : "text-gray-900"
              }`}
              numberOfLines={1}
            >
              {title}
            </Text>
          </View>
        </View>
      </View>

      {/* Body Content */}
      <View className={isInSelectionMode ? "pl-11" : "pl-15"}>
        <Text
          className={`mt-2 text-sm leading-5 ${
            isRead ? "text-gray-400" : "text-gray-600"
          }`}
          numberOfLines={3}
        >
          {item.message}
        </Text>

        {/* Footer: time badge + action buttons */}
        <View className="mt-3 flex-row items-center justify-between">
          {item.timeLabel ? (
            <View
              className="rounded-full px-3 py-1"
              style={{ backgroundColor: ui.iconBg }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: ui.iconColor }}
              >
                {item.timeLabel}
              </Text>
            </View>
          ) : (
            <View />
          )}

          <View className="flex-row items-center gap-2">
            {item.actionPath && onActionPress ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item.actionLabel}
                onPress={(event) => {
                  event.stopPropagation();
                  onActionPress();
                }}
                className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 active:bg-amber-100"
                style={{ minHeight: 32 }}
              >
                <Text className="text-xs font-bold text-amber-700">
                  {item.actionLabel}
                </Text>
              </Pressable>
            ) : null}

            {!isInSelectionMode && onArchive ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Archive ${title}`}
                onPress={(event) => {
                  event.stopPropagation();
                  onArchive();
                }}
                className="flex-row items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 active:bg-gray-100"
                style={{ minHeight: 32 }}
              >
                <Archive size={13} color="#6B7280" strokeWidth={2} />
                <Text className="text-xs font-semibold text-gray-600">
                  Archive
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

