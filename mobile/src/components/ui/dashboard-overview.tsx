import { Text, View } from "react-native";

interface StatRowProps {
  color: string;
  label: string;
  value: string;
}

interface ProgressBarProps {
  percent: number;
  accessibilityLabel: string;
}

export function StatRow({ color, label, value }: StatRowProps) {
  return (
    <View
      className="mt-3 flex-row items-center justify-between"
      accessible
      accessibilityLabel={`${label}: ${value}`}
    >
      <View className="flex-row items-center pr-3">
        <View
          style={{ backgroundColor: color }}
          className="mr-2 h-3 w-3 rounded-full"
        />
        <Text className="text-base text-gray-700">{label}</Text>
      </View>
      <Text className="text-base font-semibold text-gray-800">{value}</Text>
    </View>
  );
}

export function ProgressBar({ percent, accessibilityLabel }: ProgressBarProps) {
  const clampedPercent = Math.min(100, Math.max(0, percent));

  return (
    <View
      className="h-3 w-full overflow-hidden rounded-full bg-gray-200"
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: clampedPercent }}
    >
      <View
        style={{ width: `${clampedPercent}%` }}
        className="h-full bg-teal-500"
      />
    </View>
  );
}
