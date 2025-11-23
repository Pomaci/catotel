import type { UserRole } from '@/types/enums';

export type UserProfile = {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
  customer?: {
    id: string;
    phone?: string | null;
    address?: string | null;
  } | null;
  staff?: {
    id: string;
    phone?: string | null;
    position?: string | null;
  } | null;
};

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
};

export type LoginResponse = AuthTokens & {
  user: UserProfile;
};

export type Session = {
  id: string;
  userAgent?: string | null;
  ip?: string | null;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
};

export type LoginDto = {
  email: string;
  password: string;
};

export type RegisterDto = {
  email: string;
  password: string;
  name?: string;
  phone?: string;
};
