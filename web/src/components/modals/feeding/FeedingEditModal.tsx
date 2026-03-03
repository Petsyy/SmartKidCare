import { useEffect, useState } from "react";

export type FeedingEditModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (status: "completed" | "missed") => void;
  initialStatus: "completed" | "missed";
  childName: string;
};

export default function FeedingEditModal({
  open,
  onClose,
  onSave,
  initialStatus,
  childName,
}: FeedingEditModalProps) {
  const [status, setStatus] = useState<"completed" | "missed">(initialStatus);

  useEffect(() => {
    if (open) setStatus(initialStatus);
  }, [open, initialStatus]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-gray-50 shadow-xl ring-1 ring-black/5 dark:bg-slate-900 dark:ring-slate-700">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-slate-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-slate-50">
            Edit Feeding
          </h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            Update feeding status for this child. Changes are saved immediately.
          </p>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-lg bg-white/60 px-4 py-3 dark:bg-slate-700/60">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Child
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-slate-50">
              {childName}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300">
              Feeding Status
            </label>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
              Choose whether feeding is completed or missed.
            </p>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as "completed" | "missed")
              }
              className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
            >
              <option value="completed">Completed</option>
              <option value="missed">Missed</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-900/50">
          <button
            type="button"
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex items-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            onClick={() => onSave(status)}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
