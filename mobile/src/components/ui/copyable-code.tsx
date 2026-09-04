import React from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { Copy } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";

interface CopyableCodeProps {
  code: string;
  label?: string;
  successMessage?: string;
}

export function CopyableCode({ 
  code, 
  label = "Tap to Copy",
  successMessage = "Code copied to clipboard." 
}: CopyableCodeProps) {
  const handleCopy = async () => {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    Alert.alert("Copied", successMessage);
  };

  return (
    <Pressable 
      onPress={handleCopy}
      className="bg-gray-50 px-8 py-5 rounded-2xl border-2 border-teal-500/30 my-3 items-center active:bg-gray-100 w-full"
    >
      <Text className="text-5xl font-black tracking-widest text-teal-950 font-mono mb-3">
        {code}
      </Text>
      <View className="flex-row items-center bg-teal-50 px-4 py-2 rounded-full border border-teal-100">
        <Copy size={16} color="#0D9488" />
        <Text className="text-teal-800 font-bold text-xs ml-2 uppercase tracking-wider">
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
