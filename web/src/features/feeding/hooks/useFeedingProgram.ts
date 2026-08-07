import { useCallback, useMemo, useState } from "react";
import { API_BASE } from "@/api/config";
import {
  formatConfidentialName,
  maskCompositeName,
} from "@/utils/name-privacy";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { webQueryKeys } from "@/lib/query-keys";

type ChildRef = {
  _id: string;
  firstName: string;
  middleName?: string;
  middle?: string;
  middle_name?: string;
  lastName: string;
  studentId?: string;
};

type FeedingApiResponse = {
  _id: string;
  date: string;
  foodServed: string;
  createdAt?: string;
  updatedAt?: string;
  teacher?: {
    _id: string;
    firstName: string;
    lastName: string;
  } | null;
  records: Array<{
    child: ChildRef | string;
    status: "completed" | "missed";
    notes?: string;
    blockchainVerified?: boolean;
  }>;
};

export type FeedingRow = {
  id: string;
  date: string;
  studentId: string;
  childName: string;
  foodServed: string;
  status: "completed" | "missed";
  notes: string;
  teacherName: string;
  submittedAt: string;
  blockchainVerified: boolean;
};

type PaginatedFeedingResponse = {
  data: FeedingRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

export type DatePreset = "all" | "today" | "thisWeek" | "thisMonth";
export type FeedingStatusFilter = "all" | "completed" | "missed";

const formatChildName = (child?: ChildRef | null) => {
  if (!child) return "Unknown";
  return (
    formatConfidentialName({
      lastName: child.lastName,
      firstName: child.firstName,
      middleName: child.middleName ?? child.middle ?? child.middle_name,
    }) || "Unknown"
  );
};

export function useFeedingProgram() {
  const [search, setSearch] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [statusFilter, setStatusFilter] =
    useState<FeedingStatusFilter>("completed");
  const [teacherId, setTeacherId] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const queryClient = useQueryClient();

  const flattenFeeding = useCallback(
    (data: FeedingApiResponse[]): FeedingRow[] =>
      data.flatMap((entry) =>
        entry.records.map((record, index) => {
          const child = typeof record.child === "object" ? record.child : null;
          return {
            id: `${entry._id}-${child?._id ?? record.child ?? index}`,
            date: entry.date,
            studentId: child?.studentId ?? "â€”",
            childName: formatChildName(child),
            foodServed: entry.foodServed,
            status: record.status,
            notes: String(record.notes ?? "").trim(),
            teacherName: entry.teacher
              ? `${entry.teacher.firstName} ${entry.teacher.lastName}`
              : "â€”",
            submittedAt: entry.updatedAt || entry.createdAt || entry.date,
            blockchainVerified: record.blockchainVerified ?? false,
          };
        }),
      ),
    [],
  );

  const paramsKey = useMemo(
    () =>
      JSON.stringify({
        search,
        datePreset,
        startDate,
        endDate,
        statusFilter,
        teacherId,
        page,
        limit,
      }),
    [search, datePreset, startDate, endDate, statusFilter, teacherId, page, limit],
  );
  const fetchFeeding = useCallback(async () => {
    if (!teacherId) {
      return {
        rows: [] as FeedingRow[],
        total: 0,
        totalPages: 0,
      };
    }
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search.trim()) {
      params.set("search", search.trim());
    }
    if (startDate && endDate) {
      params.set("startDate", startDate);
      params.set("endDate", endDate);
    } else if (datePreset !== "all") {
      params.set("datePreset", datePreset);
    }
    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }
    params.set("teacherId", teacherId);
    const url = `${API_BASE}/records/feeding?${params.toString()}`;
    const response = await fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const payload = await response.json().catch(() => []);
    if (!response.ok) {
      const message =
        (payload as { message?: string }).message ||
        "Failed to fetch feeding records";
      throw new Error(message);
    }

    if (Array.isArray(payload)) {
      const rows = flattenFeeding(payload as FeedingApiResponse[]);
      return { rows, total: rows.length, totalPages: rows.length > 0 ? 1 : 0 };
    }
    const paginated = payload as PaginatedFeedingResponse;
    const rowsFromApi = Array.isArray(paginated.data) ? paginated.data : [];
    return {
      rows: rowsFromApi.map((row) => ({
        ...row,
        notes: String(row.notes ?? "").trim(),
        childName: maskCompositeName(row.childName) || row.childName || "Unknown",
      })),
      total: Number(paginated.pagination?.total ?? 0),
      totalPages: Number(paginated.pagination?.totalPages ?? 0),
    };
  }, [
    datePreset,
    endDate,
    flattenFeeding,
    limit,
    page,
    search,
    startDate,
    statusFilter,
    teacherId,
  ]);
  const { data, isLoading, error: queryError, refetch } = useQuery({
    queryKey: webQueryKeys.feedingTracking(paramsKey),
    queryFn: fetchFeeding,
  });
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const error = queryError instanceof Error ? queryError.message : null;
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "completed" | "missed" }) =>
      fetch(`${API_BASE}/records/feeding/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      }).then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            (payload as { message?: string }).message ||
            "Failed to update feeding record",
          );
        }
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["feedingTracking"] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`${API_BASE}/records/feeding/${id}`, {
        method: "DELETE",
        credentials: "include",
      }).then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            (payload as { message?: string }).message ||
            "Failed to delete feeding record",
          );
        }
      }),
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
    Boolean(startDate && endDate) ||
    search.trim().length > 0;

  const updateSearch = useCallback((value: string) => {
    setPage(1);
    setSearch(value);
  }, []);

  const updateDatePreset = useCallback((value: DatePreset) => {
    setPage(1);
    setDatePreset(value);
    setStartDate("");
    setEndDate("");
  }, []);

  const updateStatusFilter = useCallback((value: FeedingStatusFilter) => {
    setPage(1);
    setStatusFilter(value);
  }, []);

  const updateTeacherFilter = useCallback((value: string) => {
    setPage(1);
    setTeacherId(value);
  }, []);

  const updateDateRange = useCallback((nextStart: string, nextEnd: string) => {
    setPage(1);
    setDatePreset("all");
    setStartDate(nextStart);
    setEndDate(nextEnd);
  }, []);

  const clearFilters = useCallback(() => {
    setPage(1);
    setSearch("");
    setDatePreset("all");
    setStartDate("");
    setEndDate("");
    setStatusFilter("completed");
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
    startDate,
    endDate,
    statusFilter,
    teacherId,
    page,
    limit,
    totalPages,
    isLoading,
    error,
    rangeLabel,
    hasActiveFilters,
    setPage,
    setLimit,
    updateSearch,
    updateDatePreset,
    updateDateRange,
    updateStatusFilter,
    updateTeacherFilter,
    clearFilters,
    updateFeedingStatus,
    deleteFeeding,
    fetchFeeding: refetch,
  };
}



