import React from "react";
import { View, Text, Pressable } from "react-native";

type NoticeItemProps = {
  title: string;
  desc: string;
  meta?: string;
  tone?: "emerald" | "blue" | "orange";
  onPress?: () => void;
  accessibilityHint?: string;
};

export function NoticeItem({
  title,
  desc,
  meta,
  tone = "emerald",
  onPress,
  accessibilityHint,
}: NoticeItemProps) {
  const bar =
    tone === "emerald"
      ? "bg-emerald-600"
      : tone === "blue"
        ? "bg-sky-600"
        : "bg-orange-500";

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={[title, desc, meta].filter(Boolean).join(". ")}
      accessibilityHint={accessibilityHint || (onPress ? "Opens notification" : undefined)}
      className="rounded-2xl bg-gray-50 p-4 active:opacity-85"
    >
      <View className="flex-row">
        <View className={`mr-3.5 w-2 rounded-full ${bar}`} />
        <View className="flex-1">
          <Text className="text-lg font-extrabold text-gray-900">
            {title}
          </Text>
          <Text className="mt-1 text-base leading-6 text-gray-700">{desc}</Text>
          {meta ? (
            <Text className="mt-2 text-sm font-semibold text-gray-500">
              {meta}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
