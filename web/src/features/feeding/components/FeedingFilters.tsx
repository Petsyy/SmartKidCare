import { Search } from "lucide-react";
import type { DatePreset } from "@/features/feeding/hooks/useFeedingProgram";
import type { User } from "@/api/authentication.api";

type FeedingFiltersProps = {
  search: string;
  updateSearch: (val: string) => void;
  datePreset: DatePreset;
  updateDatePreset: (val: DatePreset) => void;
  isAdvancedOpen: boolean;
  setIsAdvancedOpen: (val: boolean | ((prev: boolean) => boolean)) => void;
  hasActiveFilters: boolean;
  clearFilters: () => void;
  startDate: string;
  endDate: string;
  updateDateRange: (start: string, end: string) => void;
  centerId: string;
  setCenterId: (val: string) => void;
  teachersLoading: boolean;
  centerOptions: User["daycareCenter"][];
  teacherId: string;
  updateTeacherFilter: (val: string) => void;
  teacherOptions: User[];
  teachersError: string | null;
};

export const FeedingFilters = ({
  search,
  updateSearch,
  datePreset,
  updateDatePreset,
  isAdvancedOpen,
  setIsAdvancedOpen,
  hasActiveFilters,
  clearFilters,
  startDate,
  endDate,
  updateDateRange,
  centerId,
  setCenterId,
  teachersLoading,
  centerOptions,
  teacherId,
  updateTeacherFilter,
  teacherOptions,
  teachersError,
}: FeedingFiltersProps) => {
  return (
    <>
      <div className="border-b border-gray-200 p-4 dark:border-slate-700 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">
              Daily Feeding Logs
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Search by child ID, meal, or filter by date range to find specific
              records.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end lg:w-auto">
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
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <select
                value={datePreset}
                onChange={(event) =>
                  updateDatePreset(event.target.value as DatePreset)
                }
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="thisWeek">This Week</option>
                <option value="thisMonth">This Month</option>
              </select>
              <button
                type="button"
                onClick={() => setIsAdvancedOpen((prev) => !prev)}
                className="cursor-pointer whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
              >
                {isAdvancedOpen ? "Hide filters" : "Advanced filters"}
              </button>
              <button
                type="button"
                disabled={!hasActiveFilters}
                onClick={clearFilters}
                className="cursor-pointer whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {isAdvancedOpen && (
        <div className="grid gap-3 border-b border-gray-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-900 md:grid-cols-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
              Start date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => updateDateRange(e.target.value, endDate)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
              End date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => updateDateRange(startDate, e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
              Center
            </label>
            <select
              value={centerId}
              onChange={(e) => setCenterId(e.target.value)}
              disabled={teachersLoading}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
            >
              {centerOptions.length === 0 && (
                <option value="" disabled>
                  No centers available
                </option>
              )}
              {centerOptions.map((center) => (
                <option key={center?._id} value={center?._id}>
                  {center?.code} - {center?.barangay}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
              Teacher
            </label>
            <select
              value={teacherId}
              onChange={(e) => updateTeacherFilter(e.target.value)}
              disabled={teachersLoading}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
            >
              {teacherOptions.length === 0 && (
                <option value="" disabled>
                  No teachers available
                </option>
              )}
              {teacherOptions.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.lastName}, {teacher.firstName} (
                  {teacher.daycareCenter?.code || "NO CENTER"})
                  {teacher.isActive === false ? " (Inactive)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-4">
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Date range and teacher filters are server-filtered. Pick a center
              first to narrow the teacher list.
            </p>
            {teachersError && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-300">
                {teachersError}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};
