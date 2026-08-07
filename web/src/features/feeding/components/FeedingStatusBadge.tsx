type FeedingStatusBadgeProps = {
  status: "completed" | "missed";
};

export function FeedingStatusBadge({ status }: FeedingStatusBadgeProps) {
  const isCompleted = status === "completed";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        isCompleted
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
          : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isCompleted ? "bg-emerald-500" : "bg-rose-500"
        }`}
      />
      {isCompleted ? "Completed" : "Missed"}
    </span>
  );
}
