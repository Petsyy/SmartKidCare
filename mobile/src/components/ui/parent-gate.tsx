import { View, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/src/hooks/use-auth";
import { getMyChildren } from "@/src/api/parent.api";
import { mobileQueryKeys } from "@/src/lib/query-keys";

type Props = {
  children: React.ReactNode;
};

export default function ParentGate({ children }: Props) {
  const { isAuthenticated } = useAuth();
  const { isLoading: loading } = useQuery({
    queryKey: mobileQueryKeys.parentChildrenDashboard(),
    queryFn: getMyChildren,
    enabled: isAuthenticated,
    retry: false,
  });

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-teal-50">
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );
  }

  return <>{children}</>;
}
