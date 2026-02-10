import { useState } from "react";

export type AttendanceEditModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (status: "present" | "absent") => void;
  initialStatus: "present" | "absent";
  childName: string;
};

export default function AttendanceEditModal({
  open,
  onClose,
  onSave,
  initialStatus,
  childName,
}: AttendanceEditModalProps) {
  const [status, setStatus] = useState<"present" | "absent">(
    initialStatus,
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-gray-50 shadow-xl ring-1 ring-black/5">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            Edit Attendance
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Adjust the attendance status for this child. Changes are saved
            immediately.
          </p>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-lg bg-white/60 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Child
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {childName}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">
              Attendance Status
            </label>
            <p className="mt-1 text-xs text-gray-500">
              Choose whether this child is marked present or absent.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus("present")}
                className={`flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition ${status === "present"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                    : "border-gray-200 bg-white text-gray-700 hover:border-emerald-400 hover:bg-emerald-50/60"
                  }`}
              >
                Present
              </button>
              <button
                type="button"
                onClick={() => setStatus("absent")}
                className={`flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition ${status === "absent"
                    ? "border-rose-500 bg-rose-50 text-rose-700 shadow-sm"
                    : "border-gray-200 bg-white text-gray-700 hover:border-rose-400 hover:bg-rose-50/60"
                  }`}
              >
                Absent
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            type="button"
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex items-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
            onClick={() => onSave(status)}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
