import { X, Building2 } from "lucide-react";
import { useAddCenterForm } from "../hooks/useAddCenterForm";
import type { AddCenterModalProps } from "../types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/Dialog";

export function AddCenterModal({
  isOpen,
  onClose,
  onAdd,
}: AddCenterModalProps) {
  const {
    register,
    formState: { errors },
    onSubmit,
    isSubmitting,
  } = useAddCenterForm({ onAdd, onClose });

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        overlayClassName="bg-transparent"
        className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm outline-none transition-all"
        onClick={onClose}
      >
        <DialogTitle className="sr-only">Add New Center</DialogTitle>
        <DialogDescription className="sr-only">
          Create a new daycare center.
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
                Add New Center
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

          <form onSubmit={onSubmit} className="p-6">
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Center Name
                </label>
                <input
                  type="text"
                  {...register("name")}
                  placeholder="e.g. Bonuan Boquig Child Development Center"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100 dark:focus:border-teal-500"
                />
                {errors.name && (
                  <p className="mt-1.5 text-xs text-rose-500">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Barangay
                </label>
                <input
                  type="text"
                  {...register("barangay")}
                  placeholder="e.g. Bonuan Boquig"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100 dark:focus:border-teal-500"
                />
                {errors.barangay && (
                  <p className="mt-1.5 text-xs text-rose-500">
                    {errors.barangay.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Address (Optional)
                </label>
                <textarea
                  {...register("address")}
                  placeholder="Full address of the center"
                  rows={2}
                  className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100 dark:focus:border-teal-500"
                />
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:cursor-not-allowed disabled:bg-teal-400"
              >
                {isSubmitting ? "Adding..." : "Add Center"}
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
