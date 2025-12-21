import { AsyncLocalStorage } from 'async_hooks';

export type RequestContextPayload = {
  requestId?: string;
  userId?: string;
};

const storage = new AsyncLocalStorage<RequestContextPayload>();

export function runWithRequestContext<T>(
  context: RequestContextPayload,
  callback: () => T,
): T {
  return storage.run(context, callback);
}

export function getRequestContext(): RequestContextPayload | undefined {
  return storage.getStore();
}

export function mergeRequestContext(
  patch: Partial<RequestContextPayload>,
): void {
  const store = storage.getStore();
  if (!store) {
    return;
  }

  Object.entries(patch).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }
    (store as Record<string, unknown>)[key] = value;
  });
}
