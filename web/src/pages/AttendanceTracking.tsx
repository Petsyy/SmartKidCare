import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ShieldCheck, ShieldAlert } from "lucide-react";
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


const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("authToken")}`,
});

const formatChildName = (child?: ChildRef | null) => {
  if (!child) return "Unknown";
  const middleName = child.middleName ?? child.middle ?? child.middle_name;
  const trailing = [child.firstName, middleName].filter(Boolean).join(" ");
  return trailing ? `${child.lastName}, ${trailing}` : child.lastName;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

const formatDateTime = (value?: string) =>
  value
    ? new Date(value).toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export default function AttendanceTracking() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [search, setSearch] = useState("");
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
    setIsLoading(true);
    setError(null);
    try {
      const url = `${API_BASE}/records/attendance`;
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
      });

      const payload = await response.json().catch(() => []);
      if (!response.ok) {
        const message =
          (payload as { message?: string }).message ||
          "Failed to fetch attendance";
        throw new Error(message);
      }

      const data: AttendanceApiResponse[] = Array.isArray(payload)
        ? payload
        : [];
      setRows(flattenAttendance(data));
    } catch (err: any) {
      setError(err?.message || "Unable to fetch attendance");
    } finally {
      setIsLoading(false);
    }
  }, [flattenAttendance]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (row) =>
        row.childName.toLowerCase().includes(term) ||
        row.studentId.toLowerCase().includes(term),
    );
  }, [rows, search]);



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
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or ID"
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
                    Attendance Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Recorded By
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Submitted At
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Integrity
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
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-10 text-center text-sm text-gray-500"
                    >
                      No attendance records found.
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
                        {row.blockchainVerified ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1">
                              <ShieldCheck className="h-4 w-4 text-emerald-600" />
                              <span className="text-xs font-medium text-emerald-700">Verified</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <div className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1">
                              <ShieldAlert className="h-4 w-4 text-amber-600" />
                              <span className="text-xs font-medium text-amber-700">Unverified</span>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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


