import { useCallback, useEffect, useMemo, useState } from "react";
import AttendanceEditModal from "../components/modals/AttendanceEditModal";
import VerificationModal from "../components/modals/VerificationModal";
import { useNavigate } from "react-router-dom";
import { Search, Pencil, Link } from "lucide-react";
import Layout from "../components/layout/Layout";
import { API_BASE } from "../components/config/config.api";

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

type AttendanceRow = {
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

type DatePreset = "all" | "today" | "thisWeek" | "thisMonth";
type AttendanceStatusFilter = "all" | "present" | "absent";
type VerificationFilter = "all" | "verified" | "unverified";

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

export default function AttendanceTracking() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [search, setSearch] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [statusFilter, setStatusFilter] =
    useState<AttendanceStatusFilter>("all");
  const [verificationFilter, setVerificationFilter] =
    useState<VerificationFilter>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<{
    open: boolean;
    row: AttendanceRow | null;
  }>({ open: false, row: null });
  const [verifyModal, setVerifyModal] = useState<{
    open: boolean;
    row: AttendanceRow | null;
    data?: any | null;
  }>({ open: false, row: null, data: null });
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
    } catch (err: any) {
      setError(err?.message || "Unable to fetch attendance");
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
    fetchAttendance();
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

  return (
    <Layout
      activeItem="attendance"
      breadcrumbs={["Admin", "Attendance Tracking"]}
      onNavigate={(path) => navigate(`/${path}`)}
    >
      <div className="space-y-6 p-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Attendance Tracking
          </h1>
          <p className="text-sm text-gray-500">
            Monitor daily submissions from teachers and keep parents informed.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Daily Attendance Logs
              </h2>
              <p className="text-sm text-gray-500">
                Search by student or filter by date range to find specific
                records.
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
                placeholder="Search by name or ID"
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
                  setStatusFilter(event.target.value as AttendanceStatusFilter);
                }}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
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
                    Attendance Status
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
                      colSpan={7}
                      className="px-6 py-10 text-center text-sm text-gray-500"
                    >
                      Loading attendance records...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-10 text-center text-sm text-gray-500"
                    >
                      No attendance records found.
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

                      <td className="px-6 py-4">
                        <AttendanceStatusBadge status={row.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {row.teacherName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {formatDateTime(row.submittedAt)}
                      </td>
                      <td className="px-6 py-4">
                        <AttendanceRowActions
                          onEdit={() => setEditModal({ open: true, row })}
                          onViewVerification={async () => {
                            setVerifyModal({ open: true, row, data: null }); // open instantly
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

                              const payload = await resp
                                .json()
                                .catch(() => null);
                              if (!resp.ok)
                                throw new Error(
                                  payload?.message ||
                                    "Failed to fetch verification",
                                );

                              setVerifyModal({
                                open: true,
                                row,
                                data: payload,
                              });
                            } catch (err: any) {
                              setError(
                                err?.message || "Unable to fetch verification",
                              );
                              setVerifyModal({
                                open: false,
                                row: null,
                                data: null,
                              });
                            } finally {
                              setVerifyLoading(false);
                            }
                          }}
                        />
                      </td>
                      {/* Edit Modal */}
                      <AttendanceEditModal
                        open={editModal.open}
                        onClose={() => setEditModal({ open: false, row: null })}
                        onSave={async (status) => {
                          if (!editModal.row) return;
                          setIsLoading(true);
                          setError(null);
                          try {
                            // PATCH endpoint: /records/attendance/:id
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
                              const payload = await response
                                .json()
                                .catch(() => ({}));
                              throw new Error(
                                payload.message ||
                                  "Failed to update attendance",
                              );
                            }
                            await fetchAttendance();
                            setEditModal({ open: false, row: null });
                          } catch (err: any) {
                            setError(
                              err?.message || "Unable to update attendance",
                            );
                          } finally {
                            setIsLoading(false);
                          }
                        }}
                        initialStatus={editModal.row?.status || "present"}
                        childName={editModal.row?.childName || ""}
                      />

                      {/* Verification Modal */}
                      <VerificationModal
                        open={verifyModal.open}
                        onClose={() =>
                          setVerifyModal({ open: false, row: null, data: null })
                        }
                        loading={verifyLoading}
                        data={verifyModal.data}
                      />
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
    </Layout>
  );
}

function AttendanceStatusBadge({ status }: { status: "present" | "absent" }) {
  const isPresent = status === "present";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        isPresent
          ? "bg-emerald-100 text-emerald-700"
          : "bg-rose-100 text-rose-700"
      }`}
    >
      {isPresent ? "Present" : "Absent"}
    </span>
  );
}

type AttendanceRowActionsProps = {
  onEdit: () => void;
  onViewVerification?: () => void;
};

function AttendanceRowActions({
  onEdit,
  onViewVerification,
}: AttendanceRowActionsProps) {
  return (
    <div className="flex items-center gap-2 justify-center">
      <button
        className="group inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-100 hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        title="Edit Attendance"
        onClick={onEdit}
      >
        <Pencil className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-rotate-6" />
        <span>Edit</span>
      </button>

      <button
        onClick={onViewVerification}
        title="View blockchain proof"
        className="group inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-linear-to-r from-teal-50 to-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-teal-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:from-teal-100 hover:to-emerald-100 hover:shadow focus:outline-none focus:ring-2 focus:ring-teal-500/30"
      >
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/90 ring-1 ring-teal-200">
          <Link className="h-3.5 w-3.5 text-teal-700" />
        </span>
        <span>View Proof</span>
      </button>
    </div>
  );
}
