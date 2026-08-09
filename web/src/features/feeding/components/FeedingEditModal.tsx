import { X, Utensils } from "lucide-react";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/Dialog";
import type { FeedingStatusFilter } from "@/features/feeding/hooks/useFeedingProgram";

type EditModalProps = {
  editingId: string;
  editingStatus: FeedingStatusFilter;
  setEditingStatus: (status: FeedingStatusFilter) => void;
  actionError: string | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: () => void;
};

export const FeedingEditModal = ({
  editingId,
  editingStatus,
  setEditingStatus,
  actionError,
  isSaving,
  onClose,
  onSave,
}: EditModalProps) => {
  if (!editingId) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        overlayClassName="bg-transparent"
        className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm outline-none transition-all"
        onClick={onClose}
      >
        <DialogTitle className="sr-only">Edit Feeding Record</DialogTitle>
        <DialogDescription className="sr-only">
          Update feeding status.
        </DialogDescription>
        <div
          className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/95"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-gray-200/50 bg-gradient-to-r from-teal-50 to-emerald-50/50 px-6 py-5 backdrop-blur-md dark:border-slate-700/50 dark:from-teal-900/30 dark:to-emerald-900/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400">
                <Utensils size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  Edit Feeding Record
                </h3>
                <p className="text-sm font-normal text-slate-600 dark:text-slate-400">
                  Only feeding status is editable in the current API.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-xl bg-white/50 p-2 text-gray-500 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-white hover:text-gray-700 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6">
            <ErrorAlert message={actionError} />

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Feeding Status
                </label>
                <select
                  value={editingStatus}
                  onChange={(event) =>
                    setEditingStatus(event.target.value as FeedingStatusFilter)
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100 dark:focus:border-teal-500"
                >
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:cursor-not-allowed disabled:bg-teal-400"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
