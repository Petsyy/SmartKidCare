import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@/src/hooks/use-auth";
import { getMyChildren } from "@/src/api/parent.api";

type Props = {
  children: React.ReactNode;
};

export default function ParentGate({ children }: Props) {
  const { isAuthenticated } = useAuth();
  const [childrenList, setChildrenList] = useState<unknown[] | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchChildren = async () => {
    if (!isAuthenticated) {
      setChildrenList([]);
      setLoading(false);
      return;
    }
    try {
      const data = await getMyChildren();
      setChildrenList(data);
    } catch {
      setChildrenList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, [isAuthenticated]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-teal-50">
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );
  }

  return <>{children}</>;
}
