import { useEffect, useState } from "react";
import { Text, View, useWindowDimensions } from "react-native";
import { NewEnrollmentForm } from "@/src/features/enrollment/components/sections/new-enrollment-form";
import { useNavigation, useRouter } from "expo-router";
import {
  ScreenShell,
  ScreenHeader,
  OfflineFeatureBanner,
} from "@/src/components/ui";
import { useAuth } from "@/src/hooks/use-auth";
import { useOffline } from "@/src/offline/offline-context";
import { readOfflineResource } from "@/src/offline/offline-read";
import { useQuery } from "@tanstack/react-query";

export default function EnrollChildScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const contentMaxWidth = isWide ? 860 : undefined;
  const contentPadding = isWide ? 28 : 16;

  const [hasStarted, setHasStarted] = useState(false);
  const { user } = useAuth();
  const { isConnected, isInternetReachable, lastCompleteRecordSyncAt } =
    useOffline();
  const isOffline = !isConnected || !isInternetReachable;
  const { data: offlineReference } = useQuery({
    queryKey: ["offline", "enrollment-reference", user?.id],
    enabled: isOffline && Boolean(user?.id),
    networkMode: "always",
    queryFn: async () => {
      if (!user?.id) return null;
      return (
        (
          await readOfflineResource<{
            childCount: number;
            daycareCenter?: { name?: string };
          }>(user.id, "enrollmentReference")
        )[0] ?? null
      );
    },
  });

  useEffect(() => {
    (navigation as any).setParams({ hideTabBar: hasStarted });
  }, [hasStarted, navigation]);

  function handleSubmitSuccess() {
    setHasStarted(false);
    router.replace("/(teacher)/children");
  }

  return (
    <ScreenShell edges={hasStarted ? ["bottom"] : []}>
      <ScreenHeader
        backgroundVariant="teacherGradient"
        title="Child Enrollment"
        subtitle="Directly enroll a new child"
      />

      {isOffline ? (
        <View className="flex-1 bg-gray-50 px-5 pt-6">
          <OfflineFeatureBanner
            title="Enrollment is read-only offline"
            description="Connect to the internet to enroll a child or upload documents."
            className="mb-4"
          />
          <View className="rounded-3xl border border-gray-200 bg-white p-5">
            <Text className="text-base font-bold text-gray-900">
              Downloaded enrollment context
            </Text>
            <Text className="mt-3 text-sm text-gray-600">
              Enrolled children: {offlineReference?.childCount ?? 0}
            </Text>
            <Text className="mt-2 text-sm text-gray-600">
              Center: {offlineReference?.daycareCenter?.name ?? "Not available"}
            </Text>
            <Text className="mt-2 text-xs text-gray-500">
              Last synchronized{" "}
              {lastCompleteRecordSyncAt
                ? new Date(lastCompleteRecordSyncAt).toLocaleString()
                : "not available"}
            </Text>
          </View>
        </View>
      ) : (
        <NewEnrollmentForm
          hasStarted={hasStarted}
          setHasStarted={setHasStarted}
          onSubmissionSuccess={handleSubmitSuccess}
          contentPadding={contentPadding}
          contentMaxWidth={contentMaxWidth}
          isWide={isWide}
        />
      )}
    </ScreenShell>
  );
}
