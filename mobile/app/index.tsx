import { Redirect } from "expo-router";
import { useAuth } from "@/src/hooks/useAuth";

export default function Index() {
  const { user, role, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (role === "parent") {
    return <Redirect href="/(parent)/parent-dashboard" />;
  }

  if (role === "worker") {
    return <Redirect href="/(worker)/worker-dashboard" />;
  }

  return null;
}
