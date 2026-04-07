import type { ReactNode } from "react";
import { Text, View } from "react-native";

export function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View className="mb-6 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
      <View className="mb-4 flex-row items-center gap-2">
        <View className="h-1 w-6 rounded-full bg-teal-500" />
        <Text className="text-xl font-bold tracking-tight text-gray-900">{title}</Text>
      </View>
      <View className="gap-y-3.5">{children}</View>
    </View>
  );
}

export function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-baseline justify-between py-0.5">
      <Text className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
        {label}
      </Text>
      <Text className="flex-1 text-right text-[15px] font-semibold text-gray-800 ml-4">
        {value}
      </Text>
    </View>
  );
}
