import { Check } from "lucide-react-native";
import { Pressable, View } from "react-native";

interface NotificationCheckboxProps {
  selected: boolean;
  label: string;
  onPress: () => void;
  className?: string;
}

export function NotificationCheckbox({
  selected,
  label,
  onPress,
  className = "",
}: NotificationCheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      hitSlop={10}
      onPress={(event) => {
        event.stopPropagation();
        onPress();
      }}
      className={`items-center justify-center ${className}`}
    >
      <View
        className={`h-5 w-5 items-center justify-center rounded-md border-2 ${
          selected ? "border-teal-600 bg-teal-600" : "border-gray-300 bg-white"
        }`}
      >
        {selected ? <Check size={13} color="#FFFFFF" strokeWidth={3} /> : null}
      </View>
    </Pressable>
  );
}
