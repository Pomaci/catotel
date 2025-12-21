const HOTEL_DAY_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_IN_DAY = 86_400_000;

function toUtcDate(year: number, monthIndex: number, day: number) {
  return new Date(Date.UTC(year, monthIndex, day));
}

export function parseHotelDay(value?: string | null) {
  if (!value) return null;
  const normalized = value.trim();
  const match = HOTEL_DAY_REGEX.exec(normalized.split('T')[0] ?? '');
  if (match) {
    return toUtcDate(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
    );
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return toUtcDate(
    parsed.getUTCFullYear(),
    parsed.getUTCMonth(),
    parsed.getUTCDate(),
  );
}

export function formatHotelDay(
  value?: string | null,
  options?: Intl.DateTimeFormatOptions,
) {
  const parsed = parseHotelDay(value);
  if (!parsed) {
    return value ?? '-';
  }
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'short',
    ...options,
  }).format(parsed);
}

export function hotelNightCount(checkIn?: string, checkOut?: string) {
  const start = parseHotelDay(checkIn);
  const end = parseHotelDay(checkOut);
  if (!start || !end) {
    return null;
  }
  const diff = (end.getTime() - start.getTime()) / MS_IN_DAY;
  const rounded = Math.round(diff);
  return rounded > 0 ? rounded : null;
}

export function toHotelDayString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
