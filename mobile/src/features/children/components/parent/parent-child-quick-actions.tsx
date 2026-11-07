import React from "react";
import { View, Text, Pressable } from "react-native";
import { Award, ShieldCheck } from "lucide-react-native";

export interface ParentChildQuickActionsProps {
  onOpenCompetencies: () => void;
  onOpenPickups: () => void;
}

export function ParentChildQuickActions({
  onOpenCompetencies,
  onOpenPickups,
}: ParentChildQuickActionsProps) {
  return (
    <View className="mb-6 flex-row gap-3">
      <Pressable
        onPress={onOpenCompetencies}
        accessibilityRole="button"
        accessibilityLabel="Open ECCD evaluation history"
        className="flex-1 items-center justify-center rounded-2xl border border-teal-100 bg-white p-4 shadow-sm active:bg-gray-50"
      >
        <View className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-teal-50">
          <Award size={24} color="#0D9488" />
        </View>
        <Text className="text-center text-xs font-bold text-gray-700">
          ECCD History
        </Text>
      </Pressable>

      <Pressable
        onPress={onOpenPickups}
        accessibilityRole="button"
        accessibilityLabel="View authorized guardians and pickups"
        className="flex-1 items-center justify-center rounded-2xl border border-sky-100 bg-white p-4 shadow-sm active:bg-gray-50"
      >
        <View className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-sky-50">
          <ShieldCheck size={24} color="#0369A1" />
        </View>
        <Text className="text-center text-xs font-bold text-gray-700">
          Pickups
        </Text>
      </Pressable>
    </View>
  );
}

