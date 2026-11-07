import { CheckCircle2 } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import type { TeacherAttendanceStats } from "@/src/features/attendance/types";

interface AttendanceOverviewCardProps {
  stats: TeacherAttendanceStats;
  onReviewUnmarked: () => void;
}

export function AttendanceOverviewCard({
  stats,
  onReviewUnmarked,
}: AttendanceOverviewCardProps) {
  const markedCount = stats.present + stats.absent + stats.excused;
  const markedPercentage =
    stats.total > 0 ? Math.round((markedCount / stats.total) * 100) : 0;

  return (
    <View className="mx-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text
            className="text-lg font-extrabold text-gray-900"
            accessibilityRole="header"
          >
            Attendance overview
          </Text>
          <Text className="mt-0.5 text-sm text-gray-600">
            {markedCount} of {stats.total} children marked
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-2xl font-extrabold text-teal-700">
            {markedPercentage}%
          </Text>
          <Text className="text-xs font-semibold text-gray-500">
            complete
          </Text>
        </View>
      </View>
      <View className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
        <View
          className="h-full rounded-full bg-emerald-600"
          style={{ width: `${markedPercentage}%` as `${number}%` }}
        />
      </View>
      <View className="mt-3 flex-row gap-2">
        {[
          ["Present", stats.present, "bg-emerald-50", "text-emerald-800"],
          ["Absent", stats.absent, "bg-red-50", "text-red-800"],
          ["Excused", stats.excused, "bg-amber-50", "text-amber-800"],
        ].map(([label, value, background, color]) => (
          <View
            key={String(label)}
            className={`flex-1 rounded-xl px-3 py-2.5 ${background}`}
          >
            <Text className={`text-lg font-extrabold ${color}`}>
              {value}
            </Text>
            <Text className={`text-xs font-semibold ${color}`} numberOfLines={1}>
              {label}
            </Text>
          </View>
        ))}
      </View>
      <Pressable
        onPress={onReviewUnmarked}
        disabled={stats.unmarked === 0}
        accessibilityRole="button"
        accessibilityLabel={`${stats.unmarked} unmarked children. Show unmarked children.`}
        accessibilityState={{ disabled: stats.unmarked === 0 }}
        className={`mt-3 min-h-11 flex-row items-center justify-between rounded-xl px-3 ${
          stats.unmarked > 0 ? "bg-amber-50" : "bg-emerald-50"
        }`}
        accessibilityLiveRegion="polite"
      >
        <Text
          className={`text-sm font-bold ${
            stats.unmarked > 0 ? "text-amber-800" : "text-emerald-800"
          }`}
        >
          {stats.unmarked > 0
            ? `${stats.unmarked} still need a status`
            : "All children are marked"}
        </Text>
        {stats.unmarked > 0 ? (
          <Text className="text-sm font-bold text-amber-800">Review</Text>
        ) : (
          <CheckCircle2 size={18} color="#047857" />
        )}
      </Pressable>
    </View>
  );
}

