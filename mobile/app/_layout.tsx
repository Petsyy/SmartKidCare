import "@/global.css";
import { Stack, useRouter } from "expo-router";
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

type NotificationResponseLike = {
  notification: {
    request: {
      content: {
        data?: Record<string, unknown>;
      };
    };
  };
};

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

function LayoutContent() {
  const { loading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isExpoGo || loading || role !== "parent") return;

    let active = true;
    let removeListener: (() => void) | undefined;

    void import("expo-notifications").then((Notifications) => {
      if (!active) return;

      const openConcern = (response: NotificationResponseLike | null) => {
        const data = response?.notification.request.content.data;
        const type = String(data?.type ?? "");
        const concernId = String(data?.concernId ?? "");
        if (
          concernId &&
          (type === "concern_reply" || type === "concern_status_changed")
        ) {
          router.push(`/(parent)/concerns/${concernId}`);
        }
      };

      const subscription =
        Notifications.addNotificationResponseReceivedListener(openConcern);
      removeListener = () => subscription.remove();
      void Notifications.getLastNotificationResponseAsync().then((response) => {
        if (active) openConcern(response);
      });
    });

    return () => {
      active = false;
      removeListener?.();
    };
  }, [loading, role, router]);

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
