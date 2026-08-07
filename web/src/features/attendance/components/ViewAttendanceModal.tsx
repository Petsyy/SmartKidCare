import { CalendarDays, UserRound, X } from "lucide-react";
import type { AttendanceRow } from "../hooks/useAttendanceTracking";

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/70">
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-teal-600/70 dark:text-teal-400/70">
        {label}
      </p>
      <div className="text-sm font-medium text-gray-800 dark:text-slate-200">{value}</div>
    </div>
  );
}

type ViewAttendanceModalProps = {
  row: AttendanceRow | null;
  onClose: () => void;
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
    : "-";

export function ViewAttendanceModal({ row, onClose }: ViewAttendanceModalProps) {
  if (!row) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl dark:bg-slate-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-teal-200 bg-teal-50 p-6 dark:border-teal-900/50 dark:bg-teal-900/20">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50">View Attendance</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">{row.childName || row.studentId || "Attendance record"}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-white p-6 dark:bg-slate-900">
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/70">
              <div className="mb-2 flex items-center gap-2 text-teal-600 dark:text-teal-400">
                <UserRound size={16} />
                <p className="text-[11px] font-bold uppercase tracking-[0.18em]">Child</p>
              </div>
              <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{row.childName || "-"}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/70">
              <div className="mb-2 flex items-center gap-2 text-teal-600 dark:text-teal-400">
                <CalendarDays size={16} />
                <p className="text-[11px] font-bold uppercase tracking-[0.18em]">Date</p>
              </div>
              <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{formatDate(row.date)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/70">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-teal-600/70 dark:text-teal-400/70">Status</p>
              <span
                className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  row.status === "present"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200"
                }`}
              >
                {row.status === "present" ? "Present" : "Absent"}
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Detail label="Child ID" value={row.studentId || "-"} />
            <Detail label="Recorded by" value={row.teacherName || "-"} />
            <Detail label="Submitted at" value={formatDateTime(row.submittedAt)} />
          </div>
        </div>
      </div>
    </div>
  );
}
