import { Text, View } from "react-native";
import { COMPETENCY_LEVELS } from "../constants";

interface CompetencySummaryCardProps {
  summary: Record<string, number>;
}

export function CompetencySummaryCard({ summary }: CompetencySummaryCardProps) {
  return (
    <View className="mb-6 rounded-3xl border border-gray-200 bg-white p-4">
      <Text className="mb-3 text-base font-bold text-gray-900">
        Automatic Summary
      </Text>
      <View className="flex-row flex-wrap justify-between gap-y-2">
        {COMPETENCY_LEVELS.map((level) => (
          <View
            key={level.value}
            className="w-[48%] flex-row justify-between rounded-xl bg-gray-50 p-3 border border-gray-100"
          >
            <Text className="text-sm font-medium text-gray-600">
              {level.label}
            </Text>
            <Text className="text-sm font-bold text-gray-900">
              {summary[level.value] || 0}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

