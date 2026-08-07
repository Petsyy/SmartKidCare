import { useState } from "react";
import { SearchInput } from "@/components/ui/SearchInput";
import { SelectFilter } from "@/components/ui/SelectFilter";
import { Button } from "@/components/ui/Button";
import type { User } from "@/api/authentication.api";
import type { DatePreset, AttendanceStatusFilter } from "../hooks/useAttendanceTracking";

type AttendanceFiltersProps = {
  search: string;
  datePreset: DatePreset;
  startDate: string;
  endDate: string;
  statusFilter: AttendanceStatusFilter;
  teacherId: string;
  hasActiveFilters: boolean;
  teachers: User[];
  teachersLoading: boolean;
  teachersError: string | null;
  centerId: string;
  onCenterChange: (value: string) => void;
  centerOptions: NonNullable<User["daycareCenter"]>[];
  teacherOptions: User[];
  onSearchChange: (value: string) => void;
  onDatePresetChange: (value: DatePreset) => void;
  onDateRangeChange: (start: string, end: string) => void;
  onStatusFilterChange: (value: AttendanceStatusFilter) => void;
  onTeacherFilterChange: (value: string) => void;
  onClearFilters: () => void;
};

export function AttendanceFilters({
  search,
  datePreset,
  startDate,
  endDate,
  statusFilter,
  teacherId,
  hasActiveFilters,
  teachersLoading,
  teachersError,
  centerId,
  onCenterChange,
  centerOptions,
  teacherOptions,
  onSearchChange,
  onDatePresetChange,
  onDateRangeChange,
  onStatusFilterChange,
  onTeacherFilterChange,
  onClearFilters,
}: AttendanceFiltersProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  return (
    <>
      <div className="border-b border-gray-200 p-4 dark:border-slate-700 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">
              Daily Attendance Logs
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Search by child ID or filter by date range to find specific
              records.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end lg:w-auto">
            <SearchInput
              value={search}
              onChange={onSearchChange}
              placeholder="Search attendance records..."
              className="w-full sm:w-72 lg:w-80"
            />
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <SelectFilter
                value={datePreset}
                onChange={(v) => onDatePresetChange(v as DatePreset)}
                options={[
                  { value: "all", label: "All Dates" },
                  { value: "today", label: "Today" },
                  { value: "thisWeek", label: "This Week" },
                  { value: "thisMonth", label: "This Month" },
                ]}
                className="text-xs"
              />
              <SelectFilter
                value={statusFilter}
                onChange={(v) =>
                  onStatusFilterChange(v as AttendanceStatusFilter)
                }
                options={[
                  { value: "all", label: "All Status" },
                  { value: "present", label: "Present" },
                  { value: "absent", label: "Absent" },
                ]}
                className="text-xs"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsAdvancedOpen((prev) => !prev)}
                className="whitespace-nowrap font-semibold"
              >
                {isAdvancedOpen ? "Hide filters" : "Advanced filters"}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={onClearFilters}
                disabled={!hasActiveFilters}
                className="whitespace-nowrap"
              >
                Clear
              </Button>
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
              onChange={(e) => onDateRangeChange(e.target.value, endDate)}
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
              onChange={(e) => onDateRangeChange(startDate, e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
              Center
            </label>
            <select
              value={centerId}
              onChange={(e) => onCenterChange(e.target.value)}
              disabled={teachersLoading}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50"
            >
              {centerOptions.length === 0 && (
                <option value="" disabled>
                  No centers available
                </option>
              )}
              {centerOptions.map((center) => (
                <option key={center._id} value={center._id}>
                  {center.code} - {center.barangay}
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
              onChange={(e) => onTeacherFilterChange(e.target.value)}
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
}
