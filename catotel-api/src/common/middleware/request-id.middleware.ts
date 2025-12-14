import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

export type RequestWithId = Request & { requestId?: string };

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: RequestWithId, res: Response, next: NextFunction) {
    const headerValue = req.headers['x-request-id'];
    const incomingId =
      Array.isArray(headerValue) && headerValue.length > 0
        ? headerValue[0]
        : headerValue;

    const normalized =
      typeof incomingId === 'string' && incomingId.trim().length > 0
        ? incomingId.trim()
        : randomUUID();

    req.requestId = normalized;
    res.setHeader('X-Request-Id', normalized);

    next();
  }
}
