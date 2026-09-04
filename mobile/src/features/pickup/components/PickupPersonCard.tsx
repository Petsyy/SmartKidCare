import React from "react";
import { View, Text, Pressable } from "react-native";
import { User, ShieldCheck, CheckCircle } from "lucide-react-native";

interface PickupPersonCardProps {
  name: string;
  subtitle: string;
  isSelected: boolean;
  onPress: () => void;
  variant?: "parent" | "guardian";
}

export function PickupPersonCard({
  name,
  subtitle,
  isSelected,
  onPress,
  variant = "guardian",
}: PickupPersonCardProps) {
  const IconComponent = variant === "parent" ? User : ShieldCheck;

  return (
    <Pressable
      onPress={onPress}
      className={`overflow-hidden rounded-2xl border mb-3 active:opacity-90 ${isSelected ? "border-teal-600" : "border-gray-200"}`}
      style={
        isSelected
          ? {
              shadowColor: "#14B8A6",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.2,
              shadowRadius: 6,
              elevation: 4,
            }
          : undefined
      }
      accessibilityRole="button"
      accessibilityLabel={`${isSelected ? "Selected: " : ""}${name}`}
      accessibilityState={{ selected: isSelected }}
    >
      <View style={{ flexDirection: "row" }}>
        {/* Accent bar */}
        <View
          style={{
            width: 4,
            backgroundColor: isSelected ? "#14B8A6" : "#E5E7EB",
          }}
        />
        <View
          className={`flex-1 flex-row items-center p-4 ${isSelected ? "bg-teal-50" : "bg-white"}`}
        >
          <View
            className={`h-12 w-12 rounded-2xl items-center justify-center ${isSelected ? "bg-teal-600" : "bg-gray-100"}`}
          >
            <IconComponent
              size={24}
              color={isSelected ? "#FFFFFF" : "#4B5563"}
            />
          </View>
          <View className="ml-4 flex-1">
            <Text
              className={`font-black text-lg ${isSelected ? "text-teal-900" : "text-gray-900"}`}
              numberOfLines={1}
            >
              {name}
            </Text>
            <Text
              className={`text-sm font-semibold mt-0.5 ${isSelected ? "text-teal-600" : "text-gray-500"}`}
            >
              {subtitle}
            </Text>
          </View>
          {isSelected && <CheckCircle size={24} color="#0D9488" />}
        </View>
      </View>
    </Pressable>
  );
}
