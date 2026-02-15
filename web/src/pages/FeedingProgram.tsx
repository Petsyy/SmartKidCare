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
  new Date(value).toLocaleDateString("en-US", {
    month: "numeric",
    day: "2-digit",
    year: "numeric",
  });

const formatDateTime = (value?: string) =>
  value
    ? new Date(value).toLocaleString("en-US", {
        month: "numeric",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export default function FeedingProgram() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<FeedingRow[]>([]);
  const [search, setSearch] = useState("");
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
      const url = `${API_BASE}/records/feeding`;
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

      const data: FeedingApiResponse[] = Array.isArray(payload) ? payload : [];
      setRows(flattenFeeding(data));
    } catch (err: any) {
      setError(err?.message || "Unable to fetch feeding records");
    } finally {
      setIsLoading(false);
    }
  }, [flattenFeeding]);

  useEffect(() => {
    fetchFeeding();
  }, [fetchFeeding]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (row) =>
        row.childName.toLowerCase().includes(term) ||
        row.studentId.toLowerCase().includes(term) ||
        row.foodServed.toLowerCase().includes(term),
    );
  }, [rows, search]);

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
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, meal, or ID"
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
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
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-10 text-center text-sm text-gray-500"
                    >
                      No feeding records found.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
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
