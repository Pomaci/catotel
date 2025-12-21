import {
  ERROR_CODES,
  type ErrorCode,
  type ErrorDescriptor,
  type Locale,
  SUPPORTED_LOCALES,
  errorCatalog,
} from './catalog';

export { ERROR_CODES, SUPPORTED_LOCALES };
export type { ErrorCode, Locale, ErrorDescriptor };

export type ErrorMessageParams = Record<string, string | number>;

export type LocalizedErrorMessage = {
  code: ErrorCode;
  locale: Locale;
  message: string;
  translations: Record<Locale, string>;
  params?: ErrorMessageParams;
};

const DEFAULT_LOCALE: Locale = 'en';
const PLACEHOLDER_REGEX = /\{\{\s*(\w+)\s*\}\}/g;

function ensureDescriptor(code: ErrorCode): ErrorDescriptor {
  const descriptor = errorCatalog[code];
  if (!descriptor) {
    throw new Error(`Unknown error code: ${code}`);
  }
  return descriptor;
}

function interpolate(
  template: string,
  params?: ErrorMessageParams,
): string {
  if (!params) {
    return template;
  }
  return template.replace(PLACEHOLDER_REGEX, (_, token: string) => {
    return token in params ? String(params[token]) : '';
  });
}

function renderForLocale(
  descriptor: ErrorDescriptor,
  locale: Locale,
  params?: ErrorMessageParams,
  fallbackLocale: Locale = DEFAULT_LOCALE,
) {
  const template =
    descriptor.translations[locale] ??
    descriptor.translations[fallbackLocale] ??
    descriptor.translations[DEFAULT_LOCALE];
  return interpolate(template, params);
}

export function formatErrorMessage(
  code: ErrorCode,
  locale: Locale,
  params?: ErrorMessageParams,
): string {
  const descriptor = ensureDescriptor(code);
  const fallback = descriptor.defaultLocale ?? DEFAULT_LOCALE;
  return renderForLocale(descriptor, locale, params, fallback);
}

export function buildLocalizedMessage(
  code: ErrorCode,
  params?: ErrorMessageParams,
  options?: { locale?: Locale },
): LocalizedErrorMessage {
  const descriptor = ensureDescriptor(code);
  const preferred =
    options?.locale ?? descriptor.defaultLocale ?? DEFAULT_LOCALE;
  const translations = {} as Record<Locale, string>;
  for (const locale of SUPPORTED_LOCALES) {
    translations[locale] = renderForLocale(
      descriptor,
      locale,
      params,
      preferred,
    );
  }

  return {
    code,
    locale: preferred,
    message: translations[preferred],
    translations,
    ...(params && Object.keys(params).length ? { params } : {}),
  };
}

export function getErrorDescriptor(code: ErrorCode) {
  return ensureDescriptor(code);
}

export function isLocalizedErrorMessage(
  value: unknown,
): value is LocalizedErrorMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  const hasTranslations =
    typeof candidate.translations === 'object' && candidate.translations !== null;
  return (
    typeof candidate.code === 'string' &&
    typeof candidate.locale === 'string' &&
    typeof candidate.message === 'string' &&
    hasTranslations
  );
}
