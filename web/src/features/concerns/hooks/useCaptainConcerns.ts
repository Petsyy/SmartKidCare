import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCaptainConcern,
  getCaptainConcerns,
  replyToConcern,
  updateConcernStatus,
} from "@/api/concerns.api";
import { webQueryKeys } from "@/lib/query-keys";
import type { ConcernCategory, ConcernStatus } from "../types";

export function useCaptainConcernList(params: {
  page: number;
  limit: number;
  status?: ConcernStatus;
  category?: ConcernCategory;
}) {
  const paramsKey = JSON.stringify(params);
  return useQuery({
    queryKey: webQueryKeys.concerns(paramsKey),
    queryFn: () => getCaptainConcerns(params),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    placeholderData: (previousData) => previousData,
  });
}

export function useCaptainConcernDetail(id: string | null) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: webQueryKeys.concernDetail(id ?? "none"),
    queryFn: () => getCaptainConcern(id!),
    enabled: Boolean(id),
    refetchOnWindowFocus: true,
  });

  const replyMutation = useMutation({
    mutationFn: (message: string) => replyToConcern(id!, message),
    onSuccess: (response) => {
      queryClient.setQueryData(webQueryKeys.concernDetail(id!), response);
      void queryClient.invalidateQueries({ queryKey: webQueryKeys.concernsRoot() });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ status, note }: { status: ConcernStatus; note?: string }) =>
      updateConcernStatus(id!, status, note),
    onSuccess: (response) => {
      queryClient.setQueryData(webQueryKeys.concernDetail(id!), response);
      void queryClient.invalidateQueries({ queryKey: webQueryKeys.concernsRoot() });
    },
  });

  return { query, replyMutation, statusMutation };
}
