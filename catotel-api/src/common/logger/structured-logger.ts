import { Logger } from '@nestjs/common';
import { getRequestContext } from '../request-context/request-context';

export type LogMetadata = Record<string, unknown>;
type LogLevel = 'debug' | 'log' | 'warn' | 'error';

export class StructuredLogger {
  private readonly logger: Logger;

  constructor(private readonly context: string) {
    this.logger = new Logger(context);
  }

  log(message: string, metadata?: LogMetadata) {
    this.logger.log(this.format('log', message, metadata));
  }

  debug(message: string, metadata?: LogMetadata) {
    this.logger.debug(this.format('debug', message, metadata));
  }

  warn(message: string, metadata?: LogMetadata) {
    this.logger.warn(this.format('warn', message, metadata));
  }

  error(message: string, metadata?: LogMetadata, trace?: string) {
    this.logger.error(this.format('error', message, metadata), trace);
  }

  private format(level: LogLevel, message: string, metadata?: LogMetadata): string {
    const cleanedMetadata = this.cleanMetadata(metadata);
    const contextSnapshot = getRequestContext();
    const payload: Record<string, unknown> = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: this.context,
      ...cleanedMetadata,
    };

    if (contextSnapshot?.requestId && payload.requestId === undefined) {
      payload.requestId = contextSnapshot.requestId;
    }
    if (contextSnapshot?.userId && payload.userId === undefined) {
      payload.userId = contextSnapshot.userId;
    }

    return JSON.stringify(payload);
  }

  private cleanMetadata(metadata?: LogMetadata): LogMetadata {
    if (!metadata) {
      return {};
    }

    return Object.entries(metadata).reduce<LogMetadata>((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});
  }
}
