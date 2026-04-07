import React from "react";
import { View, Text } from "react-native";

type StatCardProps = {
  title: string;
  value: string | number;
  variant?: "blue" | "green" | "amber" | "white";
  icon: React.ReactNode;
};

export function StatCard({
  title,
  value,
  variant = "white",
  icon,
}: StatCardProps) {
  const styles =
    variant === "blue"
      ? "bg-sky-50 border-sky-100"
      : variant === "green"
        ? "bg-emerald-50 border-emerald-100"
        : variant === "amber"
          ? "bg-orange-50 border-orange-100"
          : "bg-white border-gray-100";

  const iconWrap =
    variant === "blue"
      ? "bg-sky-100"
      : variant === "green"
        ? "bg-emerald-100"
        : variant === "amber"
          ? "bg-orange-100"
          : "bg-gray-100";

  return (
    <View
      className={`rounded-3xl border p-4 ${styles}`}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View className="flex-row items-start gap-3">
        <View
          className={`h-12 w-12 items-center justify-center rounded-2xl ${iconWrap}`}
        >
          {icon}
        </View>

        <View className="flex-1">
          <Text className="text-base font-bold text-gray-700">{title}</Text>
          <Text className="mt-2 text-4xl font-extrabold text-gray-900">
            {value}
          </Text>
        </View>
      </View>
    </View>
  );
}
