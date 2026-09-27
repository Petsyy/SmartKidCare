import "@/global.css";
import { Stack } from "expo-router";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { ActivityIndicator, LogBox, StyleSheet, View } from "react-native";
import { AuthProvider } from "@/src/context/auth-context";
import { useAuth } from "@/src/hooks/use-auth";
import { SystemSettingsProvider } from "@/src/context/system-settings-context";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {configureReanimatedLogger,ReanimatedLogLevel} from "react-native-reanimated";
import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/src/lib/query-client";
import { ErrorBoundary } from "@/src/components/ui/error-boundary";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import { cssInterop } from "nativewind";

// Expo SDK 57's LinearGradient is a third-party native component, so NativeWind
// needs an explicit mapping before gradient layout classes can reach `style`.
cssInterop(LinearGradient, { className: "style" });

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// NativeWind's Babel interop currently breaks the React Native 0.86 LogBox UI.
// Keep Expo Go usable while retaining LogBox in custom development builds.
if (__DEV__ && isExpoGo) {
  LogBox.ignoreAllLogs(true);
}

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
          style={StyleSheet.absoluteFill}
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

    if (!isExpoGo) {
      void import("expo-notifications").then((Notifications) => {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });
      });
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
    </GestureHandlerRootView>
  );
}
