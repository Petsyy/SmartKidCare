import "@/global.css";
import { Stack } from "expo-router";
import Constants, { ExecutionEnvironment } from "expo-constants";
import {
  ActivityIndicator,
  LogBox,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AuthProvider } from "@/src/context/auth-context";
import { useAuth } from "@/src/hooks/use-auth";
import { SystemSettingsProvider } from "@/src/context/system-settings-context";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/src/lib/query-client";
import { ErrorBoundary } from "@/src/components/ui/error-boundary";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import { cssInterop } from "nativewind";
import { OfflineProvider, useOffline } from "@/src/offline/offline-context";

// Expo SDK 57's LinearGradient is a third-party native component, so NativeWind
// needs an explicit mapping before gradient layout classes can reach `style`.
cssInterop(LinearGradient, { className: "style" });

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

if (__DEV__ && isExpoGo) {
  LogBox.ignoreAllLogs(true);
}

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

function LayoutContent() {
  const { loading, authState, unlockOffline } = useAuth();
  const { isConnected, isInternetReachable, pendingCount, syncState } =
    useOffline();
  const insets = useSafeAreaInsets();
  const isOffline = !isConnected || !isInternetReachable;
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      {(isOffline || pendingCount > 0) && authState !== "signedOut" ? (
        <View
          pointerEvents="none"
          style={{ paddingTop: insets.top }}
          className="absolute left-0 right-0 top-0 z-40 bg-gray-900 px-4 pb-2"
        >
          <Text className="text-center text-sm font-semibold text-white">
            {isOffline
              ? pendingCount > 0
                ? `Offline • ${pendingCount} queued for synchronization`
                : "Offline • showing securely cached information"
              : syncState === "syncing"
                ? `Synchronizing ${pendingCount} submission${pendingCount === 1 ? "" : "s"}…`
                : `${pendingCount} submission${pendingCount === 1 ? "" : "s"} waiting to synchronize`}
          </Text>
        </View>
      ) : null}
      {loading ? (
        <View
          pointerEvents="auto"
          style={StyleSheet.absoluteFill}
          className="z-50 items-center justify-center bg-white"
        >
          <ActivityIndicator size="large" />
        </View>
      ) : null}
      {!loading && authState === "offlineLocked" ? (
        <View
          pointerEvents="auto"
          style={StyleSheet.absoluteFill}
          className="z-50 items-center justify-center bg-gray-50 px-6"
        >
          <View className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6">
            <Text className="text-center text-2xl font-bold text-gray-900">
              Unlock Offline Mode
            </Text>
            <Text className="mt-3 text-center text-base text-gray-600">
              Verify with your device security before viewing protected cached
              information.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Unlock offline mode"
              className="mt-6 min-h-12 items-center justify-center rounded-xl bg-teal-600 px-4"
              onPress={() => void unlockOffline()}
            >
              <Text className="font-semibold text-white">
                Unlock Offline Mode
              </Text>
            </Pressable>
          </View>
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
              <OfflineProvider>
                <SystemSettingsProvider>
                  <LayoutContent />
                </SystemSettingsProvider>
              </OfflineProvider>
            </AuthProvider>
          </SafeAreaProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
