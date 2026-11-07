import { CheckCircle2, Lock } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import type { EvaluationPeriod, PeriodState } from "../types";

interface CompetencyPeriodTabsProps {
  selectedPeriod: EvaluationPeriod;
  periodStates: Record<EvaluationPeriod, PeriodState>;
  onPeriodChange: (period: EvaluationPeriod) => void;
  disabled?: boolean;
}

const PERIODS: { value: EvaluationPeriod; label: string }[] = [
  { value: "quarterly", label: "Quarterly" },
  { value: "final", label: "Final" },
];

const periodTabSelectedStyle = {
  backgroundColor: "#FFFFFF",
  elevation: 2,
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.08,
  shadowRadius: 2,
} as const;

export function CompetencyPeriodTabs({
  selectedPeriod,
  periodStates,
  onPeriodChange,
  disabled = false,
}: CompetencyPeriodTabsProps) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-semibold text-gray-600">
        Evaluation Progress
      </Text>
      <View className="flex-row gap-2">
        {PERIODS.map((period, index) => {
          const selected = selectedPeriod === period.value;
          const state = periodStates[period.value];
          return (
            <Pressable
              key={period.value}
              accessibilityRole="tab"
              accessibilityState={{ selected, disabled: state.isLocked }}
              accessibilityLabel={`${period.label} evaluation${
                state.isLocked
                  ? ", locked"
                  : state.isSubmitted
                    ? ", submitted"
                    : ", available"
              }`}
              accessibilityHint={
                state.isLocked
                  ? `Submit the ${state.prerequisiteLabel} evaluation first`
                  : `Open the ${period.label} evaluation`
              }
              onPress={() => onPeriodChange(period.value)}
              disabled={disabled}
              className={`min-h-20 flex-1 items-center justify-center rounded-2xl border px-1 py-3 ${
                selected
                  ? "border-teal-500 bg-teal-50"
                  : state.isLocked
                    ? "border-gray-200 bg-gray-50"
                    : state.isSubmitted
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-gray-200 bg-white"
              }`}
              style={selected ? periodTabSelectedStyle : undefined}
            >
              <View
                className={`mb-1 h-7 w-7 items-center justify-center rounded-full ${
                  state.isLocked
                    ? "bg-gray-200"
                    : state.isSubmitted
                      ? "bg-emerald-100"
                      : "bg-teal-100"
                }`}
              >
                {state.isLocked ? (
                  <Lock size={14} color="#6B7280" />
                ) : state.isSubmitted ? (
                  <CheckCircle2 size={16} color="#059669" />
                ) : (
                  <Text className="text-xs font-extrabold text-teal-700">
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text
                numberOfLines={1}
                className={`text-xs font-bold ${
                  selected
                    ? "text-teal-800"
                    : state.isLocked
                      ? "text-gray-400"
                      : state.isSubmitted
                        ? "text-emerald-700"
                        : "text-gray-700"
                }`}
              >
                {period.label}
              </Text>
              <Text
                className={`mt-0.5 text-[10px] font-medium ${
                  state.isLocked ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {state.isLocked
                  ? "Locked"
                  : state.isSubmitted
                    ? "Submitted"
                    : "Available"}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

