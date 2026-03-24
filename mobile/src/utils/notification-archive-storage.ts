import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_PREFIX = "smartkidcare:notificationArchive:v1";
const MAX_ARCHIVED_ITEMS = 200;

export type NotificationAudience = "parent" | "teacher";

export interface NotificationArchiveBaseItem {
  id: string;
  type: string;
  title: string;
  message: string;
  timeLabel: string;
  actionLabel: string;
}

export type ArchivedNotificationItem<T extends NotificationArchiveBaseItem> = T & {
  archivedAt: string;
  sourceDate: string;
};

export interface NotificationArchiveState<T extends NotificationArchiveBaseItem> {
  readIds: Record<string, boolean>;
  archivedItems: ArchivedNotificationItem<T>[];
}

interface StorageKeyInput {
  audience: NotificationAudience;
  userId: string;
}

const toStorageKey = ({ audience, userId }: StorageKeyInput): string =>
  `${STORAGE_PREFIX}:${audience}:${userId}`;

const isStringRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const normalizeReadIds = (value: unknown): Record<string, boolean> => {
  if (!isStringRecord(value)) {
    return {};
  }

  const next: Record<string, boolean> = {};
  Object.entries(value).forEach(([id, flag]) => {
    if (typeof id === "string" && id.trim() && Boolean(flag)) {
      next[id] = true;
    }
  });
  return next;
};

const normalizeArchivedItems = <T extends NotificationArchiveBaseItem>(
  value: unknown,
): ArchivedNotificationItem<T>[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenIds = new Set<string>();
  const normalized: ArchivedNotificationItem<T>[] = [];

  value.forEach((item) => {
    if (!isStringRecord(item)) {
      return;
    }

    const id = typeof item.id === "string" ? item.id.trim() : "";
    if (!id || seenIds.has(id)) {
      return;
    }

    const type = typeof item.type === "string" ? item.type : "";
    const title = typeof item.title === "string" ? item.title : "";
    const message = typeof item.message === "string" ? item.message : "";
    const timeLabel = typeof item.timeLabel === "string" ? item.timeLabel : "";
    const actionLabel =
      typeof item.actionLabel === "string" ? item.actionLabel : "View";
    const archivedAt =
      typeof item.archivedAt === "string" && item.archivedAt
        ? item.archivedAt
        : new Date().toISOString();
    const sourceDate =
      typeof item.sourceDate === "string" && item.sourceDate
        ? item.sourceDate
        : "";

    if (!type || !title || !message) {
      return;
    }

    seenIds.add(id);
    normalized.push({
      ...(item as T),
      id,
      type,
      title,
      message,
      timeLabel,
      actionLabel,
      archivedAt,
      sourceDate,
    });
  });

  normalized.sort((a, b) => {
    const aTime = Number(new Date(a.archivedAt));
    const bTime = Number(new Date(b.archivedAt));
    if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
      return 0;
    }
    return bTime - aTime;
  });

  return normalized.slice(0, MAX_ARCHIVED_ITEMS);
};

const emptyArchiveState = <T extends NotificationArchiveBaseItem>(): NotificationArchiveState<T> => ({
  readIds: {},
  archivedItems: [],
});

export const loadNotificationArchiveState = async <
  T extends NotificationArchiveBaseItem,
>({
  audience,
  userId,
}: StorageKeyInput): Promise<NotificationArchiveState<T>> => {
  if (!audience || !userId) {
    return emptyArchiveState<T>();
  }

  try {
    const raw = await AsyncStorage.getItem(toStorageKey({ audience, userId }));
    if (!raw) {
      return emptyArchiveState<T>();
    }

    const parsed = JSON.parse(raw) as {
      readIds?: unknown;
      archivedItems?: unknown;
    };

    return {
      readIds: normalizeReadIds(parsed.readIds),
      archivedItems: normalizeArchivedItems<T>(parsed.archivedItems),
    };
  } catch {
    return emptyArchiveState<T>();
  }
};

export const saveNotificationArchiveState = async <
  T extends NotificationArchiveBaseItem,
>({
  audience,
  userId,
  state,
}: StorageKeyInput & { state: NotificationArchiveState<T> }): Promise<void> => {
  if (!audience || !userId) {
    return;
  }

  const payload: NotificationArchiveState<T> = {
    readIds: normalizeReadIds(state.readIds),
    archivedItems: normalizeArchivedItems<T>(state.archivedItems),
  };

  await AsyncStorage.setItem(
    toStorageKey({ audience, userId }),
    JSON.stringify(payload),
  );
};
