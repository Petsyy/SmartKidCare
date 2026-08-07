import type { Child } from "@/types/child";

type DeleteChildModalProps = {
  child: Child;
  onClose: () => void;
  onDelete: (child: Child) => Promise<void>;
};

export function DeleteChildModal({
  child,
  onClose,
  onDelete,
}: DeleteChildModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-50">
            Delete Child
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            Are you sure you want to delete {`${child.firstName} ${child.lastName}`}?
            This action cannot be undone.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={async () => {
              await onDelete(child);
              onClose();
            }}
            className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
