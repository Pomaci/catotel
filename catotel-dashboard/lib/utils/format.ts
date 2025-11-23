export function formatCurrency(value: number | string, currency = 'TRY') {
  const amount = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(amount)) {
    return '-';
  }
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(value?: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('tr-TR', options ?? {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function formatEnum(value?: string | null) {
  if (!value) return '-';
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}
