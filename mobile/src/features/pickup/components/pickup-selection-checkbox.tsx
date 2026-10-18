import { Check } from "lucide-react-native";
import { Pressable, View } from "react-native";

interface PickupSelectionCheckboxProps {
  selected: boolean;
  childName: string;
  disabled?: boolean;
  onToggle: () => void;
  className?: string;
}

export function PickupSelectionCheckbox({
  selected,
  childName,
  disabled = false,
  onToggle,
  className = "",
}: PickupSelectionCheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={`Select ${childName} for pickup reminder`}
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      className={`h-11 w-11 items-center justify-center ${disabled ? "opacity-40" : "opacity-100"} ${className}`}
    >
      <View
        className={`h-6 w-6 items-center justify-center rounded-md border-2 ${
          selected ? "border-teal-600 bg-teal-600" : "border-gray-300 bg-white"
        }`}
      >
        {selected ? <Check size={16} color="#FFFFFF" strokeWidth={3} /> : null}
      </View>
    </Pressable>
  );
}
