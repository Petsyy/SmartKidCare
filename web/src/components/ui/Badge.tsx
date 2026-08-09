import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
  {
    variants: {
      variant: {
        success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
        danger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
        warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
        info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
        neutral: "bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    dot?: boolean;
  };

export function Badge({ variant, children, dot, className, ...props }: BadgeProps) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
