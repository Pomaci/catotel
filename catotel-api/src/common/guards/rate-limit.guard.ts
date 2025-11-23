import { Injectable, Logger, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';
import type { Request } from 'express';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  private readonly logger = new Logger(RateLimitGuard.name);

  protected throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ) {
    const request = context.switchToHttp().getRequest<Request>();
    const forwardedFor = request.headers['x-forwarded-for'];
    const sourceIp = Array.isArray(forwardedFor)
      ? forwardedFor.join(',')
      : (forwardedFor ?? request.ip);
    this.logger.warn(
      `Rate limit exceeded for ${request.method} ${
        request.originalUrl ?? request.url
      } from ${sourceIp}`,
    );
    return super.throwThrottlingException(context, throttlerLimitDetail);
  }
}
