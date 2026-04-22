import { useCallback, useMemo, useState } from "react";
import { API_BASE } from "@/components/config/config.api";
import {
  formatConfidentialName,
  maskCompositeName,
} from "@/utils/namePrivacy";
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
  const [search, setSearch] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [statusFilter, setStatusFilter] =
    useState<AttendanceStatusFilter>("all");
  const [teacherId, setTeacherId] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const queryClient = useQueryClient();

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
  const fetchAttendance = useCallback(async () => {
    if (!teacherId) {
      return {
        rows: [] as AttendanceRow[],
        total: 0,
        totalPages: 0,
        page,
        limit,
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
      const rows = flattenAttendance(payload as AttendanceApiResponse[]);
      return { rows, total: rows.length, totalPages: rows.length > 0 ? 1 : 0, page, limit };
    }
    const paginated = payload as PaginatedAttendanceResponse;
    const rowsFromApi = Array.isArray(paginated.data) ? paginated.data : [];
    return {
      rows: rowsFromApi.map((row) => ({
        ...row,
        childName: maskCompositeName(row.childName) || row.childName || "Unknown",
      })),
      total: Number(paginated.pagination?.total ?? 0),
      totalPages: Number(paginated.pagination?.totalPages ?? 0),
      page: Number(paginated.pagination?.page ?? page),
      limit: Number(paginated.pagination?.limit ?? limit),
    };
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
  const { data, isLoading, error: queryError, refetch } = useQuery({
    queryKey: webQueryKeys.attendanceTracking(paramsKey),
    queryFn: fetchAttendance,
  });
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const error = queryError instanceof Error ? queryError.message : null;
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "present" | "absent" }) =>
      fetch(`${API_BASE}/records/attendance/${id}`, {
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
              "Failed to update attendance record",
          );
        }
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["attendanceTracking"] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`${API_BASE}/records/attendance/${id}`, {
        method: "DELETE",
        credentials: "include",
      }).then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            (payload as { message?: string }).message ||
              "Failed to delete attendance record",
          );
        }
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["attendanceTracking"] });
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
      await updateStatusMutation.mutateAsync({ id, status });
    },
    [updateStatusMutation],
  );

  const deleteAttendance = useCallback(
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
    updateAttendanceStatus,
    deleteAttendance,
    fetchAttendance: refetch,
  };
}
