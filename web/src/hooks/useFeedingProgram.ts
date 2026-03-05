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

type VerificationData = {
  isValid: boolean;
  dateHash?: string | null;
  rootHash?: string | null;
  txHash?: string | null;
  recordedBy?: string | null;
  timestamp?: number | null;
  reason?: string;
};

type AttendanceLookupResponse = {
  _id: string;
  date: string;
  records: Array<{
    child: ChildRef | string;
  }>;
};

type VerifyModalState = {
  open: boolean;
  row: FeedingRow | null;
  data?: VerificationData | null;
};

type EditModalState = {
  open: boolean;
  row: FeedingRow | null;
};

const toDateKey = (value: string) =>
  new Date(value).toISOString().split("T")[0];

const getChildIdFromRowId = (rowId: string) => {
  const parts = String(rowId).split("-");
  return parts.length > 1 ? parts.slice(1).join("-") : "";
};

const getChildId = (child: ChildRef | string) =>
  typeof child === "string" ? child : String(child?._id || "");

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
  const [verifyModal, setVerifyModal] = useState<VerifyModalState>({
    open: false,
    row: null,
    data: null,
  });
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [editModal, setEditModal] = useState<EditModalState>({
    open: false,
    row: null,
  });

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

  const fetchVerificationData = useCallback(
    async (row: FeedingRow): Promise<VerificationData> => {
      const headers = {
        "Content-Type": "application/json",
      };

      const enrichWithTxHash = async (
        verificationData: VerificationData,
      ): Promise<VerificationData> => {
        const dateHash = verificationData?.dateHash;
        if (!dateHash) return verificationData;

        try {
          const txResp = await fetch(`${API_BASE}/records/attendance/tx/${dateHash}`, {
            credentials: "include",
            headers,
          });

          if (!txResp.ok) return verificationData;
          const txPayload = await txResp.json().catch(() => null);
          const txHash = (txPayload as { txHash?: string } | null)?.txHash || null;

          return {
            ...verificationData,
            txHash,
          };
        } catch {
          return verificationData;
        }
      };

      const primaryResp = await fetch(
        `${API_BASE}/records/feeding/verify/${row.id}`,
        {
          credentials: "include",
          headers,
        },
      );
      const primaryPayload = await primaryResp.json().catch(() => null);
      if (primaryResp.ok && primaryPayload) {
        return await enrichWithTxHash(primaryPayload as VerificationData);
      }

      const childId = getChildIdFromRowId(row.id);
      if (!childId) {
        throw new Error(
          (primaryPayload as { reason?: string; message?: string } | null)
            ?.reason ||
            (primaryPayload as { reason?: string; message?: string } | null)
              ?.message ||
            "Invalid record id",
        );
      }

      const attendanceResp = await fetch(`${API_BASE}/records/attendance`, {
        credentials: "include",
        headers,
      });
      const attendancePayload = await attendanceResp.json().catch(() => null);
      if (!attendanceResp.ok || !Array.isArray(attendancePayload)) {
        throw new Error(
          (primaryPayload as { reason?: string; message?: string } | null)
            ?.reason ||
            (primaryPayload as { reason?: string; message?: string } | null)
              ?.message ||
            "Verification unavailable",
        );
      }

      const targetDateKey = toDateKey(row.date);
      const matchedAttendance = (
        attendancePayload as AttendanceLookupResponse[]
      ).find(
        (entry) =>
          toDateKey(entry.date) === targetDateKey &&
          entry.records.some((record) => getChildId(record.child) === childId),
      );

      if (!matchedAttendance) {
        throw new Error(
          (primaryPayload as { reason?: string; message?: string } | null)
            ?.reason ||
            (primaryPayload as { reason?: string; message?: string } | null)
              ?.message ||
            "Matching attendance record not found",
        );
      }

      const fallbackResp = await fetch(
        `${API_BASE}/records/attendance/verify/${matchedAttendance._id}-${childId}`,
        { credentials: "include", headers },
      );
      const fallbackPayload = await fallbackResp.json().catch(() => null);
      if (!fallbackResp.ok || !fallbackPayload) {
        throw new Error(
          (fallbackPayload as { message?: string } | null)?.message ||
            (primaryPayload as { reason?: string; message?: string } | null)
              ?.reason ||
            (primaryPayload as { reason?: string; message?: string } | null)
              ?.message ||
            "Verification unavailable",
        );
      }

      return await enrichWithTxHash(fallbackPayload as VerificationData);
    },
    [],
  );

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

  const openEditModal = useCallback((row: FeedingRow) => {
    setEditModal({ open: true, row });
  }, []);

  const closeEditModal = useCallback(() => {
    setEditModal({ open: false, row: null });
  }, []);

  const closeVerificationModal = useCallback(() => {
    setVerifyModal({ open: false, row: null, data: null });
  }, []);

  const handleViewVerification = useCallback(
    async (row: FeedingRow) => {
      setVerifyModal({ open: true, row, data: null });
      setVerifyLoading(true);
      try {
        const verificationData = await fetchVerificationData(row);
        setVerifyModal({
          open: true,
          row,
          data: verificationData,
        });
      } catch (err: unknown) {
        const reason =
          err instanceof Error ? err.message : "Unable to fetch verification";
        setVerifyModal({
          open: true,
          row,
          data: {
            isValid: false,
            reason,
          },
        });
      } finally {
        setVerifyLoading(false);
      }
    },
    [fetchVerificationData],
  );

  const handleSaveEdit = useCallback(
    async (status: FeedingRow["status"]) => {
      if (!editModal.row) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${API_BASE}/records/feeding/${editModal.row.id}`,
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
              "Failed to update feeding",
          );
        }
        await fetchFeeding();
        setEditModal({ open: false, row: null });
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Unable to update feeding",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [editModal.row, fetchFeeding],
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
    verifyModal,
    verifyLoading,
    editModal,
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
