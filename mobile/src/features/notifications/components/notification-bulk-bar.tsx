import { Archive, RotateCcw, Trash2 } from "lucide-react-native";
import { Alert, Pressable, Text, View } from "react-native";
import type { NotificationFilter } from "@/src/features/notifications/types";

interface NotificationBulkBarProps {
  activeFilter: NotificationFilter;
  selectableCount: number;
  selectedCount: number;
  isInSelectionMode: boolean;
  unreadCount: number;
  onEnterSelectMode: () => void;
  onExitSelectMode: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onArchiveSelected: () => void;
  onRestoreSelected: () => void;
  onDeleteSelected: () => void;
  onMarkAllAsRead: () => void;
}

export function NotificationBulkBar({
  activeFilter,
  selectableCount,
  selectedCount,
  isInSelectionMode,
  unreadCount,
  onEnterSelectMode,
  onExitSelectMode,
  onSelectAll,
  onClearSelection,
  onArchiveSelected,
  onRestoreSelected,
  onDeleteSelected,
  onMarkAllAsRead,
}: NotificationBulkBarProps) {
  if (selectableCount === 0) {
    return null;
  }

  const handleDeleteWithConfirmation = () => {
    Alert.alert(
      "Delete Selected Notifications",
      `Permanently delete ${selectedCount} selected notification${selectedCount === 1 ? "" : "s"}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: onDeleteSelected },
      ],
    );
  };

  return (
    <View
      className="mt-3 rounded-2xl border border-gray-200 bg-white p-4"
      style={{
        shadowColor: "#0D9488",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-lg font-black text-gray-900">
            {activeFilter === "archived" ? "Archived items" : "Notification actions"}
          </Text>
          <Text className="mt-1 text-sm font-semibold leading-5 text-gray-500">
            {isInSelectionMode
              ? `${selectedCount} of ${selectableCount} items selected`
              : activeFilter === "archived"
                ? "Select items to restore or permanently delete."
                : "Select items to archive at once."}
          </Text>
        </View>

        {!isInSelectionMode ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enable selection mode"
            onPress={onEnterSelectMode}
            className="min-h-10 items-center justify-center rounded-xl bg-teal-50 border border-teal-600 px-4 active:bg-teal-100"
          >
            <Text className="text-sm font-bold text-teal-700">Select</Text>
          </Pressable>
        ) : (
          <View className="flex-row items-center gap-2">
            <View className="rounded-full bg-teal-600 px-3 py-1">
              <Text className="text-xs font-bold text-white">
                {selectedCount} selected
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Exit selection mode"
              onPress={onExitSelectMode}
              className="min-h-9 items-center justify-center rounded-xl bg-gray-100 px-3 active:bg-gray-200"
            >
              <Text className="text-xs font-bold text-gray-700">Cancel</Text>
            </Pressable>
          </View>
        )}
      </View>

      {isInSelectionMode ? (
        <View className="mt-3 flex-row items-center gap-2.5">
          {selectedCount > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear selection"
              onPress={onClearSelection}
              className="min-h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 active:bg-gray-100"
            >
              <Text className="text-sm font-bold text-gray-700">Clear</Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Select all visible notifications"
              onPress={onSelectAll}
              className="min-h-11 items-center justify-center rounded-xl border border-teal-600 bg-teal-50 px-4 active:bg-teal-100"
            >
              <Text className="text-sm font-bold text-teal-700">Select All</Text>
            </Pressable>
          )}

          {activeFilter === "archived" ? (
            <View className="flex-1 flex-row gap-2">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Restore selected notifications"
                disabled={selectedCount === 0}
                onPress={onRestoreSelected}
                className={`min-h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border px-3 ${
                  selectedCount === 0
                    ? "border-gray-200 bg-gray-100 opacity-60"
                    : "border-teal-200 bg-teal-50 active:bg-teal-100"
                }`}
              >
                <RotateCcw
                  size={15}
                  color={selectedCount === 0 ? "#9CA3AF" : "#0F766E"}
                  strokeWidth={2}
                />
                <Text
                  className={`text-sm font-bold ${
                    selectedCount === 0 ? "text-gray-400" : "text-teal-700"
                  }`}
                >
                  Restore
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Delete selected notifications"
                disabled={selectedCount === 0}
                onPress={handleDeleteWithConfirmation}
                className={`min-h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border px-3 ${
                  selectedCount === 0
                    ? "border-gray-200 bg-gray-100 opacity-60"
                    : "border-rose-200 bg-rose-50 active:bg-rose-100"
                }`}
              >
                <Trash2
                  size={15}
                  color={selectedCount === 0 ? "#9CA3AF" : "#BE123C"}
                  strokeWidth={2}
                />
                <Text
                  className={`text-sm font-bold ${
                    selectedCount === 0 ? "text-gray-400" : "text-rose-700"
                  }`}
                >
                  Delete
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Archive selected notifications"
              disabled={selectedCount === 0}
              onPress={onArchiveSelected}
              className={`min-h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl px-4 ${
                selectedCount === 0
                  ? "bg-gray-200"
                  : "bg-teal-600 active:bg-teal-700"
              }`}
            >
              <Archive
                size={16}
                color={selectedCount === 0 ? "#9CA3AF" : "#FFFFFF"}
                strokeWidth={2}
              />
              <Text
                className={`text-sm font-bold ${
                  selectedCount === 0 ? "text-gray-400" : "text-white"
                }`}
              >
                Archive {selectedCount > 0 ? `(${selectedCount})` : ""}
              </Text>
            </Pressable>
          )}
        </View>
      ) : activeFilter !== "archived" && unreadCount > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mark all notifications as read"
          onPress={onMarkAllAsRead}
          className="mt-3 min-h-10 items-center justify-center rounded-xl bg-gray-50 active:bg-gray-100"
        >
          <Text className="text-sm font-bold text-teal-700">Mark all as read</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

