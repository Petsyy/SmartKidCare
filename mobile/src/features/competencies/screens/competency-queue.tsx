import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import {
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  CloudOff,
  Lock,
  Search,
  Users,
} from "lucide-react-native";
import {
  EmptyStateCard,
  ScreenHeader,
  ScreenLoadingState,
  ScreenShell,
} from "@/src/components/ui";
import { formatManilaDateLabel } from "@/src/utils/manila-date";
import { CompetencyDatePicker } from "../components/competency-date-picker";
import {
  useCompetencyQueue,
  type QueueFilter,
} from "../hooks/useCompetencyQueue";

const FILTERS: { value: QueueFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "remaining", label: "To do" },
  { value: "draft", label: "Draft" },
  { value: "completed", label: "Done" },
  { value: "locked", label: "Locked" },
];

export function CompetencyQueueScreen() {
  const router = useRouter();
  const queue = useCompetencyQueue();
  const notStarted = Math.max(
    queue.counts.total -
      queue.counts.completed -
      queue.counts.draft -
      queue.counts.locked,
    0,
  );
  const progress = queue.counts.total
    ? Math.round((queue.counts.completed / queue.counts.total) * 100)
    : 0;
  const visibleFilters = FILTERS.filter((item) => {
    if (item.value === "all" || item.value === "remaining") return true;
    if (item.value === queue.filter) return true;
    if (item.value === "draft") return queue.counts.draft > 0;
    if (item.value === "completed") return queue.counts.completed > 0;
    return queue.counts.locked > 0;
  });

  const openChild = (childId: string, locked: boolean) => {
    if (locked) return;
    const orderedIds = queue.queueIds.includes(childId)
      ? queue.queueIds
      : [childId, ...queue.queueIds];
    router.push({
      pathname: "/(teacher)/child-details/competencies/[childId]",
      params: {
        childId,
        queueMode: "true",
        period: queue.period,
        date: queue.date,
        queueIds: orderedIds.join(","),
      },
    });
  };

  return (
    <ScreenShell withKeyboardAvoiding={false}>
      <ScreenHeader
        backgroundVariant="teacherGradient"
        title="Competency Evaluation"
        subtitle={`${queue.period === "quarterly" ? "Quarterly" : "Final"} class queue`}
        onBack={() => router.replace("/(teacher)")}
      />
      {queue.isLoading ? (
        <ScreenLoadingState
          title="Loading class queue"
          message="Preparing competency progress for your class."
        />
      ) : queue.error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-base font-semibold text-red-600">
            Unable to load the competency queue.
          </Text>
          <Pressable
            onPress={() => void queue.refetch()}
            accessibilityRole="button"
            className="mt-4 min-h-12 justify-center rounded-xl bg-teal-600 px-6"
          >
            <Text className="font-bold text-white">Try Again</Text>
          </Pressable>
        </View>
      ) : (
        <View className="flex-1 bg-gray-50">
          <FlatList
            data={queue.items}
            keyExtractor={(item) => item.child._id}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: 32,
              gap: 8,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View className="pb-3 pt-3">
                {queue.isOffline ? (
                  <View className="mb-3 flex-row items-center rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                    <CloudOff size={17} color="#B45309" />
                    <Text className="ml-2 flex-1 text-sm font-semibold text-amber-800">
                      Offline data is shown. Connect to submit evaluations.
                    </Text>
                  </View>
                ) : null}

                <View className="flex-row rounded-2xl border border-gray-200 bg-white p-1">
                  {(["quarterly", "final"] as const).map((period) => (
                    <Pressable
                      key={period}
                      onPress={() => queue.setPeriod(period)}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: queue.period === period }}
                      className={`min-h-11 flex-1 items-center justify-center rounded-xl ${queue.period === period ? "bg-teal-600" : "bg-white"}`}
                    >
                      <Text
                        className={`font-bold ${queue.period === period ? "text-white" : "text-gray-600"}`}
                      >
                        {period === "quarterly" ? "Quarterly" : "Final"}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <CompetencyDatePicker
                  dateKey={queue.date}
                  dateLabel={formatManilaDateLabel(queue.date)}
                  compact
                  onDateChange={queue.setDate}
                />

                <View className="mb-3 rounded-2xl border border-teal-100 bg-white p-4">
                  <View className="flex-row items-end justify-between">
                    <View>
                      <Text className="text-xs font-bold uppercase tracking-wide text-gray-500">
                        Class progress
                      </Text>
                      <Text className="mt-1 text-2xl font-black text-gray-900">
                        {progress}%
                      </Text>
                    </View>
                    <Text className="pb-1 text-sm font-bold text-teal-700">
                      {queue.counts.completed} of {queue.counts.total} completed
                    </Text>
                  </View>
                  <View className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                    <View
                      className="h-full rounded-full bg-teal-500"
                      style={{ width: `${progress}%` }}
                    />
                  </View>
                  <View className="mt-3 flex-row">
                    <Text className="flex-1 text-xs font-semibold text-gray-600">
                      {notStarted} to do
                    </Text>
                    <Text className="flex-1 text-center text-xs font-semibold text-amber-700">
                      {queue.counts.draft} drafts
                    </Text>
                    <Text className="flex-1 text-right text-xs font-semibold text-gray-500">
                      {queue.counts.locked} locked
                    </Text>
                  </View>
                </View>

                <View className="mb-3 h-14 flex-row items-center rounded-2xl border border-gray-200 bg-white px-4 shadow-sm">
                  <Search size={25} color="#64748B" strokeWidth={2.25} />
                  <TextInput
                    value={queue.search}
                    onChangeText={queue.setSearch}
                    placeholder="Search by child name"
                    placeholderTextColor="#9CA3AF"
                    returnKeyType="search"
                    textAlignVertical="center"
                    accessibilityLabel="Search children"
                    className="ml-3 h-14 flex-1 py-0 text-lg leading-6 text-gray-900"
                  />
                </View>

                <View className="flex-row gap-2">
                  {visibleFilters.map((item) => (
                    <Pressable
                      key={item.value}
                      onPress={() => queue.setFilter(item.value)}
                      accessibilityRole="button"
                      accessibilityState={{
                        selected: queue.filter === item.value,
                      }}
                      className={`min-h-11 flex-1 items-center justify-center rounded-xl border px-2 ${queue.filter === item.value ? "border-teal-600 bg-teal-600" : "border-teal-100 bg-teal-50"}`}
                    >
                      <Text
                        numberOfLines={1}
                        className={`text-sm font-bold ${queue.filter === item.value ? "text-white" : "text-teal-800"}`}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text className="mt-4 text-sm font-bold text-gray-500">
                  {queue.items.length}{" "}
                  {queue.items.length === 1 ? "child" : "children"}
                </Text>
              </View>
            }
            ListEmptyComponent={
              <EmptyStateCard
                icon={Users}
                title="No children found"
                description="No children match the selected status and search."
              />
            }
            renderItem={({ item }) => {
              const completed = item.status === "submitted";
              const locked = item.status === "locked";
              return (
                <Pressable
                  onPress={() => openChild(item.child._id, locked)}
                  disabled={locked}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.child.firstName} ${item.child.lastName}, ${item.status}`}
                  accessibilityState={{ disabled: locked }}
                  className={`min-h-20 flex-row items-center rounded-2xl border bg-white px-4 py-3 ${locked ? "border-gray-200 opacity-70" : completed ? "border-emerald-200" : "border-gray-200"}`}
                >
                  <View
                    className={`h-10 w-10 items-center justify-center rounded-xl ${locked ? "bg-gray-100" : completed ? "bg-emerald-100" : "bg-teal-50"}`}
                  >
                    {locked ? (
                      <Lock size={20} color="#6B7280" />
                    ) : completed ? (
                      <CheckCircle2 size={22} color="#059669" />
                    ) : (
                      <ClipboardCheck size={22} color="#0D9488" />
                    )}
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-extrabold text-gray-900">
                      {item.child.firstName} {item.child.lastName}
                    </Text>
                    <Text className="mt-1 text-sm font-semibold text-gray-500">
                      {completed
                        ? "Completed"
                        : item.status === "draft"
                          ? "Draft saved"
                          : locked
                            ? "Quarterly required"
                            : "Not started"}
                    </Text>
                  </View>
                  {!locked ? (
                    <View className="ml-2 flex-row items-center">
                      <Text className="text-sm font-bold text-teal-700">
                        {completed
                          ? "View"
                          : item.status === "draft"
                            ? "Continue"
                            : "Evaluate"}
                      </Text>
                      <ChevronRight size={18} color="#0F766E" />
                    </View>
                  ) : null}
                </Pressable>
              );
            }}
          />
        </View>
      )}
    </ScreenShell>
  );
}
