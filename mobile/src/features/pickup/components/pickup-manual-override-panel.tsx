import React from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { ShieldCheck, QrCode, AlertCircle } from "lucide-react-native";
import { PickupPersonSelector } from "./pickup-person-selector";
import type { Guardian } from "@/src/api/api.types";

interface ParentInfo {
  firstName: string;
  lastName: string;
}

interface Props {
  parent: ParentInfo | null | undefined;
  guardians: Guardian[];
  selectedGuardianIndex: number | null;
  onSelectGuardian: (index: number | null) => void;
  onConfirm: () => void;
  isReleasing: boolean;
  onBack: () => void;
}

export function PickupManualOverridePanel({
  parent,
  guardians,
  selectedGuardianIndex,
  onSelectGuardian,
  onConfirm,
  isReleasing,
  onBack,
}: Props) {
  const confirmDisabled =
    isReleasing || (selectedGuardianIndex === null && !parent);

  return (
    <View
      className="bg-white p-6 rounded-3xl overflow-hidden"
      style={{
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
      }}
    >
      {/* Section Header */}
      <View className="flex-row items-center mb-2">
        <View className="h-10 w-10 rounded-xl bg-amber-50 items-center justify-center mr-3 border border-amber-200">
          <ShieldCheck size={22} color="#D97706" />
        </View>
        <View className="flex-1">
          <Text className="text-xl font-black text-gray-900">
            Manual Override
          </Text>
          <Text className="text-sm font-semibold text-gray-500 mt-0.5">
            Verify using physical photo ID
          </Text>
        </View>
      </View>

      {/* Warning Banner */}
      <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 mt-4">
        <View className="flex-row items-start">
          <AlertCircle size={18} color="#D97706" />
          <Text className="text-amber-800 text-sm font-semibold ml-2 flex-1 leading-5">
            Check the person's government-issued photo ID and confirm it matches
            one of the authorized persons below before releasing the child.
          </Text>
        </View>
      </View>

      {/* Person Selector */}
      <PickupPersonSelector
        parent={parent}
        guardians={guardians}
        selectedGuardianIndex={selectedGuardianIndex}
        onSelect={onSelectGuardian}
      />

      {/* Confirm Button */}
      <Pressable
        onPress={onConfirm}
        disabled={confirmDisabled}
        className={`mt-4 py-5 rounded-2xl items-center active:opacity-90 ${isReleasing ? "bg-teal-400" : "bg-teal-600"}`}
        style={{
          shadowColor: "#14B8A6",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        }}
        accessibilityRole="button"
        accessibilityLabel="Confirm manual release"
      >
        {isReleasing ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-black text-xl tracking-wide">
            Confirm Manual Release
          </Text>
        )}
      </Pressable>

      {/* Back Link */}
      <Pressable
        onPress={onBack}
        className="py-4 items-center mt-2 flex-row justify-center"
        accessibilityRole="button"
        accessibilityLabel="Back to code verification"
      >
        <QrCode size={16} color="#6B7280" />
        <Text className="text-gray-600 font-black text-base ml-2">
          Back to Code Verification
        </Text>
      </Pressable>
    </View>
  );
}
