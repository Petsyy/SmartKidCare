import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { formatDateLabel } from "@/src/features/notifications/utils";

interface NotificationDateStripProps {
  date: string | null;
  canGoToNextDate: boolean;
  goToPreviousDate: () => void;
  goToNextDate: () => void;
  activeCount: number;
  archivedCount: number;
}

export function NotificationDateStrip({
  date,
  canGoToNextDate,
  goToPreviousDate,
  goToNextDate,
  activeCount,
  archivedCount,
}: NotificationDateStripProps) {
  return (
    <View className="rounded-2xl bg-teal-50 px-4 py-3">
      <View className="flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Show previous day's notifications"
          onPress={goToPreviousDate}
          className="h-10 w-10 items-center justify-center rounded-full bg-white active:bg-gray-50"
        >
          <ChevronLeft size={20} color="#0F766E" />
        </Pressable>
        <Text className="text-base font-bold text-gray-900">
          {date ? formatDateLabel(date) : "Today"}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Show next day's notifications"
          accessibilityState={{ disabled: !canGoToNextDate }}
          disabled={!canGoToNextDate}
          onPress={goToNextDate}
          className={`h-10 w-10 items-center justify-center rounded-full bg-white active:bg-gray-50 ${
            canGoToNextDate ? "opacity-100" : "opacity-40"
          }`}
        >
          <ChevronRight size={20} color="#0F766E" />
        </Pressable>
      </View>
      <View className="mt-2 flex-row items-center justify-center gap-2">
        <View className="rounded-full bg-teal-100 px-3 py-1">
          <Text className="text-xs font-bold text-teal-800">
            {activeCount} active
          </Text>
        </View>
        {archivedCount > 0 ? (
          <View className="rounded-full bg-gray-200 px-3 py-1">
            <Text className="text-xs font-semibold text-gray-600">
              {archivedCount} archived
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

