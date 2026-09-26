import { Eye, EyeOff } from "lucide-react";

type PasswordVisibilityButtonProps = {
  visible: boolean;
  onToggle: () => void;
  inputId: string;
  label: string;
  disabled?: boolean;
};

export const PasswordVisibilityButton = ({
  visible,
  onToggle,
  inputId,
  label,
  disabled = false,
}: PasswordVisibilityButtonProps) => (
  <button
    type="button"
    onClick={onToggle}
    disabled={disabled}
    className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
    aria-controls={inputId}
    aria-label={`${visible ? "Hide" : "Show"} ${label}`}
    aria-pressed={visible}
    title={`${visible ? "Hide" : "Show"} ${label}`}
  >
    {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
  </button>
);
