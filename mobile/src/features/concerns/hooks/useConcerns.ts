import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addConcernMessage,
  createConcern,
  getConcern,
  getConcerns,
  type CreateConcernPayload,
} from "@/src/api/concerns.api";
import { getMyChildren } from "@/src/api/parent.api";
import { mobileQueryKeys } from "@/src/lib/query-keys";

export function useConcernList() {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: mobileQueryKeys.concerns(page),
    queryFn: () => getConcerns({ page, limit: 10 }),
  });
  const { refetch } = query;

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  return { ...query, page, setPage };
}

export function useCreateConcern() {
  const queryClient = useQueryClient();
  const childrenQuery = useQuery({
    queryKey: mobileQueryKeys.parentChildrenDashboard(),
    queryFn: getMyChildren,
  });
  const mutation = useMutation({
    mutationFn: (payload: CreateConcernPayload) => createConcern(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mobileQueryKeys.concernRoot() });
    },
  });
  return { childrenQuery, mutation };
}

export function useConcernDetail(id: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: mobileQueryKeys.concernDetail(id),
    queryFn: () => getConcern(id),
    enabled: Boolean(id),
  });
  const { refetch } = query;
  const replyMutation = useMutation({
    mutationFn: (message: string) => addConcernMessage(id, message),
    onSuccess: (response) => {
      queryClient.setQueryData(mobileQueryKeys.concernDetail(id), response);
      void queryClient.invalidateQueries({ queryKey: mobileQueryKeys.concernRoot() });
    },
  });

  useFocusEffect(
    useCallback(() => {
      if (id) void refetch();
    }, [id, refetch]),
  );

  return { query, replyMutation };
}
