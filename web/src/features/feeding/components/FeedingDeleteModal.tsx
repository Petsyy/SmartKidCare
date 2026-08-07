type DeleteModalProps = {
  deletingId: string | null;
  actionError: string | null;
  isSaving: boolean;
  onClose: () => void;
  onDelete: () => void;
};

export const FeedingDeleteModal = ({
  deletingId,
  actionError,
  isSaving,
  onClose,
  onDelete,
}: DeleteModalProps) => {
  if (!deletingId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-50">
            Delete feeding record
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            This removes the child record from the selected feeding entry.
          </p>
        </div>
        <div className="space-y-4 px-6 py-4">
          {actionError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-200">
              {actionError}
            </div>
          )}
          <p className="text-sm text-gray-700 dark:text-slate-200">
            Are you sure you want to delete this record?
          </p>
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
            onClick={onDelete}
            disabled={isSaving}
            className="cursor-pointer rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            {isSaving ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};
