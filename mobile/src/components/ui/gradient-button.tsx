import React from "react";
import { Pressable, Text, ActivityIndicator, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
  colors?: readonly [string, string, ...string[]];
  disabledColors?: readonly [string, string, ...string[]];
  className?: string;
  textClassName?: string;
}

export function GradientButton({
  label,
  onPress,
  loading = false,
  loadingLabel,
  disabled = false,
  colors = ["#14b8a6", "#059669"],
  disabledColors = ["#d1d5db", "#9ca3af"],
  className = "",
  textClassName = "",
}: GradientButtonProps) {
  const isButtonDisabled = disabled || loading;
  const activeColors = isButtonDisabled ? disabledColors : colors;

  return (
    <Pressable
      onPress={onPress}
      disabled={isButtonDisabled}
      accessibilityRole="button"
      accessibilityLabel={loading ? loadingLabel || label : label}
      accessibilityState={{ disabled: isButtonDisabled, busy: loading }}
      className={`rounded-xl overflow-hidden ${className}`}
      style={({ pressed }) => [
        { opacity: isButtonDisabled ? 0.75 : pressed ? 0.88 : 1 },
      ]}
    >
      <LinearGradient
        colors={activeColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="w-full py-4 items-center justify-center rounded-xl"
      >
        {loading ? (
          <View className="flex-row items-center justify-center gap-3">
            <ActivityIndicator size="small" color="#fff" />
            <Text className="text-white text-center text-xl font-bold">
              {loadingLabel || label}
            </Text>
          </View>
        ) : (
          <Text
            className={`text-center text-xl font-bold ${
              disabled ? "text-gray-500" : "text-white"
            } ${textClassName}`}
          >
            {label}
          </Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}
