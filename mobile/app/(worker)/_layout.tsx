import { Stack, Redirect } from "expo-router";
import { useAuth } from "@/src/hooks/useAuth";

export default function WorkerLayout() {
  const { user, role, loading } = useAuth();

  if (loading) return null;

  if (!user || role !== "worker") {
    return <Redirect href="/(auth)/login" />;
  }

  return <Stack />;
}
