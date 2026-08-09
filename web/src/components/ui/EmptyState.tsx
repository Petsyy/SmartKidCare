type EmptyStateProps = {
  message?: string;
  colSpan?: number;
};

export function EmptyState({
  message = "No data found.",
  colSpan,
}: EmptyStateProps) {
  if (colSpan !== undefined) {
    return (
      <tr data-slot="empty-state">
        <td
          colSpan={colSpan}
          className="px-6 py-12 text-center text-sm text-gray-500 dark:text-slate-400"
        >
          {message}
        </td>
      </tr>
    );
  }

  return (
    <div data-slot="empty-state" className="py-12 text-center text-sm text-gray-500 dark:text-slate-400">
      {message}
    </div>
  );
}
