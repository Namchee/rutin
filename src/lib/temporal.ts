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

export function formatRelativeTime(a: Temporal.PlainDateTime, b: Temporal.PlainDateTime): string {
  const formatter = new Intl.RelativeTimeFormat('en-GB', { numeric: 'auto' });
  const diff = a.until(b, { largestUnit: 'year' });

  const parts: [number, Intl.RelativeTimeFormatUnit][] = [
    [diff.years, 'year'],
    [diff.months, 'month'],
    [diff.days, 'day'],
    [diff.hours, 'hour'],
    [diff.minutes, 'minute'],
  ];

  for (const [value, unit] of parts) {
    if (value !== 0) {
      return formatter.format(value, unit);
    }
  }

  return 'Just now';
}
