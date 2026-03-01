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
export type VerificationFilter = "all" | "verified" | "unverified";

type VerificationData = {
  isValid: boolean;
  dateHash?: string | null;
  recordedBy?: string | null;
  timestamp?: number | null;
  reason?: string;
};

type EditModalState = {
  open: boolean;
  row: AttendanceRow | null;
};

type VerifyModalState = {
  open: boolean;
  row: AttendanceRow | null;
  data?: VerificationData | null;
};

const formatChildName = (child?: ChildRef | null) => {
  if (!child) return "Unknown";
  const middleName = child.middleName ?? child.middle ?? child.middle_name;
  const trailing = [child.firstName, middleName].filter(Boolean).join(" ");
  return trailing ? `${child.lastName}, ${trailing}` : child.lastName;
};

export function useAttendanceTracking() {
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [search, setSearch] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [statusFilter, setStatusFilter] =
    useState<AttendanceStatusFilter>("all");
  const [verificationFilter, setVerificationFilter] =
    useState<VerificationFilter>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<EditModalState>({
    open: false,
    row: null,
  });
  const [verifyModal, setVerifyModal] = useState<VerifyModalState>({
    open: false,
    row: null,
    data: null,
  });
  const [verifyLoading, setVerifyLoading] = useState(false);

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
        err instanceof Error ? err.message : "Unable to fetch attendance",
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    datePreset,
    flattenAttendance,
    limit,
    page,
    search,
    statusFilter,
    verificationFilter,
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

  const updateStatusFilter = useCallback((value: AttendanceStatusFilter) => {
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

  const openEditModal = useCallback((row: AttendanceRow) => {
    setEditModal({ open: true, row });
  }, []);

  const closeEditModal = useCallback(() => {
    setEditModal({ open: false, row: null });
  }, []);

  const closeVerificationModal = useCallback(() => {
    setVerifyModal({ open: false, row: null, data: null });
  }, []);

  const handleViewVerification = useCallback(async (row: AttendanceRow) => {
    setVerifyModal({ open: true, row, data: null });
    try {
      setVerifyLoading(true);
      setError(null);

      const resp = await fetch(
        `${API_BASE}/records/attendance/verify/${row.id}`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const payload = await resp.json().catch(() => null);
      if (!resp.ok) {
        throw new Error(
          (payload as { message?: string } | null)?.message ||
            "Failed to fetch verification",
        );
      }

      setVerifyModal({
        open: true,
        row,
        data: payload as VerificationData,
      });
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to fetch verification",
      );
      setVerifyModal({
        open: false,
        row: null,
        data: null,
      });
    } finally {
      setVerifyLoading(false);
    }
  }, []);

  const handleSaveEdit = useCallback(
    async (status: AttendanceRow["status"]) => {
      if (!editModal.row) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${API_BASE}/records/attendance/${editModal.row.id}`,
          {
            method: "PATCH",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status }),
          },
        );
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(
            (payload as { message?: string }).message ||
              "Failed to update attendance",
          );
        }
        await fetchAttendance();
        setEditModal({ open: false, row: null });
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Unable to update attendance",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [editModal.row, fetchAttendance],
  );

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
    editModal,
    verifyModal,
    verifyLoading,
    rangeLabel,
    hasActiveFilters,
    setPage,
    setLimit,
    updateSearch,
    updateDatePreset,
    updateStatusFilter,
    updateVerificationFilter,
    clearFilters,
    openEditModal,
    closeEditModal,
    closeVerificationModal,
    handleViewVerification,
    handleSaveEdit,
  };
}
