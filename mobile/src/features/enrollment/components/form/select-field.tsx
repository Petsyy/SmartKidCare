import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronDown } from "lucide-react-native";

export type SelectOption = {
  label: string;
  value: string;
};

interface SelectFieldProps {
  label: string;
  value: string;
  options: SelectOption[];
  placeholder?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

export function SelectField({
  label,
  value,
  options,
  placeholder = "Select an option",
  onValueChange,
  disabled = false,
  loading = false,
}: SelectFieldProps) {
  const [expanded, setExpanded] = useState(false);
  const selectedOption = options.find((option) => option.value === value);
  const labelToShow = loading
    ? "Loading options..."
    : selectedOption?.label || placeholder;

  const toggleExpanded = () => {
    if (disabled || loading) return;
    setExpanded((prev) => !prev);
  };

  return (
    <View className="mb-[18px]">
      <Text className="mb-2 text-[13px] font-bold uppercase tracking-[0.6px] text-[#374151]">
        {label}
      </Text>
      <Pressable
        onPress={toggleExpanded}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${labelToShow}`}
        className={`min-h-[50px] rounded-xl border-[1.5px] px-[14px] py-[13px] ${
          disabled
            ? "border-[#D1D5DB] bg-[#F9FAFB]"
            : "border-[#E5E7EB] bg-[#FFFFFF] active:border-[#0D9488] active:bg-[#F0FDFA]"
        }`}
      >
        <View className="flex-row items-center">
          <Text
            numberOfLines={1}
            className={`flex-1 text-[15px] ${
              selectedOption
                ? "font-medium text-[#111827]"
                : "font-normal text-[#9CA3AF]"
            }`}
          >
            {labelToShow}
          </Text>
          <View className="ml-2.5 items-center justify-center">
            <ChevronDown
              size={20}
              color={disabled ? "#9CA3AF" : "#0F766E"}
              style={
                expanded ? { transform: [{ rotate: "180deg" }] } : undefined
              }
            />
          </View>
        </View>
      </Pressable>

      {expanded && !disabled ? (
        <View className="-mt-0.5 overflow-hidden rounded-b-xl border-[1.5px] border-t-0 border-[#0D9488] bg-[#FFFFFF]">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  onValueChange(option.value);
                  setExpanded(false);
                }}
                className={`border-t border-[#F3F4F6] px-[14px] py-3 active:bg-[#F0FDFA] ${
                  isSelected ? "bg-[#ECFEFF]" : "bg-[#FFFFFF]"
                }`}
              >
                <Text
                  numberOfLines={1}
                  className={`text-[15px] ${
                    isSelected
                      ? "font-bold text-[#0F766E]"
                      : "font-medium text-[#111827]"
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

