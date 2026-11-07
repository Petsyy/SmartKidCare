import { RotateCcw, Trash2 } from "lucide-react-native";
import { Alert, Pressable, Text, View } from "react-native";
import { NotificationCheckbox } from "./notification-checkbox";
import type { ArchivedItem, CardUI, NotificationItemBase } from "@/src/features/notifications/types";
import { formatArchivedAt, formatDateLabel } from "@/src/features/notifications/utils";

interface NotificationArchivedCardProps<T extends NotificationItemBase> {
  item: ArchivedItem<T>;
  ui: CardUI;
  title: string;
  isSelected: boolean;
  isInSelectionMode: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onToggleSelect: () => void;
  onRestore: () => void;
  onDelete: () => void;
}

export function NotificationArchivedCard<T extends NotificationItemBase>({
  item,
  ui,
  title,
  isSelected,
  isInSelectionMode,
  onPress,
  onLongPress,
  onToggleSelect,
  onRestore,
  onDelete,
}: NotificationArchivedCardProps<T>) {
  const Icon = ui.icon;

  const handleDeleteWithPrompt = () => {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to permanently delete this archived notification? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: onDelete,
          style: "destructive",
        },
      ],
    );
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      className={`mb-3 overflow-hidden rounded-2xl p-4 active:scale-[0.99] ${
        isSelected
          ? "border border-teal-500 bg-teal-50/70"
          : "border border-transparent bg-white"
      }`}
      style={{
        shadowColor: "#0F172A",
        shadowOpacity: isSelected ? 0.08 : 0.03,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
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
          style={{
            backgroundColor: ui.iconBg,
            opacity: 0.8,
          }}
        >
          <Icon size={22} color={ui.iconColor} strokeWidth={1.5} />
        </View>

        {/* Header Title */}
        <View className="flex-1">
          <Text
            className="text-base font-extrabold text-gray-800"
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
      </View>

      {/* Body Content */}
      <View className={isInSelectionMode ? "pl-11" : "pl-15"}>
        <Text
          className="mt-2 text-sm leading-5 text-gray-500"
          numberOfLines={3}
        >
          {item.message}
        </Text>

        {/* Source date badge */}
        <View className="mt-3 flex-row items-center">
          <View className="rounded-full bg-gray-100 px-3 py-1">
            <Text className="text-xs font-semibold text-gray-500">
              {item.sourceDate ? formatDateLabel(item.sourceDate) : item.timeLabel}
            </Text>
          </View>
        </View>

        {/* Footer: archived timestamp + actions */}
        <View className="mt-3 flex-row items-center justify-between pt-1">
          <Text className="text-xs text-gray-400">
            {formatArchivedAt(item.archivedAt)}
          </Text>

          {!isInSelectionMode ? (
            <View className="flex-row gap-2">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Restore ${title}`}
                onPress={onRestore}
                className="flex-row items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 active:bg-teal-100"
                style={{ minHeight: 32 }}
              >
                <RotateCcw size={13} color="#0F766E" strokeWidth={2} />
                <Text className="text-xs font-semibold text-teal-700">
                  Restore
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Delete ${title}`}
                onPress={handleDeleteWithPrompt}
                className="flex-row items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 active:bg-rose-100"
                style={{ minHeight: 32 }}
              >
                <Trash2 size={13} color="#BE123C" strokeWidth={2} />
                <Text className="text-xs font-semibold text-rose-700">
                  Delete
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

