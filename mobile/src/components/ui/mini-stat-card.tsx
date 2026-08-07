import React from "react";
import { View, Text } from "react-native";

interface MiniStatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  variant?: "default" | "teal" | "red";
}

const VARIANT_MAP = {
  default: {
    cardClass: "border-gray-200 bg-white",
    iconContainerClass: "bg-gray-100",
    iconColor: "#4B5563",
    labelClass: "text-gray-600",
    valueClass: "text-gray-800",
  },
  teal: {
    cardClass: "border-teal-200 bg-teal-50",
    iconContainerClass: "bg-teal-100",
    iconColor: "#0F766E",
    labelClass: "text-teal-700",
    valueClass: "text-teal-700",
  },
  red: {
    cardClass: "border-red-200 bg-red-50",
    iconContainerClass: "bg-red-100",
    iconColor: "#B91C1C",
    labelClass: "text-red-700",
    valueClass: "text-red-700",
  },
};

export function MiniStatCard({
  label,
  value,
  icon: Icon,
  variant = "default",
}: MiniStatCardProps) {
  const styles = VARIANT_MAP[variant];

  return (
    <View className={`flex-1 rounded-2xl border p-3 shadow-sm ${styles.cardClass}`}>
      <View className="flex-row items-center">
        <View className={`h-8 w-8 items-center justify-center rounded-lg ${styles.iconContainerClass}`}>
          <Icon size={16} color={styles.iconColor} />
        </View>
        <Text className={`ml-2 text-sm font-semibold uppercase tracking-wide ${styles.labelClass}`}>
          {label}
        </Text>
      </View>
      <Text className={`mt-2 text-3xl font-black ${styles.valueClass}`}>
        {value}
      </Text>
    </View>
  );
}
