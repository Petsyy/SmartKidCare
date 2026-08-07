import { FilterBar } from "@/components/ui/FilterBar";
import { SearchInput } from "@/components/ui/SearchInput";
import { SelectFilter } from "@/components/ui/SelectFilter";
import type { AccountStatusFilter } from "../hooks/useUserManagement";
import { PAGE_SIZE_OPTIONS } from "../hooks/useUserManagement";

type UserFiltersProps = {
  activeTab: "teacher" | "parent";
  hasActiveFilters: boolean;
  resultCount: number;
  currentSearchQuery: string;
  onSearchChange: (value: string) => void;
  currentStatusFilter: string;
  onStatusFilterChange: (value: AccountStatusFilter) => void;
  teacherCenterFilter: string;
  onTeacherCenterFilterChange: (value: string) => void;
  teacherCenterOptions: { _id: string; name: string; barangay: string }[];
  currentPageSize: number;
  onPageSizeChange: (value: number) => void;
  onClearFilters: () => void;
};

export const UserFilters = ({
  activeTab,
  hasActiveFilters,
  resultCount,
  currentSearchQuery,
  onSearchChange,
  currentStatusFilter,
  onStatusFilterChange,
  teacherCenterFilter,
  onTeacherCenterFilterChange,
  teacherCenterOptions,
  currentPageSize,
  onPageSizeChange,
  onClearFilters,
}: UserFiltersProps) => {
  return (
    <FilterBar
      hasActiveFilters={hasActiveFilters}
      onClear={onClearFilters}
      resultCount={resultCount}
    >
      <SearchInput
        value={currentSearchQuery}
        onChange={onSearchChange}
        placeholder={`Search ${activeTab === "teacher" ? "teachers" : "parents"}...`}
        className="min-w-55 flex-1 sm:max-w-xs"
      />
      <SelectFilter
        value={currentStatusFilter}
        onChange={(v) => onStatusFilterChange(v as AccountStatusFilter)}
        options={[
          { value: "all", label: "All Statuses" },
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ]}
      />
      {activeTab === "teacher" && (
        <SelectFilter
          value={teacherCenterFilter}
          onChange={(v) => {
            onTeacherCenterFilterChange(v);
          }}
          options={[
            { value: "all", label: "All Centers" },
            { value: "assigned", label: "Assigned Only" },
            { value: "unassigned", label: "Unassigned" },
            ...teacherCenterOptions.map((center) => ({
              value: center._id,
              label: `${center.barangay} - ${center.name}`,
            })),
          ]}
        />
      )}
      <SelectFilter
        value={String(currentPageSize)}
        onChange={(v) => onPageSizeChange(Number(v))}
        options={PAGE_SIZE_OPTIONS.map((size) => ({
          value: String(size),
          label: `${size} per page`,
        }))}
      />
    </FilterBar>
  );
};
