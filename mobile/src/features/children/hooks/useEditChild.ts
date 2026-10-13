import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { updateChild } from "@/src/api/teacher.api";
import { mobileQueryKeys } from "@/src/lib/query-keys";
import type { Child } from "@/src/api/api.types";
import type { EditChildFormValues } from "../validations/edit-child-validation";
import { useOffline } from "@/src/offline/offline-context";
import {
  getUserFriendlyErrorMessage,
  reportHandledError,
} from "@/src/lib/error-reporting";

export function useEditChild(childId: string | null) {
  const queryClient = useQueryClient();
  const { isConnected, isInternetReachable } = useOffline();

  return useMutation({
    mutationFn: async (data: EditChildFormValues) => {
      if (!childId) throw new Error("Child ID is missing");
      if (!isConnected || !isInternetReachable)
        throw new Error("Connect to the internet to update child information.");
      return updateChild(childId, data);
    },
    onSuccess: (updatedChild: Child) => {
      // Invalidate both the details page and the overview list
      void queryClient.invalidateQueries({
        queryKey: mobileQueryKeys.teacherChildDetails(childId),
      });
      void queryClient.invalidateQueries({
        queryKey: mobileQueryKeys.teacherChildEdit(childId),
      });
      void queryClient.invalidateQueries({
        queryKey: mobileQueryKeys.teacherChildrenOverview(),
      });
      Alert.alert("Success", "Child profile updated successfully.");
    },
    onError: (error: unknown) => {
      reportHandledError("child.update", error);
      Alert.alert(
        "Update Failed",
        getUserFriendlyErrorMessage(
          error,
          "The child profile could not be updated. Please try again.",
        ),
      );
    },
  });
}
