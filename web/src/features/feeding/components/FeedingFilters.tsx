import { Search } from "lucide-react";
import type { DatePreset } from "@/features/feeding/hooks/useFeedingProgram";

type FeedingFiltersProps = {
  search: string;
  updateSearch: (value: string) => void;
  datePreset: DatePreset;
  updateDatePreset: (value: DatePreset) => void;
  foodServedFilter: string;
  foodOptions: string[];
  updateFoodServedFilter: (value: string) => void;
  hasActiveFilters: boolean;
  clearFilters: () => void;
};

export function FeedingFilters({
  search,
  updateSearch,
  datePreset,
  updateDatePreset,
  foodServedFilter,
  foodOptions,
  updateFoodServedFilter,
  hasActiveFilters,
  clearFilters,
}: FeedingFiltersProps) {
  return (
    <div className="border-b border-gray-200 p-4 dark:border-slate-700 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="shrink-0 text-lg font-semibold text-gray-900 dark:text-slate-50">
          Daily Feeding Logs
        </h2>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end lg:w-auto">
          <div className="relative w-full sm:w-72 lg:w-80">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              value={search}
              onChange={(event) => updateSearch(event.target.value)}
              placeholder="Search feeding records..."
              aria-label="Search feeding records"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-700 transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
            />
          </div>

          <select
            value={datePreset}
            onChange={(event) =>
              updateDatePreset(event.target.value as DatePreset)
            }
            aria-label="Filter feeding records by date"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="thisWeek">This Week</option>
            <option value="thisMonth">This Month</option>
          </select>

          <select
            value={foodServedFilter}
            onChange={(event) => updateFoodServedFilter(event.target.value)}
            aria-label="Filter by food served"
            className="max-w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:max-w-64"
          >
            <option value="">All Food Served</option>
            {foodOptions.map((food) => (
              <option key={food} value={food}>
                {food}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={!hasActiveFilters}
            onClick={clearFilters}
            className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
