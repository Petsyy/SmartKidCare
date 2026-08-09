import { X, UserRound } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/Dialog";
import type { User } from "@/api/authentication.api";

type ViewUserModalProps = { user: User | null; onClose: () => void };

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
      <p className="mb-1.5 text-sm font-semibold uppercase tracking-[0.04em] text-slate-700 dark:text-slate-400">
        {label}
      </p>
      <div className="text-base font-medium leading-6 text-slate-900 dark:text-slate-200">
        {value}
      </div>
      {subvalue ? (
        <div className="mt-1 text-xs font-normal text-slate-500 dark:text-slate-400">
          {subvalue}
        </div>
      ) : null}
    </div>
  );
}

export function ViewUserModal({ user, onClose }: ViewUserModalProps) {
  if (!user) return null;
  const fullName = [user.firstName, user.middleName, user.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        overlayClassName="bg-transparent"
        className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm outline-none transition-all"
        onClick={onClose}
      >
        <DialogTitle className="sr-only">View User</DialogTitle>
        <DialogDescription className="sr-only">
          View user account information.
        </DialogDescription>
        <div
          className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/95"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-gray-200/50 bg-gradient-to-r from-teal-50 to-emerald-50/50 px-6 py-5 backdrop-blur-md dark:border-slate-700/50 dark:from-teal-900/30 dark:to-emerald-900/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400">
                <UserRound size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  View User
                </h3>
                <p className="text-sm font-normal text-slate-600 dark:text-slate-400">
                  {fullName}
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
              Account information
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailCard
                label="Email"
                value={<span className="break-words">{user.email}</span>}
              />
              <DetailCard label="Phone" value={user.phone || "-"} />
              <DetailCard
                label="Role"
                value={<span className="capitalize">{user.role}</span>}
              />
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
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${user.isActive !== false ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200" : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200"}`}
                  >
                    {user.isActive !== false ? "Active" : "Inactive"}
                  </span>
                }
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
