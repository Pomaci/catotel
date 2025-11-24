import { Injectable, Logger, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';
import type { Request } from 'express';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  private readonly logger = new Logger(RateLimitGuard.name);

  protected getTracker(request: Request): string {
    const forwardedFor = request.headers['x-forwarded-for'];
    if (Array.isArray(forwardedFor)) {
      const first = forwardedFor.find((ip) => !!ip?.trim());
      if (first) {
        return first.trim();
      }
    } else if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
      return forwardedFor.split(',')[0].trim();
    }
    return request.ip;
  }

  protected throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ) {
    const request = context.switchToHttp().getRequest<Request>();
    const sourceIp = this.getTracker(request);
    this.logger.warn(
      `Rate limit exceeded for ${request.method} ${
        request.originalUrl ?? request.url
      } from ${sourceIp}`,
    );
    return super.throwThrottlingException(context, throttlerLimitDetail);
  }
}
