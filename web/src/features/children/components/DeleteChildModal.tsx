import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/AlertDialog";
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
    <AlertDialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader className="flex-row items-center gap-3 space-y-0 text-left">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400">
            <Trash2 size={20} />
          </div>
          <div className="flex-1">
            <AlertDialogTitle>Delete Child</AlertDialogTitle>
            <AlertDialogDescription>
              Delete {child.firstName} {child.lastName} from the records.
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <div className="bg-slate-50/60 px-6 py-5 dark:bg-slate-950/30">
          <p className="text-sm font-normal text-slate-700 dark:text-slate-300">
            Are you sure you want to delete this child? This action cannot be
            undone.
          </p>
        </div>
        <AlertDialogFooter>
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={async () => {
              await onDelete(child);
              onClose();
            }}
          >
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
