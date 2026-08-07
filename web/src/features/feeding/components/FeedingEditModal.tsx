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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-50">
            Edit feeding record
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            Only feeding status is editable in the current API.
          </p>
        </div>
        <div className="space-y-4 px-6 py-4">
          {actionError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-200">
              {actionError}
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
              Feeding status
            </label>
            <select
              value={editingStatus}
              onChange={(e) =>
                setEditingStatus(e.target.value as FeedingStatusFilter)
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
            >
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="cursor-pointer rounded-md bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};
