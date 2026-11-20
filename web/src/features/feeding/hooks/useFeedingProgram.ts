import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { webQueryKeys } from "@/lib/query-keys";
import {
  getFeedingRecords,
  updateFeedingRecord,
  deleteFeedingRecord,
} from "../services/feeding.service";
import type {
  DatePreset,
  UseFeedingProgramOptions,
} from "../types";

export type { FeedingRow, DatePreset, FeedingStatusFilter } from "../types";

export function useFeedingProgram({
  initialDatePreset = "all",
}: UseFeedingProgramOptions = {}) {
  const [search, setSearch] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>(initialDatePreset);
  const [foodServedFilter, setFoodServedFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const queryClient = useQueryClient();

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search.trim()) {
      params.set("search", search.trim());
    }
    if (datePreset !== "all") {
      params.set("datePreset", datePreset);
    }
    if (foodServedFilter) params.set("foodServed", foodServedFilter);
    return params.toString();
  }, [datePreset, foodServedFilter, limit, page, search]);

  const { data, isLoading, isFetching, error: queryError, refetch } = useQuery({
    queryKey: webQueryKeys.feedingTracking(queryString),
    queryFn: () => getFeedingRecords(queryString),
    staleTime: 0,
  });

  const rows = data?.rows ?? [];
  const foodOptions = data?.foodOptions ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const error = queryError instanceof Error ? queryError.message : null;

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "completed" | "missed" }) =>
      updateFeedingRecord(id, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["feedingTracking"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFeedingRecord(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["feedingTracking"] });
    },
  });

  const rangeLabel = useMemo(() => {
    if (total === 0 || rows.length === 0) return "0 of 0";
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);
    return `${start}-${end} of ${total}`;
  }, [limit, page, rows.length, total]);

  const hasActiveFilters =
    datePreset !== "all" ||
    search.trim().length > 0 ||
    Boolean(foodServedFilter);

  const updateSearch = useCallback((value: string) => {
    setPage(1);
    setSearch(value);
  }, []);

  const updateDatePreset = useCallback((value: DatePreset) => {
    setPage(1);
    setDatePreset(value);
  }, []);

  const updateFoodServedFilter = useCallback((value: string) => {
    setPage(1);
    setFoodServedFilter(value);
  }, []);

  const clearFilters = useCallback(() => {
    setPage(1);
    setSearch("");
    setDatePreset("all");
    setFoodServedFilter("");
  }, []);

  const updateFeedingStatus = useCallback(
    async (id: string, status: "completed" | "missed") => {
      await updateStatusMutation.mutateAsync({ id, status });
    },
    [updateStatusMutation],
  );

  const deleteFeeding = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id);
    },
    [deleteMutation],
  );

  return {
    rows,
    search,
    datePreset,
    foodServedFilter,
    foodOptions,
    page,
    limit,
    totalPages,
    isLoading: isLoading || isFetching,
    error,
    rangeLabel,
    hasActiveFilters,
    setPage,
    setLimit,
    updateSearch,
    updateDatePreset,
    updateFoodServedFilter,
    clearFilters,
    updateFeedingStatus,
    deleteFeeding,
    fetchFeeding: refetch,
  };
}
