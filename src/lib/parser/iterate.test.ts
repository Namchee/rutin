import { Temporal } from '@js-temporal/polyfill';
import { describe, expect, it } from 'vitest';

import { UNIXParser } from './unix';

const START = Temporal.PlainDateTime.from('2026-07-01T00:00:00');

function fires(expr: string, count: number): Temporal.PlainDateTime[] {
  const dates: Temporal.PlainDateTime[] = [];
  for (const d of UNIXParser.iterate(expr, START)) {
    dates.push(d);
    if (dates.length === count) break;
  }
  return dates;
}

describe('iterator: POSIX DOW (Unix)', () => {
  it('0 12 * * 0 fires on every Sunday (regression for infinite loop)', () => {
    const dates = fires('0 12 * * 0', 3);
    expect(dates.length).toBe(3);
    expect(dates.every(d => d.dayOfWeek === 7)).toBe(true);
    expect(dates[0].toString().slice(0, 10)).toBe('2026-07-05');
  });

  it('0 12 * * SUN fires on every Sunday (name alias for 0)', () => {
    const dates = fires('0 12 * * SUN', 3);
    expect(dates.every(d => d.dayOfWeek === 7)).toBe(true);
  });

  it('0 12 * * 1 fires on every Monday', () => {
    const dates = fires('0 12 * * 1', 3);
    expect(dates.every(d => d.dayOfWeek === 1)).toBe(true);
  });

  it('0 12 * * 0,6 fires on Sunday AND Saturday', () => {
    const dates = fires('0 12 * * 0,6', 6);
    expect(dates.every(d => d.dayOfWeek === 7 || d.dayOfWeek === 6)).toBe(true);
    const dows = new Set(dates.slice(0, 4).map(d => d.dayOfWeek));
    expect(dows.has(6)).toBe(true);
    expect(dows.has(7)).toBe(true);
  });

  it('0 12 * * 0-6 fires every day (range covers full week)', () => {
    const dates = fires('0 12 * * 0-6', 7);
    expect(dates.length).toBe(7);
    const dows = new Set(dates.map(d => d.dayOfWeek));
    expect(dows.size).toBe(7);
  });
});
