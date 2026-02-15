import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "authToken";
const USER_KEY = "authUser";

export const saveToken = async (token: string) => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getToken = async () => {
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

export const deleteToken = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

export const saveUser = async <T>(user: T) => {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
};

export const getUser = async <T>() => {
  const rawUser = await SecureStore.getItemAsync(USER_KEY);
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as T;
  } catch {
    // If stored user is corrupted, clear it so the app can recover.
    await SecureStore.deleteItemAsync(USER_KEY);
    return null;
  }
};

export const deleteUser = async () => {
  await SecureStore.deleteItemAsync(USER_KEY);
};

export const clearSession = async () => {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
  ]);
};
