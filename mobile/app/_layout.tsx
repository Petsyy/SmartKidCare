import "@/global.css";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import * as Notifications from "expo-notifications";
import { AuthProvider } from "@/src/context/AuthContext";
import { useAuth } from "@/src/hooks/useAuth";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { configureReanimatedLogger, ReanimatedLogLevel } from "react-native-reanimated";

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

// Show incoming push notifications even when app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function LayoutContent() {
  const { user, role, loading } = useAuth();

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
