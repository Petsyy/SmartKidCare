import React from "react";
import { View, Text } from "react-native";

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <View className="flex-row items-center py-2">
      <View className="h-8 w-8 items-center justify-center rounded-xl bg-gray-50 mr-3">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          {label}
        </Text>
        <Text className="text-base font-semibold text-gray-800 mt-0.5">
          {value}
        </Text>
      </View>
    </View>
  );
}
