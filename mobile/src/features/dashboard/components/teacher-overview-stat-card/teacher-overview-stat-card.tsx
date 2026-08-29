import React from "react";
import { Pressable, Text, View } from "react-native";
import {
  TEACHER_OVERVIEW_STAT_ICON_SIZE,
  TEACHER_OVERVIEW_STAT_MINIMUM_VALUE_SCALE,
} from "./constants";
import {
  TEACHER_OVERVIEW_STAT_MUTED_VALUE_CLASS,
  TEACHER_OVERVIEW_STAT_TONE_STYLES,
} from "./styles";
import type { TeacherOverviewStatCardProps } from "./types";

export function TeacherOverviewStatCard({
  icon: Icon,
  value,
  label,
  caption,
  tone,
  muted = false,
  accessibilityLabel,
  accessibilityHint,
  onPress,
}: TeacherOverviewStatCardProps) {
  const toneStyles = TEACHER_OVERVIEW_STAT_TONE_STYLES[tone];
  const valueClass = muted
    ? TEACHER_OVERVIEW_STAT_MUTED_VALUE_CLASS
    : toneStyles.valueClass;

  const content = (
    <View
      className={`min-h-32 flex-1 rounded-3xl border bg-white p-4 shadow-sm ${toneStyles.borderClass}`}
      accessible={!onPress}
      accessibilityLabel={!onPress ? accessibilityLabel : undefined}
    >
      <View className="flex-row items-center">
        <View
          className={`h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${toneStyles.iconContainerClass}`}
        >
          <Icon
            size={TEACHER_OVERVIEW_STAT_ICON_SIZE}
            color={toneStyles.iconColor}
          />
        </View>
        <Text
          className={`ml-3 flex-1 text-3xl font-black ${valueClass}`}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={TEACHER_OVERVIEW_STAT_MINIMUM_VALUE_SCALE}
        >
          {value}
        </Text>
      </View>

      <Text className="mt-3 text-base font-extrabold text-gray-900">{label}</Text>
      <Text className="mt-0.5 text-sm leading-5 font-medium text-gray-600">{caption}</Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        className="flex-1 active:opacity-85"
      >
        {content}
      </Pressable>
    );
  }

  return content;
}
