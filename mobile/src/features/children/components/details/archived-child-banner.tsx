import React from "react";
import { View, Text } from "react-native";
import type { Child } from "@/src/api/parent.api";

interface ArchivedChildBannerProps {
  child: Child;
}

export function ArchivedChildBanner({ child }: ArchivedChildBannerProps) {
  const formattedDate = child.archivedAt
    ? `Archived ${new Date(child.archivedAt).toLocaleDateString("en-PH")}`
    : "Archive date unavailable";

  return (
    <View className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <Text className="text-lg font-bold text-amber-900">
        Archived child
      </Text>
      <Text className="mt-1 text-sm text-amber-800">
        {formattedDate} · {child.archiveReason || "Reason unavailable"}
      </Text>
      <Text className="mt-1 text-sm text-amber-700">
        History remains available. Editing and new records are disabled.
      </Text>
    </View>
  );
}
