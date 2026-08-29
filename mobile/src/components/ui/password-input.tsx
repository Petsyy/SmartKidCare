import React, { useState } from "react";
import { View, TextInput, Pressable, TextInputProps } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";

interface PasswordInputProps extends TextInputProps {
  containerClassName?: string;
  inputClassName?: string;
}

export function PasswordInput({
  containerClassName = "relative",
  inputClassName = "",
  onFocus,
  onBlur,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className={containerClassName}>
      <TextInput
        secureTextEntry={!showPassword}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        className={`w-full px-4 py-3 border rounded-xl text-lg text-gray-900 pr-12 ${
          isFocused
            ? "border-emerald-500 bg-white"
            : "border-gray-200 bg-gray-50"
        } ${inputClassName}`}
        {...props}
      />
      <Pressable
        onPress={() => setShowPassword((prev) => !prev)}
        accessibilityRole="button"
        accessibilityLabel={showPassword ? "Hide password" : "Show password"}
        accessibilityHint="Toggles whether the password is visible"
        hitSlop={8}
        className="absolute right-4 top-0 bottom-0 justify-center z-10"
        style={{
          position: "absolute",
          right: 16,
          top: 0,
          bottom: 0,
          justifyContent: "center",
        }}
      >
        {showPassword ? (
          <EyeOff size={20} color="#6b7280" />
        ) : (
          <Eye size={20} color="#6b7280" />
        )}
      </Pressable>
    </View>
  );
}
