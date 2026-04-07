import React from "react";
import { View, Text, Pressable } from "react-native";

type ActionCardProps = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onPress?: () => void;
};

export function ActionCard({
  title,
  subtitle,
  icon,
  onPress,
}: ActionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-sm active:opacity-70 active:scale-95"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View className="items-center">
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">
          {icon}
        </View>

        <Text className="mt-4 text-center text-base font-bold text-gray-900">
          {title}
        </Text>

        {subtitle ? (
          <Text className="mt-1 text-center text-sm font-medium text-gray-500">
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
