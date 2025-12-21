import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { catchError, tap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { StructuredLogger } from '../logger/structured-logger';
import { RequestWithId } from '../middleware/request-id.middleware';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new StructuredLogger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithId>();
    const response = http.getResponse<Response>();
    const { method, originalUrl } = request;
    const requestId = request.requestId;
    const userId = request.user?.sub;
    const ip =
      request.ip ||
      (Array.isArray(request.ips) && request.ips.length
        ? request.ips[0]
        : undefined);
    const userAgent = request.get?.('user-agent');

    return next.handle().pipe(
      tap(() => {
        const status = response.statusCode;
        this.logger.log('Request completed', {
          requestId,
          method,
          path: originalUrl,
          statusCode: status,
          durationMs: Date.now() - now,
          userId,
          ip,
          userAgent,
        });
      }),
      catchError((error) => {
        const status = error?.status ?? error?.statusCode ?? response.statusCode;
        this.logger.error(
          'Request failed',
          {
            requestId,
            method,
            path: originalUrl,
            statusCode: status,
            durationMs: Date.now() - now,
            userId,
            ip,
            userAgent,
            errorName: error?.name,
            errorMessage: error?.message,
          },
          error?.stack,
        );
        return throwError(() => error);
      }),
    );
  }
}
