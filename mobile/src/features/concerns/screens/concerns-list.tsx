import { useRouter } from "expo-router";
import { AlertCircle, MessageSquarePlus, MessagesSquare } from "lucide-react-native";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { ScreenHeader, ScreenShell } from "@/src/components/ui";
import { concernCategoryLabel, concernStatusClasses, concernStatusLabel } from "../constants";
import { useConcernList } from "../hooks/useConcerns";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  }).format(new Date(value));

export default function ConcernsListScreen() {
  const router = useRouter();
  const { data, isLoading, isRefetching, error, refetch, page, setPage } = useConcernList();
  const concerns = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <ScreenShell edges={[]} withKeyboardAvoiding={false}>
      <ScreenHeader
        backgroundVariant="brandGradient"
        title="Concerns & Feedback"
        subtitle="Track messages handled by the barangay captain"
        onBack={() => router.back()}
        rightAction={
          <Pressable
            onPress={() => router.push("/(parent)/concerns/new")}
            accessibilityRole="button"
            accessibilityLabel="Submit a new concern"
            className="h-11 w-11 items-center justify-center rounded-full bg-white/20 active:bg-white/30"
          >
            <MessageSquarePlus size={23} color="#FFFFFF" />
          </Pressable>
        }
      />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0F766E" />
          <Text className="mt-3 text-base text-gray-600">Loading concerns...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <AlertCircle size={42} color="#DC2626" />
          <Text className="mt-4 text-xl font-bold text-gray-900">Could not load concerns</Text>
          <Text className="mt-2 text-center text-base text-gray-600">
            {error instanceof Error ? error.message : "Check your connection and try again."}
          </Text>
          <Pressable
            onPress={() => void refetch()}
            className="mt-5 min-h-12 justify-center rounded-xl bg-teal-700 px-6"
            accessibilityRole="button"
            accessibilityLabel="Retry loading concerns"
          >
            <Text className="font-bold text-white">Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={concerns}
          keyExtractor={(item) => item._id}
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          contentContainerStyle={{ padding: 20, paddingBottom: 36, flexGrow: 1 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-5">
              <View className="h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">
                <MessagesSquare size={30} color="#0F766E" />
              </View>
              <Text className="mt-4 text-xl font-bold text-gray-900">No concerns yet</Text>
              <Text className="mt-2 text-center text-base leading-6 text-gray-600">
                Submit a concern or feedback when you need an official response from the captain.
              </Text>
              <Pressable
                onPress={() => router.push("/(parent)/concerns/new")}
                className="mt-5 min-h-12 justify-center rounded-xl bg-teal-700 px-6"
                accessibilityRole="button"
                accessibilityLabel="Submit your first concern"
              >
                <Text className="font-bold text-white">Submit concern</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/(parent)/concerns/${item._id}`)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.subject}, status ${concernStatusLabel(item.status)}`}
              className="mb-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm active:bg-gray-50"
            >
              <View className="flex-row items-start justify-between gap-3">
                <Text className="flex-1 text-lg font-extrabold text-gray-900" numberOfLines={2}>
                  {item.subject}
                </Text>
                <View className={`rounded-full px-3 py-1 ${concernStatusClasses[item.status]}`}>
                  <Text className={`text-xs font-extrabold ${concernStatusClasses[item.status]}`}>
                    {concernStatusLabel(item.status)}
                  </Text>
                </View>
              </View>
              <Text className="mt-2 text-sm font-semibold text-teal-700">
                {concernCategoryLabel(item.category)}
              </Text>
              <Text className="mt-1 text-sm text-gray-600">
                {item.child.firstName} {item.child.lastName}
              </Text>
              <Text className="mt-3 text-xs text-gray-500">Updated {formatDate(item.lastActivityAt)}</Text>
            </Pressable>
          )}
          ListFooterComponent={
            pagination && pagination.totalPages > 1 ? (
              <View className="mt-3 flex-row items-center justify-between">
                <Pressable
                  disabled={page <= 1}
                  onPress={() => setPage((current) => Math.max(1, current - 1))}
                  className="min-h-11 justify-center rounded-xl border border-gray-300 bg-white px-4 disabled:opacity-40"
                >
                  <Text className="font-bold text-gray-700">Previous</Text>
                </Pressable>
                <Text className="text-sm font-semibold text-gray-600">
                  Page {page} of {pagination.totalPages}
                </Text>
                <Pressable
                  disabled={page >= pagination.totalPages}
                  onPress={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
                  className="min-h-11 justify-center rounded-xl border border-gray-300 bg-white px-4 disabled:opacity-40"
                >
                  <Text className="font-bold text-gray-700">Next</Text>
                </Pressable>
              </View>
            ) : null
          }
        />
      )}
    </ScreenShell>
  );
}
