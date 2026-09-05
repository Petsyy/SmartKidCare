import React from "react";
import { KeyboardAvoidingView, Platform, StatusBar, StatusBarStyle, View, ViewProps } from "react-native";
import { SafeAreaView, Edge } from "react-native-safe-area-context";

interface ScreenShellProps extends ViewProps {
  children: React.ReactNode;
  edges?: Edge[];
  statusBarStyle?: StatusBarStyle;
  withKeyboardAvoiding?: boolean;
  keyboardAvoidingBehavior?: "padding" | "height" | "position";
}

export function ScreenShell({
  children,
  edges = [],
  statusBarStyle = "light-content",
  withKeyboardAvoiding = true,
  keyboardAvoidingBehavior = Platform.OS === "ios" ? "padding" : undefined,
  className = "flex-1 bg-gray-50",
  style,
  ...props
}: ScreenShellProps) {
  const content = (
    <View className="flex-1" style={style} {...props}>
      {children}
    </View>
  );

  return (
    <SafeAreaView className={className} edges={edges}>
      <StatusBar
        barStyle={statusBarStyle}
        translucent
        backgroundColor="transparent"
      />
      {withKeyboardAvoiding ? (
        <KeyboardAvoidingView
          behavior={keyboardAvoidingBehavior}
          className="flex-1"
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}
