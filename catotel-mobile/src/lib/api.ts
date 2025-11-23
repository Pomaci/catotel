import type {
  LoginDto,
  RegisterDto,
  Session,
  UserProfile,
  AuthTokens,
  LoginResponse,
} from '@/types/auth';
import { apiRequest } from './api-client';

const toRefreshPayload = (refreshToken: string) => ({
  refresh_token: refreshToken,
});

export const api = {
  register(data: RegisterDto): Promise<UserProfile> {
    return apiRequest<UserProfile>('/users/register', {
      method: 'POST',
      body: data,
      auth: false,
    });
  },

  login(data: LoginDto): Promise<LoginResponse> {
    return apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: data,
      auth: false,
    });
  },

  me(): Promise<UserProfile> {
    return apiRequest<UserProfile>('/users/me');
  },

  sessions(): Promise<Session[]> {
    return apiRequest<Session[]>('/auth/sessions');
  },

  logout(refreshToken: string): Promise<void> {
    return apiRequest<void>('/auth/logout', {
      method: 'POST',
      body: toRefreshPayload(refreshToken),
      auth: false,
    });
  },

  logoutAll(): Promise<void> {
    return apiRequest<void>('/auth/logout-all', { method: 'POST' });
  },

  refresh(refreshToken: string): Promise<AuthTokens> {
    return apiRequest<AuthTokens>('/auth/refresh', {
      method: 'POST',
      body: toRefreshPayload(refreshToken),
      auth: false,
    });
  },

  forgotPassword(email: string): Promise<void> {
    return apiRequest<void>('/auth/forgot-password', {
      method: 'POST',
      body: { email },
      auth: false,
    });
  },
};
