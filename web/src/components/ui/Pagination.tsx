import { Button } from "./Button";
import { NativeSelect } from "./NativeSelect";

type PaginationProps = {
  page: number;
  totalPages: number;
  rangeLabel: string;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  pageSizeOptions?: number[];
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
};

export function Pagination({
  page,
  totalPages,
  rangeLabel,
  onPageChange,
  disabled = false,
  pageSizeOptions,
  pageSize,
  onPageSizeChange,
}: PaginationProps) {
  return (
    <div data-slot="pagination" className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600 dark:text-slate-400 sm:justify-start">
        <span>{rangeLabel}</span>
        {pageSizeOptions && pageSize !== undefined && onPageSizeChange && (
          <NativeSelect
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </NativeSelect>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={disabled || page <= 1}
        >
          Previous
        </Button>
        <span className="whitespace-nowrap text-center text-xs text-gray-600 dark:text-slate-400 sm:text-sm">
          Page {totalPages === 0 ? 0 : page} / {totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            onPageChange(totalPages > 0 ? Math.min(totalPages, page + 1) : page)
          }
          disabled={disabled || page >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
