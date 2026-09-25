import { useState, useMemo } from "react";
import type { Child } from "@/types/child";

type UseChildrenFiltersProps = {
  childrenList: Child[];
};

export function useChildrenFilters({ childrenList }: UseChildrenFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignmentFilter, setAssignmentFilter] = useState("all");

  const [schoolYearFilter, setSchoolYearFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const filteredChildren = useMemo(() => {
    if (!searchTerm) return childrenList;
    const lowerSearch = searchTerm.toLowerCase();
    return childrenList.filter((child) => {
      const childName = `${child.firstName} ${child.lastName}`.toLowerCase();
      const parentName = child.parent
        ? `${child.parent.firstName} ${child.parent.lastName}`.toLowerCase()
        : "";
      return childName.includes(lowerSearch) || parentName.includes(lowerSearch);
    });
  }, [childrenList, searchTerm]);



  const schoolYearOptions = useMemo(() => {
    const years = new Set<string>();
    childrenList.forEach((child) => {
      if (child.schoolYear) years.add(child.schoolYear);
    });
    return Array.from(years).sort().reverse();
  }, [childrenList]);

  const filteredByControls = useMemo(() => {
    return filteredChildren.filter((child) => {
      if (statusFilter !== "all" && child.status !== statusFilter) {
        return false;
      }
      if (assignmentFilter !== "all") {
        const hasTeacher = Boolean(child.teacher);
        if (assignmentFilter === "assigned" && !hasTeacher) return false;
        if (assignmentFilter === "unassigned" && hasTeacher) return false;
      }

      if (schoolYearFilter !== "all" && child.schoolYear !== schoolYearFilter) {
        return false;
      }
      return true;
    });
  }, [
    assignmentFilter,

    filteredChildren,
    schoolYearFilter,
    statusFilter,
  ]);

  const total = filteredByControls.length;
  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
  const safePage = totalPages > 0 ? Math.min(page, totalPages) : page;
  const start = total === 0 ? 0 : (safePage - 1) * limit + 1;
  const end = total === 0 ? 0 : Math.min(safePage * limit, total);
  const rangeLabel = `${start}-${end} of ${total}`;

  const pagedChildren = useMemo(() => {
    const sliceStart = (safePage - 1) * limit;
    return filteredByControls.slice(sliceStart, sliceStart + limit);
  }, [filteredByControls, limit, safePage]);

  const hasActiveFilters =
    statusFilter !== "all" ||
    assignmentFilter !== "all" ||
    schoolYearFilter !== "all";

  const clearFilters = () => {
    setStatusFilter("all");
    setAssignmentFilter("all");
    setSchoolYearFilter("all");
    setPage(1);
  };

  const stats = useMemo(() => {
    const totalChildren = childrenList.length;
    const active = childrenList.filter((child) => child.status === "Active").length;
    const inactive = childrenList.filter(
      (child) => child.status === "Inactive",
    ).length;
    const unassigned = childrenList.filter((child) => !child.teacher).length;
    return { totalChildren, active, inactive, unassigned };
  }, [childrenList]);

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    assignmentFilter,
    setAssignmentFilter,

    schoolYearFilter,
    setSchoolYearFilter,
    page: safePage,
    setPage,
    limit,
    setLimit,

    schoolYearOptions,
    total,
    totalPages,
    rangeLabel,
    pagedChildren,
    hasActiveFilters,
    clearFilters,
    stats,
  };
}
