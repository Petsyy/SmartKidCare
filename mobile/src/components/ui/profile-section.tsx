import type { ReactNode } from "react";
import { View, Text } from "react-native";

export function ProfileSection({
  icon,
  title,
  tone,
  children,
}: {
  icon: ReactNode;
  title: string;
  tone: "sky" | "emerald" | "teal" | "amber";
  children: ReactNode;
}) {
  const theme = {
    sky: {
      border: "border-sky-100",
      accent: "bg-sky-500",
      iconBackground: "bg-sky-50",
    },
    emerald: {
      border: "border-emerald-100",
      accent: "bg-emerald-500",
      iconBackground: "bg-emerald-50",
    },
    teal: {
      border: "border-teal-100",
      accent: "bg-teal-500",
      iconBackground: "bg-teal-50",
    },
    amber: {
      border: "border-amber-100",
      accent: "bg-amber-500",
      iconBackground: "bg-amber-50",
    },
  }[tone];

  return (
    <View
      className={`mb-4 overflow-hidden rounded-3xl border bg-white shadow-sm ${theme.border}`}
    >
      <View className={`h-1.5 rounded-t-3xl ${theme.accent}`} />
      <View className="p-4">
        <View className="flex-row items-center border-b border-gray-100 pb-3">
          <View
            className={`h-11 w-11 items-center justify-center rounded-2xl ${theme.iconBackground}`}
          >
            {icon}
          </View>
          <Text
            className="ml-3 flex-1 text-xl font-black text-gray-900"
            accessibilityRole="header"
          >
            {title}
          </Text>
        </View>
        <View>{children}</View>
      </View>
    </View>
  );
}
