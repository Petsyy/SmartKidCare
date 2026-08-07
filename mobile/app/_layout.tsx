import "@/global.css";
import { Stack } from "expo-router";
import { ActivityIndicator, LogBox, StyleSheet, View } from "react-native";
import { AuthProvider } from "@/src/context/auth-context";
import { useAuth } from "@/src/hooks/use-auth";
import { SystemSettingsProvider } from "@/src/context/system-settings-context";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/src/lib/query-client";
import { ErrorBoundary } from "@/src/components/ui/error-boundary";

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

function LayoutContent() {
  const { loading } = useAuth();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      {loading ? (
        <View
          pointerEvents="auto"
          style={StyleSheet.absoluteFillObject}
          className="z-50 items-center justify-center bg-white"
        >
          <ActivityIndicator size="large" />
        </View>
      ) : null}
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    LogBox.ignoreLogs([
      "SafeAreaView has been deprecated and will be removed in a future release.",
      "[Reanimated] Reduced motion setting is enabled on this device.",
    ]);
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <AuthProvider>
            <SystemSettingsProvider>
              <LayoutContent />
            </SystemSettingsProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
