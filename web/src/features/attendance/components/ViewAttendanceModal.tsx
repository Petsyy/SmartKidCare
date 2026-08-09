import { CalendarDays, UserRound, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/Dialog";
import type { AttendanceRow } from "../hooks/useAttendanceTracking";

const labelClass =
  "mb-1.5 text-sm font-semibold uppercase tracking-[0.04em] text-slate-700 dark:text-slate-400";
const valueClass =
  "text-base font-medium leading-6 text-slate-900 dark:text-slate-200";

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/70">
      <p className={labelClass}>{label}</p>
      <div className={valueClass}>{value}</div>
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

export function ViewAttendanceModal({
  row,
  onClose,
}: ViewAttendanceModalProps) {
  if (!row) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        overlayClassName="bg-transparent"
        className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm outline-none transition-all"
        onClick={onClose}
      >
        <DialogTitle className="sr-only">View Attendance</DialogTitle>
        <DialogDescription className="sr-only">
          View attendance record details.
        </DialogDescription>
        <div
          className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/95"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-gray-200/50 bg-gradient-to-r from-teal-50 to-emerald-50/50 px-6 py-5 backdrop-blur-md dark:border-slate-700/50 dark:from-teal-900/30 dark:to-emerald-900/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400">
                <CalendarDays size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  View Attendance
                </h3>
                <p className="text-sm font-normal text-slate-600 dark:text-slate-400">
                  {row.childName || row.studentId || "Attendance record"}
                </p>
              </div>
            </div>
            <DialogClose asChild>
              <button
                type="button"
                className="cursor-pointer rounded-xl bg-white/50 p-2 text-gray-500 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-white hover:text-gray-700 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </DialogClose>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50/60 p-6 dark:bg-slate-950/30">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.04em] text-slate-700 dark:text-slate-100">
              Attendance snapshot
            </p>
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                <div className="mb-2 flex items-center gap-2 text-teal-600 dark:text-teal-400">
                  <UserRound size={16} />
                  <p className="text-sm font-semibold uppercase tracking-[0.04em] text-slate-700 dark:text-slate-400">
                    Child
                  </p>
                </div>
                <p className={valueClass}>{row.childName || "-"}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                <div className="mb-2 flex items-center gap-2 text-teal-600 dark:text-teal-400">
                  <CalendarDays size={16} />
                  <p className="text-sm font-semibold uppercase tracking-[0.04em] text-slate-700 dark:text-slate-400">
                    Date
                  </p>
                </div>
                <p className={valueClass}>{formatDate(row.date)}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                <p className={labelClass}>Status</p>
                <span
                  className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold ${row.status === "present" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200" : "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200"}`}
                >
                  {row.status === "present" ? "Present" : "Absent"}
                </span>
              </div>
            </div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.04em] text-slate-700 dark:text-slate-100">
              Record details
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Detail label="Child ID" value={row.studentId || "-"} />
              <Detail label="Recorded by" value={row.teacherName || "-"} />
              <Detail
                label="Submitted at"
                value={formatDateTime(row.submittedAt)}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
