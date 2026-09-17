import { createPortal } from "react-dom";
import { KeyRound, Power } from "lucide-react";
import type { User } from "@/api/authentication.api";

type UserActionMenuProps = {
  user: User;
  anchorRect: DOMRect;
  onClose: () => void;
  onResetPassword: (userId: string) => void;
  onToggleStatus: (user: User) => void;
};

export function UserActionMenu({
  user,
  anchorRect,
  onClose,
  onResetPassword,
  onToggleStatus,
}: UserActionMenuProps) {
  return createPortal(
    <div
      className="fixed z-50 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-900 cursor-pointer"
      style={{
        top: anchorRect.bottom + 4,
        left: anchorRect.left,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => {
          onClose();
          onResetPassword(user._id);
        }}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-amber-700 transition hover:bg-amber-50 dark:hover:bg-amber-500/10 cursor-pointer"
      >
        <KeyRound size={14} />
        Reset password
      </button>
      <button
        onClick={() => {
          onClose();
          onToggleStatus(user);
        }}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
      >
        <Power size={14} />
        {user.isActive === false ? "Activate" : "Deactivate"}
      </button>
    </div>,
    document.body,
  );
}
