import { useState } from "react";
import { Alert, ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import type { ConcernCategory } from "@/src/api/api.types";
import { GradientButton, ScreenHeader, ScreenShell } from "@/src/components/ui";
import { CONCERN_CATEGORY_OPTIONS } from "../constants";
import { useCreateConcern } from "../hooks/useConcerns";

export default function CreateConcernScreen() {
  const router = useRouter();
  const { childrenQuery, mutation } = useCreateConcern();
  const children = childrenQuery.data ?? [];
  const [childId, setChildId] = useState("");
  const [category, setCategory] = useState<ConcernCategory>("feedback_suggestion");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const effectiveChildId = childId || (children.length === 1 ? children[0]._id : "");

  const subjectError = submitted && subject.trim().length < 5 ? "Subject must be at least 5 characters." : null;
  const messageError = submitted && message.trim().length < 1 ? "Message is required." : null;
  const childError = submitted && !effectiveChildId ? "Select the child related to this concern." : null;

  const submit = async () => {
    setSubmitted(true);
    if (!effectiveChildId || subject.trim().length < 5 || !message.trim()) return;
    try {
      const response = await mutation.mutateAsync({ childId: effectiveChildId, category, subject: subject.trim(), message: message.trim() });
      Alert.alert("Concern submitted", "Your concern is now available to the barangay captain.", [
        { text: "View concern", onPress: () => router.replace(`/(parent)/concerns/${response.data._id}`) },
      ]);
    } catch {
      // Inline mutation error is rendered below.
    }
  };

  return (
    <ScreenShell edges={[]}>
      <ScreenHeader
        backgroundVariant="brandGradient"
        title="Submit Concern"
        subtitle="Send an official message to the barangay captain"
        onBack={() => router.back()}
      />
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {childrenQuery.isLoading ? (
          <View className="items-center py-10"><ActivityIndicator color="#0F766E" /></View>
        ) : childrenQuery.error ? (
          <View className="rounded-xl border border-red-200 bg-red-50 p-4">
            <Text className="font-bold text-red-700">Could not load your children.</Text>
            <Pressable onPress={() => void childrenQuery.refetch()} className="mt-3 min-h-11 justify-center">
              <Text className="font-bold text-teal-700">Try again</Text>
            </Pressable>
          </View>
        ) : children.length === 0 ? (
          <View className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <Text className="font-bold text-amber-800">No linked child is available for a concern.</Text>
          </View>
        ) : (
          <>
            <Text className="text-sm font-bold text-gray-700">Related child</Text>
            <View className="mt-2 gap-2">
              {children.map((child) => (
                <Pressable
                  key={child._id}
                  onPress={() => setChildId(child._id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: effectiveChildId === child._id }}
                  className={`min-h-12 justify-center rounded-xl border px-4 ${effectiveChildId === child._id ? "border-teal-600 bg-teal-50" : "border-gray-200 bg-white"}`}
                >
                  <Text className="font-bold text-gray-900">{child.firstName} {child.lastName}</Text>
                </Pressable>
              ))}
            </View>
            {childError ? <Text className="mt-1 text-sm text-red-500">{childError}</Text> : null}

            <Text className="mt-5 text-sm font-bold text-gray-700">Category</Text>
            <View className="mt-2 flex-row flex-wrap gap-2">
              {CONCERN_CATEGORY_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setCategory(option.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: category === option.value }}
                  className={`min-h-11 justify-center rounded-full border px-4 ${category === option.value ? "border-teal-600 bg-teal-600" : "border-gray-300 bg-white"}`}
                >
                  <Text className={`font-semibold ${category === option.value ? "text-white" : "text-gray-700"}`}>{option.label}</Text>
                </Pressable>
              ))}
            </View>

            <Text className="mt-5 text-sm font-bold text-gray-700">Subject</Text>
            <TextInput
              value={subject}
              onChangeText={setSubject}
              maxLength={120}
              placeholder="Briefly describe the concern"
              className="mt-2 min-h-12 rounded-xl border border-gray-300 bg-white px-4 text-base text-gray-900"
              accessibilityLabel="Concern subject"
              returnKeyType="next"
            />
            {subjectError ? <Text className="mt-1 text-sm text-red-500">{subjectError}</Text> : null}

            <Text className="mt-5 text-sm font-bold text-gray-700">Message</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              maxLength={2000}
              multiline
              textAlignVertical="top"
              placeholder="Explain what happened and what assistance you need"
              className="mt-2 min-h-40 rounded-xl border border-gray-300 bg-white p-4 text-base leading-6 text-gray-900"
              accessibilityLabel="Concern message"
            />
            {messageError ? <Text className="mt-1 text-sm text-red-500">{messageError}</Text> : null}
            <Text className="mt-1 text-right text-xs text-gray-500">{message.length}/2000</Text>

            {mutation.error ? (
              <Text className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {mutation.error instanceof Error ? mutation.error.message : "Unable to submit concern."}
              </Text>
            ) : null}

            <GradientButton
              label="Submit concern"
              loadingLabel="Submitting..."
              loading={mutation.isPending}
              disabled={children.length === 0}
              onPress={() => void submit()}
              className="mt-6"
            />
          </>
        )}
      </ScrollView>
    </ScreenShell>
  );
}
