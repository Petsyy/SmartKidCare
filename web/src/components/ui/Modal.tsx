import type { ReactNode } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./Dialog";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidth?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  maxWidth = "max-w-md",
  children,
  footer,
}: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        overlayClassName="z-50"
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-gray-200 bg-white shadow-lg outline-none dark:border-slate-700 dark:bg-slate-900",
          maxWidth,
        )}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-slate-700">
          <div>
            <DialogTitle className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              {title}
            </DialogTitle>
            {subtitle && (
              <DialogDescription className="mt-1 text-sm font-normal leading-5 text-slate-600 dark:text-slate-400">
                {subtitle}
              </DialogDescription>
            )}
          </div>
          <DialogClose asChild>
            <button
              type="button"
              className="rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
          </DialogClose>
        </div>

        <div className="px-6 py-4">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4 dark:border-slate-700">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
