import { Platform } from "react-native";

const LOCAL_BASE = Platform.select({
  android: "http://10.0.2.2:3000",
  default: "http://127.0.0.1:3000",
});

const FALLBACK_API_BASE = `${LOCAL_BASE}/api/v1`;

function getApiBase() {
  const envBase = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (!envBase) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL must be set for builds.");
  }
  if (!envBase.startsWith("https://") && process.env.NODE_ENV === "production") {
    throw new Error("EXPO_PUBLIC_API_BASE_URL must use HTTPS in production builds.");
  }
  return envBase;
}

export const API_BASE =
  process.env.NODE_ENV === "development"
    ? process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || FALLBACK_API_BASE
    : getApiBase();
