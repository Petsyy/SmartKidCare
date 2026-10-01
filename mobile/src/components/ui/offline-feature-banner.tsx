import React from "react";
import { View, Text } from "react-native";
import { WifiOff } from "lucide-react-native";

interface OfflineFeatureBannerProps {
  title?: string;
  description: string;
  className?: string;
}

export function OfflineFeatureBanner({ 
  title = "Offline Mode", 
  description,
  className = "mx-5 mt-4"
}: OfflineFeatureBannerProps) {
  return (
    <View className={`${className} flex-row items-center rounded-2xl border border-amber-200 bg-amber-50 p-4`}>
      <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-amber-100/70">
        <WifiOff size={22} color="#D97706" />
      </View>
      <View className="flex-1 justify-center">
        <Text className="text-base font-bold text-amber-900">{title}</Text>
        <Text className="mt-0.5 text-sm leading-5 text-amber-800">{description}</Text>
      </View>
    </View>
  );
}
