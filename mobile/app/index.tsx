import { Redirect, useRootNavigationState } from "expo-router";
import { useAuth } from "@/src/hooks/use-auth";

export default function Index() {
  const { user, role, loading } = useAuth();
  const rootNavigationState = useRootNavigationState();

  if (!rootNavigationState?.key) return null;

  if (loading) return null;

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (role === "parent") {
    return <Redirect href="/(parent)" />;
  }

  if (role === "teacher") {
    return <Redirect href="/(teacher)" />;
  }

  return null;
}
