import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { updateChildStatus } from "@/src/api/teacher.api";
import { mobileQueryKeys } from "@/src/lib/query-keys";
import { useRouter } from "expo-router";

type ChildStatus = "Active" | "Inactive";

const statusFeedback: Record<
  ChildStatus,
  { title: string; message: string; errorTitle: string }
> = {
  Active: {
    title: "Child Unarchived",
    message: "The child has been restored to the active children list.",
    errorTitle: "Unarchive Failed",
  },
  Inactive: {
    title: "Child Archived",
    message: "The child has been moved to inactive status.",
    errorTitle: "Archive Failed",
  },
};

function useChildStatusMutation(
  childId: string | null,
  nextStatus: ChildStatus,
) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const feedback = statusFeedback[nextStatus];

  return useMutation({
    mutationFn: async () => {
      if (!childId) throw new Error("Child ID is missing");
      return updateChildStatus(childId, nextStatus);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: mobileQueryKeys.teacherChildrenOverview(),
      });
      void queryClient.invalidateQueries({
        queryKey: mobileQueryKeys.teacherChildDetails(childId),
      });
      Alert.alert(feedback.title, feedback.message);
      router.push("/(teacher)/children");
    },
    onError: (error: Error) => {
      Alert.alert(
        feedback.errorTitle,
        error.message || "Something went wrong.",
      );
    },
  });
}

export function useArchiveChild(childId: string | null) {
  return useChildStatusMutation(childId, "Inactive");
}

export function useRestoreChild(childId: string | null) {
  return useChildStatusMutation(childId, "Active");
}
