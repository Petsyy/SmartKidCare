import { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";

const expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN || undefined,
});

export interface SendExpoPushPayload {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channelId?: string;
}

export interface PushNotificationSendResult {
  requested: number;
  accepted: number;
  rejected: number;
  invalidTokens: string[];
  tickets: ExpoPushTicket[];
  errors: string[];
}

const normalizeTokens = (tokens: string[]): string[] => {
  return Array.from(
    new Set(
      tokens
        .map((token) => (typeof token === "string" ? token.trim() : ""))
        .filter((token) => token.length > 0),
    ),
  );
};

export const extractUserPushTokens = (user: {
  pushToken?: string | null;
  pushTokens?: Array<{ token?: string | null }>;
}): string[] => {
  const legacyToken =
    typeof user.pushToken === "string" ? user.pushToken.trim() : "";

  const tokenList = Array.isArray(user.pushTokens)
    ? user.pushTokens
        .map((entry) => (typeof entry?.token === "string" ? entry.token : ""))
        .map((token) => token.trim())
    : [];

  return normalizeTokens([legacyToken, ...tokenList]);
};

export async function sendExpoPushNotifications(
  payload: SendExpoPushPayload,
): Promise<PushNotificationSendResult> {
  const requestedTokens = normalizeTokens(payload.tokens);
  const validTokens: string[] = [];
  const invalidTokens: string[] = [];

  requestedTokens.forEach((token) => {
    if (Expo.isExpoPushToken(token)) {
      validTokens.push(token);
      return;
    }
    invalidTokens.push(token);
  });

  const messages: ExpoPushMessage[] = validTokens.map((token) => ({
    to: token,
    title: payload.title,
    body: payload.body,
    data: payload.data,
    channelId: payload.channelId ?? "default",
    sound: "default",
    priority: "high",
  }));

  const tickets: ExpoPushTicket[] = [];
  const errors: string[] = [];
  let chunkFailures = 0;

  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      const chunkTickets = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...chunkTickets);
    } catch (error: any) {
      chunkFailures += chunk.length;
      errors.push(error?.message || "Expo push send failed for one chunk.");
    }
  }

  let rejectedByTicket = 0;
  tickets.forEach((ticket) => {
    if (ticket.status === "error") {
      rejectedByTicket += 1;
      const detailCode =
        typeof (ticket.details as any)?.error === "string"
          ? (ticket.details as any).error
          : null;
      errors.push(
        detailCode
          ? `${ticket.message} (${detailCode})`
          : ticket.message || "Expo rejected one push notification.",
      );
    }
  });

  const accepted = tickets.filter((ticket) => ticket.status === "ok").length;
  const rejected = invalidTokens.length + rejectedByTicket + chunkFailures;

  return {
    requested: requestedTokens.length,
    accepted,
    rejected,
    invalidTokens,
    tickets,
    errors: Array.from(new Set(errors)),
  };
}
