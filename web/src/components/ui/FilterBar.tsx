import type { ReactNode } from "react";
import { Button } from "./Button";

type FilterBarProps = {
  children: ReactNode;
  hasActiveFilters: boolean;
  onClear: () => void;
  resultCount?: number;
};

export function FilterBar({
  children,
  hasActiveFilters,
  onClear,
  resultCount,
}: FilterBarProps) {
  return (
    <div data-slot="filter-bar" className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">{children}</div>
      <div className="flex items-center justify-between gap-3 xl:justify-end">
        {resultCount !== undefined && (
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {resultCount} result{resultCount === 1 ? "" : "s"}
          </p>
        )}
        <Button variant="secondary" size="sm" onClick={onClear} disabled={!hasActiveFilters}>
          Clear Filters
        </Button>
      </div>
    </div>
  );
}