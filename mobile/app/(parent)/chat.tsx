import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  StatusBar,
  ScrollView,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Icons from "lucide-react-native";
import { useAuth } from "@/src/hooks/use-auth";
import { sendAIChat } from "@/src/api/ai.api";
import { getMyChildren, type Child } from "@/src/api/parent.api";
import {
  extractAIBulletText,
  extractAIRiskLevel,
  getAIRiskBadgeStyle,
  isAISectionLine,
  removeAIRiskLevelLine,
} from "@/src/components/ai/ai-chat";
import { BRAND_HEADER_GRADIENT, ScreenHeader } from "@/src/components/ui";
import { useOffline } from "@/src/offline/offline-context";
import {
  readOfflineResource,
  onlineWithOfflineFallback,
} from "@/src/offline/offline-read";
import {
  clearOfflineChatMessages,
  readOfflineChatMessages,
  replaceOfflineChatMessages,
} from "@/src/offline/offline-chat-store";

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
  childId?: string | null;
  createdAt: string;
};

function getChildFullName(child: Child): string {
  return [child.firstName, child.middleName, child.lastName]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function ParentChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { user } = useAuth();
  const { isConnected, isInternetReachable } = useOffline();
  const isOffline = !isConnected || !isInternetReachable;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [contextLoading, setContextLoading] = useState(true);
  const [contextError, setContextError] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [historyReady, setHistoryReady] = useState(false);
  const listRef = useRef<FlatList>(null);

  const selectedChild = useMemo(() => {
    if (!children.length) return null;
    if (!selectedChildId) return children[0];
    return (
      children.find((child) => child._id === selectedChildId) ?? children[0]
    );
  }, [children, selectedChildId]);

  const selectedChildName = selectedChild
    ? getChildFullName(selectedChild)
    : "";
  const canSend =
    Boolean(input.trim()) &&
    Boolean(selectedChild?._id) &&
    isAuthenticated &&
    !loading &&
    !contextLoading &&
    !isOffline;

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      setMessages([]);
      setHistoryReady(true);
      return;
    }
    setHistoryReady(false);
    void readOfflineChatMessages(user.id).then((stored) => {
      if (!cancelled) {
        setMessages(stored);
        setHistoryReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!historyReady || !user?.id) return;
    const timeout = setTimeout(
      () => void replaceOfflineChatMessages(user.id, messages),
      300,
    );
    return () => clearTimeout(timeout);
  }, [historyReady, messages, user?.id]);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [messages, scrollToEnd]);

  const loadChildren = useCallback(() => {
    let cancelled = false;

    const run = async () => {
      if (!isAuthenticated) {
        setChildren([]);
        setSelectedChildId(null);
        setContextLoading(false);
        return;
      }
      setContextLoading(true);
      setContextError(null);
      try {
        const linkedChildren = await onlineWithOfflineFallback(
          isOffline,
          getMyChildren,
          () =>
            user?.id
              ? readOfflineResource<Child>(user.id, "children")
              : Promise.resolve([]),
        );

        if (cancelled) return;

        setChildren(linkedChildren);
        setSelectedChildId((currentId) => {
          if (
            currentId &&
            linkedChildren.some((child) => child._id === currentId)
          ) {
            return currentId;
          }
          return linkedChildren[0]?._id ?? null;
        });
      } catch (error: any) {
        if (!cancelled) {
          setChildren([]);
          setSelectedChildId(null);
          setContextError(
            error?.message ?? "Unable to load your linked children.",
          );
        }
      } finally {
        if (!cancelled) setContextLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isOffline, user?.id]);

  useEffect(() => loadChildren(), [loadChildren]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    const childId = selectedChild?._id;
    if (!text || !isAuthenticated || loading || contextLoading || !childId) {
      return;
    }

    setInput("");
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      childId,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const assistantId = `assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        childId,
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      const reply = await sendAIChat({
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
  }, [input, loading, contextLoading, isAuthenticated, selectedChild?._id]);

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

          const bulletText = extractAIBulletText(trimmed);
          if (bulletText) {
            return (
              <View
                key={`bullet-clean-${index}`}
                className="flex-row items-start gap-2"
              >
                <View className="mt-[9px] h-1.5 w-1.5 rounded-full bg-gray-500" />
                <Text
                  className="flex-1 text-[15px] text-gray-800"
                  style={{ lineHeight: 22 }}
                >
                  {bulletText}
                </Text>
              </View>
            );
          }

          const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/);
          if (bulletMatch?.[1]) {
            return (
              <View
                key={`bullet-${index}`}
                className="flex-row items-start gap-2"
              >
                <Text
                  className="text-[15px] text-gray-800"
                  style={{ lineHeight: 22 }}
                >
                  •
                </Text>
                <Text
                  className="flex-1 text-[15px] text-gray-800"
                  style={{ lineHeight: 22 }}
                >
                  {bulletMatch[1]}
                </Text>
              </View>
            );
          }

          const isSection = isAISectionLine(trimmed);
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
        className={`mb-4 flex-row ${isUser ? "justify-end pl-10" : "justify-start pr-10"}`}
      >
        <View
          className={`max-w-[86%] rounded-2xl px-4 py-3.5 ${
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
      </View>
    );
  };

  const confirmClearHistory = () => {
    if (!user?.id || messages.length === 0) return;
    Alert.alert(
      "Delete chat history?",
      "This removes the encrypted chat history saved on this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            void clearOfflineChatMessages(user.id).then(() => setMessages([])),
        },
      ],
    );
  };

  const listEmpty = (
    <View className="flex-1 px-2 pt-3">
      <View className="mx-auto mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-teal-50">
        {contextError || (!contextLoading && !selectedChild) ? (
          <Icons.AlertCircle size={28} color="#F97316" />
        ) : (
          <Icons.MessageCircle size={28} color="#0F766E" />
        )}
      </View>
      <Text className="text-center text-2xl font-extrabold text-gray-900">
        {contextError
          ? "Couldn't load child context"
          : !contextLoading && !selectedChild
            ? "No child linked yet"
            : "How can I help?"}
      </Text>
      <Text className="mx-auto mt-2 max-w-[300px] text-center text-base leading-6 text-gray-500">
        {contextError
          ? "Please try again so I can answer using the right child records."
          : !contextLoading && !selectedChild
            ? "Link a child to your parent account before using the AI assistant."
            : `Ask about ${selectedChildName || "your child"}'s records or tap a suggestion below.`}
      </Text>
      {contextError ? (
        <Pressable
          onPress={loadChildren}
          disabled={contextLoading}
          accessibilityRole="button"
          accessibilityLabel="Try loading linked children again"
          className="mt-5 flex-row items-center rounded-2xl bg-teal-600 px-4 py-3 active:opacity-85 disabled:opacity-50"
        >
          {contextLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Icons.RefreshCw size={18} color="white" />
          )}
          <Text className="ml-2 text-sm font-bold text-white">
            {contextLoading ? "Loading..." : "Try Again"}
          </Text>
        </Pressable>
      ) : null}
      <Text className="mt-6 text-sm font-bold uppercase tracking-wide text-gray-500">
        Try asking
      </Text>
      <View className="mt-2.5 w-full gap-2.5">
        {SUGGESTIONS.map((s) => (
          <Pressable
            key={s}
            onPress={() => onSuggestionPress(s)}
            disabled={contextLoading || !selectedChild}
            accessibilityRole="button"
            accessibilityLabel={`Use suggested question: ${s}`}
            className="rounded-2xl border border-gray-200 bg-white px-4 py-3 active:bg-teal-50"
          >
            <Text
              className="text-base font-semibold leading-6 text-gray-700"
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
    <SafeAreaView
      className="flex-1 bg-gray-50"
      edges={["left", "right", "bottom"]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0D9488" />
      <View className="flex-1">
        <ScreenHeader
          backgroundVariant="brandGradient"
          title="AI Assistant"
          subtitle="Ask about attendance and meals"
          onBack={() => router.back()}
          rightAction={
            messages.length ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Delete saved chat history"
                onPress={confirmClearHistory}
                className="h-10 w-10 items-center justify-center rounded-full bg-white/20"
              >
                <Icons.Trash2 size={20} color="white" />
              </Pressable>
            ) : undefined
          }
        />

        {isOffline ? (
          <View className="border-b border-amber-200 bg-amber-50 px-5 py-4">
            <Text className="text-base font-bold text-amber-900">
              Offline · saved chat history is read-only
            </Text>
            <Text className="mt-1 text-sm leading-5 text-amber-800">
              Connect to the internet to send a new message.
            </Text>
          </View>
        ) : null}

        {children.length > 1 ? (
          <View className="border-b border-gray-200 bg-white px-4 py-3">
            <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
              Replying about
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}
            >
              {children.map((child) => {
                const isSelected = child._id === selectedChild?._id;
                const childName = getChildFullName(child);

                return (
                  <Pressable
                    key={child._id}
                    onPress={() => setSelectedChildId(child._id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Use AI chat for ${childName}`}
                    className={`rounded-full border px-4 py-2 ${
                      isSelected
                        ? "border-teal-600 bg-teal-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        isSelected ? "text-teal-700" : "text-gray-600"
                      }`}
                    >
                      {childName}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={listEmpty}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 16,
            paddingTop: messages.length === 0 ? 20 : 16,
            paddingBottom: 20,
          }}
          showsVerticalScrollIndicator={false}
        />

        <View
          className="flex-row items-center gap-3 border-t border-gray-200 bg-white px-4 py-3"
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
            placeholder={
              isOffline
                ? "Connect to the internet to send a message"
                : contextLoading
                  ? "Loading your child records..."
                  : selectedChild
                    ? `Ask about ${selectedChild.firstName}'s attendance or feeding...`
                    : "Link a child before chatting..."
            }
            placeholderTextColor="#9CA3AF"
            className="min-h-[52px] max-h-28 flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[15px] text-gray-800"
            textAlignVertical="center"
            multiline
            editable={
              !isOffline &&
              !loading &&
              !contextLoading &&
              Boolean(selectedChild)
            }
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <Pressable
            onPress={sendMessage}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel="Send message to AI assistant"
            className="h-[52px] w-[52px] overflow-hidden rounded-full active:opacity-90 disabled:opacity-50"
            style={{
              shadowColor: "#0D9488",
              shadowOpacity: 0.35,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: 4,
            }}
          >
            <LinearGradient
              colors={BRAND_HEADER_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="h-full w-full items-center justify-center"
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Icons.Send size={20} color="white" />
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
