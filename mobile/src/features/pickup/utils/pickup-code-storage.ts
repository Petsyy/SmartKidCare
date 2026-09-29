import * as SecureStore from "expo-secure-store";

const PICKUP_CODES_KEY = "activePickupCodes";

interface StoredPickupCode {
  userId: string;
  childId: string;
  code: string;
  expiresAt: string;
}

const readStoredCodes = async (): Promise<StoredPickupCode[]> => {
  const raw = await SecureStore.getItemAsync(PICKUP_CODES_KEY);
  if (!raw) return [];

  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    await SecureStore.deleteItemAsync(PICKUP_CODES_KEY);
    return [];
  }
};

const writeStoredCodes = async (codes: StoredPickupCode[]) => {
  if (codes.length === 0) {
    await SecureStore.deleteItemAsync(PICKUP_CODES_KEY);
    return;
  }

  await SecureStore.setItemAsync(PICKUP_CODES_KEY, JSON.stringify(codes));
};

export const savePickupCode = async (session: StoredPickupCode) => {
  const stored = await readStoredCodes();
  const remaining = stored.filter(
    (item) =>
      item.userId !== session.userId || item.childId !== session.childId,
  );
  await writeStoredCodes([...remaining, session]);
};

export const getActivePickupCode = async (
  userId: string,
  childId: string,
): Promise<{ code: string; expiresAt: Date } | null> => {
  const stored = await readStoredCodes();
  const now = Date.now();
  const active = stored.find(
    (item) =>
      item.userId === userId &&
      item.childId === childId &&
      Date.parse(item.expiresAt) > now,
  );

  const validCodes = stored.filter((item) => Date.parse(item.expiresAt) > now);
  if (validCodes.length !== stored.length) await writeStoredCodes(validCodes);

  return active
    ? { code: active.code, expiresAt: new Date(active.expiresAt) }
    : null;
};

export const clearPickupCode = async (userId: string, childId: string) => {
  const stored = await readStoredCodes();
  await writeStoredCodes(
    stored.filter((item) => item.userId !== userId || item.childId !== childId),
  );
};

export const clearPickupCodesForUser = async (userId: string) => {
  const stored = await readStoredCodes();
  await writeStoredCodes(stored.filter((item) => item.userId !== userId));
};
