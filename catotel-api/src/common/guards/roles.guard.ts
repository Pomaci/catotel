import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import {
  localizedError,
  ERROR_CODES,
} from '../errors/localized-error.util';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as { role?: UserRole } | undefined;
    if (!user) {
      throw new UnauthorizedException(
        localizedError(ERROR_CODES.AUTH_PAYLOAD_MISSING),
      );
    }
    if (!user.role || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        localizedError(ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS),
      );
    }
    return true;
  }
}
