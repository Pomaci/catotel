import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { RequestWithId } from '../middleware/request-id.middleware';
import { StructuredLogger } from '../logger/structured-logger';
import {
  isLocalizedErrorMessage,
  type LocalizedErrorMessage,
} from '@catotel/i18n';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new StructuredLogger(
    GlobalHttpExceptionFilter.name,
  );

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithId>();
    const status = this.resolveStatus(exception);
    const { body, logMetadata, trace } = this.buildErrorPayload(
      exception,
      request,
      status,
    );

    this.logger.error('Handled exception', logMetadata, trace);

    if (!response.headersSent) {
      response.status(status).json(body);
    }
  }

  private resolveStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private buildErrorPayload(
    exception: unknown,
    request: RequestWithId,
    status: number,
  ) {
    const timestamp = new Date().toISOString();
    const path = request?.originalUrl;
    const method = request?.method;
    const requestId = request?.requestId;
    const userId = request.user?.sub;
    const ip =
      request?.ip ||
      (Array.isArray(request?.ips) && request.ips.length ? request.ips[0] : undefined);

    const defaultMessage =
      status === HttpStatus.INTERNAL_SERVER_ERROR
        ? 'Internal server error'
        : 'Unexpected error';
    let message = defaultMessage;
    let errorType: string | undefined;
    let validationErrors: string[] | undefined;
    let localizedMessage: LocalizedErrorMessage | undefined;

    if (exception instanceof HttpException) {
      const {
        message: resolvedMessage,
        validationErrors: resolvedErrors,
        errorType: resolvedErrorType,
        localizedMessage: resolvedLocalizedMessage,
      } = this.normalizeHttpExceptionResponse(exception);
      message = resolvedMessage;
      validationErrors = resolvedErrors;
      errorType = resolvedErrorType;
      localizedMessage = resolvedLocalizedMessage;
    } else if (exception instanceof Error) {
      message =
        status === HttpStatus.INTERNAL_SERVER_ERROR
          ? defaultMessage
          : exception.message;
      errorType = exception.name;
    }

    const body: Record<string, unknown> = {
      statusCode: status,
      requestId,
      timestamp,
      path,
      method,
      error: errorType ?? HttpStatus[status] ?? 'Error',
      message,
      ...(localizedMessage ? { localizedMessage } : {}),
      ...(validationErrors ? { errors: validationErrors } : {}),
    };

    const logMetadata = {
      ...body,
      userId,
      ip,
      errorName: exception instanceof Error ? exception.name : undefined,
      errorMessage: exception instanceof Error ? exception.message : undefined,
      localizedMessageCode: localizedMessage?.code,
    };

    const trace = exception instanceof Error ? exception.stack : undefined;

    return { body, logMetadata, trace };
  }

  private normalizeHttpExceptionResponse(
    exception: HttpException,
  ): {
    message: string;
    validationErrors?: string[];
    errorType?: string;
    localizedMessage?: LocalizedErrorMessage;
  } {
    const response = exception.getResponse();
    const fallbackMessage = exception.message;
    let message = fallbackMessage;
    let validationErrors: string[] | undefined;
    let errorType: string | undefined = exception.name;
    let localizedMessage: LocalizedErrorMessage | undefined;

    if (typeof response === 'string') {
      message = response;
    } else if (typeof response === 'object' && response !== null) {
      const responseBody = response as Record<string, unknown>;
      const responseMessage = responseBody['message'];
      const responseError = responseBody['error'];
      const maybeLocalized = responseBody['localizedMessage'];
      if (isLocalizedErrorMessage(maybeLocalized)) {
        localizedMessage = maybeLocalized;
        message = maybeLocalized.message;
      }

      if (Array.isArray(responseMessage)) {
        validationErrors = responseMessage.map((value) => String(value));
        message =
          typeof responseError === 'string' && responseError.length > 0
            ? responseError
            : 'Validation failed';
      } else if (typeof responseMessage === 'object' && responseMessage !== null) {
        if (isLocalizedErrorMessage(responseMessage)) {
          localizedMessage = responseMessage;
          message = responseMessage.message;
        }
      } else if (typeof responseMessage === 'string' && responseMessage.length > 0) {
        message = responseMessage;
      } else if (typeof responseError === 'string' && responseError.length > 0) {
        message = responseError;
      }

      if (typeof responseError === 'string' && responseError.length > 0) {
        errorType = responseError;
      }
    }

    return { message, validationErrors, errorType, localizedMessage };
  }
}
