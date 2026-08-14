import { X, Building2, MapPin, Hash, User, Users } from "lucide-react";
import type { DaycareCenter } from "@/api/daycare-center.api";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/Dialog";

type ViewCenterModalProps = {
  center: DaycareCenter | null;
  onClose: () => void;
};

export function ViewCenterModal({ center, onClose }: ViewCenterModalProps) {
  if (!center) return null;

  return (
    <Dialog open={!!center} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        overlayClassName="bg-transparent"
        className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm outline-none transition-all"
        onClick={onClose}
      >
        <DialogTitle className="sr-only">View Center Details</DialogTitle>
        <DialogDescription className="sr-only">
          View details for {center.name}.
        </DialogDescription>
        <div
          className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/95"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-gray-200/50 bg-gradient-to-r from-teal-50 to-emerald-50/50 px-6 py-5 backdrop-blur-md dark:border-slate-700/50 dark:from-teal-900/30 dark:to-emerald-900/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400">
                <Building2 size={20} />
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Center Details
              </h3>
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-xl bg-white/50 p-2 text-gray-500 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-white hover:text-gray-700 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h4 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                {center.name}
              </h4>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
                Center Overview
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 rounded-2xl border border-gray-100 bg-gray-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                <div className="flex items-center gap-2 text-sm font-medium text-teal-600 dark:text-teal-400">
                  <MapPin size={16} />
                  Barangay
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                  {center.barangay}
                </div>
              </div>
              <div className="space-y-1 rounded-2xl border border-gray-100 bg-gray-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                <div className="flex items-center gap-2 text-sm font-medium text-teal-600 dark:text-teal-400">
                  <Hash size={16} />
                  Code
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                  {center.code || "N/A"}
                </div>
              </div>
            </div>

            <div className="space-y-1 rounded-2xl border border-gray-100 bg-gray-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
              <div className="flex items-center gap-2 text-sm font-medium text-teal-600 dark:text-teal-400">
                <MapPin size={16} />
                Address
              </div>
              <div className="font-medium text-gray-900 dark:text-slate-200">
                {center.address || "No address provided"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/30 dark:bg-emerald-900/10">
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  <User size={16} />
                  Assigned CDW
                </div>
                <div className="text-lg font-semibold text-emerald-950 dark:text-emerald-50">
                  {center.assignedCDW || "Unassigned"}
                </div>
              </div>
              <div className="space-y-1 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-400">
                  <Users size={16} />
                  Children Count
                </div>
                <div className="text-lg font-semibold text-blue-950 dark:text-blue-50">
                  {center.childrenCount || 0} enrolled
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200/50 bg-gray-50/50 p-4 px-6 dark:border-slate-700/50 dark:bg-slate-900/50 flex justify-end">
            <button
              onClick={onClose}
              className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            >
              Close
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
