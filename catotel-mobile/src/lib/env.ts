import { Platform } from 'react-native';

const LOCAL_BASE = Platform.select({
  android: 'http://10.0.2.2:3000',
  default: 'http://127.0.0.1:3000',
});

const FALLBACK_API_BASE = `${LOCAL_BASE}/api/v1`;

export const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || FALLBACK_API_BASE;
