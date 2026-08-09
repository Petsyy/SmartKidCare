import { createPortal } from "react-dom";
import { Trash2 } from "lucide-react";
import type { EnrollmentRequestItem } from "@/api/admin.api";

type EnrollmentActionMenuProps = {
  request: EnrollmentRequestItem;
  anchorRect: DOMRect;
  onClose: () => void;
  onDelete: (request: EnrollmentRequestItem) => void;
  isProcessing: boolean;
};

export function EnrollmentActionMenu({
  request,
  anchorRect,
  onClose,
  onDelete,
  isProcessing,
}: EnrollmentActionMenuProps) {
  const isApproved = request.status === "approved";
  const isDisabled = isProcessing || isApproved;

  return createPortal(
    <div
      className="fixed z-50 min-w-44 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900 cursor-pointer"
      style={{
        top: anchorRect.bottom + 4,
        left: anchorRect.right - 176, // 176px is min-w-44 roughly. Align right edge of button.
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => {
          onClose();
          onDelete(request);
        }}
        disabled={isDisabled}
        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition cursor-pointer ${
          isDisabled
            ? "cursor-not-allowed text-gray-400 dark:text-slate-500"
            : "text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
        }`}
      >
        <Trash2 size={14} />
        {isApproved ? "Delete unavailable" : "Delete request"}
      </button>
    </div>,
    document.body,
  );
}
