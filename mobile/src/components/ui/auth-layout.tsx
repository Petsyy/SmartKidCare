import React from "react";
import { KeyboardAvoidingView, Platform, Pressable, StatusBar, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft } from "lucide-react-native";

interface AuthLayoutProps {
  children: React.ReactNode;
  onBack?: () => void;
  gradientColors?: readonly [string, string, ...string[]];
  cardClassName?: string;
  keyboardDismissMode?: "none" | "on-drag" | "interactive";
}

export function AuthLayout({
  children,
  onBack,
  gradientColors = ["#ecfdf5", "#d1fae5", "#a7f3d0"],
  cardClassName = "bg-white rounded-3xl p-6 shadow-lg shadow-gray-200",
  keyboardDismissMode = "on-drag",
}: AuthLayoutProps) {
  return (
    <LinearGradient colors={gradientColors} className="flex-1">
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />
      <SafeAreaView className="flex-1" edges={["top"]}>
        {onBack && (
          <Pressable
            onPress={onBack}
            className="ml-4 mt-2 p-2 self-start z-10"
          >
            <ChevronLeft size={28} color="#0d9488" />
          </Pressable>
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-center px-6"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={keyboardDismissMode}
          >
            <View className={cardClassName}>{children}</View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
