import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { AlertCircle } from "lucide-react-native";
import { GradientButton, ScreenHeader, ScreenShell } from "@/src/components/ui";
import { concernCategoryLabel, concernStatusClasses, concernStatusLabel } from "../constants";
import { useConcernDetail } from "../hooks/useConcerns";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-PH", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila",
  }).format(new Date(value));

const actorName = (actor: unknown, role: string) => {
  if (actor && typeof actor === "object" && "firstName" in actor) {
    const person = actor as { firstName: string; lastName?: string };
    return `${person.firstName} ${person.lastName ?? ""}`.trim();
  }
  return role === "parent" ? "Parent" : "Barangay Captain";
};

export default function ConcernDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { query, replyMutation } = useConcernDetail(String(id ?? ""));
  const [reply, setReply] = useState("");
  const concern = query.data?.data;

  const sendReply = async () => {
    if (!reply.trim()) return;
    try {
      await replyMutation.mutateAsync(reply.trim());
      setReply("");
    } catch {
      // Inline error is rendered below.
    }
  };

  return (
    <ScreenShell edges={[]}>
      <ScreenHeader backgroundVariant="brandGradient" title="Concern Details" subtitle="Official response and resolution history" onBack={() => router.back()} />
      {query.isLoading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#0F766E" /></View>
      ) : query.error || !concern ? (
        <View className="flex-1 items-center justify-center px-6">
          <AlertCircle size={42} color="#DC2626" />
          <Text className="mt-4 text-xl font-bold text-gray-900">Could not load this concern</Text>
          <Text className="mt-2 text-center text-base text-gray-600">{query.error instanceof Error ? query.error.message : "Concern not found."}</Text>
          <Pressable onPress={() => void query.refetch()} className="mt-5 min-h-12 justify-center rounded-xl bg-teal-700 px-6"><Text className="font-bold text-white">Try again</Text></Pressable>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <View className="rounded-2xl border border-gray-200 bg-white p-5">
            <View className="flex-row items-start justify-between gap-3">
              <Text className="flex-1 text-xl font-extrabold text-gray-900">{concern.subject}</Text>
              <View className={`rounded-full px-3 py-1 ${concernStatusClasses[concern.status]}`}>
                <Text className={`text-xs font-extrabold ${concernStatusClasses[concern.status]}`}>{concernStatusLabel(concern.status)}</Text>
              </View>
            </View>
            <Text className="mt-2 font-semibold text-teal-700">{concernCategoryLabel(concern.category)}</Text>
            <Text className="mt-1 text-sm text-gray-600">For {concern.child.firstName} {concern.child.lastName}</Text>
          </View>

          <Text className="mb-3 mt-6 text-xl font-extrabold text-gray-900">Conversation</Text>
          {concern.messages.map((message) => {
            const isParent = message.senderRole === "parent";
            return (
              <View key={message._id} className={`mb-3 max-w-[88%] rounded-2xl p-4 ${isParent ? "self-end bg-teal-700" : "self-start border border-gray-200 bg-white"}`}>
                <Text className={`text-xs font-bold ${isParent ? "text-teal-100" : "text-teal-700"}`}>{actorName(message.sender, message.senderRole)}</Text>
                <Text className={`mt-1 text-base leading-6 ${isParent ? "text-white" : "text-gray-800"}`}>{message.body}</Text>
                <Text className={`mt-2 text-xs ${isParent ? "text-teal-100" : "text-gray-500"}`}>{formatDate(message.createdAt)}</Text>
              </View>
            );
          })}

          <Text className="mb-3 mt-4 text-xl font-extrabold text-gray-900">Status history</Text>
          <View className="rounded-2xl border border-gray-200 bg-white p-4">
            {concern.statusHistory.map((item, index) => (
              <View key={item._id} className={index < concern.statusHistory.length - 1 ? "mb-4 border-b border-gray-100 pb-4" : ""}>
                <Text className="font-bold text-gray-900">{concernStatusLabel(item.newStatus)}</Text>
                <Text className="mt-1 text-sm text-gray-600">By {actorName(item.changedBy, item.changedByRole)} · {formatDate(item.changedAt)}</Text>
                {item.note ? <Text className="mt-2 text-sm leading-5 text-gray-700">{item.note}</Text> : null}
              </View>
            ))}
          </View>

          {concern.status === "closed" ? (
            <View className="mt-5 rounded-xl bg-gray-100 p-4"><Text className="text-center font-semibold text-gray-700">This concern is closed and read-only. Submit a new concern if you need more assistance.</Text></View>
          ) : (
            <View className="mt-6">
              <Text className="text-sm font-bold text-gray-700">Follow-up message</Text>
              <TextInput
                value={reply}
                onChangeText={setReply}
                maxLength={2000}
                multiline
                textAlignVertical="top"
                placeholder="Write a follow-up message"
                className="mt-2 min-h-28 rounded-xl border border-gray-300 bg-white p-4 text-base text-gray-900"
                accessibilityLabel="Follow-up message"
              />
              {replyMutation.error ? <Text className="mt-2 text-sm text-red-600">{replyMutation.error instanceof Error ? replyMutation.error.message : "Unable to send reply."}</Text> : null}
              <GradientButton label="Send reply" loadingLabel="Sending..." loading={replyMutation.isPending} disabled={!reply.trim()} onPress={() => void sendReply()} className="mt-3" />
            </View>
          )}
        </ScrollView>
      )}
    </ScreenShell>
  );
}
