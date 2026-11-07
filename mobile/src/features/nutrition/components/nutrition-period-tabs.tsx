import { Pressable, Text, View } from "react-native";
import type { EditableNutritionPeriod } from "../types";

interface NutritionPeriodTabsProps {
  period: EditableNutritionPeriod;
  onSelectPeriod: (period: EditableNutritionPeriod) => void;
}

export function NutritionPeriodTabs({
  period,
  onSelectPeriod,
}: NutritionPeriodTabsProps) {
  const options: EditableNutritionPeriod[] = ["quarterly", "final"];

  return (
    <View className="mx-6 mt-2 flex-row rounded-2xl border border-gray-200 bg-white p-1">
      {options.map((option) => {
        const isSelected = period === option;
        return (
          <Pressable
            key={option}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${option} assessment`}
            onPress={() => onSelectPeriod(option)}
            className={`flex-1 items-center rounded-xl px-3 py-3 active:opacity-90 ${
              isSelected ? "bg-teal-600" : "bg-white"
            }`}
          >
            <Text
              className={`font-bold ${
                isSelected ? "text-white" : "text-gray-600"
              }`}
            >
              {option === "quarterly" ? "Quarterly" : "Final"}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

