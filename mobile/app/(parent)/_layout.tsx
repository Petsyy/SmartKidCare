import { Stack, Redirect } from "expo-router";
import { useAuth } from "@/src/hooks/useAuth";

export default function ParentLayout() {
  const { user, role, loading } = useAuth();

  if (loading) return null;

  if (!user || role !== "parent") {
    return <Redirect href="/(auth)/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
