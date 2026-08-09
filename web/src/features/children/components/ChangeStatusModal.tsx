import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { NativeSelect } from "@/components/ui/NativeSelect";
import type { Child } from "@/types/child";

type ChangeStatusModalProps = {
  child: Child;
  value: string;
  onChangeValue: (val: string) => void;
  onClose: () => void;
  onSubmit: (child: Child, newStatus: string) => Promise<void>;
};

export function ChangeStatusModal({ child, value, onChangeValue, onClose, onSubmit }: ChangeStatusModalProps) {
  return (
    <Modal
      open
      onClose={onClose}
      title="Change Status"
      subtitle={`Update status for ${child.firstName} ${child.lastName}.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={async () => {
              await onSubmit(child, value);
              onClose();
            }}
          >
            Update
          </Button>
        </>
      }
    >
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Status</label>
        <NativeSelect
          value={value}
          onChange={(event) => onChangeValue(event.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </NativeSelect>
      </div>
    </Modal>
  );
}