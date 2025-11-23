import type { Request } from 'express';
import type { UserRole } from '@prisma/client';

export type AuthenticatedUser = {
  sub: string;
  email?: string;
  role?: UserRole;
};

export type RequestUser = Request & {
  user?: AuthenticatedUser;
};
