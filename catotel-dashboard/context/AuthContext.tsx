"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import type { UserProfileDto } from '@catotel/api-client';

import { clientRequest } from '@/lib/http-client';

type AuthState = {
  user: UserProfileDto | null;
  loading: boolean;
  bootstrapping: boolean;
  error: string | null;
};

type AuthContextValue = AuthState & {
  isAuthenticated: boolean;
  login(email: string, password: string): Promise<UserProfileDto | null>;
  register(email: string, password: string, name?: string): Promise<UserProfileDto | null>;
  logout(): Promise<void>;
  logoutAll(): Promise<void>;
  reloadMe(): Promise<void>;
  refresh(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchMe() {
  return clientRequest<UserProfileDto>('/api/auth/me');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: false,
    bootstrapping: true,
    error: null,
  });

  const ensureCsrfCookie = useCallback(async () => {
    try {
      await clientRequest<{ token: string }>('/api/auth/csrf');
    } catch (err) {
      console.error('Failed to obtain CSRF token', err);
    }
  }, []);

  const callAuth = useCallback(
    async <T,>(
      path: string,
      init: RequestInit = {},
      requireCsrf = false,
    ): Promise<T> => {
      return clientRequest<T>(
        `/api/auth/${path}`,
        {
          ...init,
        },
        { csrf: requireCsrf },
      );
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ensureCsrfCookie();
        const profile = await fetchMe();
        if (!cancelled) {
          setState((s) => ({
            ...s,
            user: profile,
            error: null,
          }));
        }
      } catch (err: any) {
        if (!cancelled) {
          setState((s) => ({
            ...s,
            error:
              err?.message && err.message !== 'Unauthorized'
                ? err.message
                : null,
          }));
        }
      } finally {
        if (!cancelled) {
          setState((s) => ({ ...s, bootstrapping: false }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ensureCsrfCookie]);

  async function login(email: string, password: string) {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const payload = await callAuth<{ user: UserProfileDto }>(
        'login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        },
        true,
      );
      setState((s) => ({
        ...s,
        user: payload.user,
        loading: false,
        error: null,
      }));
      return payload.user;
    } catch (err: any) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err?.message ?? 'Giriş başarısız.',
      }));
      return null;
    }
  }

  async function register(email: string, password: string, name?: string) {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const payload = await callAuth<{ user: UserProfileDto }>(
        'register',
        {
          method: 'POST',
          body: JSON.stringify({ email, password, name }),
        },
        true,
      );
      setState((s) => ({
        ...s,
        user: payload.user,
        loading: false,
        error: null,
      }));
      return payload.user;
    } catch (err: any) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err?.message ?? 'Kayıt işlemi başarısız.',
      }));
      return null;
    }
  }

  async function refresh() {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      await callAuth('refresh', { method: 'POST' }, true);
      const profile = await fetchMe();
      setState((s) => ({
        ...s,
        user: profile,
        loading: false,
        error: null,
      }));
    } catch (err: any) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err?.message ?? 'Token yenileme başarısız.',
      }));
    }
  }

  async function logout() {
    try {
      await callAuth('logout', { method: 'POST' }, true);
    } finally {
      setState((s) => ({
        ...s,
        user: null,
        loading: false,
        error: null,
      }));
      void ensureCsrfCookie();
      if (typeof window !== 'undefined') {
        window.location.assign('/auth/login');
      }
    }
  }

  async function logoutAll() {
    try {
      await callAuth('logout-all', { method: 'POST' }, true);
    } finally {
      setState((s) => ({
        ...s,
        user: null,
        loading: false,
        error: null,
      }));
      void ensureCsrfCookie();
      if (typeof window !== 'undefined') {
        window.location.assign('/auth/login');
      }
    }
  }

  async function reloadMe() {
    try {
      const profile = await fetchMe();
      setState((s) => ({ ...s, user: profile, error: null }));
    } catch (err: any) {
      setState((s) => ({
        ...s,
        user: null,
        error:
          err?.message && err.message !== 'Unauthorized'
            ? err.message
            : null,
      }));
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isAuthenticated: Boolean(state.user),
      login,
      register,
      logout,
      logoutAll,
      reloadMe,
      refresh,
    }),
    [state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

