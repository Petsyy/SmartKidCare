import { X } from "lucide-react";
import type { User } from "@/api/authentication.api";

type ViewUserModalProps = {
  user: User | null;
  onClose: () => void;
};

function DetailCard({
  label,
  value,
  subvalue,
}: {
  label: string;
  value: React.ReactNode;
  subvalue?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/70">
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-teal-600/70 dark:text-teal-400/70">
        {label}
      </p>
      <div className="text-sm font-medium text-gray-800 dark:text-slate-200">{value}</div>
      {subvalue ? <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">{subvalue}</div> : null}
    </div>
  );
}

export function ViewUserModal({ user, onClose }: ViewUserModalProps) {
  if (!user) return null;

  const fullName = [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ");

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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50">View User</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">{fullName}</p>
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailCard label="Email" value={<span className="break-all">{user.email}</span>} />
            <DetailCard label="Phone" value={user.phone || "-"} />
            <DetailCard label="Role" value={<span className="capitalize">{user.role}</span>} />
            {user.role === "teacher" ? (
              <DetailCard
                label="Assigned Center"
                value={user.daycareCenter?.name || "Unassigned"}
                subvalue={user.daycareCenter?.barangay || "-"}
              />
            ) : null}
            <DetailCard
              label="Status"
              value={
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                    user.isActive !== false
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
                      : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200"
                  }`}
                >
                  {user.isActive !== false ? "Active" : "Inactive"}
                </span>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
