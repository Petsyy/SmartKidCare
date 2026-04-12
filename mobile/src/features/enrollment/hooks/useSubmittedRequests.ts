import { useState, useCallback, useEffect, useMemo } from "react";
import { Alert } from "react-native";
import { getMyEnrollmentRequests, type TeacherEnrollmentRequest } from "@/src/api/teacher.api";
import { buildRequestChildName } from "@/src/features/enrollment/utils";

export const useSubmittedRequests = (token: string | null) => {
  const [submittedRequests, setSubmittedRequests] = useState<TeacherEnrollmentRequest[]>([]);
  const [loadingSubmitted, setLoadingSubmitted] = useState(false);
  const [submittedStatusFilter, setSubmittedStatusFilter] = useState<"all" | "pending" | "rejected">("all");
  const [submittedSearchQuery, setSubmittedSearchQuery] = useState("");

  const refreshSubmitted = useCallback(async () => {
    if (!token) return;
    setLoadingSubmitted(true);
    try {
      const data = await getMyEnrollmentRequests(token);
      // Filter out approved requests (once admin approval is done)
      setSubmittedRequests(data.filter((request) => request.status !== "approved"));
    } catch (error: any) {
      Alert.alert("Load Error", error?.message || "Failed to load submitted requests.");
    } finally {
      setLoadingSubmitted(false);
    }
  }, [token]);

  // Load on component mount
  useEffect(() => {
    void refreshSubmitted();
  }, [refreshSubmitted]);

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
    setSubmittedRequests,
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
