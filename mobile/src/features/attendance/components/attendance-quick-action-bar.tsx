import { Check } from "lucide-react-native";
import { Alert, Pressable, Text, View } from "react-native";

interface AttendanceQuickActionBarProps {
  unmarkedCount: number;
  onMarkAllUnmarkedPresent: () => void;
}

export function AttendanceQuickActionBar({
  unmarkedCount,
  onMarkAllUnmarkedPresent,
}: AttendanceQuickActionBarProps) {
  if (unmarkedCount === 0) {
    return null;
  }

  const confirmQuickAttendance = () => {
    Alert.alert(
      "Mark unmarked children Present?",
      `This will mark all ${unmarkedCount} unmarked ${
        unmarkedCount === 1 ? "child" : "children"
      } in the class as Present. Existing statuses will not change.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark Present",
          onPress: onMarkAllUnmarkedPresent,
        },
      ],
    );
  };

  return (
    <View className="mx-6 mt-4 rounded-2xl border border-teal-200 bg-teal-50 p-4">
      <View className="flex-row items-center">
        <View className="flex-1">
          <Text className="text-base font-extrabold text-teal-950">Quick attendance</Text>
          <Text className="mt-0.5 text-sm text-teal-800">
            Existing statuses will not be changed.
          </Text>
        </View>
      </View>
      <Pressable
        onPress={confirmQuickAttendance}
        accessibilityRole="button"
        accessibilityLabel={`Mark ${unmarkedCount} unmarked children as Present`}
        className="mt-3 min-h-12 flex-row items-center justify-center rounded-xl bg-teal-700 px-4 active:opacity-90"
      >
        <Check size={18} color="#FFFFFF" />
        <Text className="ml-2 text-center font-bold text-white">
          Mark {unmarkedCount} Unmarked as Present
        </Text>
      </Pressable>
    </View>
  );
}

