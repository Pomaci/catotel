import type { ComponentType, ReactNode } from 'react';
import { AppState } from 'react-native';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import {
  QueryClient,
  focusManager,
  onlineManager,
} from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry(failureCount, error) {
        if (failureCount >= 2) {
          return false;
        }
        if (error instanceof Error && /401|403/.test(error.message)) {
          return false;
        }
        return true;
      },
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'catotel-query-cache',
  throttleTime: 1000,
});

onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => {
    setOnline(Boolean(state.isConnected));
  }),
);

focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener('change', (status) => {
    handleFocus(status === 'active');
  });
  return () => subscription.remove();
});

const PersistProvider =
  PersistQueryClientProvider as unknown as ComponentType<{
    client: QueryClient;
    persistOptions: {
      persister: ReturnType<typeof createAsyncStoragePersister>;
      maxAge: number;
    };
    children?: ReactNode;
  }>;

export function QueryProvider({ children }: { children: ReactNode | null }) {
  return (
    <PersistProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 24 * 60 * 60 * 1000,
      }}
    >
      {children}
    </PersistProvider>
  );
}
