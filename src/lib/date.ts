export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  });
}

export function formatRelativeTime(a: Date, b: Date): string {
  const diffInMs = a.getTime() - b.getTime();
  const diffInMinutes = Math.round(diffInMs / 60_000);
  const absMinutes = Math.abs(diffInMinutes);

  const THRESHOLDS: Record<string, number> = {
    year: 365 * 24 * 60,
    month: 30 * 24 * 60,
    day: 24 * 60,
    hour: 60,
    minute: 1,
  };

  const formatter = new Intl.RelativeTimeFormat('en-GB', { numeric: 'auto' });

  for (const [unit, mins] of Object.entries(THRESHOLDS)) {
    if (absMinutes >= mins || unit === 'minute') {
      const value = Math.round(diffInMs / (mins * 60_000));
      return formatter.format(value, unit as Intl.RelativeTimeFormatUnit);
    }
  }

  return 'Just now';
}
