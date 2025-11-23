import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "@/lib/api";
import { onTokensUpdated, setApiTokens } from "@/lib/api-client";
import { clearTokens, loadTokens, persistTokens } from "@/lib/storage";
import type { AuthTokens, UserProfile } from "@/types/auth";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  loading: boolean;
  bootstrapping: boolean;
  error: string | null;
};

type RegisterPayload = {
  email: string;
  password: string;
  name?: string;
  phone?: string;
};

type AuthContextValue = AuthState & {
  login(email: string, password: string): Promise<void>;
  register(payload: RegisterPayload): Promise<void>;
  logout(): Promise<void>;
  logoutAll(): Promise<void>;
  refresh(): Promise<void>;
  reloadMe(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const toErrorMessage = (err: unknown, fallback: string) => {
  if (err instanceof Error) {
    return err.message || fallback;
  }
  return fallback;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    accessToken: null,
    refreshToken: null,
    user: null,
    loading: false,
    bootstrapping: true,
    error: null,
  });

  const syncMe = useCallback(async (accessToken: string | null) => {
    if (!accessToken) {
      setState((s) => ({ ...s, user: null }));
      return;
    }
    try {
      const profile = await api.me();
      setState((s) => ({ ...s, user: profile, error: null }));
    } catch (err) {
      setState((s) => ({
        ...s,
        error: toErrorMessage(err, "Profil bilgileri alınamadı."),
      }));
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { accessToken, refreshToken } = await loadTokens();
        if (!mounted) return;
        setApiTokens(accessToken, refreshToken);
        setState((s) => ({
          ...s,
          accessToken,
          refreshToken,
        }));
        if (accessToken) {
          await syncMe(accessToken);
        }
      } catch (err) {
        if (mounted) {
          setState((s) => ({
            ...s,
            error: toErrorMessage(err, "Kayıtlı oturum okunamadı."),
          }));
        }
      } finally {
        if (mounted) {
          setState((s) => ({ ...s, bootstrapping: false }));
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [syncMe]);

  const applyTokens = useCallback(
    async (tokens: AuthTokens | null) => {
      const accessToken = tokens?.access_token ?? null;
      const refreshToken = tokens?.refresh_token ?? null;
      await persistTokens({ accessToken, refreshToken });
      setApiTokens(accessToken, refreshToken);
      setState((s) => ({
        ...s,
        accessToken,
        refreshToken,
      }));
    },
    [],
  );

  useEffect(() => {
    onTokensUpdated(applyTokens);
    return () => onTokensUpdated(null);
  }, [applyTokens]);

  const handleTokens = useCallback(
    async (tokens: AuthTokens) => {
      await applyTokens(tokens);
      setState((s) => ({
        ...s,
        loading: false,
        error: null,
      }));
      await syncMe(tokens.access_token);
    },
    [applyTokens, syncMe],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const response = await api.login({ email, password });
        await handleTokens(response);
        setState((s) => ({ ...s, user: response.user }));
      } catch (err) {
        setState((s) => ({
          ...s,
          loading: false,
          error: toErrorMessage(err, "Giriş başarısız."),
        }));
      }
    },
    [handleTokens],
  );

  const register = useCallback(async (payload: RegisterPayload) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      await api.register(payload);
      setState((s) => ({ ...s, loading: false }));
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: toErrorMessage(err, "Kayıt işlemi başarısız."),
      }));
      throw err;
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!state.refreshToken) {
      setState((s) => ({
        ...s,
        error: "Kayıtlı bir refresh token bulunamadı.",
      }));
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const tokens = await api.refresh(state.refreshToken);
      await handleTokens(tokens);
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: toErrorMessage(err, "Token yenileme başarısız."),
      }));
    }
  }, [handleTokens, state.refreshToken]);

  const logout = useCallback(async () => {
    try {
      if (state.refreshToken) {
        await api.logout(state.refreshToken);
      }
    } catch (err) {
      console.warn("Logout error", err);
    } finally {
      await clearTokens();
      setApiTokens(null, null);
      setState((s) => ({
        ...s,
        accessToken: null,
        refreshToken: null,
        user: null,
        loading: false,
        error: null,
      }));
    }
  }, [state.refreshToken]);

  const logoutAll = useCallback(async () => {
    try {
      if (state.accessToken) {
        await api.logoutAll();
      }
    } catch (err) {
      console.warn("Logout-all error", err);
    } finally {
      await clearTokens();
      setApiTokens(null, null);
      setState((s) => ({
        ...s,
        accessToken: null,
        refreshToken: null,
        user: null,
        loading: false,
        error: null,
      }));
    }
  }, [state.accessToken]);

  const reloadMe = useCallback(async () => {
    await syncMe(state.accessToken);
  }, [state.accessToken, syncMe]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      register,
      logout,
      logoutAll,
      refresh,
      reloadMe,
    }),
    [login, logout, logoutAll, refresh, register, reloadMe, state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth sadece AuthProvider içinde kullanılabilir.");
  }
  return ctx;
}
