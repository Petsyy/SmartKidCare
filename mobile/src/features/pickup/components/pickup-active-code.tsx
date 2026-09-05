import React from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { KeyRound, Clock, RefreshCw } from "lucide-react-native";
import { CopyableCode } from "@/src/components/ui";

interface Props {
  code: string;
  timeLeft: string;
  isRequesting: boolean;
  onRegenerate: () => void;
}

export function PickupActiveCode({
  code,
  timeLeft,
  isRequesting,
  onRegenerate,
}: Props) {
  return (
    <View className="items-center py-2">
      <View className="bg-teal-50 h-14 w-14 items-center justify-center rounded-2xl mb-3">
        <KeyRound size={28} color="#0D9488" />
      </View>
      <Text className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-1">
        Active Pickup Code
      </Text>

      <CopyableCode code={code} successMessage="Pickup code copied to clipboard." />

      <View className="flex-row items-center bg-amber-50 px-4 py-2 rounded-full border border-amber-200 mt-1">
        <Clock size={15} color="#D97706" />
        <Text className="text-amber-800 font-bold ml-2 text-sm">
          Valid for: {timeLeft}
        </Text>
      </View>

      <Text className="text-center text-gray-500 mt-4 leading-5 text-sm px-2">
        Present this 6-digit code to the teacher to safely verify and release
        your child.
      </Text>

      <Pressable
        onPress={onRegenerate}
        disabled={isRequesting}
        className="mt-5 flex-row items-center px-4 py-2.5 rounded-full border border-teal-200 bg-teal-50 active:bg-teal-100"
        accessibilityRole="button"
        accessibilityLabel="Regenerate pickup code"
      >
        <RefreshCw size={15} color="#0D9488" />
        <Text className="ml-2 text-teal-800 font-bold text-sm">
          Regenerate Code
        </Text>
      </Pressable>
    </View>
  );
}
