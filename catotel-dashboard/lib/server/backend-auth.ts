import type {
  AuthResponseDto,
  AuthTokensDto,
  LoginDto,
  RefreshTokenDto,
  RegisterUserDto,
  SessionResponseDto,
  UserProfileDto,
} from '@catotel/api-client';
import { backendRequest } from './backend-client';

export function backendLogin(payload: LoginDto) {
  return backendRequest<AuthResponseDto>({
    method: 'POST',
    url: '/auth/login',
    body: payload,
    mediaType: 'application/json',
  });
}

export function backendRegister(payload: RegisterUserDto) {
  return backendRequest<UserProfileDto>({
    method: 'POST',
    url: '/users/register',
    body: payload,
    mediaType: 'application/json',
  });
}

export function backendRefresh(payload: RefreshTokenDto) {
  return backendRequest<AuthTokensDto>({
    method: 'POST',
    url: '/auth/refresh',
    body: payload,
    mediaType: 'application/json',
  });
}

export function backendLogout(payload: RefreshTokenDto) {
  return backendRequest<void>({
    method: 'POST',
    url: '/auth/logout',
    body: payload,
    mediaType: 'application/json',
  });
}

export function backendLogoutAll(token: string) {
  return backendRequest<void>(
    {
      method: 'POST',
      url: '/auth/logout-all',
    },
    token,
  );
}

export function backendMe(token: string) {
  return backendRequest<UserProfileDto>(
    {
      method: 'GET',
      url: '/users/me',
    },
    token,
  );
}

export function backendSessions(token: string) {
  return backendRequest<SessionResponseDto[]>(
    {
      method: 'GET',
      url: '/auth/sessions',
    },
    token,
  );
}

export function backendForgotPassword(payload: { email: string }) {
  return backendRequest<void>({
    method: 'POST',
    url: '/auth/forgot-password',
    body: payload,
    mediaType: 'application/json',
  });
}

export function backendResetPassword(payload: { token: string; password: string }) {
  return backendRequest<void>({
    method: 'POST',
    url: '/auth/reset-password',
    body: payload,
    mediaType: 'application/json',
  });
}
