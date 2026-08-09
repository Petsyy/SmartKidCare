type LoadingStateProps = {
  message?: string;
  colSpan?: number;
};

export function LoadingState({
  message = "Loading...",
  colSpan,
}: LoadingStateProps) {
  if (colSpan !== undefined) {
    return (
      <tr data-slot="loading-state">
        <td
          colSpan={colSpan}
          className="px-6 py-10 text-center text-sm text-gray-500 dark:text-slate-400"
        >
          {message}
        </td>
      </tr>
    );
  }

  return (
    <div data-slot="loading-state" className="flex h-64 items-center justify-center">
      <div className="text-center text-gray-500 dark:text-slate-400">
        {message}
      </div>
    </div>
  );
}
