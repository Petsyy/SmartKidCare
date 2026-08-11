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
import type { User } from "@/api/authentication.api";
import { useState } from "react";

type DeleteUserModalProps = {
  user: User;
  onClose: () => void;
  onDelete: (user: User) => Promise<void>;
};

export function DeleteUserModal({
  user,
  onClose,
  onDelete,
}: DeleteUserModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onDelete(user);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader className="flex-row items-center gap-3 space-y-0 sm:text-left">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400">
            <Trash2 size={20} />
          </div>
          <div className="flex-1">
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Delete {user.firstName} {user.lastName} from the system.
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <div className="bg-slate-50/60 px-6 py-5 dark:bg-slate-950/30">
          {error && <ErrorAlert message={error} />}
          <p className="text-sm font-normal text-slate-700 dark:text-slate-300">
            Are you sure you want to delete this user? This action cannot be
            undone.
          </p>
        </div>
        <AlertDialogFooter>
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={handleDelete}
            loading={isDeleting}
          >
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
