import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

type DeleteAttendanceModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSaving: boolean;
  error: string | null;
};

export function DeleteAttendanceModal({
  open,
  onClose,
  onConfirm,
  isSaving,
  error,
}: DeleteAttendanceModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete attendance record"
      subtitle="This removes the child record from the selected attendance entry."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={isSaving}>
            Delete
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <ErrorAlert message={error} />
        <p className="text-sm text-gray-700 dark:text-slate-200">
          Are you sure you want to delete this record?
        </p>
      </div>
    </Modal>
  );
}
