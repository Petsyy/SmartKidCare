import React from "react";
import { View, Text, Pressable } from "react-native";
import { User, ChevronRight, Phone } from "lucide-react-native";
import type { PickupEligibleChild } from "@/src/api/api.types";

interface Props {
  child: PickupEligibleChild;
  onPress: () => void;
}

export function PickupEligibleChildCard({ child, onPress }: Props) {
  const guardianCount =
    child.authorizedPickupPersons?.filter((g) => g.isActive !== false).length ??
    0;

  return (
    <Pressable
      onPress={onPress}
      className="overflow-hidden rounded-3xl bg-white active:scale-[0.98]"
      style={{
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
      }}
      accessibilityRole="button"
      accessibilityLabel={`Verify pickup for ${child.firstName} ${child.lastName}`}
    >
      <View style={{ flexDirection: "row" }}>
        {/* Accent bar */}
        <View style={{ width: 4, backgroundColor: "#14B8A6" }} />

        <View className="flex-1 p-4">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="w-14 h-14 rounded-2xl bg-teal-50 items-center justify-center mr-4 border border-teal-100">
                <User size={28} color="#0D9488" />
              </View>
              <View className="flex-1">
                <Text
                  className="text-xl font-black text-gray-900"
                  numberOfLines={1}
                >
                  {child.firstName} {child.lastName}
                </Text>
                <Text className="text-base font-bold text-gray-500 mt-0.5">
                  ID: {child.studentId}
                </Text>
              </View>
            </View>
            <ChevronRight size={24} color="#94A3B8" />
          </View>

          {/* Status Chips */}
          <View className="flex-row items-center gap-2 mt-3">
            <View className="px-3 py-1.5 rounded-full bg-teal-50">
              <Text className="text-sm font-black text-teal-700">Present</Text>
            </View>
            <View className="px-3 py-1.5 rounded-full bg-blue-50">
              <Text className="text-sm font-black text-blue-700">
                {guardianCount} Guardian{guardianCount !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>

          {/* Footer — Parent info */}
          {child.parent && (
            <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <View className="flex-row items-center">
                <Phone size={14} color="#9CA3AF" />
                <Text className="text-sm font-bold text-gray-400 ml-1.5">
                  {child.parent.firstName} {child.parent.lastName}
                </Text>
              </View>
              <View className="bg-teal-600 px-4 py-1.5 rounded-full">
                <Text className="text-white font-black text-xs">Verify</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
