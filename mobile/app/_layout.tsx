import "@/global.css";
import { Stack } from "expo-router";
import { ActivityIndicator, LogBox, StyleSheet, View } from "react-native";
import { AuthProvider } from "@/src/context/auth-context";
import { useAuth } from "@/src/hooks/use-auth";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import { useEffect } from "react";

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

function LayoutContent() {
  const { loading } = useAuth();

  // Keep Stack mounted at all times so NavigationContainer exists (Redirect, useRouter, Tabs).
  // index.tsx and each group layout handle auth redirects.
  return (
    <>
      {/* File-based routes; do not list Stack.Screen manually (breaks Expo Router 6 linking). */}
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

  // Temporarily disabled for Expo Go / local development while EAS push setup is being fixed.
  // Re-enable Android notification channel setup here when notifications are ready again.

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LayoutContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
