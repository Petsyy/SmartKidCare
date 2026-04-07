import React from "react";
import { View, Text, Pressable } from "react-native";

type NoticeItemProps = {
  title: string;
  desc: string;
  meta?: string;
  tone?: "emerald" | "blue" | "orange";
  onPress?: () => void;
};

export function NoticeItem({
  title,
  desc,
  meta,
  tone = "emerald",
  onPress,
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
      className="rounded-2xl bg-gray-50 p-4 active:opacity-90"
    >
      <View className="flex-row">
        <View className={`mr-4 w-1.5 rounded-full ${bar}`} />
        <View className="flex-1">
          <Text className="text-base font-extrabold text-gray-900">
            {title}
          </Text>
          <Text className="mt-1 text-sm leading-5 text-gray-600">{desc}</Text>
          {meta ? (
            <Text className="mt-2 text-xs font-semibold text-gray-500">
              {meta}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
