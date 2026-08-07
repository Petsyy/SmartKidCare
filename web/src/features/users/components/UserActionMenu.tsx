import { createPortal } from "react-dom";
import { KeyRound, Power } from "lucide-react";
import type { User } from "@/api/authentication.api";

type UserActionMenuProps = {
  user: User;
  anchorRect: DOMRect;
  onClose: () => void;
  onResetPassword: (userId: string) => void;
  onToggleStatus: (user: User) => void;
  onDeleteUser: (user: User) => void;
};

export function UserActionMenu({
  user,
  anchorRect,
  onClose,
  onResetPassword,
  onToggleStatus,
  onDeleteUser,
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
      <button
        onClick={() => {
          onClose();
          onDeleteUser(user);
        }}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"
          />
        </svg>
        Delete user
      </button>
    </div>,
    document.body,
  );
}
