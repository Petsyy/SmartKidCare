import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE } from "@/components/config/config.api";
import {
  formatConfidentialName,
  maskCompositeName,
} from "@/utils/namePrivacy";

type ChildRef = {
  _id: string;
  firstName: string;
  middleName?: string;
  middle?: string;
  middle_name?: string;
  lastName: string;
  studentId?: string;
};

type AttendanceApiResponse = {
  _id: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
  teacher?: {
    _id: string;
    firstName: string;
    lastName: string;
  } | null;
  records: Array<{
    child: ChildRef | string;
    status: "present" | "absent";
    blockchainVerified?: boolean;
  }>;
};

export type AttendanceRow = {
  id: string;
  date: string;
  studentId: string;
  childName: string;
  status: "present" | "absent";
  teacherName: string;
  submittedAt: string;
  blockchainVerified: boolean;
};

type PaginatedAttendanceResponse = {
  data: AttendanceRow[];
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
export type AttendanceStatusFilter = "all" | "present" | "absent";

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

export function useAttendanceTracking() {
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [search, setSearch] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [statusFilter, setStatusFilter] =
    useState<AttendanceStatusFilter>("all");
  const [teacherId, setTeacherId] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flattenAttendance = useCallback(
    (data: AttendanceApiResponse[]): AttendanceRow[] =>
      data.flatMap((entry) =>
        entry.records.map((record, index) => {
          const child = typeof record.child === "object" ? record.child : null;
          return {
            id: `${entry._id}-${child?._id ?? record.child ?? index}`,
            date: entry.date,
            studentId: child?.studentId ?? "—",
            childName: formatChildName(child),
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

  const fetchAttendance = useCallback(async () => {
    if (!teacherId) {
      setRows([]);
      setTotal(0);
      setTotalPages(0);
      setError(null);
      setIsLoading(false);
      return;
    }

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
      const url = `${API_BASE}/records/attendance?${params.toString()}`;
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
          "Failed to fetch attendance";
        throw new Error(message);
      }

      if (Array.isArray(payload)) {
        const data = flattenAttendance(payload as AttendanceApiResponse[]);
        setRows(data);
        setTotal(data.length);
        setTotalPages(data.length > 0 ? 1 : 0);
      } else {
        const paginated = payload as PaginatedAttendanceResponse;
        const rowsFromApi = Array.isArray(paginated.data) ? paginated.data : [];
        setRows(
          rowsFromApi.map((row) => ({
            ...row,
            childName: maskCompositeName(row.childName) || row.childName || "Unknown",
          })),
        );
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
        err instanceof Error ? err.message : "Unable to fetch attendance",
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    datePreset,
    endDate,
    flattenAttendance,
    limit,
    page,
    search,
    startDate,
    statusFilter,
    teacherId,
  ]);

  useEffect(() => {
    void fetchAttendance();
  }, [fetchAttendance]);

  const rangeLabel = useMemo(() => {
    if (total === 0 || rows.length === 0) return "0 of 0";
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);
    return `${start}-${end} of ${total}`;
  }, [limit, page, rows.length, total]);

  const hasActiveFilters =
    datePreset !== "all" ||
    statusFilter !== "all" ||
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

  const updateStatusFilter = useCallback((value: AttendanceStatusFilter) => {
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
    setStatusFilter("all");
  }, []);

  const updateAttendanceStatus = useCallback(
    async (id: string, status: "present" | "absent") => {
      const response = await fetch(`${API_BASE}/records/attendance/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          (payload as { message?: string }).message ||
          "Failed to update attendance record";
        throw new Error(message);
      }

      await fetchAttendance();
    },
    [fetchAttendance],
  );

  const deleteAttendance = useCallback(
    async (id: string) => {
      const response = await fetch(`${API_BASE}/records/attendance/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          (payload as { message?: string }).message ||
          "Failed to delete attendance record";
        throw new Error(message);
      }

      await fetchAttendance();
    },
    [fetchAttendance],
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
    updateAttendanceStatus,
    deleteAttendance,
  };
}
