import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Send } from "lucide-react-native";

interface PickupReminderBulkBarProps {
  eligibleCount: number;
  selectedCount: number;
  isInSelectionMode: boolean;
  isNotifying: boolean;
  isOffline: boolean;
  onEnterSelectMode: () => void;
  onExitSelectMode: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onNotifyParents: () => void;
}

export function PickupReminderBulkBar({
  eligibleCount,
  selectedCount,
  isInSelectionMode,
  isNotifying,
  isOffline,
  onEnterSelectMode,
  onExitSelectMode,
  onSelectAll,
  onClearSelection,
  onNotifyParents,
}: PickupReminderBulkBarProps) {
  if (eligibleCount === 0) {
    return null;
  }

  const isNotifyDisabled = isOffline || isNotifying || selectedCount === 0;

  return (
    <View className="bg-gray-50 px-5 pb-3 pt-2">
      <View
        className="rounded-2xl border border-gray-200 bg-white p-4"
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
              Pickup reminders
            </Text>
            <Text className="mt-1 text-sm font-semibold leading-5 text-gray-500">
              {isInSelectionMode
                ? `${selectedCount} of ${eligibleCount} children selected`
                : "Send pickup reminders to parents at once."}
            </Text>
          </View>

          {!isInSelectionMode ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enable selection mode for bulk pickup reminders"
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
                accessibilityState={{ disabled: isNotifying }}
                disabled={isNotifying}
                onPress={onClearSelection}
                className="min-h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 active:bg-gray-100"
              >
                <Text className="text-sm font-bold text-gray-700">Clear</Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Select all eligible children"
                accessibilityState={{ disabled: isNotifying }}
                disabled={isNotifying}
                onPress={onSelectAll}
                className="min-h-11 items-center justify-center rounded-xl border border-teal-600 bg-teal-50 px-4 active:bg-teal-100"
              >
                <Text className="text-sm font-bold text-teal-700">Select All</Text>
              </Pressable>
            )}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notify selected parents"
              accessibilityState={{
                disabled: isNotifyDisabled,
                busy: isNotifying,
              }}
              disabled={isNotifyDisabled}
              onPress={onNotifyParents}
              className={`min-h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl px-4 ${
                isNotifyDisabled
                  ? "bg-gray-200"
                  : "bg-teal-600 active:bg-teal-700"
              }`}
            >
              {isNotifying ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Send
                  size={16}
                  color={selectedCount === 0 || isOffline ? "#9CA3AF" : "#FFFFFF"}
                />
              )}
              <Text
                className={`text-sm font-bold ${
                  selectedCount === 0 || isOffline
                    ? "text-gray-400"
                    : "text-white"
                }`}
              >
                {isNotifying
                  ? "Sending..."
                  : selectedCount > 0
                    ? `Notify ${selectedCount} Parent${selectedCount > 1 ? "s" : ""}`
                    : "Notify Parents"}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

