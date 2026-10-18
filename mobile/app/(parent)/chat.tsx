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
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Crypto from "expo-crypto";
import * as Icons from "lucide-react-native";
import { useAuth } from "@/src/hooks/use-auth";
import {
  invalidateAIChatContext,
  sendAIChat,
} from "@/src/api/ai.api";
import type {
  AILanguageMode,
  AIResponseLanguage,
  AIRiskLevel,
} from "@/src/api/api.types";
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
import {
  getUserFriendlyErrorMessage,
  reportHandledError,
} from "@/src/lib/error-reporting";
import { useSafeBack } from "@/src/hooks/use-safe-back";
import {
  AI_CHAT_COPY,
  getRiskLabel,
} from "@/src/components/ai/ai-chat-copy";
import {
  deleteOfflineChatInvalidation,
  deleteOfflineChatSession,
  queueOfflineChatInvalidation,
  readOfflineChatInvalidations,
  readOfflineChatSession,
  saveOfflineChatSession,
} from "@/src/offline/offline-chat-session-store";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  childId?: string | null;
  createdAt: string;
  language?: AIResponseLanguage;
  riskLevel?: AIRiskLevel;
};

const messageKeyExtractor = (message: Message) => message.id;

function getChildFullName(child: Child): string {
  return [child.firstName, child.middleName, child.lastName]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function ParentChatScreen() {
  const handleBack = useSafeBack("/(parent)");
  const { isAuthenticated, user, token } = useAuth();
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
  const [historyOwnerUserId, setHistoryOwnerUserId] = useState<string | null>(null);
  const [responseLanguage, setResponseLanguage] =
    useState<AIResponseLanguage>("en");
  const [languageMode, setLanguageMode] =
    useState<AILanguageMode>("auto");
  const [contextId, setContextId] = useState(() => Crypto.randomUUID());
  const [contextExpiresAt, setContextExpiresAt] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const listRef = useRef<FlatList>(null);
  const authGenerationRef = useRef(0);
  const currentScopeRef = useRef({
    userId: user?.id ?? null,
    childId: selectedChildId,
    contextId,
  });

  currentScopeRef.current = {
    userId: user?.id ?? null,
    childId: selectedChildId,
    contextId,
  };

  const copy = AI_CHAT_COPY.en;

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
    historyReady &&
    sessionReady &&
    !isOffline;

  useEffect(() => {
    ++authGenerationRef.current;
    setContextId(Crypto.randomUUID());
    setContextExpiresAt(null);
    setResponseLanguage("en");
    setLanguageMode("auto");
    setSessionReady(false);
    setLoading(false);
  }, [isAuthenticated, token, user?.id]);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      setMessages([]);
      setHistoryOwnerUserId(null);
      setHistoryReady(true);
      return;
    }
    setHistoryReady(false);
    setHistoryOwnerUserId(null);
    setMessages([]);
    void readOfflineChatMessages(user.id).then((stored) => {
      if (!cancelled) {
        setMessages(stored);
        setHistoryOwnerUserId(user.id);
        setHistoryReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (
      !historyReady ||
      !user?.id ||
      historyOwnerUserId !== user.id
    ) {
      return;
    }
    const timeout = setTimeout(
      () => void replaceOfflineChatMessages(user.id, messages),
      300,
    );
    return () => clearTimeout(timeout);
  }, [historyOwnerUserId, historyReady, messages, user?.id]);

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
      } catch (error: unknown) {
        reportHandledError("chat.children.load", error);
        if (!cancelled) {
          setChildren([]);
          setSelectedChildId(null);
          setContextError(
            getUserFriendlyErrorMessage(
              error,
              "Unable to load your linked children. Please try again.",
            ),
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

  useEffect(() => {
    let cancelled = false;
    const generation = authGenerationRef.current;
    const userId = user?.id;
    const childId = selectedChild?._id;
    if (!userId || !childId || !isAuthenticated) {
      setSessionReady(false);
      return;
    }
    setSessionReady(false);
    void readOfflineChatSession(userId, childId)
      .then((saved) => {
        if (
          cancelled ||
          authGenerationRef.current !== generation ||
          currentScopeRef.current.userId !== userId ||
          currentScopeRef.current.childId !== childId
        ) {
          return;
        }
        if (saved) {
          setContextId(saved.contextId);
          setContextExpiresAt(saved.contextExpiresAt);
          setResponseLanguage(saved.responseLanguage);
          setLanguageMode(saved.languageMode);
        } else {
          setContextId(Crypto.randomUUID());
          setContextExpiresAt(null);
          setResponseLanguage("en");
          setLanguageMode("auto");
        }
      })
      .catch((error: unknown) => {
        reportHandledError("chat.session.load", error);
        if (!cancelled && authGenerationRef.current === generation) {
          setContextId(Crypto.randomUUID());
          setContextExpiresAt(null);
          setResponseLanguage("en");
          setLanguageMode("auto");
        }
      })
      .finally(() => {
        if (!cancelled && authGenerationRef.current === generation) {
          setSessionReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, selectedChild?._id, user?.id]);

  useEffect(() => {
    if (isOffline || !isAuthenticated || !user?.id) return;
    const userId = user.id;
    void readOfflineChatInvalidations(userId)
      .then(async (pending) => {
        for (const item of pending) {
          try {
            await invalidateAIChatContext(item.context_id);
            await deleteOfflineChatInvalidation(userId, item.context_id);
          } catch (error: unknown) {
            reportHandledError("chat.context.invalidate.flush", error);
            break;
          }
        }
      })
      .catch((error: unknown) => {
        reportHandledError("chat.context.invalidate.read", error);
      });
  }, [isAuthenticated, isOffline, user?.id]);

  const invalidateOrQueueContext = useCallback(
    async (userId: string, staleContextId: string) => {
      if (isOffline) {
        await queueOfflineChatInvalidation(userId, staleContextId);
        return;
      }
      try {
        await invalidateAIChatContext(staleContextId);
      } catch (error: unknown) {
        reportHandledError("chat.context.invalidate", error);
        await queueOfflineChatInvalidation(userId, staleContextId);
      }
    },
    [isOffline],
  );

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    const childId = selectedChild?._id;
    if (
      !text ||
      !isAuthenticated ||
      isOffline ||
      loading ||
      contextLoading ||
      !historyReady ||
      !childId ||
      !user?.id ||
      !sessionReady
    ) {
      return;
    }

    const requestContextId = contextId;
    const requestId = Crypto.randomUUID();
    const requestScope = {
      generation: authGenerationRef.current,
      userId: user.id,
      childId,
      contextId: requestContextId,
    };
    const requestOwnerIsCurrent = () => {
      const currentScope = currentScopeRef.current;
      return (
        authGenerationRef.current === requestScope.generation &&
        currentScope.userId === requestScope.userId &&
        currentScope.childId === requestScope.childId
      );
    };
    const requestScopeIsCurrent = () => {
      const currentScope = currentScopeRef.current;
      return (
        requestOwnerIsCurrent() &&
        currentScope.contextId === requestScope.contextId
      );
    };

    setInput("");
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      childId,
      createdAt: new Date().toISOString(),
      language: responseLanguage,
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
        language: responseLanguage,
      },
    ]);

    try {
      const response = await sendAIChat({
        message: text,
        childId,
        languageMode: "auto",
        contextId: requestContextId,
        requestId,
        resetContext: false,
      });

      if (!requestScopeIsCurrent()) return;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: response.reply,
                language: response.language,
                riskLevel: response.riskLevel,
              }
            : m,
        ),
      );
      setResponseLanguage(response.language);
      setLanguageMode(response.languageMode);
      if (response.contextStatus === "active" && response.contextId) {
        setContextId(response.contextId);
        setContextExpiresAt(response.contextExpiresAt);
        currentScopeRef.current = {
          userId: user.id,
          childId,
          contextId: response.contextId,
        };
        void saveOfflineChatSession(user.id, childId, {
          contextId: response.contextId,
          contextExpiresAt: response.contextExpiresAt,
          responseLanguage: response.language,
          languageMode: response.languageMode,
        }).catch((error: unknown) => {
          reportHandledError("chat.session.save", error);
        });
      } else {
        const replacementContextId = Crypto.randomUUID();
        setContextId(replacementContextId);
        setContextExpiresAt(null);
        currentScopeRef.current = {
          userId: user.id,
          childId,
          contextId: replacementContextId,
        };
        void deleteOfflineChatSession(user.id, childId).catch(
          (error: unknown) => {
            reportHandledError("chat.session.delete.unusable", error);
          },
        );
      }
    } catch (error: unknown) {
      reportHandledError("chat.message.send", error);
      if (!requestScopeIsCurrent()) return;
      const errorStatus =
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        typeof error.status === "number"
          ? error.status
          : undefined;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content:
                  errorStatus === 429
                    ? copy.rateLimited
                    : getUserFriendlyErrorMessage(error, copy.sendFailed),
              }
            : m,
        ),
      );
    } finally {
      if (requestOwnerIsCurrent()) {
        setLoading(false);
      }
    }
  }, [
    contextId,
    contextLoading,
    copy.rateLimited,
    copy.sendFailed,
    input,
    historyReady,
    isAuthenticated,
    isOffline,
    loading,
    responseLanguage,
    selectedChild?._id,
    sessionReady,
    user?.id,
  ]);

  const onSuggestionPress = useCallback((text: string) => {
    setInput(text);
  }, []);

  const selectChild = useCallback(
    (childId: string) => {
      if (loading || childId === selectedChild?._id) return;
      const userId = user?.id;
      const previousChildId = selectedChild?._id;
      const staleContextId = contextId;
      if (userId && previousChildId) {
        void deleteOfflineChatSession(userId, previousChildId).catch(
          (error: unknown) => {
            reportHandledError("chat.session.delete.child-change", error);
          },
        );
        void invalidateOrQueueContext(userId, staleContextId);
      }
      const nextContextId = Crypto.randomUUID();
      setSelectedChildId(childId);
      setContextId(nextContextId);
      setContextExpiresAt(null);
      setResponseLanguage("en");
      setLanguageMode("auto");
      setSessionReady(false);
      currentScopeRef.current = {
        userId: userId ?? null,
        childId,
        contextId: nextContextId,
      };
    },
    [contextId, invalidateOrQueueContext, loading, selectedChild?._id, user?.id],
  );

  const renderAssistantContent = useCallback((text: string) => {
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
  }, []);

  const renderItem = useCallback(({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    const isLoading = item.role === "assistant" && !item.content && loading;
    const riskLevel =
      !isUser && !isLoading
        ? item.riskLevel ?? extractAIRiskLevel(item.content)
        : null;
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
                {copy.thinking}
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
                      {getRiskLabel(riskLevel!)}
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
  }, [copy.thinking, loading, renderAssistantContent]);

  const confirmClearHistory = () => {
    if (!user?.id || messages.length === 0) return;
    Alert.alert(
      copy.deleteTitle,
      copy.deleteBody,
      [
        { text: copy.cancel, style: "cancel" },
        {
          text: copy.delete,
          style: "destructive",
          onPress: () => {
            const userId = user.id;
            const childId = selectedChild?._id;
            const staleContextId = contextId;
            const replacementContextId = Crypto.randomUUID();
            void Promise.all([
              clearOfflineChatMessages(userId),
              childId
                ? deleteOfflineChatSession(userId, childId)
                : Promise.resolve(),
              invalidateOrQueueContext(userId, staleContextId),
            ])
              .then(() => {
                setMessages([]);
                setContextId(replacementContextId);
                setContextExpiresAt(null);
                setResponseLanguage("en");
                setLanguageMode("auto");
                currentScopeRef.current = {
                  userId,
                  childId: childId ?? null,
                  contextId: replacementContextId,
                };
              })
              .catch((error: unknown) => {
                reportHandledError("chat.history.clear", error);
              });
          },
        },
      ],
    );
  };

  const listEmpty = useMemo(() => (
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
          ? copy.loadErrorTitle
          : !contextLoading && !selectedChild
            ? copy.noChildTitle
            : copy.emptyTitle}
      </Text>
      <Text className="mx-auto mt-2 max-w-[300px] text-center text-base leading-6 text-gray-500">
        {contextError
          ? copy.loadErrorBody
          : !contextLoading && !selectedChild
            ? copy.noChildBody
            : copy.emptyBody(selectedChildName)}
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
            {contextLoading ? copy.loading : copy.tryAgain}
          </Text>
        </Pressable>
      ) : null}
      <Text className="mt-6 text-sm font-bold uppercase tracking-wide text-gray-500">
        {copy.tryAsking}
      </Text>
      <View className="mt-2.5 w-full gap-2.5">
        {copy.suggestions.map((s) => (
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
  ), [
    contextError,
    contextLoading,
    copy,
    loadChildren,
    onSuggestionPress,
    selectedChild,
    selectedChildName,
  ]);

  const messageListContentStyle = useMemo(
    () => ({
      flexGrow: 1,
      paddingHorizontal: 16,
      paddingTop: messages.length === 0 ? 20 : 16,
      paddingBottom: 20,
    }),
    [messages.length],
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
          subtitle={copy.subtitle}
          onBack={handleBack}
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
              {copy.offlineTitle}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-amber-800">
              {copy.offlineBody}
            </Text>
          </View>
        ) : null}

        {children.length > 1 ? (
          <View className="border-b border-gray-200 bg-white px-4 py-3">
            <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
              {copy.replyingAbout}
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
                    onPress={() => selectChild(child._id)}
                    disabled={loading}
                    accessibilityRole="button"
                    accessibilityLabel={`Use AI chat for ${childName}`}
                    accessibilityState={{ disabled: loading, selected: isSelected }}
                    className={`min-h-11 rounded-full border px-4 py-2 ${
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
          keyExtractor={messageKeyExtractor}
          renderItem={renderItem}
          ListEmptyComponent={listEmpty}
          contentContainerStyle={messageListContentStyle}
          showsVerticalScrollIndicator={false}
        />

        <View
          className="flex-row items-end gap-3 border-t border-gray-200 bg-white px-4 py-3"
          style={{
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
                ? copy.offlinePlaceholder
                : contextLoading
                  ? copy.contextPlaceholder
                  : selectedChild
                    ? copy.placeholder(selectedChild.firstName)
                    : copy.noChildPlaceholder
            }
            placeholderTextColor="#9CA3AF"
            className="h-14 flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-[15px] text-gray-800"
            style={{
              includeFontPadding: false,
              paddingTop: 0,
              paddingBottom: 0,
            }}
            textAlignVertical="center"
            multiline
            editable={
              !isOffline &&
              !loading &&
              !contextLoading &&
              historyReady &&
              sessionReady &&
              Boolean(selectedChild)
            }
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <Pressable
            onPress={sendMessage}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel={copy.send}
            className="h-14 w-14 overflow-hidden rounded-full active:opacity-90 disabled:opacity-50"
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
