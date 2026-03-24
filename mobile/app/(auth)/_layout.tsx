import { Stack, Redirect, useRootNavigationState } from "expo-router";
import { useAuth } from "@/src/hooks/use-auth";

export default function AuthLayout() {
  const { user, loading } = useAuth();
  const rootNavigationState = useRootNavigationState();

  if (!rootNavigationState?.key) return null;

  if (loading) return null;

  if (user) {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{ headerShown: false }}
      initialRouteName="splash-screen/onboarding"
    >
      <Stack.Screen name="splash-screen/onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="forgot-password-otp" />
      <Stack.Screen name="forgot-password-reset" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="change-password" />
    </Stack>
  );
}
