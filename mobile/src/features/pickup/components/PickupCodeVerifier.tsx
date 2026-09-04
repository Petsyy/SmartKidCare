import React from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { QrCode, ShieldCheck } from "lucide-react-native";

interface Props {
  code: string;
  onChangeCode: (value: string) => void;
  onVerify: () => void;
  isVerifying: boolean;
  onSwitchToManual: () => void;
}

export function PickupCodeVerifier({
  code,
  onChangeCode,
  onVerify,
  isVerifying,
  onSwitchToManual,
}: Props) {
  const isReady = code.length === 6 && !isVerifying;

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
      <View className="flex-row items-center mb-5">
        <View className="h-10 w-10 rounded-xl bg-teal-50 items-center justify-center mr-3 border border-teal-100">
          <QrCode size={22} color="#0D9488" />
        </View>
        <View>
          <Text className="text-xl font-black text-gray-900">
            Enter Pickup Code
          </Text>
          <Text className="text-sm font-semibold text-gray-500 mt-0.5">
            Ask the parent or guardian for their 6-digit code
          </Text>
        </View>
      </View>

      {/* Code Input */}
      <TextInput
        value={code}
        onChangeText={onChangeCode}
        keyboardType="number-pad"
        maxLength={6}
        placeholder="• • • • • •"
        placeholderTextColor="#D1D5DB"
        className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center text-5xl font-black tracking-widest text-gray-900 mb-6"
        accessibilityLabel="6-digit pickup code input"
      />

      {/* Verify Button */}
      <Pressable
        onPress={onVerify}
        disabled={!isReady}
        className={`py-5 rounded-2xl items-center mb-5 active:opacity-90 ${isReady ? "bg-teal-600" : "bg-gray-300"}`}
        style={
          isReady
            ? {
                shadowColor: "#14B8A6",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }
            : undefined
        }
        accessibilityRole="button"
        accessibilityLabel="Verify and release child"
      >
        {isVerifying ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-black text-xl tracking-wide">
            Verify & Release
          </Text>
        )}
      </Pressable>

      {/* OR Divider */}
      <View className="flex-row items-center mb-5">
        <View className="flex-1 h-px bg-gray-200" />
        <Text className="px-4 text-gray-400 font-bold text-sm">OR</Text>
        <View className="flex-1 h-px bg-gray-200" />
      </View>

      {/* Manual Override Button */}
      <Pressable
        onPress={onSwitchToManual}
        className="flex-row items-center justify-center py-4 rounded-2xl bg-amber-50 border border-amber-200 active:bg-amber-100"
        accessibilityRole="button"
        accessibilityLabel="Use manual override with photo ID"
      >
        <ShieldCheck size={18} color="#D97706" />
        <Text className="text-amber-800 font-black text-base ml-2">
          Use Manual Override
        </Text>
      </Pressable>
      <Text className="text-center text-gray-400 text-xs mt-2 font-semibold">
        Requires verifying a physical photo ID
      </Text>
    </View>
  );
}
