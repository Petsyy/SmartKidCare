import "@/global.css";
import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider } from "@/src/context/AuthContext";
import { useAuth } from "@/src/hooks/useAuth";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { configureReanimatedLogger, ReanimatedLogLevel } from "react-native-reanimated";

// Disable Reanimated strict mode warnings
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
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
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(parent)" />
      <Stack.Screen name="(worker)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LayoutContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
