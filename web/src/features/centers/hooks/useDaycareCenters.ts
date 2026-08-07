import { useState, useEffect, useMemo } from "react";
import { getDaycareCenters, type DaycareCenter } from "@/api/daycare-center.api";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function useDaycareCenters() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { data: centers = [], isLoading, error } = useQuery({
    queryKey: ["daycare-centers"],
    queryFn: getDaycareCenters,
  });

  const errorMessage = error instanceof Error ? error.message : null;

  const handleAddCenter = async (data: Partial<DaycareCenter>) => {
    const newCenter = { ...data, _id: Date.now().toString() } as DaycareCenter;
    queryClient.setQueryData<DaycareCenter[]>(["daycare-centers"], (prev = []) => [
      newCenter,
      ...prev,
    ]);
  };

  const handleUpdateCenter = async (id: string, data: Partial<DaycareCenter>) => {
    queryClient.setQueryData<DaycareCenter[]>(["daycare-centers"], (prev = []) =>
      prev.map((c) => (c._id === id ? { ...c, ...data } : c)),
    );
  };

  const filteredCenters = useMemo(() => {
    let result = centers;

    if (statusFilter !== "all") {
      const targetStatus = statusFilter === "active";
      result = result.filter((c) => (c.isActive !== false) === targetStatus);
    }

    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter((center) => {
        const name = center.name.toLowerCase();
        const barangay = center.barangay.toLowerCase();
        const code = center.code.toLowerCase();
        return (
          name.includes(query) ||
          barangay.includes(query) ||
          code.includes(query)
        );
      });
    }

    return result;
  }, [centers, search, statusFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.ceil(filteredCenters.length / itemsPerPage);
  
  const paginatedCenters = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCenters.slice(start, start + itemsPerPage);
  }, [filteredCenters, currentPage, itemsPerPage]);

  const activeCount = centers.filter(
    (center) => center.isActive !== false,
  ).length;
  const inactiveCount = centers.length - activeCount;

  return {
    centers,
    isLoading,
    error: errorMessage,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    filteredCenters,
    paginatedCenters,
    activeCount,
    inactiveCount,
    handleAddCenter,
    handleUpdateCenter
  };
}
