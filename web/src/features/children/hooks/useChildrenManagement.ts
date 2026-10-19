
import { getChildren } from "@/api/child.api";
import { useQuery } from "@tanstack/react-query";
import { webQueryKeys } from "@/lib/query-keys";

export function useChildrenManagement() {
  const {
    data: children = [],
    isLoading,
  } = useQuery({
    queryKey: webQueryKeys.children(),
    queryFn: async () => {
      const data = await getChildren();
      return Array.isArray(data) ? data : [];
    },
  });

  return {
    children,
    isLoading,
  };
}
