import type { Child } from "@/types/child";

type ChangeStatusModalProps = {
  child: Child;
  value: string;
  onChangeValue: (val: string) => void;
  onClose: () => void;
  onSubmit: (child: Child, newStatus: string) => Promise<void>;
};

export function ChangeStatusModal({
  child,
  value,
  onChangeValue,
  onClose,
  onSubmit,
}: ChangeStatusModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-50">
            Change Status
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            Update status for {`${child.firstName} ${child.lastName}`}.
          </p>
        </div>
        <div className="space-y-4 px-6 py-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
              Status
            </label>
            <select
              value={value}
              onChange={(e) => onChangeValue(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
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
              await onSubmit(child, value);
              onClose();
            }}
            className="rounded-md bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}
