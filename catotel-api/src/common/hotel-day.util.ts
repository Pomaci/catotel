import { BadRequestException } from '@nestjs/common';
import {
  localizedError,
  ERROR_CODES,
} from './errors/localized-error.util';

const HOTEL_DAY_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_IN_DAY = 86_400_000;

function toUtcDate(year: number, monthIndex: number, day: number) {
  return new Date(Date.UTC(year, monthIndex, day));
}

function extractDateParts(value: string) {
  const normalized = value.trim();
  const match = HOTEL_DAY_REGEX.exec(normalized);
  if (!match) {
    return null;
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]) - 1,
    day: Number(match[3]),
  };
}

export function parseHotelDayInput(value: string, fieldName: string) {
  if (!value || typeof value !== 'string') {
    throw new BadRequestException(
      localizedError(ERROR_CODES.VALIDATION_FIELD_REQUIRED, {
        field: fieldName,
      }),
    );
  }
  const parts = extractDateParts(value);
  if (parts) {
    return toUtcDate(parts.year, parts.month, parts.day);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(
      localizedError(ERROR_CODES.VALIDATION_INVALID_DATE, {
        field: fieldName,
      }),
    );
  }
  return toUtcDate(
    parsed.getUTCFullYear(),
    parsed.getUTCMonth(),
    parsed.getUTCDate(),
  );
}

export function startOfUtcDay(date: Date) {
  return toUtcDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function differenceInHotelNights(checkOut: Date, checkIn: Date) {
  const start = startOfUtcDay(checkIn).getTime();
  const end = startOfUtcDay(checkOut).getTime();
  return Math.round((end - start) / MS_IN_DAY);
}
