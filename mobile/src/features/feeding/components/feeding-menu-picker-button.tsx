import { ChevronDown } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

interface FeedingMenuPickerButtonProps {
  foodServed: string;
  isReadOnly: boolean;
  disabled: boolean;
  onPress: () => void;
}

export function FeedingMenuPickerButton({
  foodServed,
  isReadOnly,
  disabled,
  onPress,
}: FeedingMenuPickerButtonProps) {
  return (
    <View className="px-6 pb-5">
      <Text className="mb-2 text-lg font-medium text-gray-700">
        Food Served (Menu) {!isReadOnly && <Text className="text-red-500">*</Text>}
      </Text>
      <Pressable
        onPress={() => !disabled && onPress()}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={
          foodServed ? `Food served: ${foodServed}` : "Select food menu"
        }
        accessibilityHint={
          disabled
            ? "Submitted feeding records cannot be changed"
            : "Opens the food menu options"
        }
        accessibilityState={{ disabled }}
        className={`min-h-14 flex-row items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm ${
          disabled ? "opacity-75" : "active:bg-gray-50"
        }`}
      >
        <Text
          className={`flex-1 text-lg font-medium ${
            foodServed ? "text-gray-800" : "text-gray-400"
          }`}
        >
          {foodServed || "Select food menu"}
        </Text>
        {!disabled && <ChevronDown size={20} color="#9CA3AF" />}
      </Pressable>
    </View>
  );
}

