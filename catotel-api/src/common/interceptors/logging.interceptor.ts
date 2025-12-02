import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { catchError, tap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const { method, originalUrl } = request;
    const userId = (request as any)?.user?.sub as string | undefined;
    const ip =
      request.ip ||
      (Array.isArray(request.ips) && request.ips.length
        ? request.ips[0]
        : undefined);

    return next.handle().pipe(
      tap(() => {
        const status = response.statusCode;
        this.logger.log(
          `${method} ${originalUrl} ${status} ${Date.now() - now}ms` +
            (userId ? ` user=${userId}` : '') +
            (ip ? ` ip=${ip}` : ''),
        );
      }),
      catchError((error) => {
        const status = response.statusCode;
        this.logger.error(
          `${method} ${originalUrl} ${status} ${Date.now() - now}ms` +
            (userId ? ` user=${userId}` : '') +
            (ip ? ` ip=${ip}` : ''),
          error?.stack,
        );
        return throwError(() => error);
      }),
    );
  }
}
