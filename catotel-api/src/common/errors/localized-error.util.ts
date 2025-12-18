import {
  ERROR_CODES,
  buildLocalizedMessage,
  type ErrorCode,
  type ErrorMessageParams,
  type LocalizedErrorMessage,
} from '@catotel/i18n';

export { ERROR_CODES };
export type { ErrorCode, ErrorMessageParams, LocalizedErrorMessage };

export type LocalizedErrorBody = {
  message: string;
  localizedMessage: LocalizedErrorMessage;
};

export function localizedError(
  code: ErrorCode,
  params?: ErrorMessageParams,
): LocalizedErrorBody {
  const localizedMessage = buildLocalizedMessage(code, params);
  return {
    message: localizedMessage.message,
    localizedMessage,
  };
}
