import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "border-teal-500/20 bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500",
        secondary: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50 dark:hover:bg-slate-600",
        danger: "border-rose-500/20 bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500",
        ghost: "border-transparent text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800/60",
      },
      size: {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-5 py-2.5 text-base",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "sm",
    },
  },
);

type ButtonProps = {
  icon?: ReactNode;
  loading?: boolean;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> &
  VariantProps<typeof buttonVariants>;

export function Button({
  variant,
  size,
  icon,
  loading = false,
  children,
  disabled,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      data-slot="button"
      type="button"
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {loading ? "Loading..." : children}
    </button>
  );
}
