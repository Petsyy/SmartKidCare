import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Icons from "lucide-react-native";
import { useAuth } from "@/src/hooks/use-auth";
import { sendAIChat } from "@/src/api/ai.api";
import { getAttendanceHistory, getFeedingHistory } from "@/src/api/records.api";
import {
  extractAIRiskLevel,
  getAIRiskBadgeStyle,
  removeAIRiskLevelLine,
} from "@/src/components/ai/ai-chat";

const SUGGESTIONS = [
  "Was my child present today?",
  "How many absences did my child have last week?",
  "What did my child eat this week?",
  "Summarize my child's attendance and feeding last week.",
];

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function ParentChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [contextLoading, setContextLoading] = useState(true);
  const [childId, setChildId] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [messages, scrollToEnd]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!token) {
        setContextLoading(false);
        return;
      }
      setContextLoading(true);
      try {
        const [attList, feedList] = await Promise.all([
          getAttendanceHistory(token),
          getFeedingHistory(token),
        ]);

        if (cancelled) return;

        const deriveChildId = (): string | null => {
          const firstAttChild =
            attList
              .flatMap((entry: any) => entry.records ?? [])
              .map((r: any) =>
                typeof r.child === "object" ? r.child?._id : r.child,
              )
              .find(Boolean) ?? null;
          if (firstAttChild) return String(firstAttChild);

          const firstFeedChild =
            feedList
              .flatMap((entry: any) => entry.records ?? [])
              .map((r: any) =>
                typeof r.child === "object" ? r.child?._id : r.child,
              )
              .find(Boolean) ?? null;
          return firstFeedChild ? String(firstFeedChild) : null;
        };

        setChildId(deriveChildId());
      } catch {
        if (!cancelled) {
          setChildId(null);
        }
      } finally {
        if (!cancelled) setContextLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || !token || loading || !childId) return;

    setInput("");
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const assistantId = `assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "" },
    ]);

    try {
      const reply = await sendAIChat(token, {
        role: "parent",
        message: text,
        childId,
      });

      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: reply } : m)),
      );
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content:
                  err?.message ?? "Something went wrong. Please try again.",
              }
            : m,
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [input, loading, token, childId]);

  const onSuggestionPress = (text: string) => {
    setInput(text);
  };

  const renderAssistantContent = (text: string) => {
    const lines = text.split(/\r?\n/);
    return (
      <View className="gap-1">
        {lines.map((line, index) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <View key={`spacer-${index}`} style={{ height: 8 }} />;
          }

          const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/);
          if (bulletMatch?.[1]) {
            return (
              <View
                key={`bullet-${index}`}
                className="flex-row items-start gap-2"
              >
                <Text className="text-[15px] text-gray-800" style={{ lineHeight: 22 }}>
                  •
                </Text>
                <Text className="flex-1 text-[15px] text-gray-800" style={{ lineHeight: 22 }}>
                  {bulletMatch[1]}
                </Text>
              </View>
            );
          }

          const isSection = /^(Suggested Actions|Follow-up):/i.test(trimmed);
          return (
            <Text
              key={`line-${index}`}
              className={`text-[15px] text-gray-800 ${isSection ? "mt-1 font-semibold" : ""}`}
              style={{ lineHeight: 22 }}
            >
              {trimmed}
            </Text>
          );
        })}
      </View>
    );
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    const isLoading = item.role === "assistant" && !item.content && loading;
    const riskLevel =
      !isUser && !isLoading ? extractAIRiskLevel(item.content) : null;
    const displayContent = riskLevel
      ? removeAIRiskLevelLine(item.content)
      : item.content;
    const riskBadgeStyle = riskLevel ? getAIRiskBadgeStyle(riskLevel) : null;

    return (
      <View
        className={`mb-5 flex-row ${isUser ? "justify-end pl-10" : "justify-start pr-10"}`}
      >
        {!isUser && (
          <View
            className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-teal-100"
            style={{
              shadowColor: "#0D9488",
              shadowOpacity: 0.2,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 1 },
              elevation: 2,
            }}
          >
            <Icons.Bot size={18} color="#0D9488" />
          </View>
        )}
        <View
          className={`max-w-[80%] rounded-2xl px-4 py-3.5 ${
            isUser
              ? "rounded-br-sm bg-teal-600"
              : "rounded-bl-sm border border-gray-100 bg-white"
          }`}
          style={
            isUser
              ? {
                  shadowColor: "#0D9488",
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 4,
                }
              : {
                  shadowColor: "#000",
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                }
          }
        >
          {isLoading ? (
            <View className="flex-row items-center gap-2.5 py-0.5">
              <ActivityIndicator size="small" color="#14B8A6" />
              <Text className="text-sm font-medium text-gray-500">
                Thinking…
              </Text>
            </View>
          ) : (
            <>
              {!isUser && riskBadgeStyle && (
                <View
                  className="mb-2.5 self-start rounded-full border px-3 py-1"
                  style={{
                    borderColor: riskBadgeStyle.borderColor,
                    backgroundColor: riskBadgeStyle.backgroundColor,
                  }}
                >
                  <View className="flex-row items-center gap-1.5">
                    <View
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: riskBadgeStyle.dotColor }}
                    />
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: riskBadgeStyle.textColor }}
                    >
                      {riskBadgeStyle.label}
                    </Text>
                  </View>
                </View>
              )}
              {isUser ? (
                <Text
                  className="text-[15px] text-white"
                  style={{ lineHeight: 22 }}
                  selectable
                >
                  {displayContent}
                </Text>
              ) : (
                <View>{renderAssistantContent(displayContent)}</View>
              )}
            </>
          )}
        </View>
        {isUser && (
          <View
            className="ml-3 h-9 w-9 items-center justify-center rounded-full bg-teal-600"
            style={{
              shadowColor: "#0D9488",
              shadowOpacity: 0.3,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 1 },
              elevation: 2,
            }}
          >
            <Icons.User size={18} color="white" />
          </View>
        )}
      </View>
    );
  };

  const listHeader = (
    <View className="px-1 pt-1 pb-6">
      <View
        className="flex-row items-center gap-4 rounded-3xl border border-teal-100 bg-white p-5"
        style={{
          shadowColor: "#0D9488",
          shadowOpacity: 0.08,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 4 },
          elevation: 3,
        }}
      >
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-teal-500">
          <Icons.Bot size={26} color="white" />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900">
            Smart KidCare Assistant
          </Text>
          <Text className="mt-0.5 text-sm text-gray-500">
            Ask about your child's attendance and feeding.
          </Text>
        </View>
        {contextLoading && <ActivityIndicator size="small" color="#14B8A6" />}
      </View>
    </View>
  );

  const listEmpty = (
    <View className="flex-1 items-center px-2 pt-8">
      <View className="h-20 w-20 items-center justify-center rounded-full bg-gray-100">
        <Icons.MessageCircle size={40} color="#9CA3AF" />
      </View>
      <Text className="mt-5 text-center text-base font-semibold text-gray-700">
        How can I help?
      </Text>
      <Text className="mt-2 max-w-[260px] text-center text-sm text-gray-500">
        Ask about your child's records or tap a suggestion below.
      </Text>
      <View className="mt-6 w-full max-w-[320px] gap-3">
        {SUGGESTIONS.map((s) => (
          <Pressable
            key={s}
            onPress={() => onSuggestionPress(s)}
            className="rounded-2xl border border-gray-200 bg-white px-4 py-3.5 active:opacity-80"
            style={{
              shadowColor: "#000",
              shadowOpacity: 0.04,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            <Text
              className="text-center text-sm font-medium text-gray-700"
              numberOfLines={2}
            >
              {s}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0D9488"
        translucent={false}
      />
      <View className="flex-1">
        {/* Header */}
        <View className="bg-teal-600 border-b border-teal-700/30">
          <View className="flex-row items-center px-4 pt-4 pb-5">
            <Pressable
              onPress={() => router.back()}
              className="mr-3 h-10 w-10 items-center justify-center rounded-full active:bg-white/20"
              hitSlop={10}
            >
              <Icons.ChevronLeft size={26} color="white" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-[22px] font-semibold text-white">
                AI Assistant
              </Text>
              <Text className="mt-0.5 text-[14px] text-teal-100">
                Based on your child's attendance & feeding
              </Text>
            </View>
          </View>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={messages.length === 0 ? listHeader : null}
          ListEmptyComponent={listEmpty}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 20,
          }}
          showsVerticalScrollIndicator={false}
        />

        <View
          className="flex-row items-end gap-3 border-t border-gray-200 bg-white px-4 py-3"
          style={{
            paddingBottom: insets.bottom + 12,
            shadowColor: "#000",
            shadowOpacity: 0.06,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: -4 },
            elevation: 8,
          }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask about your child's attendance or feeding…"
            placeholderTextColor="#9CA3AF"
            className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[15px] text-gray-800 min-h-[48px] max-h-28"
            multiline
            editable={!loading}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <Pressable
            onPress={sendMessage}
            disabled={loading || !input.trim()}
            className="h-12 w-12 items-center justify-center rounded-full bg-teal-600 active:opacity-90 disabled:opacity-50"
            style={{
              shadowColor: "#0D9488",
              shadowOpacity: 0.35,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: 4,
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Icons.Send size={20} color="white" />
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
