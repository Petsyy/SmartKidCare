import React from "react";
import { View, Text } from "react-native";
import { CheckCircle2, User, Clock } from "lucide-react-native";

interface PickupInfo {
  pickedUpBy: {
    name?: string;
    relationship?: string;
  };
  pickedUpAt?: string;
}

interface Props {
  pickup: PickupInfo | undefined;
}

export function PickupReleasedBanner({ pickup }: Props) {
  return (
    <View className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 items-center mb-5 shadow-sm">
      <View className="h-16 w-16 rounded-full bg-emerald-100 items-center justify-center mb-2">
        <CheckCircle2 size={36} color="#059669" />
      </View>
      <Text className="text-2xl font-black text-emerald-900 mt-2">
        Child Picked Up
      </Text>
      <Text className="text-emerald-700 text-center mt-1 mb-5 text-sm">
        Your child was safely released and verified for pickup today.
      </Text>

      <View className="bg-white rounded-2xl w-full p-4 border border-emerald-100 shadow-sm">
        {/* Picked up by */}
        <View className="flex-row items-center justify-between mb-3 border-b border-gray-100 pb-2.5">
          <View className="flex-row items-center">
            <User size={16} color="#059669" />
            <Text className="text-gray-500 font-semibold ml-2 text-sm">
              Picked up by
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-gray-900 font-extrabold text-sm">
              {pickup?.pickedUpBy.name}
            </Text>
            <Text className="text-emerald-700 font-semibold text-xs bg-emerald-50 px-2 py-0.5 rounded-full ml-2">
              {pickup?.pickedUpBy.relationship}
            </Text>
          </View>
        </View>

        {/* Time of Release */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Clock size={16} color="#059669" />
            <Text className="text-gray-500 font-semibold ml-2 text-sm">
              Time of Release
            </Text>
          </View>
          <Text className="text-gray-900 font-bold text-sm">
            {pickup?.pickedUpAt
              ? new Date(pickup.pickedUpAt).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "N/A"}
          </Text>
        </View>
      </View>
    </View>
  );
}
