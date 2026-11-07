import type { Temporal } from 'temporal-polyfill/full';

export function formatDate(
  date: Temporal.PlainDateTime,
  options?: Intl.DateTimeFormatOptions,
): string {
  const { timeZone, ...rest } = options ?? {};

  const value = timeZone ? date.toZonedDateTime('UTC').withTimeZone(timeZone) : date;

  return value.toLocaleString('en-GB', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    timeZoneName: 'shortGeneric',
    weekday: 'short',
    year: 'numeric',
    ...rest,
  });
}

export function formatDateTime(date: Temporal.PlainDateTime): string {
  return date
    .toLocaleString('en-GB', {
      day: 'numeric',
      hour: '2-digit',
      hour12: false,
      minute: '2-digit',
      month: 'short',
      weekday: 'short',
      year: 'numeric',
    })
    .replace(',', '');
}

export function formatRelativeTime(
  a: Temporal.PlainDateTime,
  b: Temporal.PlainDateTime,
): string {
  const diff = a.until(b, { largestUnit: 'year' });

  const units: [number, string][] = [
    [diff.years, 'y'],
    [diff.months, 'm'],
    [diff.days, 'd'],
    [diff.hours, 'h'],
    [diff.minutes, 'm'],
  ];

  const parts = units
    .filter(([value]) => value !== 0)
    .slice(0, 2)
    .map(([value, unit]) => `${Math.abs(value)}${unit}`);

  if (parts.length === 0) {
    if (diff.sign === 0) {
      return 'Just now';
    }

    return diff.sign > 0 ? 'in <1m' : '<1m ago';
  }

  const value = parts.join(' ');

  return diff.sign < 0 ? `${value} ago` : `in ${value}`;
}
