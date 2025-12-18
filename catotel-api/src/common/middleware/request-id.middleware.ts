import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Response } from 'express';
import type { RequestUser } from 'src/types/request-user';
import {
  runWithRequestContext,
  type RequestContextPayload,
} from '../request-context/request-context';

export type RequestWithId = RequestUser & { requestId?: string };

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

    const context: RequestContextPayload = {
      requestId: normalized,
      userId: req.user?.sub,
    };

    runWithRequestContext(context, () => next());
  }
}
