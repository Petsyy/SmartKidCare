import { CheckCircle2 } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

interface FeedingPrerequisiteEmptyStateProps {
  attendanceMissing: boolean;
  attendanceDateLabel: string;
  onRecordAttendance: () => void;
}

export function FeedingPrerequisiteEmptyState({
  attendanceMissing,
  attendanceDateLabel,
  onRecordAttendance,
}: FeedingPrerequisiteEmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <CheckCircle2 size={64} color="#D1D5DB" />
      <Text className="mt-4 text-2xl font-bold text-gray-800">
        {attendanceMissing ? "Attendance Required" : "No Present Children"}
      </Text>
      <Text className="mt-2 text-center text-gray-600">
        {attendanceMissing
          ? `Submit attendance for ${attendanceDateLabel} before recording feeding.`
          : `Attendance for ${attendanceDateLabel} has no children marked present.`}
      </Text>
      {attendanceMissing ? (
        <Pressable
          onPress={onRecordAttendance}
          accessibilityRole="button"
          accessibilityLabel={`Record attendance for ${attendanceDateLabel}`}
          accessibilityHint="Opens attendance and returns to feeding after submission"
          className="mt-6 min-h-14 items-center justify-center rounded-2xl bg-emerald-600 px-6 py-4 active:opacity-90"
        >
          <Text className="text-lg font-bold text-white">
            Record Attendance
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

