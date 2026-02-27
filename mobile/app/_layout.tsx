import "@/global.css";
import { Stack } from "expo-router";
import { ActivityIndicator, LogBox, Platform, View } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { AuthProvider } from "@/src/context/AuthContext";
import { useAuth } from "@/src/hooks/useAuth";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import { registerPushToken } from "@/src/api/notifications.api";
import * as SecureStore from "expo-secure-store";
import { useEffect, useRef } from "react";

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function LayoutContent() {
  const { user, role, token, loading } = useAuth();
  const isRegisteringRef = useRef(false);

  useEffect(() => {
    if (!user || !token) return;
    if (Platform.OS === "web") return;
    if (isRegisteringRef.current) return;

    isRegisteringRef.current = true;

    const registerToken = async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        let finalStatus = status;

        if (status !== "granted") {
          const request = await Notifications.requestPermissionsAsync();
          finalStatus = request.status;
        }

        if (finalStatus !== "granted") return;

        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ||
          Constants.easConfig?.projectId;

        if (!projectId) return;

        const { data: expoPushToken } =
          await Notifications.getExpoPushTokenAsync({ projectId });

        const savedToken = await SecureStore.getItemAsync("expoPushToken");

        if (savedToken !== expoPushToken) {
          await registerPushToken(token, {
            pushToken: expoPushToken,
            platform:
              Platform.OS === "ios"
                ? "ios"
                : Platform.OS === "android"
                  ? "android"
                  : undefined,
            deviceName: Constants.deviceName ?? null,
            appOwnership: Constants.appOwnership ?? null,
          });

          await SecureStore.setItemAsync("expoPushToken", expoPushToken);
        }
      } catch (error: any) {
        console.warn("Push registration failed:", error?.message || error);
      } finally {
        isRegisteringRef.current = false;
      }
    };

    registerToken();
  }, [user, token]);

  useEffect(() => {
    const subscription = Notifications.addPushTokenListener(
      async (tokenData) => {
        const newToken = tokenData.data;

        if (!newToken.startsWith("ExponentPushToken")) {
          console.log("Ignoring non-Expo token refresh:", newToken);
          return;
        }

        const savedToken = await SecureStore.getItemAsync("expoPushToken");

        if (savedToken !== newToken && user && token) {
          try {
            await registerPushToken(token, {
              pushToken: newToken,
              platform:
                Platform.OS === "ios"
                  ? "ios"
                  : Platform.OS === "android"
                    ? "android"
                    : undefined,
              deviceName: Constants.deviceName ?? null,
              appOwnership: Constants.appOwnership ?? null,
            });

            await SecureStore.setItemAsync("expoPushToken", newToken);
          } catch (err: any) {
            console.warn("Token refresh sync failed:", err?.message || err);
          }
        }
      },
    );

    return () => subscription.remove();
  }, [user, token]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="(auth)" />
      ) : role === "parent" ? (
        <Stack.Screen name="(parent)" />
      ) : role === "teacher" ? (
        <Stack.Screen name="(teacher)" />
      ) : (
        <Stack.Screen name="(auth)" />
      )}
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    LogBox.ignoreLogs([
      "SafeAreaView has been deprecated and will be removed in a future release.",
      "[Reanimated] Reduced motion setting is enabled on this device.",
    ]);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    void Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#14B8A6",
    });
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LayoutContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
