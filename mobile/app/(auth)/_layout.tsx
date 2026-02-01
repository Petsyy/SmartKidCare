import { Stack, Redirect } from "expo-router";
import { useAuth } from "@/src/hooks/useAuth";

export default function AuthLayout() {
  const { user, loading } = useAuth();

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
    </Stack>
  );
}
