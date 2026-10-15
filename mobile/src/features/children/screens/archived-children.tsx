import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Archive, ChevronRight, RefreshCw } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { getChildren } from "@/src/api/teacher.api";
import type { Child } from "@/src/api/api.types";
import { mobileQueryKeys } from "@/src/lib/query-keys";
import { ScreenHeader, ScreenLoadingState, ScreenShell, SearchBar } from "@/src/components/ui";
import { useOffline } from "@/src/offline/offline-context";
import { useSafeBack } from "@/src/hooks/use-safe-back";

export default function ArchivedChildrenScreen() {
  const router = useRouter();
  const handleBack = useSafeBack("/(teacher)/children");
  const { isConnected, isInternetReachable } = useOffline();
  const isOffline = !isConnected || !isInternetReachable;
  const [search, setSearch] = useState("");
  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: mobileQueryKeys.teacherArchivedChildren(),
    queryFn: () => getChildren("Inactive"),
    enabled: !isOffline,
  });

  const children = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...data]
      .sort((a, b) => new Date(b.archivedAt || b.updatedAt || 0).getTime() - new Date(a.archivedAt || a.updatedAt || 0).getTime())
      .filter((child) => !query || `${child.firstName} ${child.middleName || ""} ${child.lastName} ${child.studentId || ""}`.toLowerCase().includes(query));
  }, [data, search]);

  return (
    <ScreenShell edges={[]} withKeyboardAvoiding={false}>
      <ScreenHeader title="Archived Children" subtitle="Historical child records" backgroundVariant="teacherGradient" onBack={handleBack} />
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search by name or student ID" containerClassName="bg-gray-50 px-5 py-4" />
      {isOffline ? (
        <View className="mx-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Text className="font-bold text-amber-900">Connection required</Text>
          <Text className="mt-1 text-sm text-amber-700">Connect to view or restore archived children.</Text>
        </View>
      ) : isLoading ? (
        <ScreenLoadingState title="Loading archived children" message="Getting historical child records ready." />
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-xl font-bold text-gray-900">Couldn’t load archived children</Text>
          <Text className="mt-2 text-center text-gray-500">Check your connection and try again.</Text>
          <Pressable accessibilityRole="button" onPress={() => refetch()} className="mt-5 min-h-12 flex-row items-center rounded-xl bg-teal-600 px-5">
            <RefreshCw size={18} color="white" /><Text className="ml-2 font-bold text-white">Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={children}
          keyExtractor={(item) => item._id}
          contentContainerClassName="px-5 pb-8"
          ListEmptyComponent={
            <View className="items-center py-20">
              <View className="h-20 w-20 items-center justify-center rounded-3xl bg-teal-50"><Archive size={38} color="#0D9488" /></View>
              <Text className="mt-5 text-xl font-bold text-gray-900">{search ? "No matches found" : "No archived children"}</Text>
              <Text className="mt-2 text-center text-gray-500">{search ? "Try a different name or student ID." : "Children you archive will appear here."}</Text>
            </View>
          }
          renderItem={({ item }: { item: Child }) => {
            const name = [item.firstName, item.middleName, item.lastName].filter(Boolean).join(" ");
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`View archived child ${name}`}
                onPress={() => router.push(`/(teacher)/child-details/${item._id}`)}
                className="mb-3 min-h-24 flex-row items-center rounded-2xl border border-gray-200 bg-white p-4 active:opacity-85"
              >
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-amber-50"><Archive size={23} color="#B45309" /></View>
                <View className="ml-3 flex-1">
                  <Text className="text-lg font-bold text-gray-900">{name}</Text>
                  <Text className="mt-0.5 text-sm text-gray-500">{item.studentId || "No student ID"}</Text>
                  <Text className="mt-1 text-sm font-medium text-amber-700">{item.archiveReason || "Reason unavailable"} · {item.archivedAt ? new Date(item.archivedAt).toLocaleDateString("en-PH") : "Date unavailable"}</Text>
                </View>
                <ChevronRight size={20} color="#9CA3AF" />
              </Pressable>
            );
          }}
        />
      )}
    </ScreenShell>
  );
}
