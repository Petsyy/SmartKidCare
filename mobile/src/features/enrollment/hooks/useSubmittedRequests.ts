import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyEnrollmentRequests, type TeacherEnrollmentRequest } from "@/src/api/teacher.api";
import { buildRequestChildName } from "@/src/features/enrollment/utils";
import { mobileQueryKeys } from "@/src/lib/query-keys";
import { useSubmittedRequestsUiStore } from "@/src/features/enrollment/stores/submitted-requests-ui.store";

export const useSubmittedRequests = (token: string | null) => {
  const {
    submittedStatusFilter,
    submittedSearchQuery,
    setSubmittedStatusFilter,
    setSubmittedSearchQuery,
  } = useSubmittedRequestsUiStore();

  const {
    data: submittedRequests = [],
    isLoading: loadingSubmitted,
    refetch: refreshSubmitted,
  } = useQuery({
    queryKey: mobileQueryKeys.submittedRequests(token),
    queryFn: async () => {
      if (!token) return [];
      const data = await getMyEnrollmentRequests(token);
      // Filter out approved requests (once admin approval is done)
      return data.filter((request) => request.status !== "approved");
    },
    enabled: !!token,
  });

  const submittedSummary = useMemo(() => {
    const pending = submittedRequests.filter((item) => item.status === "pending").length;
    const rejected = submittedRequests.filter((item) => item.status === "rejected").length;
    return {
      all: submittedRequests.length,
      pending,
      rejected,
    };
  }, [submittedRequests]);

  const filteredSubmittedRequests = useMemo(() => {
    const query = submittedSearchQuery.trim().toLowerCase();
    return submittedRequests.filter((request) => {
      if (submittedStatusFilter !== "all" && request.status !== submittedStatusFilter) {
        return false;
      }

      if (!query) return true;
      const childName = buildRequestChildName(request).toLowerCase();
      const parentName = `${request.parent.firstName} ${request.parent.lastName}`.toLowerCase();
      return childName.includes(query) || parentName.includes(query);
    });
  }, [submittedRequests, submittedStatusFilter, submittedSearchQuery]);

  return {
    submittedRequests,
    loadingSubmitted,
    submittedStatusFilter,
    setSubmittedStatusFilter,
    submittedSearchQuery,
    setSubmittedSearchQuery,
    refreshSubmitted,
    submittedSummary,
    filteredSubmittedRequests,
  };
};
