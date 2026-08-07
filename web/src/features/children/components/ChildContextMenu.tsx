import { createPortal } from "react-dom";
import { ToggleLeft, Unlink, Trash2 } from "lucide-react";
import type { Child } from "@/types/child";

type ChildContextMenuProps = {
  child: Child;
  anchorRect: DOMRect;
  onClose: () => void;
  onChangeStatus: (child: Child) => void;
  onUnlinkParent: (child: Child) => void;
  onDelete: (child: Child) => void;
};

export function ChildContextMenu({
  child,
  anchorRect,
  onClose,
  onChangeStatus,
  onUnlinkParent,
  onDelete,
}: ChildContextMenuProps) {
  return createPortal(
    <div
      className="fixed z-50 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-900"
      style={{
        top: anchorRect.bottom + 4,
        left: anchorRect.left,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => {
          onChangeStatus(child);
          onClose();
        }}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
      >
        <ToggleLeft size={14} />
        Change Status
      </button>
      {child.parent && (
        <button
          onClick={() => {
            onUnlinkParent(child);
            onClose();
          }}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
        >
          <Unlink size={14} />
          Unlink Parent
        </button>
      )}
      <button
        onClick={() => {
          onClose();
          onDelete(child);
        }}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
      >
        <Trash2 size={14} />
        Delete Child
      </button>
    </div>,
    document.body,
  );
}
