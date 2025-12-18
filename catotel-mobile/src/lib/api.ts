import type {
  AuthTokens,
  LoginDto,
  LoginResponse,
  RegisterDto,
  Session,
  UserProfile,
  RefreshTokenDto,
} from '@/types/auth';
import { apiRequest } from './api-client';

const toRefreshPayload = (refreshToken: string): RefreshTokenDto => ({
  refresh_token: refreshToken,
});

export const api = {
  register(data: RegisterDto): Promise<UserProfile> {
    return apiRequest<UserProfile>(
      {
        method: 'POST',
        url: '/users/register',
        body: data,
        mediaType: 'application/json',
      },
      { auth: false },
    );
  },

  login(data: LoginDto): Promise<LoginResponse> {
    return apiRequest<LoginResponse>(
      {
        method: 'POST',
        url: '/auth/login',
        body: data,
        mediaType: 'application/json',
      },
      { auth: false },
    );
  },

  me(): Promise<UserProfile> {
    return apiRequest<UserProfile>({
      method: 'GET',
      url: '/users/me',
    });
  },

  sessions(): Promise<Session[]> {
    return apiRequest<Session[]>({
      method: 'GET',
      url: '/auth/sessions',
    });
  },

  logout(refreshToken: string): Promise<void> {
    return apiRequest<void>(
      {
        method: 'POST',
        url: '/auth/logout',
        body: toRefreshPayload(refreshToken),
        mediaType: 'application/json',
      },
      { auth: false },
    );
  },

  logoutAll(): Promise<void> {
    return apiRequest<void>({
      method: 'POST',
      url: '/auth/logout-all',
    });
  },

  refresh(refreshToken: string): Promise<AuthTokens> {
    return apiRequest<AuthTokens>(
      {
        method: 'POST',
        url: '/auth/refresh',
        body: toRefreshPayload(refreshToken),
        mediaType: 'application/json',
      },
      { auth: false },
    );
  },

  forgotPassword(email: string): Promise<void> {
    return apiRequest<void>(
      {
        method: 'POST',
        url: '/auth/forgot-password',
        body: { email },
        mediaType: 'application/json',
      },
      { auth: false },
    );
  },
};
