import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const ACCESS_TOKEN_KEY = "catotel_access";
const REFRESH_TOKEN_KEY = "catotel_refresh";

const memoryStore = new Map<string, string>();
let secureStoreAvailable: boolean | null = null;

async function hasSecureStore() {
  if (secureStoreAvailable !== null) {
    return secureStoreAvailable;
  }
  try {
    secureStoreAvailable = await SecureStore.isAvailableAsync();
  } catch {
    secureStoreAvailable = false;
  }
  return secureStoreAvailable;
}

function getWebStorage() {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.localStorage;
  }
  return null;
}

async function read(key: string) {
  if (await hasSecureStore()) {
    const value = await SecureStore.getItemAsync(key);
    if (value !== null) {
      return value;
    }
  }

  const localStorage = getWebStorage();
  if (localStorage) {
    const value = localStorage.getItem(key);
    if (value !== null) {
      return value;
    }
  }

  return memoryStore.get(key) ?? null;
}

async function write(key: string, value: string | null) {
  if (await hasSecureStore()) {
    if (value === null) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } else {
    const localStorage = getWebStorage();
    if (localStorage) {
      if (value === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, value);
      }
    } else if (value === null) {
      memoryStore.delete(key);
    } else {
      memoryStore.set(key, value);
    }
  }
}

export async function loadTokens() {
  const [accessToken, refreshToken] = await Promise.all([
    read(ACCESS_TOKEN_KEY),
    read(REFRESH_TOKEN_KEY),
  ]);

  return { accessToken, refreshToken };
}

export async function persistTokens({
  accessToken,
  refreshToken,
}: {
  accessToken: string | null;
  refreshToken: string | null;
}) {
  await Promise.all([
    write(ACCESS_TOKEN_KEY, accessToken),
    write(REFRESH_TOKEN_KEY, refreshToken),
  ]);
}

export async function clearTokens() {
  await persistTokens({ accessToken: null, refreshToken: null });
}
