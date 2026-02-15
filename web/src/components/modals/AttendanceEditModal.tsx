import { useEffect, useState } from "react";

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
  const [status, setStatus] = useState<"present" | "absent">(initialStatus);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setStatus(initialStatus);
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [open, initialStatus]);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Light Overlay (No black blur) */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Clean Modal (No Shadow, added subtle border for definition) */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white border border-gray-200">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Edit Attendance
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Adjust the attendance status for this child.
          </p>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Child
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {childName}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Attendance Status
            </label>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as "present" | "absent")
              }
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
          <button
            type="button"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex items-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            onClick={() => onSave(status)}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}