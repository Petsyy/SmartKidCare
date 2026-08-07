import type { ExpoPushTicket } from "expo-server-sdk";
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
