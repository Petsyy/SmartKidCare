import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/AlertDialog";

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
    <AlertDialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader className="flex-row items-center gap-3 space-y-0 text-left">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400">
            <Trash2 size={20} />
          </div>
          <div className="flex-1">
            <AlertDialogTitle>Delete feeding record</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the child record from the selected feeding entry.
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <div className="bg-slate-50/60 space-y-4 px-6 py-5 dark:bg-slate-950/30">
          <ErrorAlert message={actionError} />
          <p className="text-sm font-normal text-slate-700 dark:text-slate-300">
            Are you sure you want to delete this record? This action cannot be
            undone.
          </p>
        </div>
        <AlertDialogFooter>
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={onDelete}
            loading={isSaving}
          >
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
