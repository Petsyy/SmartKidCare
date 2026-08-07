import { Pressable, Text, TextInput, View } from "react-native";
import { COMPETENCY_LEVELS } from "../constants";
import type { CompetencyDefinition, CompetencyLevel } from "../types";

export function CompetencyItem({
  definition,
  level,
  remarks,
  disabled,
  onLevelChange,
  onRemarksChange,
}: {
  definition: CompetencyDefinition;
  level?: CompetencyLevel;
  remarks: string;
  disabled: boolean;
  onLevelChange: (level: CompetencyLevel) => void;
  onRemarksChange: (value: string) => void;
}) {
  return (
    <View className="border-b border-gray-100 py-4 last:border-b-0">
      <Text className="text-base font-bold text-gray-900">
        {definition.name}
      </Text>
      <Text className="mt-1 text-sm leading-5 text-gray-500">
        {definition.description}
      </Text>
      <View className="mt-3 flex-row flex-wrap gap-2">
        {COMPETENCY_LEVELS.map((option) => {
          const selected = level === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled }}
              accessibilityLabel={`${definition.name}: ${option.label}`}
              disabled={disabled}
              onPress={() => onLevelChange(option.value)}
              className="min-h-11 justify-center rounded-xl border px-3 py-2"
              style={{
                backgroundColor: selected ? option.selectedColor : option.color,
                borderColor: option.selectedColor,
              }}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: selected ? "#FFFFFF" : option.selectedColor }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <TextInput
        accessibilityLabel={`Remarks for ${definition.name}`}
        editable={!disabled}
        value={remarks}
        onChangeText={onRemarksChange}
        placeholder={level === "not_demonstrated" || level === "emerging" ? "Remarks (Required for this rating)" : "Optional remarks"}
        placeholderTextColor={level === "not_demonstrated" || level === "emerging" ? "#F87171" : "#9CA3AF"}
        maxLength={500}
        multiline
        className={`mt-3 min-h-12 rounded-xl border px-3 py-3 text-sm text-gray-900 ${(level === "not_demonstrated" || level === "emerging") && !remarks.trim() ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50"}`}
      />
    </View>
  );
}
