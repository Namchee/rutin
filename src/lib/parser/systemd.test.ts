import { Temporal } from '@js-temporal/polyfill';
import { describe, expect, it } from 'vitest';

import { generator, SystemdParser } from './systemd';

const START = Temporal.PlainDateTime.from('2026-07-01T00:00:00');

function firstN(expr: string, n: number): Temporal.PlainDateTime[] {
  const dates: Temporal.PlainDateTime[] = [];
  for (const d of generator(expr, START)) {
    dates.push(d);
    if (dates.length === n) break;
  }
  return dates;
}

function firstNFrom(expr: string, startISO: string, n: number): Temporal.PlainDateTime[] {
  const dates: Temporal.PlainDateTime[] = [];
  for (const d of generator(expr, Temporal.PlainDateTime.from(startISO))) {
    dates.push(d);
    if (dates.length === n) break;
  }
  return dates;
}

function errorsOf(expr: string): string[] | undefined {
  const result = SystemdParser.process(expr);
  return result.status === 'invalid' ? result.error : undefined;
}

describe('systemd: validation errors point at the offending field', () => {
  it('invalid time reports time', () => {
    expect(errorsOf('*-*-* 25:00:00')).toEqual(['time']);
  });

  it('out-of-range month reports date', () => {
    expect(errorsOf('*-13-01 00:00:00')).toEqual(['date']);
  });

  it('invalid weekday name reports dayOfWeek', () => {
    expect(errorsOf('Funday 00:00:00')).toEqual(['dayOfWeek']);
  });

  it('reports every invalid component at once', () => {
    expect(errorsOf('Funday *-13-01 25:00:00')?.sort()).toEqual(['date', 'dayOfWeek', 'time']);
  });

  it('unrecognised date-like token reports date', () => {
    expect(errorsOf('2012-01 00:00:00')).toEqual(['date']);
  });

  it('unrecognised time-like token reports time', () => {
    expect(errorsOf('25:00 00:00:00')).toEqual(['time']);
  });

  it('unrecognised weekday-like token reports dayOfWeek', () => {
    expect(errorsOf('Foo/Bar')).toEqual(['dayOfWeek']);
  });

  it('empty input is incomplete, not invalid', () => {
    const result = SystemdParser.process('');
    expect(result.status).toBe('incomplete');
  });

  it('valid input has no errors', () => {
    const result = SystemdParser.process('*-*-* 00:00:00');
    expect(result.status).toBe('valid');
  });
});

describe('systemd: iteration', () => {
  it('daily midnight', () => {
    expect(firstN('*-*-* 00:00:00', 1)[0].toString()).toBe('2026-07-02T00:00:00');
  });

  it('weekday range Mon..Fri at noon', () => {
    // 2026-07-01 is a Wednesday and falls inside Mon..Fri.
    const dates = firstN('Mon..Fri 12:00:00', 2);
    expect(dates[0].toString()).toBe('2026-07-01T12:00:00');
    expect(dates[1].toString()).toBe('2026-07-02T12:00:00');
  });

  it('weekday list Mon,Fri at 09:00', () => {
    expect(firstN('Mon,Fri 09:00:00', 1)[0].toString()).toBe('2026-07-03T09:00:00');
  });

  it('3rd-last day of February via ~N', () => {
    // Start just before the target so the second-by-second scan stays fast.
    expect(firstNFrom('*-02~03 00:00:00', '2027-02-25T00:00:00', 1)[0].toString()).toBe(
      '2027-02-26T00:00:00',
    );
  });

  it('every 3rd minute starting at :02', () => {
    expect(firstN('*:02/3:00', 1)[0].toString()).toBe('2026-07-01T00:02:00');
  });

  it('weekday-only input defaults to daily midnight', () => {
    expect(firstN('Mon', 1)[0].toString()).toBe('2026-07-06T00:00:00');
  });

  it('time-only input defaults to every-day', () => {
    expect(firstN('12:00', 1)[0].toString()).toBe('2026-07-01T12:00:00');
  });
});

describe('systemd: normalization', () => {
  it('trims and collapses internal whitespace', () => {
    const { value } = SystemdParser.normalize('Mon *-*-*  12:00:00');
    expect(value).toBe('Mon *-*-* 12:00:00');
  });

  it('leaves invalid input untouched instead of throwing', () => {
    const { value, tokens } = SystemdParser.normalize('12:00:00 *-*-* Mon');
    expect(value).toBe('12:00:00 *-*-* Mon');
    expect(Object.keys(tokens)).toHaveLength(0);
  });

  it('marks canonical input as normal', () => {
    const result = SystemdParser.process('Mon *-*-* 12:00:00');
    expect(result.status).toBe('valid');
    if (result.status === 'valid') {
      expect(result.normal).toBe(true);
    }
  });

  it('rejects components out of canonical order', () => {
    // weekday must precede date must precede time.
    expect(errorsOf('*-*-* 12:00:00 Mon')).toEqual(['dayOfWeek']);
    expect(errorsOf('12:00:00 *-*-*')).toEqual(['date']);
    expect(errorsOf('Mon 12:00:00 *-*-*')).toEqual(['date']);
  });
});

describe('systemd: process generator', () => {
  it('yields future datetimes for a valid expression', () => {
    const result = SystemdParser.process('Mon..Fri 12:00:00');
    expect(result.status).toBe('valid');
    if (result.status === 'valid') {
      const first = result.generator.next().value as Temporal.PlainDateTime;
      expect(
        Temporal.PlainDateTime.compare(first, Temporal.Now.plainDateTimeISO()),
      ).toBeGreaterThan(0);
    }
  });
});
