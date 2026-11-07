import { CheckCircle2 } from "lucide-react-native";
import { Text, View } from "react-native";

interface FeedingOverviewCardProps {
  total: number;
  fed: number;
  isReadOnly: boolean;
}

export function FeedingOverviewCard({
  total,
  fed,
  isReadOnly,
}: FeedingOverviewCardProps) {
  const completedPercentage = total > 0 ? 100 : 0;

  return (
    <View className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-4">
          <Text
            className="text-xl font-extrabold text-gray-900"
            accessibilityRole="header"
          >
            Feeding overview
          </Text>
          <Text className="mt-1 text-base text-gray-600">
            Present children are included as completed
          </Text>
        </View>
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
          <Text className="text-2xl font-extrabold text-slate-800">
            {total}
          </Text>
          <Text className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Total
          </Text>
        </View>
      </View>

      <View className="mt-5 h-3 overflow-hidden rounded-full bg-gray-200">
        <View
          className="h-full rounded-full bg-emerald-600"
          style={{
            width: `${completedPercentage}%` as `${number}%`,
          }}
        />
      </View>

      <View className="mt-4 flex-row items-center rounded-2xl bg-emerald-50 p-3">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
          <CheckCircle2 size={22} color="#047857" />
        </View>
        <Text className="ml-3 flex-1 text-base font-semibold text-emerald-800">
          {fed} {fed === 1 ? "child" : "children"}{" "}
          {isReadOnly ? "completed" : "ready for feeding submission"}
        </Text>
      </View>
    </View>
  );
}

