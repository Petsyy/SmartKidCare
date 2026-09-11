import React from "react";
import { View, Text } from "react-native";
import { LucideIcon } from "lucide-react-native";

interface EmptyStateCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  icon: Icon,
  title,
  description,
}) => {
  return (
    <View className="items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white p-10">
      <Icon size={48} color="#D1D5DB" />
      <Text className="mt-4 text-center text-lg font-bold text-gray-900">
        {title}
      </Text>
      <Text className="mt-2 text-center text-sm text-gray-500">
        {description}
      </Text>
    </View>
  );
};
