import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE } from "@/components/config/config.api";

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
export type VerificationFilter = "all" | "verified" | "unverified";

const formatChildName = (child?: ChildRef | null) => {
  if (!child) return "Unknown";
  const middleName = child.middleName ?? child.middle ?? child.middle_name;
  const trailing = [child.firstName, middleName].filter(Boolean).join(" ");
  return trailing ? `${child.lastName}, ${trailing}` : child.lastName;
};

export function useFeedingProgram() {
  const [rows, setRows] = useState<FeedingRow[]>([]);
  const [search, setSearch] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [statusFilter, setStatusFilter] = useState<FeedingStatusFilter>("all");
  const [verificationFilter, setVerificationFilter] =
    useState<VerificationFilter>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flattenFeeding = useCallback(
    (data: FeedingApiResponse[]): FeedingRow[] =>
      data.flatMap((entry) =>
        entry.records.map((record, index) => {
          const child = typeof record.child === "object" ? record.child : null;
          return {
            id: `${entry._id}-${child?._id ?? record.child ?? index}`,
            date: entry.date,
            studentId: child?.studentId ?? "—",
            childName: formatChildName(child),
            foodServed: entry.foodServed,
            status: record.status,
            teacherName: entry.teacher
              ? `${entry.teacher.firstName} ${entry.teacher.lastName}`
              : "—",
            submittedAt: entry.updatedAt || entry.createdAt || entry.date,
            blockchainVerified: record.blockchainVerified ?? false,
          };
        }),
      ),
    [],
  );

  const fetchFeeding = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
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
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (verificationFilter !== "all") {
        params.set("verification", verificationFilter);
      }
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
        const data = flattenFeeding(payload as FeedingApiResponse[]);
        setRows(data);
        setTotal(data.length);
        setTotalPages(data.length > 0 ? 1 : 0);
      } else {
        const paginated = payload as PaginatedFeedingResponse;
        setRows(Array.isArray(paginated.data) ? paginated.data : []);
        if (Number.isFinite(Number(paginated.pagination?.page))) {
          setPage(Number(paginated.pagination.page));
        }
        if (Number.isFinite(Number(paginated.pagination?.limit))) {
          setLimit(Number(paginated.pagination.limit));
        }
        setTotal(Number(paginated.pagination?.total ?? 0));
        setTotalPages(Number(paginated.pagination?.totalPages ?? 0));
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to fetch feeding records",
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    datePreset,
    flattenFeeding,
    limit,
    page,
    search,
    statusFilter,
    verificationFilter,
  ]);

  useEffect(() => {
    void fetchFeeding();
  }, [fetchFeeding]);

  const rangeLabel = useMemo(() => {
    if (total === 0 || rows.length === 0) return "0 of 0";
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);
    return `${start}-${end} of ${total}`;
  }, [limit, page, rows.length, total]);

  const hasActiveFilters =
    datePreset !== "all" ||
    statusFilter !== "all" ||
    verificationFilter !== "all" ||
    search.trim().length > 0;

  const updateSearch = useCallback((value: string) => {
    setPage(1);
    setSearch(value);
  }, []);

  const updateDatePreset = useCallback((value: DatePreset) => {
    setPage(1);
    setDatePreset(value);
  }, []);

  const updateStatusFilter = useCallback((value: FeedingStatusFilter) => {
    setPage(1);
    setStatusFilter(value);
  }, []);

  const updateVerificationFilter = useCallback((value: VerificationFilter) => {
    setPage(1);
    setVerificationFilter(value);
  }, []);

  const clearFilters = useCallback(() => {
    setPage(1);
    setSearch("");
    setDatePreset("all");
    setStatusFilter("all");
    setVerificationFilter("all");
  }, []);

  return {
    rows,
    search,
    datePreset,
    statusFilter,
    verificationFilter,
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
    updateStatusFilter,
    updateVerificationFilter,
    clearFilters,
  };
}
