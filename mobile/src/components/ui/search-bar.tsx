import React from "react";
import { View, TextInput, TextInputProps } from "react-native";
import { Search } from "lucide-react-native";

interface SearchBarProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  containerClassName?: string;
  iconSize?: number;
  iconColor?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Search...",
  containerClassName = "mx-6 mb-5",
  iconSize = 20,
  iconColor = "#6B7280",
  ...props
}: SearchBarProps) {
  return (
    <View className={containerClassName}>
      <View
        className="flex-row items-center rounded-2xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        <Search size={iconSize} color={iconColor} />
        <TextInput
          className="flex-1 ml-3 text-lg text-gray-800"
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChangeText}
          {...props}
        />
      </View>
    </View>
  );
}
