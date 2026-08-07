import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import type { AttendanceStatusFilter } from "../hooks/useAttendanceTracking";

type EditAttendanceModalProps = {
  open: boolean;
  onClose: () => void;
  status: AttendanceStatusFilter;
  onStatusChange: (status: AttendanceStatusFilter) => void;
  onSave: () => void;
  isSaving: boolean;
  error: string | null;
};

export function EditAttendanceModal({
  open,
  onClose,
  status,
  onStatusChange,
  onSave,
  isSaving,
  error,
}: EditAttendanceModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit attendance record"
      subtitle="Only attendance status is editable in the current API."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onSave} loading={isSaving}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <ErrorAlert message={error} />
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
            Attendance status
          </label>
          <select
            value={status}
            onChange={(e) =>
              onStatusChange(e.target.value as AttendanceStatusFilter)
            }
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
          >
            <option value="present">Present</option>
            <option value="absent">Absent</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}
