import React from "react";
import { View, Text } from "react-native";
import { User, Phone } from "lucide-react-native";
import type { PickupEligibleChild } from "@/src/api/api.types";

interface Props {
  child: PickupEligibleChild;
}

export function PickupChildInfoCard({ child }: Props) {
  return (
    <View
      className="bg-white rounded-3xl p-5 mb-6 overflow-hidden"
      style={{
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
      }}
    >
      <View className="flex-row items-center flex-1">
        <View className="h-16 w-16 bg-teal-100 rounded-2xl items-center justify-center mr-4 border border-teal-200">
          <User size={32} color="#0D9488" />
        </View>
        <View className="flex-1">
          <Text className="text-2xl font-black text-gray-900">
            {child.firstName} {child.lastName}
          </Text>
          <Text className="text-teal-700 font-bold text-base mt-0.5">
            ID: {child.studentId}
          </Text>
        </View>
      </View>

      {child.parent && (
        <View className="flex-row items-center mt-4 pt-3 border-t border-gray-100">
          <Phone size={14} color="#6B7280" />
          <Text className="text-sm font-semibold text-gray-500 ml-2">
            Parent: {child.parent.firstName} {child.parent.lastName}
          </Text>
          {child.parent.phone && (
            <Text className="text-sm font-semibold text-gray-400 ml-2">
              • {child.parent.phone}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
