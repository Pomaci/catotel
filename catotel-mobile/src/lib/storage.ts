import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "catotel_access";
const REFRESH_TOKEN_KEY = "catotel_refresh";

// Optional, non-secure fallback for platforms without SecureStore.
let AsyncStorage: { getItem: any; setItem: any; removeItem: any } | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  AsyncStorage = require("@react-native-async-storage/async-storage").default;
} catch {
  AsyncStorage = null;
}

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

async function read(key: string) {
  if (await hasSecureStore()) {
    const value = await SecureStore.getItemAsync(key);
    if (value !== null) {
      return value;
    }
  }

  if (AsyncStorage) {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      console.warn(
        "[Auth] Using AsyncStorage for tokens (not as secure as SecureStore).",
      );
      return value;
    }
  }

  // On platforms without a secure store (e.g. web), fall back to an in-memory store only.
  return memoryStore.get(key) ?? null;
}

async function write(key: string, value: string | null) {
  if (await hasSecureStore()) {
    if (value === null) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } else if (AsyncStorage) {
    console.warn(
      "[Auth] Persisting tokens in AsyncStorage; prefer SecureStore for production.",
    );
    if (value === null) {
      await AsyncStorage.removeItem(key);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  } else {
    // Avoid persisting tokens to web storage; keep them ephemeral in memory.
    if (value === null) {
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
