type FeedingStatusBadgeProps = {
  status: "completed" | "missed";
};

export function FeedingStatusBadge({ status }: FeedingStatusBadgeProps) {
  const isCompleted = status === "completed";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        isCompleted
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
          : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200"
      }`}
    >
      {isCompleted ? "Completed" : "Missed"}
    </span>
  );
}
