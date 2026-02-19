import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Link, Pencil } from "lucide-react";
import Layout from "../components/layout/Layout";
import { API_BASE } from "../components/config/config.api";
import VerificationModal from "../components/modals/VerificationModal";
import FeedingEditModal from "../components/modals/FeedingEditModal";

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

type FeedingRow = {
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

type DatePreset = "all" | "today" | "thisWeek" | "thisMonth";
type FeedingStatusFilter = "all" | "completed" | "missed";
type VerificationFilter = "all" | "verified" | "unverified";

type AttendanceLookupResponse = {
  _id: string;
  date: string;
  records: Array<{
    child: ChildRef | string;
  }>;
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

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-PH", {
    month: "numeric",
    day: "2-digit",
    year: "numeric",
    timeZone: "Asia/Manila",
  });

const formatDateTime = (value?: string) =>
  value
    ? new Date(value).toLocaleString("en-PH", {
        month: "numeric",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Manila",
      })
    : "—";

export default function FeedingProgram() {
  const navigate = useNavigate();
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
  const [verifyModal, setVerifyModal] = useState<{
    open: boolean;
    row: FeedingRow | null;
    data?: any | null;
  }>({ open: false, row: null, data: null });
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [editModal, setEditModal] = useState<{
    open: boolean;
    row: FeedingRow | null;
  }>({ open: false, row: null });

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
    } catch (err: any) {
      setError(err?.message || "Unable to fetch feeding records");
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
    fetchFeeding();
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

  const fetchVerificationData = useCallback(async (row: FeedingRow) => {
    const headers = {
      "Content-Type": "application/json",
    };

    const primaryResp = await fetch(
      `${API_BASE}/records/feeding/verify/${row.id}`,
      { credentials: "include", headers },
    );
    const primaryPayload = await primaryResp.json().catch(() => null);
    if (primaryResp.ok && primaryPayload) {
      return primaryPayload;
    }

    // Fallback: derive attendance verify id and reuse the known-good endpoint.
    const childId = getChildIdFromRowId(row.id);
    if (!childId) {
      throw new Error(
        primaryPayload?.reason ||
          primaryPayload?.message ||
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
        primaryPayload?.reason ||
          primaryPayload?.message ||
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
        primaryPayload?.reason ||
          primaryPayload?.message ||
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
        fallbackPayload?.message ||
          primaryPayload?.reason ||
          primaryPayload?.message ||
          "Verification unavailable",
      );
    }

    return fallbackPayload;
  }, []);

  return (
    <Layout
      activeItem="feeding"
      breadcrumbs={["Admin", "Feeding Program"]}
      onNavigate={(path) => navigate(`/${path}`)}
    >
      <div className="space-y-6 p-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Feeding Program
          </h1>
          <p className="text-sm text-gray-500">
            Review daily feeding submissions and meal details from teachers.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Daily Feeding Logs
              </h2>
              <p className="text-sm text-gray-500">
                Search by student, meal, or filter by date range to find
                specific records.
              </p>
            </div>
            <div className="relative w-full md:w-64">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setPage(1);
                  setSearch(event.target.value);
                }}
                placeholder="Search by name, meal, or ID"
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div className="flex flex-col gap-3 border-b bg-gray-50/60 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {(["all", "today", "thisWeek", "thisMonth"] as DatePreset[]).map(
                (preset) => {
                  const isActive = datePreset === preset;
                  const label =
                    preset === "all"
                      ? "All Dates"
                      : preset === "today"
                        ? "Today"
                        : preset === "thisWeek"
                          ? "This Week"
                          : "This Month";

                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setPage(1);
                        setDatePreset(preset);
                      }}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        isActive
                          ? "border-teal-300 bg-teal-100 text-teal-800"
                          : "border-gray-300 bg-white text-gray-600 hover:border-teal-200 hover:text-teal-700"
                      }`}
                    >
                      {label}
                    </button>
                  );
                },
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(event) => {
                  setPage(1);
                  setStatusFilter(event.target.value as FeedingStatusFilter);
                }}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="missed">Missed</option>
              </select>
              <select
                value={verificationFilter}
                onChange={(event) => {
                  setPage(1);
                  setVerificationFilter(
                    event.target.value as VerificationFilter,
                  );
                }}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Verification</option>
                <option value="verified">Verified</option>
                <option value="unverified">Needs Review</option>
              </select>
              <button
                type="button"
                disabled={!hasActiveFilters}
                onClick={() => {
                  setPage(1);
                  setSearch("");
                  setDatePreset("all");
                  setStatusFilter("all");
                  setVerificationFilter("all");
                }}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          </div>

          {error && (
            <div className="border-b border-red-100 bg-red-50 px-6 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Student ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Child Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Food Served
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Feeding Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Recorded By
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Submitted At
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions / Verification
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-10 text-center text-sm text-gray-500"
                    >
                      Loading feeding records...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-10 text-center text-sm text-gray-500"
                    >
                      No feeding records found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-mono text-sm text-gray-900">
                        {row.studentId || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {row.childName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDate(row.date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {row.foodServed || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <FeedingStatusBadge status={row.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {row.teacherName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {formatDateTime(row.submittedAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            className="group inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-100 hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                            title="Edit Feeding"
                            onClick={() => setEditModal({ open: true, row })}
                          >
                            <Pencil className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-rotate-6" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={async () => {
                              setVerifyModal({ open: true, row, data: null });
                              setVerifyLoading(true);
                              try {
                                setVerifyModal({
                                  open: true,
                                  row,
                                  data: await fetchVerificationData(row),
                                });
                              } catch (err: any) {
                                setVerifyModal({
                                  open: true,
                                  row,
                                  data: {
                                    isValid: false,
                                    reason:
                                      err?.message ||
                                      "Unable to fetch verification",
                                  },
                                });
                              } finally {
                                setVerifyLoading(false);
                              }
                            }}
                            title="View blockchain proof"
                            className="group inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-linear-to-r from-teal-50 to-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-teal-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:from-teal-100 hover:to-emerald-100 hover:shadow focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                          >
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/90 ring-1 ring-teal-200">
                              <Link className="h-3.5 w-3.5 text-teal-700" />
                            </span>
                            <span>View Proof</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t px-6 py-4">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span>{rangeLabel}</span>
              <select
                value={limit}
                onChange={(event) => setLimit(Number(event.target.value))}
                className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={isLoading || page <= 1}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {totalPages === 0 ? 0 : page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((prev) =>
                    totalPages > 0 ? Math.min(totalPages, prev + 1) : prev,
                  )
                }
                disabled={isLoading || page >= totalPages}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <VerificationModal
        open={verifyModal.open}
        onClose={() => setVerifyModal({ open: false, row: null, data: null })}
        loading={verifyLoading}
        data={verifyModal.data}
      />
      <FeedingEditModal
        open={editModal.open}
        onClose={() => setEditModal({ open: false, row: null })}
        onSave={async (status) => {
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
              throw new Error(payload.message || "Failed to update feeding");
            }
            await fetchFeeding();
            setEditModal({ open: false, row: null });
          } catch (err: any) {
            setError(err?.message || "Unable to update feeding");
          } finally {
            setIsLoading(false);
          }
        }}
        initialStatus={editModal.row?.status || "completed"}
        childName={editModal.row?.childName || ""}
      />
    </Layout>
  );
}

function FeedingStatusBadge({ status }: { status: "completed" | "missed" }) {
  const isCompleted = status === "completed";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        isCompleted
          ? "bg-emerald-100 text-emerald-700"
          : "bg-rose-100 text-rose-700"
      }`}
    >
      {isCompleted ? "Completed" : "Missed"}
    </span>
  );
}
