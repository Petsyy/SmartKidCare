import { memo } from "react";
import { Text, View } from "react-native";
import { CheckCircle2 } from "lucide-react-native";
import type { Child } from "@/src/api/parent.api";
import { formatChildRosterName } from "@/src/utils/child-name";

interface FeedingChildRowProps {
  child: Child;
}

export const FeedingChildRow = memo(function FeedingChildRow({
  child,
}: FeedingChildRowProps) {
  return (
    <View
      className="mx-6 mb-3 flex-row items-center rounded-2xl border border-emerald-200 bg-white p-3 shadow-sm"
      accessible
      accessibilityLabel={`${formatChildRosterName(child)}, included as completed`}
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
        <Text className="font-bold text-slate-700">
          {child.firstName.charAt(0)}
          {child.lastName.charAt(0)}
        </Text>
      </View>
      <Text
        className="ml-3 min-w-0 flex-1 text-base font-bold text-gray-900"
        numberOfLines={2}
      >
        {formatChildRosterName(child)}
      </Text>
      <View className="h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
        <CheckCircle2 size={24} color="#059669" />
      </View>
    </View>
  );
});

