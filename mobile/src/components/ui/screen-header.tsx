import React from "react";
import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { BRAND_HEADER_GRADIENT } from "./screen-header.constants";

export type ScreenHeaderBackgroundVariant =
  | "solid"
  | "brandGradient"
  | "teacherGradient";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  backgroundVariant?: ScreenHeaderBackgroundVariant;
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  rightAction,
  backgroundVariant = "solid",
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const content = (
    <View className="flex-row items-start justify-between">
      <View className="flex-row items-center flex-1 pr-3">
        {onBack && (
          <Pressable
            onPress={onBack}
            className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-white/20 active:bg-white/30"
          >
            <ChevronLeft size={24} color="white" />
          </Pressable>
        )}
        <View className="flex-1">
          <Text
            className="text-3xl font-extrabold text-white"
            numberOfLines={2}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text className="mt-1 text-lg text-teal-100" numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {rightAction ? (
        <View className="flex-shrink-0">{rightAction}</View>
      ) : null}
    </View>
  );

  if (backgroundVariant !== "solid") {
    return (
      <LinearGradient
        colors={BRAND_HEADER_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 12 }}
        className="px-5 pb-5"
      >
        {content}
      </LinearGradient>
    );
  }

  return (
    <View
      style={{ paddingTop: insets.top + 12 }}
      className="bg-teal-600 px-5 pb-5"
    >
      {content}
    </View>
  );
}
