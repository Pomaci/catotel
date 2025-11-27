import { Injectable, Logger, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';
import type { Request } from 'express';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  private readonly logger = new Logger(RateLimitGuard.name);

  protected async getTracker(request: Request): Promise<string> {
    const forwardedFor = request.headers['x-forwarded-for'];
    if (Array.isArray(forwardedFor)) {
      const first = forwardedFor.find((ip) => !!ip?.trim());
      if (first) {
        return first.trim();
      }
    } else if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
      return forwardedFor.split(',')[0].trim();
    }
    const fallback = request.ip ?? request.socket?.remoteAddress ?? '';
    return fallback || 'unknown';
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ) {
    const request = context.switchToHttp().getRequest<Request>();
    const sourceIp = await this.getTracker(request);
    this.logger.warn(
      `Rate limit exceeded for ${request.method} ${
        request.originalUrl ?? request.url
      } from ${sourceIp}`,
    );
    return super.throwThrottlingException(context, throttlerLimitDetail);
  }
}
