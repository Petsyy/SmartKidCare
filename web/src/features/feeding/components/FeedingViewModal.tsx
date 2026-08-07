import { CalendarDays, UserRound, X } from "lucide-react";
import type { FeedingRow } from "@/features/feeding/hooks/useFeedingProgram";

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

type ViewModalProps = {
  viewingRow: FeedingRow | null;
  onClose: () => void;
};

export const FeedingViewModal = ({ viewingRow, onClose }: ViewModalProps) => {
  if (!viewingRow) return null;

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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50">View Feeding Record</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">{viewingRow.childName || viewingRow.studentId || "Feeding record"}</p>
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
              <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{viewingRow.childName || "-"}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/70">
              <div className="mb-2 flex items-center gap-2 text-teal-600 dark:text-teal-400">
                <CalendarDays size={16} />
                <p className="text-[11px] font-bold uppercase tracking-[0.18em]">Date</p>
              </div>
              <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{formatDate(viewingRow.date)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/70">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-teal-600/70 dark:text-teal-400/70">Status</p>
              <span
                className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  viewingRow.status === "completed"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200"
                }`}
              >
                {viewingRow.status === "completed" ? "Completed" : "Missed"}
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Detail label="Child ID" value={viewingRow.studentId || "-"} />
            <Detail label="Food served" value={viewingRow.foodServed || "-"} />
            <Detail label="Recorded by" value={viewingRow.teacherName || "-"} />
            <Detail label="Submitted at" value={formatDateTime(viewingRow.submittedAt)} />
            <Detail label="Teacher notes" value={viewingRow.notes || "-"} />
          </div>
        </div>
      </div>
    </div>
  );
};



