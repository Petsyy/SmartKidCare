import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { archiveChild, restoreChild } from "@/src/api/teacher.api";
import { useRouter } from "expo-router";
import { useOffline } from "@/src/offline/offline-context";
import { getUserFriendlyErrorMessage, reportHandledError } from "@/src/lib/error-reporting";
import { useSnackbar } from "@/src/components/ui";

export interface ArchiveChildInput {
  reason: string;
  note?: string;
}

const affectedQueryPrefixes = [
  "teacherChildrenOverview",
  "teacherArchivedChildren",
  "teacherChildDetails",
  "teacherDashboard",
  "teacherAttendanceSetup",
  "teacherFeedingSetup",
  "parentChildrenList",
  "parentChildrenStatusOverview",
  "parentChildrenDashboard",
];

export function useArchiveChild(childId: string | null) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const { isConnected, isInternetReachable } = useOffline();

  const refreshLifecycleQueries = async () => {
    await queryClient.invalidateQueries({
      predicate: ({ queryKey }) => affectedQueryPrefixes.includes(String(queryKey[0])),
    });
  };

  return useMutation({
    mutationFn: async (input: ArchiveChildInput) => {
      if (!childId) throw new Error("Child ID is missing");
      if (!isConnected || !isInternetReachable) throw new Error("Connect to the internet to archive this child.");
      return archiveChild(childId, input);
    },
    onSuccess: async () => {
      await refreshLifecycleQueries();
      router.replace("/(teacher)/children");
      showSnackbar({
        message: "Child archived",
        actionLabel: "Undo",
        duration: 6000,
        onAction: async () => {
          try {
            if (!childId) return;
            await restoreChild(childId);
            await refreshLifecycleQueries();
            showSnackbar({ message: "Child restored" });
          } catch (error) {
            reportHandledError("child.archive.undo", error);
            Alert.alert("Undo failed", getUserFriendlyErrorMessage(error, "The child remains archived. Try restoring from Archived Children."));
          }
        },
      });
    },
    onError: (error: unknown) => {
      reportHandledError("child.archive", error);
      Alert.alert("Archive failed", getUserFriendlyErrorMessage(error, "The child could not be archived. Please try again."));
    },
  });
}

export function useRestoreChild(childId: string | null) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const { isConnected, isInternetReachable } = useOffline();

  return useMutation({
    mutationFn: async () => {
      if (!childId) throw new Error("Child ID is missing");
      if (!isConnected || !isInternetReachable) throw new Error("Connect to the internet to restore this child.");
      return restoreChild(childId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        predicate: ({ queryKey }) => affectedQueryPrefixes.includes(String(queryKey[0])),
      });
      router.replace("/(teacher)/archived-children");
      showSnackbar({ message: "Child restored" });
    },
    onError: (error: unknown) => {
      reportHandledError("child.restore", error);
      Alert.alert("Restore failed", getUserFriendlyErrorMessage(error, "The child could not be restored. Please try again."));
    },
  });
}
