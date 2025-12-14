import { Logger } from '@nestjs/common';

export type LogMetadata = Record<string, unknown>;

export class StructuredLogger {
  private readonly logger: Logger;

  constructor(private readonly context: string) {
    this.logger = new Logger(context);
  }

  log(message: string, metadata?: LogMetadata) {
    this.logger.log(this.format(message, metadata));
  }

  warn(message: string, metadata?: LogMetadata) {
    this.logger.warn(this.format(message, metadata));
  }

  error(message: string, metadata?: LogMetadata, trace?: string) {
    this.logger.error(this.format(message, metadata), trace);
  }

  private format(message: string, metadata?: LogMetadata): string {
    const payload = {
      message,
      ...this.cleanMetadata(metadata),
      timestamp: new Date().toISOString(),
      context: this.context,
    };

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
